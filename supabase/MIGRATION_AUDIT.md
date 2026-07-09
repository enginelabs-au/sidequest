# Migration audit — Phase 2 (2026-07-09)

Review of migrations `20260709164000` through `20260709164004` against Phase 0 privacy and RPC requirements.

## Tables (`20260709164000_core_tables.sql`)

| Table | Phase 0 spec | Status |
|-------|--------------|--------|
| profiles | Segmented mode fields | OK |
| venues | name, lat, lng | OK |
| check_ins | unique(user_id), mode, group_size, expires_at | OK; 4h default |
| connections | user_one < user_two, mutual wants flags | OK |

## Safety / chat (`20260709164001_safety_chat.sql`)

| Table | Purpose | Status |
|-------|---------|--------|
| blocks | Instant block | OK; unique(blocker, blocked) |
| messages | Ephemeral chat | OK; 2000 char limit |
| reports | Moderation stub | OK |

## RLS (`20260709164002_rls_policies.sql`)

| Table | Expected | Policy | Status |
|-------|----------|--------|--------|
| profiles | Owner only | select/insert/update own | OK — no public scrape |
| venues | Public read | venues_select_all | OK |
| check_ins | Owner CRUD only | owner policies | OK — discovery via RPC |
| connections | Participants | select/update participant | OK — insert via RPC |
| messages | Connected only | participant + connected check | OK |
| blocks | Owner | select/insert own | OK |
| reports | Owner | insert/select own | OK |

**Note:** `connections` has no INSERT policy for clients; writes go through `request_connection` (security definer). Correct.

## RPCs (`20260709164003_rpc_functions.sql`)

| Function | Grants | Status |
|----------|--------|--------|
| venue_active_check_in_counts | authenticated, anon | OK — aggregate only, no PII |
| get_room_peers | authenticated | OK — venue+mode+block+expiry filters |
| request_connection | authenticated | OK — security definer, canonical pair |
| block_user | authenticated | OK |
| checkout_user | authenticated | OK |
| expire_stale_check_ins | authenticated | OK — optional cron helper |

## Auth trigger (`20260709164004_auth_trigger.sql`)

| Item | Status |
|------|--------|
| handle_new_user on auth.users | OK |
| profiles updated_at trigger | OK |

## Gaps found (fixed in migration 006)

1. **Seed idempotency** — `seed.sql` used `on conflict do nothing` without a unique constraint on venues.
2. **Realtime** — `messages` and `check_ins` not added to `supabase_realtime` publication in SQL.

## No blocking issues

Migrations 001–005 are approved for `db push` without structural rewrites.
