-- Waypoint — realtime + latest-positions for 2D-Receive.
--
-- Adds location_points to the supabase_realtime publication so a circle
-- member with an active share watches their peers' positions update
-- live. Realtime applies RLS per-subscriber, so each client receives
-- only the inserts they can SELECT (which goes through can_see_location
-- and writes one audit_log row per viewer/target/second).
--
-- Also adds latest_visible_positions(), the one-shot fetch used to seed
-- the marker layer on mount and after every realtime burst. SECURITY
-- INVOKER on purpose: it runs as the caller, so the same can_see_location
-- gate and audit-log throttling that protect SELECTs through the policy
-- still apply.

alter publication supabase_realtime add table public.location_points;

create or replace function public.latest_visible_positions()
returns table(
  user_id uuid,
  lat double precision,
  lng double precision,
  accuracy_m real,
  recorded_at timestamptz,
  display_name text
)
language sql
stable
security invoker
set search_path = ''
as $$
  -- DISTINCT ON keeps the most recent point per user_id (ordering by
  -- recorded_at desc inside each group). 5 minutes is the stale window
  -- — if a sharer hasn't written a fresh point in that long, drop them
  -- from the live map. The cron sweep + client-side expiry handle the
  -- "share ended" case separately.
  select distinct on (lp.user_id)
    lp.user_id,
    extensions.ST_Y(lp.geog::extensions.geometry)::double precision as lat,
    extensions.ST_X(lp.geog::extensions.geometry)::double precision as lng,
    lp.accuracy_m,
    lp.recorded_at,
    p.display_name
  from public.location_points lp
  left join public.profiles p on p.id = lp.user_id
  where lp.recorded_at > now() - interval '5 minutes'
  order by lp.user_id, lp.recorded_at desc;
$$;

grant execute on function public.latest_visible_positions() to authenticated;
