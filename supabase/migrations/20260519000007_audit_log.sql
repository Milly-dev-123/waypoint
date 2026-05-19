-- Waypoint — audit log
-- Transparency log: who saw whose location, who acted on what.
--
-- IMPORTANT: user_id is intentionally NOT a cascading FK. When a user
-- deletes their account, future delete-account RPC will null/tombstone
-- their user_id rather than wipe the rows — otherwise the transparency
-- guarantee disappears for the *other* party in every recorded interaction
-- and any abuse evidence is lost. (See plan pushback #3.)

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,                        -- subject of the row (nullable post-delete)
  action text not null
    check (action in (
      'location_view',                 -- someone read a target's points
      'share_start',
      'share_stop',
      'pin_create',
      'pin_delete',
      'pin_flag',
      'pin_confirm',
      'circle_join',
      'circle_leave'
    )),
  target_id uuid,                      -- e.g. the user whose location was viewed
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_user_recent_idx on public.audit_log (user_id, created_at desc);
create index audit_log_target_recent_idx on public.audit_log (target_id, created_at desc);
create index audit_log_action_recent_idx on public.audit_log (action, created_at desc);

alter table public.audit_log enable row level security;
alter table public.audit_log force row level security;

-- You can see rows about you (target) or rows you generated (user_id).
create policy audit_log_select_involved on public.audit_log
  for select
  to authenticated
  using (user_id = auth.uid() or target_id = auth.uid());

-- No direct client insert. Only SECURITY DEFINER functions write here.

-- Helper used by other SECURITY DEFINER functions to append entries.
create or replace function public.append_audit(
  _user_id uuid,
  _action text,
  _target_id uuid,
  _metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_log (user_id, action, target_id, metadata)
  values (_user_id, _action, _target_id, coalesce(_metadata, '{}'::jsonb));
end;
$$;

revoke all on function public.append_audit(uuid, text, uuid, jsonb) from public;
-- Not granted to authenticated — only called from other definers.

-- Rebuild can_see_location so a successful read is recorded. The function
-- already exists from migration 4; this replaces it with the audit-aware
-- version now that audit_log is available.
create or replace function public.can_see_location(_target_user uuid)
returns boolean
language plpgsql
volatile
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

  if coalesce(v_allowed, false) then
    -- Coalesce per-second to avoid hammering audit_log on every point row
    -- returned by a SELECT — one entry per viewer/target/second is plenty.
    insert into public.audit_log (user_id, action, target_id, metadata)
    select v_caller, 'location_view', _target_user, '{}'::jsonb
    where not exists (
      select 1 from public.audit_log
      where user_id = v_caller
        and target_id = _target_user
        and action = 'location_view'
        and created_at > now() - interval '1 second'
    );
    return true;
  end if;

  return false;
end;
$$;
