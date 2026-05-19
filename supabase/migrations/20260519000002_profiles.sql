-- Waypoint — profiles
-- One row per auth.users row, holding display_name + age confirmation.
-- Created automatically by a trigger reading raw_user_meta_data on
-- signup, so the app never has to insert into profiles directly.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null
    check (char_length(display_name) between 1 and 40),
  avatar_url text
    check (avatar_url is null or char_length(avatar_url) <= 500),
  age_confirmed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_display_name_idx on public.profiles (lower(display_name));

-- Auto-bump updated_at.
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- Bootstrap a profile when a new auth.users row appears. SECURITY DEFINER
-- so the trigger can write into public.profiles regardless of caller role.
-- search_path pinned to empty to defend against schema-shadow attacks.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
  v_age_confirmed_at timestamptz;
begin
  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    split_part(new.email, '@', 1)
  );
  v_age_confirmed_at := coalesce(
    (new.raw_user_meta_data ->> 'age_confirmed_at')::timestamptz,
    now()
  );

  insert into public.profiles (id, display_name, age_confirmed_at)
  values (new.id, left(v_display_name, 40), v_age_confirmed_at)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS — default deny, then explicit policies.
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

-- Phase 1: any authenticated user may read display_name/avatar. Phase 2
-- will tighten this to "only profiles I share at least one circle with".
create policy profiles_select_authenticated on public.profiles
  for select
  to authenticated
  using (true);

create policy profiles_update_self on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No insert/delete policy: insertion is via the trigger above (running as
-- definer, which bypasses RLS by design); deletion happens via the
-- auth.users cascade.
