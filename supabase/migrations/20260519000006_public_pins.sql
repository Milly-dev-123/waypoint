-- Waypoint — public humanitarian pins
-- A community map of *places and services*: water, food, shelter, charging,
-- hazards, etc. Pins are about places, never about individuals. There is
-- no "person here" category and no field captures a person's identity.

create table public.public_pin_categories (
  slug text primary key,
  label text not null,
  icon text not null,                 -- Lucide icon name
  is_hazard boolean not null default false,
  sort_order int not null default 100
);

alter table public.public_pin_categories enable row level security;
alter table public.public_pin_categories force row level security;

create policy public_pin_categories_select_all on public.public_pin_categories
  for select
  to anon, authenticated
  using (true);

create table public.public_pins (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete set null,
  geog geography(point, 4326) not null,
  category text not null references public.public_pin_categories (slug),
  title text not null check (char_length(title) between 1 and 80),
  description text check (description is null or char_length(description) <= 1000),
  status text not null default 'active'
    check (status in ('active', 'expired', 'flagged', 'hidden')),
  confirms_count int not null default 0,
  flags_count int not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index public_pins_status_expiry_idx on public.public_pins (status, expires_at);
create index public_pins_geog_idx on public.public_pins using gist (geog);
create index public_pins_created_by_recent_idx
  on public.public_pins (created_by, created_at desc);

create trigger public_pins_set_updated_at
  before update on public.public_pins
  for each row execute function public.tg_set_updated_at();

-- Per-category expiry ceiling. Default 7d; hazards can be 30d so a road
-- closure doesn't keep needing manual refresh.
create or replace function public.tg_check_public_pin_expiry()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_is_hazard boolean;
  v_max_age interval;
begin
  select is_hazard into v_is_hazard
  from public.public_pin_categories
  where slug = new.category;

  v_max_age := case when v_is_hazard then interval '30 days' else interval '7 days' end;

  if new.expires_at > new.created_at + v_max_age then
    raise exception 'expires_at exceeds maximum for category %', new.category
      using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger public_pins_check_expiry
  before insert or update of expires_at, category on public.public_pins
  for each row execute function public.tg_check_public_pin_expiry();

-- Spam guard: no more than 10 active-or-recent pins per user per hour.
create or replace function public.public_pin_rate_ok(_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) < 10
  from public.public_pins
  where created_by = _user
    and created_at > now() - interval '1 hour';
$$;

create table public.pin_confirmations (
  pin_id uuid not null references public.public_pins (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null check (action in ('confirm', 'flag')),
  created_at timestamptz not null default now(),
  primary key (pin_id, user_id)
);

create index pin_confirmations_pin_idx on public.pin_confirmations (pin_id);

-- Recompute counts after any change to a row in pin_confirmations.
-- Auto-flag rule (per Phase 1 plan, pushback #2): flagged AND outvoted.
-- A simple 3-flag threshold is trivial to weaponise; requiring
-- flags > confirms means an honest pin needs sustained negative
-- consensus before it disappears.
create or replace function public.tg_recompute_pin_counts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pin uuid := coalesce(new.pin_id, old.pin_id);
  v_confirms int;
  v_flags int;
  v_status text;
begin
  select
    count(*) filter (where action = 'confirm'),
    count(*) filter (where action = 'flag')
  into v_confirms, v_flags
  from public.pin_confirmations
  where pin_id = v_pin;

  select status into v_status from public.public_pins where id = v_pin;

  update public.public_pins
  set confirms_count = v_confirms,
      flags_count = v_flags,
      status = case
        when v_status in ('expired', 'hidden') then v_status
        when v_flags >= 3 and v_flags > v_confirms then 'flagged'
        when v_status = 'flagged' and v_flags < 3 then 'active'
        else v_status
      end
  where id = v_pin;

  return null;
end;
$$;

create trigger pin_confirmations_recount
  after insert or update or delete on public.pin_confirmations
  for each row execute function public.tg_recompute_pin_counts();

-- RLS
alter table public.public_pins enable row level security;
alter table public.public_pins force row level security;
alter table public.pin_confirmations enable row level security;
alter table public.pin_confirmations force row level security;

-- Anyone signed in can read active pins. Phase 2 will likely allow anon
-- read too, but starting authenticated lets us per-user rate-limit reads
-- and prevents trivial bulk scraping.
create policy public_pins_select_active on public.public_pins
  for select
  to authenticated
  using (status = 'active');

-- Creator can see their own pins regardless of status (so they can tell
-- when one got flagged).
create policy public_pins_select_own on public.public_pins
  for select
  to authenticated
  using (created_by = auth.uid());

create policy public_pins_insert_own_rate_limited on public.public_pins
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.public_pin_rate_ok(auth.uid())
  );

-- Only the creator can edit title/description/expires_at. status changes
-- happen via the trigger or moderation tooling.
create policy public_pins_update_own on public.public_pins
  for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy public_pins_delete_own on public.public_pins
  for delete
  to authenticated
  using (created_by = auth.uid());

-- pin_confirmations: one row per (pin, user). Updating flips the action.
create policy pin_confirmations_select_self on public.pin_confirmations
  for select
  to authenticated
  using (user_id = auth.uid());

create policy pin_confirmations_insert_self on public.pin_confirmations
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy pin_confirmations_update_self on public.pin_confirmations
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy pin_confirmations_delete_self on public.pin_confirmations
  for delete
  to authenticated
  using (user_id = auth.uid());

alter publication supabase_realtime add table public.public_pins;
