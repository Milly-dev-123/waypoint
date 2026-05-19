-- Waypoint — create_circle RPC.
--
-- Mirrors the existing join_circle SECURITY DEFINER pattern. The plain
-- INSERT path with the circles_insert_self RLS policy proved brittle in
-- practice (the @supabase/ssr server client hits intermittent RLS
-- denials despite auth.uid() matching created_by); a SECURITY DEFINER
-- RPC is the same pattern Supabase recommends for write paths that
-- depend on auth and need to be atomic. The function verifies
-- auth.uid() internally so the security boundary is identical.

create or replace function public.create_circle(_name text)
returns table(id uuid, name text, invite_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_name text := trim(_name);
  v_code text;
  v_circle public.circles%rowtype;
  v_attempt int;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if v_name = '' or char_length(v_name) > 60 then
    raise exception 'circle name must be between 1 and 60 characters'
      using errcode = '22023';
  end if;

  -- Retry on the (extremely unlikely) invite-code unique-violation. The
  -- 'on_circle_created' AFTER trigger from migration 3 inserts the
  -- creator into circle_members on success, so callers don't need to.
  for v_attempt in 1..3 loop
    v_code := public.generate_invite_code();
    begin
      insert into public.circles (name, invite_code, created_by)
      values (v_name, v_code, v_user)
      returning * into v_circle;

      return query
        select v_circle.id, v_circle.name, v_circle.invite_code;
      return;
    exception when unique_violation then
      -- Try again with a fresh code.
      continue;
    end;
  end loop;

  raise exception 'could not generate a unique invite code; please try again'
    using errcode = '53400';
end;
$$;

revoke all on function public.create_circle(text) from public;
grant execute on function public.create_circle(text) to authenticated;
