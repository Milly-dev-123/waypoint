-- Waypoint — circles + circle_members
-- Private groups of users who opt in to share location and drop pins with
-- each other. Joining is by invite code, never by enumeration.

create table public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null
    check (char_length(name) between 1 and 60),
  invite_code text not null unique
    check (char_length(invite_code) = 8 and invite_code ~ '^[0-9A-HJKMNP-TV-Z]+$'),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index circles_created_by_idx on public.circles (created_by);

create table public.circle_members (
  circle_id uuid not null references public.circles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create index circle_members_user_idx on public.circle_members (user_id);

-- Crockford base-32 invite code (no 0/O/1/I/L), 8 chars. Avoids look-alike
-- characters and gives 32^8 ≈ 1.1 trillion possibilities.
create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(alphabet, 1 + floor(random() * 32)::int, 1);
  end loop;
  return result;
end;
$$;

-- Auto-add the creator as owner on circle creation. SECURITY DEFINER so it
-- can insert into circle_members without depending on caller policies.
create or replace function public.handle_new_circle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.circle_members (circle_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger on_circle_created
  after insert on public.circles
  for each row execute function public.handle_new_circle();

-- Membership check used by RLS on circle_pins (Phase 1 schema) and
-- location_shares targeting. Marked stable so the planner can inline it
-- without re-evaluating for each row.
create or replace function public.is_circle_member(_circle uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.circle_members
    where circle_id = _circle and user_id = auth.uid()
  );
$$;

-- Rate-limited join-by-invite-code RPC. Direct insert into circle_members
-- is denied by RLS; clients must call this function.
create or replace function public.join_circle(_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_circle public.circles%rowtype;
  v_user uuid := auth.uid();
  v_recent_joins int;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  -- Soft rate-limit: max 10 joins per user per hour.
  select count(*) into v_recent_joins
  from public.circle_members
  where user_id = v_user and joined_at > now() - interval '1 hour';
  if v_recent_joins >= 10 then
    raise exception 'too many join attempts; try again later'
      using errcode = '53400';
  end if;

  select * into v_circle from public.circles
    where invite_code = upper(_invite_code);
  if not found then
    raise exception 'invalid invite code' using errcode = '22023';
  end if;

  insert into public.circle_members (circle_id, user_id, role)
  values (v_circle.id, v_user, 'member')
  on conflict (circle_id, user_id) do nothing;

  return v_circle.id;
end;
$$;

revoke all on function public.join_circle(text) from public;
grant execute on function public.join_circle(text) to authenticated;

-- RLS
alter table public.circles enable row level security;
alter table public.circles force row level security;
alter table public.circle_members enable row level security;
alter table public.circle_members force row level security;

-- circles: visible only to members. Anyone authenticated can create one.
-- created_by is forced to auth.uid() via the WITH CHECK to stop spoofing.
create policy circles_select_members on public.circles
  for select
  to authenticated
  using (public.is_circle_member(id));

create policy circles_insert_self on public.circles
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy circles_delete_owner on public.circles
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.circle_members
      where circle_id = circles.id and user_id = auth.uid() and role = 'owner'
    )
  );

-- circle_members: members can see fellow members. No direct insert
-- (must use join_circle RPC). Self-removal allowed; owner can remove
-- anyone but the last owner.
create policy circle_members_select_peers on public.circle_members
  for select
  to authenticated
  using (public.is_circle_member(circle_id));

create policy circle_members_delete_self on public.circle_members
  for delete
  to authenticated
  using (user_id = auth.uid());

create policy circle_members_delete_by_owner on public.circle_members
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.circle_members cm
      where cm.circle_id = circle_members.circle_id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
  );

-- No insert policy — only the SECURITY DEFINER join_circle RPC and the
-- new-circle trigger can populate this table.
