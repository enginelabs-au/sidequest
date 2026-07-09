-- Phase 9 RLS probe — run in Supabase SQL Editor after db push + seed
-- Note: SQL Editor runs as privileged role; true RLS enforcement is verified
-- in the Expo app with authenticated users (see supabase/tests/README.md).

-- 1. All app tables have RLS enabled
select
  count(*) = 7 as all_tables_rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'profiles', 'venues', 'check_ins', 'connections',
    'blocks', 'messages', 'reports'
  )
  and c.relrowsecurity = true;

-- 2. Expected policies exist (count by table)
select
  c.relname as table_name,
  count(p.polname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relname in (
    'profiles', 'venues', 'check_ins', 'connections',
    'blocks', 'messages', 'reports'
  )
group by c.relname
order by c.relname;

-- Expected policy_count minimums:
-- profiles: 3 (select/insert/update own)
-- venues: 1 (select all)
-- check_ins: 4 (select/insert/update/delete own)
-- connections: 1+ (participant select)
-- blocks: 2 (select/insert own)
-- messages: 2 (select/insert participant)
-- reports: 2 (select/insert own)

-- 3. Profiles: no public SELECT policy (only own-row policies)
select
  count(*) = 0 as no_profiles_public_select
from pg_policy p
join pg_class c on p.polrelid = c.oid
join pg_namespace n on c.relnamespace = n.oid
where n.nspname = 'public'
  and c.relname = 'profiles'
  and p.polcmd = 'r'
  and p.polqual::text not like '%auth.uid()%';

-- 4. Check-ins: no broad SELECT (only own user_id)
select
  count(*) >= 1 as check_ins_own_select_policy
from pg_policy p
join pg_class c on p.polrelid = c.oid
join pg_namespace n on c.relnamespace = n.oid
where n.nspname = 'public'
  and c.relname = 'check_ins'
  and p.polcmd = 'r'
  and p.polqual::text like '%user_id%';

-- 5. Discovery RPC exists (peers via RPC, not direct table scan)
select
  count(*) = 1 as get_room_peers_exists
from pg_proc p
join pg_namespace n on p.pronamespace = n.oid
where n.nspname = 'public'
  and p.proname = 'get_room_peers';

-- 6. Venue counts RPC exists (aggregate only)
select
  count(*) = 1 as venue_counts_rpc_exists
from pg_proc p
join pg_namespace n on p.pronamespace = n.oid
where n.nspname = 'public'
  and p.proname = 'venue_active_check_in_counts';

-- --- App-level tests (manual, in Expo) ---
-- A. Sign in as User A. In app debugger or a test screen, attempt:
--    supabase.from('profiles').select('*')  → should return only User A's row
-- B. User A cannot select User B's check_ins row directly
-- C. get_room_peers returns peers only when both checked in same venue+mode
-- D. venue_active_check_in_counts returns counts without user names
