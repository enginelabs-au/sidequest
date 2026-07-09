-- Dev seed venues near Sydney CBD (-33.8688, 151.2093)
-- Run after migrations: supabase db execute -f supabase/seed.sql --linked
-- Idempotent via venues_name_location_unique (migration 20260709164005)

insert into public.venues (name, latitude, longitude) values
  ('The Ivy', -33.8655, 151.2099),
  ('Oxford Art Factory', -33.8842, 151.2103),
  ('The Beresford', -33.8848, 151.2201),
  ('Frankie''s Pizza', -33.8712, 151.2068),
  ('Maybe Sammy', -33.8615, 151.2108)
on conflict on constraint venues_name_location_unique do nothing;
