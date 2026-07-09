-- Phase 2 smoke tests — run in Supabase SQL Editor after db push + seed
-- Expect all checks to return ok = true (or venue_count = 5 after seed)

-- 1. Required tables exist
select
  count(*) = 7 as tables_ok
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles', 'venues', 'check_ins', 'connections',
    'blocks', 'messages', 'reports'
  );

-- 2. Required RPC functions exist
select
  count(*) = 6 as functions_ok
from pg_proc p
join pg_namespace n on p.pronamespace = n.oid
where n.nspname = 'public'
  and p.proname in (
    'venue_active_check_in_counts',
    'get_room_peers',
    'request_connection',
    'block_user',
    'checkout_user',
    'expire_stale_check_ins'
  );

-- 3. Seed venue count (run after seed.sql)
select count(*) as venue_count from public.venues;

-- 4. RLS enabled on all public app tables
select
  count(*) = 7 as rls_enabled_ok
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'profiles', 'venues', 'check_ins', 'connections',
    'blocks', 'messages', 'reports'
  )
  and c.relrowsecurity = true;

-- 5. Venues unique constraint (migration 006)
select
  count(*) = 1 as venue_unique_constraint_ok
from pg_constraint
where conname = 'venues_name_location_unique';

-- 6. Realtime publication includes messages and check_ins
select
  count(*) = 2 as realtime_tables_ok
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename in ('messages', 'check_ins');

-- 7. RPC smoke: venue counts (empty result OK before any check-ins)
select * from public.venue_active_check_in_counts();

-- 8. Auth trigger exists
select
  count(*) >= 1 as auth_trigger_ok
from pg_trigger t
join pg_class c on t.tgrelid = c.oid
join pg_namespace n on c.relnamespace = n.oid
where n.nspname = 'auth'
  and c.relname = 'users'
  and t.tgname = 'on_auth_user_created';

-- Privacy note: RLS for profiles/check_ins must be verified with authenticated
-- test users in the app or via supabase test helpers — not fully exercisable as
-- postgres role in SQL Editor alone.
