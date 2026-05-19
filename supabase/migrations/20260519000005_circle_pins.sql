-- Waypoint — circle pins
-- Short-lived pins shared only within one circle: meeting point, parking,
-- "I'm here", quick note. Max 7-day lifetime.

create table public.circle_pins (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  geog geography(point, 4326) not null,
  title text not null check (char_length(title) between 1 and 80),
  note text check (note is null or char_length(note) <= 500),
  pin_type text not null
    check (pin_type in ('meeting', 'parking', 'here', 'note')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check (expires_at <= created_at + interval '7 days')
);

create index circle_pins_circle_idx on public.circle_pins (circle_id, expires_at desc);
create index circle_pins_geog_idx on public.circle_pins using gist (geog);

alter table public.circle_pins enable row level security;
alter table public.circle_pins force row level security;

create policy circle_pins_select_members on public.circle_pins
  for select
  to authenticated
  using (public.is_circle_member(circle_id));

create policy circle_pins_insert_members on public.circle_pins
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.is_circle_member(circle_id)
  );

-- Creator or circle owner may delete a pin.
create policy circle_pins_delete_creator_or_owner on public.circle_pins
  for delete
  to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.circle_members
      where circle_id = circle_pins.circle_id
        and user_id = auth.uid()
        and role = 'owner'
    )
  );

-- Add to realtime publication so circle members can see new pins live.
-- RLS is enforced at the per-row level by Supabase Realtime.
alter publication supabase_realtime add table public.circle_pins;
