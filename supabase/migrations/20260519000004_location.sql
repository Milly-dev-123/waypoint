-- Waypoint — location_shares + location_points
-- Sharing is always user-initiated and time-bounded. Points exist only
-- while an active share is in force, are filtered to circle members of
-- the sharer, and are purged 24h after recording.

create table public.location_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  circle_id uuid not null references public.circles (id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  is_active boolean not null default true,
  check (expires_at > started_at),
  check (expires_at <= started_at + interval '24 hours')
);

-- One active share per (user, circle) at a time keeps the model simple
-- and avoids accidental double-sharing.
create unique index location_shares_one_active_per_pair
  on public.location_shares (user_id, circle_id)
  where is_active;

create index location_shares_active_by_user_idx
  on public.location_shares (user_id)
  where is_active;

create table public.location_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  geog geography(point, 4326) not null,
  accuracy_m real check (accuracy_m is null or accuracy_m >= 0),
  recorded_at timestamptz not null default now()
);

create index location_points_user_time_idx
  on public.location_points (user_id, recorded_at desc);

create index location_points_geog_idx
  on public.location_points using gist (geog);

-- Has the writer authorised the caller to see their location *right now*?
-- Used by SELECT RLS on location_points. Logs the access if it succeeds,
-- so the target can see who saw them via the Activity tab (audit_log
-- table, created in a later migration).
create or replace function public.can_see_location(_target_user uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_allowed boolean;
begin
  if v_caller is null or _target_user is null then
    return false;
  end if;
  if v_caller = _target_user then
    return true;
  end if;

  select exists (
    select 1
    from public.location_shares ls
    join public.circle_members cm_target
      on cm_target.circle_id = ls.circle_id and cm_target.user_id = ls.user_id
    join public.circle_members cm_caller
      on cm_caller.circle_id = ls.circle_id and cm_caller.user_id = v_caller
    where ls.user_id = _target_user
      and ls.is_active
      and ls.expires_at > now()
  ) into v_allowed;

  return coalesce(v_allowed, false);
end;
$$;

-- The audit-write half of can_see_location lives in the audit_log
-- migration, where audit_log itself is created.

-- RLS
alter table public.location_shares enable row level security;
alter table public.location_shares force row level security;
alter table public.location_points enable row level security;
alter table public.location_points force row level security;

-- Shares: a user can manage their own shares only. Reading "who is sharing
-- with me" goes via can_see_location() rather than direct select.
create policy location_shares_select_self on public.location_shares
  for select
  to authenticated
  using (user_id = auth.uid());

create policy location_shares_insert_self on public.location_shares
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy location_shares_update_self on public.location_shares
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy location_shares_delete_self on public.location_shares
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Points: only insertable while you have an active, unexpired share; only
-- readable by yourself or someone can_see_location says is authorised.
create policy location_points_insert_while_sharing on public.location_points
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.location_shares
      where user_id = auth.uid()
        and is_active
        and expires_at > now()
    )
  );

create policy location_points_select_authorised on public.location_points
  for select
  to authenticated
  using (public.can_see_location(user_id));

-- No update — points are append-only history.
-- No client-side delete — purged by cron after 24h.
