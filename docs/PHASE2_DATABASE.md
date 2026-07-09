# Phase 2 — Database, RLS & remote push

Schema, policies, RPCs, and seed for hosted Supabase. Repo-side work is complete; **remote apply** is Phase 9.

## Prerequisites

- Supabase project created (Phase 9)
- `.env` with `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Supabase CLI (`npx supabase` or shell alias)

## Migrations (6 files)

| # | File | Contents |
|---|------|----------|
| 1 | `20260709164000_core_tables.sql` | profiles, venues, check_ins, connections |
| 2 | `20260709164001_safety_chat.sql` | blocks, messages, reports |
| 3 | `20260709164002_rls_policies.sql` | RLS on all tables |
| 4 | `20260709164003_rpc_functions.sql` | counts, peers, connect, block, checkout |
| 5 | `20260709164004_auth_trigger.sql` | `handle_new_user` → profiles row |
| 6 | `20260709164005_realtime_and_seed_fix.sql` | Realtime (`messages`, `check_ins`); venue unique constraint |

Audit: [supabase/MIGRATION_AUDIT.md](../supabase/MIGRATION_AUDIT.md)

## Remote push procedure

```bash
npm run verify:env
supabase login
supabase link --project-ref <ref> --yes   # ref = subdomain from SUPABASE_URL
supabase db push --linked --yes
supabase db execute -f supabase/seed.sql --linked
supabase migration list --linked            # 6 rows, Local = Remote
```

## Seed

[supabase/seed.sql](../supabase/seed.sql) — 5 Sydney CBD venues, idempotent via `venues_name_location_unique`.

## Post-push validation

1. SQL Editor: [supabase/tests/phase2_smoke.sql](../supabase/tests/phase2_smoke.sql) — all checks pass
2. SQL Editor: [supabase/tests/phase9_rls_probe.sql](../supabase/tests/phase9_rls_probe.sql) — policy structure
3. Optional: `npm run db:types` → compare `types/database.generated.ts` vs `types/database.ts`

See [supabase/tests/README.md](../supabase/tests/README.md).

## Privacy model (SQL)

- **profiles** — owner SELECT/UPDATE only
- **check_ins** — owner CRUD only; no public listing
- **Discovery** — `get_room_peers` RPC only (same venue + mode, block-filtered)
- **Venue counts** — `venue_active_check_in_counts` RPC (aggregates, no PII)
- **connections** — client INSERT via `request_connection` RPC (security definer)

## Handoff

After push + smoke: proceed to [PHASE3_AUTH.md](./PHASE3_AUTH.md) (live auth), then [PHASE9_LAUNCH.md](./PHASE9_LAUNCH.md) waterfall.

## Related

- Plan: [docs/plans/side_quest_phase_2_b9bd148d.plan.md](./plans/side_quest_phase_2_b9bd148d.plan.md)
- Skill: [.cursor/skills/supabase-linked-migrations/SKILL.md](../.cursor/skills/supabase-linked-migrations/SKILL.md)
