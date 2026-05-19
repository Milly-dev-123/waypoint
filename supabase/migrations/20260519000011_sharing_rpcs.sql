-- Waypoint — location-sharing RPCs.
--
-- Mirrors the create_circle / join_circle SECURITY DEFINER pattern.
-- Direct INSERT through the location_shares_insert_self and
-- location_points_insert_while_sharing RLS policies works in theory,
-- but we've seen subtle RLS denials from the @supabase/ssr server
-- client even with matching auth.uid(); RPCs verify the auth boundary
-- internally and avoid that whole class of bug. The RPCs also let us
-- write to audit_log atomically with each state change.

-- ---------------------------------------------------------------------
-- start_location_share
-- ---------------------------------------------------------------------
-- For each circle in _circle_ids, ensure an active share exists for
-- this user that expires at now() + _duration_minutes. If an active
-- share for (user, circle) already exists (unique partial index), we
-- extend its expires_at; otherwise we insert.
--
-- Duration is locked to the four spec choices so callers can't open a
-- share past the 24h DB ceiling or below the UI minimum.

create or replace function public.start_location_share(
  _circle_ids uuid[],
  _duration_minutes int
) returns setof public.location_shares
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_expires timestamptz;
  v_circle uuid;
  v_row public.location_shares%rowtype;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if _circle_ids is null or array_length(_circle_ids, 1) is null then
    raise exception 'pick at least one circle' using errcode = '22023';
  end if;
  if _duration_minutes not in (15, 60, 240, 1440) then
    raise exception 'duration must be 15, 60, 240, or 1440 minutes'
      using errcode = '22023';
  end if;

  v_expires := now() + make_interval(mins => _duration_minutes);

  -- Verify caller is a member of every requested circle BEFORE any
  -- writes, so we never end up half-shared on a multi-circle start.
  if exists (
    select 1 from unnest(_circle_ids) as t(id)
    where not exists (
      select 1 from public.circle_members cm
      where cm.circle_id = t.id and cm.user_id = v_user
    )
  ) then
    raise exception 'you must be a member of every circle you share to'
      using errcode = '42501';
  end if;

  foreach v_circle in array _circle_ids loop
    -- Try to extend an existing active share first (unique partial
    -- index prevents two active rows per (user, circle)).
    update public.location_shares
      set expires_at = v_expires
      where user_id = v_user
        and circle_id = v_circle
        and is_active
      returning * into v_row;

    if not found then
      insert into public.location_shares (user_id, circle_id, expires_at, is_active)
        values (v_user, v_circle, v_expires, true)
        returning * into v_row;
    end if;

    perform public.append_audit(
      v_user, 'share_start', v_user,
      jsonb_build_object('circle_id', v_circle, 'expires_at', v_expires)
    );

    return next v_row;
  end loop;

  return;
end;
$$;

revoke all on function public.start_location_share(uuid[], int) from public;
grant execute on function public.start_location_share(uuid[], int) to authenticated;

-- ---------------------------------------------------------------------
-- stop_location_shares
-- ---------------------------------------------------------------------
-- Marks ALL of the caller's active shares inactive in one shot. The UI
-- exposes a single "Stop sharing" action; partial stop comes later.

create or replace function public.stop_location_shares()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_circle uuid;
  v_count int := 0;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  for v_circle in
    update public.location_shares
      set is_active = false
      where user_id = v_user and is_active
      returning circle_id
  loop
    v_count := v_count + 1;
    perform public.append_audit(
      v_user, 'share_stop', v_user,
      jsonb_build_object('circle_id', v_circle)
    );
  end loop;

  return v_count;
end;
$$;

revoke all on function public.stop_location_shares() from public;
grant execute on function public.stop_location_shares() to authenticated;

-- ---------------------------------------------------------------------
-- record_location_point
-- ---------------------------------------------------------------------
-- Append-only. Inserts one point at lat/lng (+ optional accuracy_m).
-- The same active-share invariant the
-- location_points_insert_while_sharing RLS policy enforces is checked
-- here too, so this RPC is the single sanctioned write path.

create or replace function public.record_location_point(
  _lat double precision,
  _lng double precision,
  _accuracy_m real
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if _lat is null or _lng is null
     or _lat < -90 or _lat > 90
     or _lng < -180 or _lng > 180 then
    raise exception 'lat/lng out of range' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.location_shares
    where user_id = v_user and is_active and expires_at > now()
  ) then
    raise exception 'no active share' using errcode = '42501';
  end if;

  -- PostGIS lives in the extensions schema; qualify explicitly because
  -- the function pins search_path = '' (schema-shadow defence).
  insert into public.location_points (user_id, geog, accuracy_m)
    values (
      v_user,
      extensions.ST_SetSRID(extensions.ST_MakePoint(_lng, _lat), 4326)::extensions.geography,
      _accuracy_m
    );
end;
$$;

revoke all on function public.record_location_point(double precision, double precision, real) from public;
grant execute on function public.record_location_point(double precision, double precision, real) to authenticated;
