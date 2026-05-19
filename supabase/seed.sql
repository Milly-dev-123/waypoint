-- Waypoint — seed data
-- Public pin categories. Icon names refer to Lucide icons
-- (https://lucide.dev). Idempotent via ON CONFLICT.

insert into public.public_pin_categories (slug, label, icon, is_hazard, sort_order) values
  ('water',             'Water point',         'droplets',          false,  10),
  ('food',              'Food distribution',   'utensils',          false,  20),
  ('shelter',           'Shelter',             'home',              false,  30),
  ('medical_aid',       'Medical aid',         'cross',             false,  40),
  ('charging',          'Charging station',    'battery-charging',  false,  50),
  ('wifi',              'Wi-Fi access',        'wifi',              false,  60),
  ('donation_dropoff',  'Donation drop-off',   'package',           false,  70),
  ('volunteer_point',   'Volunteer point',     'hand-helping',      false,  80),
  ('community_event',   'Community event',     'calendar',          false,  90),
  ('hazard',            'Hazard',              'alert-triangle',    true,  100),
  ('blocked_road',      'Blocked road',        'octagon-x',         true,  110),
  ('other',             'Other',               'map-pin',           false, 999)
on conflict (slug) do update
  set label      = excluded.label,
      icon       = excluded.icon,
      is_hazard  = excluded.is_hazard,
      sort_order = excluded.sort_order;
