# Supabase tests

## phase2_smoke.sql

Run **after** linking and pushing migrations to a hosted project:

```bash
npm run verify:env
supabase login
supabase link --project-ref <ref> --yes
supabase db push --linked --yes
supabase db execute -f supabase/seed.sql --linked
```

Then open **Supabase Dashboard → SQL Editor**, paste [phase2_smoke.sql](./phase2_smoke.sql), and run.

### Expected results

| Query | Expected |
|-------|----------|
| tables_ok | `true` |
| functions_ok | `true` |
| venue_count | `5` (after seed) |
| rls_enabled_ok | `true` |
| venue_unique_constraint_ok | `true` |
| realtime_tables_ok | `true` |
| venue_active_check_in_counts | runs without error (may be empty) |
| auth_trigger_ok | `true` |

## phase9_rls_probe.sql

Run **after** `phase2_smoke.sql` passes. Validates RLS **policy structure** (not full enforcement — SQL Editor uses privileged role).

Paste [phase9_rls_probe.sql](./phase9_rls_probe.sql) in SQL Editor.

### Expected results

| Query | Expected |
|-------|----------|
| all_tables_rls_enabled | `true` |
| policy counts per table | See comments in SQL file |
| no_profiles_public_select | `true` |
| check_ins_own_select_policy | `true` |
| get_room_peers_exists | `true` |
| venue_counts_rpc_exists | `true` |

### App-level RLS (requires authenticated Expo sessions)

Full enforcement must be tested in the app per [docs/PHASE9_LAUNCH.md](../../docs/PHASE9_LAUNCH.md) § Security audit:

- Client `select` on `profiles` returns only own row
- Client cannot list other users' `check_ins`
- Discovery only via `get_room_peers` RPC
- `venue_active_check_in_counts` returns aggregates without PII

Test after `.env` is populated (Phase 3+).

## Launch orchestration

See [docs/PHASE9_LAUNCH.md](../../docs/PHASE9_LAUNCH.md) for the full Phases 3–8 validation waterfall.
