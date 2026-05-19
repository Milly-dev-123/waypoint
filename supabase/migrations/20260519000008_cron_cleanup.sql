-- Waypoint — periodic cleanup jobs
-- Defence in depth on top of the app-level guarantees:
--   * location_points purged after 24h regardless of UI behaviour
--   * shares deactivated as soon as they expire
--   * public/circle pins move to status='expired' or are deleted on expiry

-- Wrap each schedule in a guard so re-running migrations doesn't error.
do $$
declare
  v_existing int;
begin
  -- Purge old location points.
  select count(*) into v_existing
  from cron.job where jobname = 'waypoint-purge-location-points';
  if v_existing = 0 then
    perform cron.schedule(
      'waypoint-purge-location-points',
      '*/15 * * * *',
      $cron$ delete from public.location_points
             where recorded_at < now() - interval '24 hours' $cron$
    );
  end if;

  -- Deactivate expired shares.
  select count(*) into v_existing
  from cron.job where jobname = 'waypoint-expire-shares';
  if v_existing = 0 then
    perform cron.schedule(
      'waypoint-expire-shares',
      '*/5 * * * *',
      $cron$ update public.location_shares
             set is_active = false
             where is_active and expires_at < now() $cron$
    );
  end if;

  -- Mark expired public pins.
  select count(*) into v_existing
  from cron.job where jobname = 'waypoint-expire-public-pins';
  if v_existing = 0 then
    perform cron.schedule(
      'waypoint-expire-public-pins',
      '*/15 * * * *',
      $cron$ update public.public_pins
             set status = 'expired'
             where status = 'active' and expires_at < now() $cron$
    );
  end if;

  -- Delete expired circle pins outright (they are ephemeral by design).
  select count(*) into v_existing
  from cron.job where jobname = 'waypoint-purge-circle-pins';
  if v_existing = 0 then
    perform cron.schedule(
      'waypoint-purge-circle-pins',
      '*/15 * * * *',
      $cron$ delete from public.circle_pins where expires_at < now() $cron$
    );
  end if;
end
$$;
