-- Waypoint — auto-delete a circle when its last member leaves.
--
-- The migration 3 RLS lets a member delete their own circle_members row
-- ("leave"), but doesn't enforce circle deletion if the row was the
-- last one. That would leave the circles row dangling — invisible to
-- everyone (no member = no select), but still occupying storage and an
-- invite code. This trigger prevents that.
--
-- SECURITY DEFINER so it can delete from circles regardless of the
-- caller's role (the leaving member is typically not an owner, so the
-- circles_delete_owner policy would block them).

create or replace function public.cleanup_empty_circle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Defensive guards:
  --  * exists() on circles avoids re-deleting a row that's already being
  --    deleted as part of an in-progress cascade from circles.
  --  * not exists() on circle_members runs after our delete, so zero
  --    means we just removed the last member.
  if exists (select 1 from public.circles where id = old.circle_id)
     and not exists (select 1 from public.circle_members where circle_id = old.circle_id) then
    delete from public.circles where id = old.circle_id;
  end if;
  return old;
end;
$$;

create trigger on_circle_member_deleted
  after delete on public.circle_members
  for each row execute function public.cleanup_empty_circle();
