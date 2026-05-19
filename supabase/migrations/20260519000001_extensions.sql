-- Waypoint — extensions
-- PostGIS for geography points; pg_cron for periodic cleanup; pgcrypto for
-- gen_random_uuid().

create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_cron with schema extensions;

-- Realtime publication exists by default in Supabase; we add tables to it
-- explicitly in later migrations, one at a time, only after their RLS is
-- proven safe. Phase 1 does NOT publish location_points.
