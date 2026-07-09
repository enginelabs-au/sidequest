# Runbook: Side Quest MVP

## Domain

Side Quest — Expo + Supabase venue social discovery MVP.

## Purpose

Record how the greenfield MVP was scaffolded and which paths to use for schema, auth, and deploy follow-up.

## Exact paths touched

- `app/` — expo-router route groups `(auth)`, `(onboarding)`, `(main)`
- `lib/supabase.ts`, `lib/auth.ts`, `lib/geo.ts`, `lib/connections.ts`, `lib/moderation.ts`
- `contexts/AuthContext.tsx`
- `hooks/useLocation.ts`, `hooks/useAutoCheckout.ts`, `hooks/useTooltipFlag.ts`
- `components/ui.tsx`, `components/PeerCard.tsx`, `components/TooltipOverlay.tsx`
- `types/database.ts`
- `supabase/migrations/20260709164000_core_tables.sql` through `20260709164005_realtime_and_seed_fix.sql`
- `supabase/seed.sql`, `supabase/MIGRATION_AUDIT.md`, `supabase/tests/phase2_smoke.sql`
- `app.config.ts`, `.env.example`, `README.md`, `docs/PHASE9_SETUP.md`, `docs/PHASE9_LAUNCH.md`, `docs/PHASE3_AUTH.md`, `docs/PHASE4_VENUE.md`, `docs/PHASE5_CHECKIN.md`, `docs/PHASE6_ROOM.md`, `docs/PHASE7_CHAT.md`, `docs/PHASE8_SAFETY.md`
- `lib/healthcheck.ts` — Phase 1 startup Supabase probe

## Phase 1 validation (foundation)

```bash
npm install
npm run typecheck
npx expo config --type public   # expect name: Side Quest, scheme: sidequest
npm start                       # Metro on :8081; boots with placeholder keys
```

**Intentional divergences from Phase 0:**

- `app.config.ts` replaces `app.json` (Expo-canonical dynamic config)
- StyleSheet + `constants/theme.ts` instead of NativeWind
- Route groups and migrations exist ahead of strict Phase 1 scope (forward-compatible)

**Phase 1 exit:** 2026-07-09 — all checks pass; ready for Phase 2 (`supabase db push`).

## Phase 2 validation (database — repo-side complete)

**Migration audit:** [supabase/MIGRATION_AUDIT.md](../../supabase/MIGRATION_AUDIT.md) — migrations 001–005 approved; no blocking issues.

**Migration 006** (`20260709164005_realtime_and_seed_fix.sql`):

- `venues_name_location_unique` — idempotent seed
- `supabase_realtime` publication for `messages` + `check_ins` (conditional DO block)

**Seed fix:** [supabase/seed.sql](../../supabase/seed.sql) uses `on conflict on constraint venues_name_location_unique do nothing`.

**Smoke tests:** [supabase/tests/phase2_smoke.sql](../../supabase/tests/phase2_smoke.sql) — run in SQL Editor after remote push.

**Remote push:** deferred until user provides Supabase project ref + `.env` keys.

```bash
supabase login
supabase link --project-ref <ref> --yes
supabase db push --linked --yes
supabase db execute -f supabase/seed.sql --linked
supabase migration list --linked   # 6 migrations, Local = Remote
# Then run supabase/tests/phase2_smoke.sql in SQL Editor
```

**Phase 2 repo exit:** 2026-07-09 — schema hardened; remote apply pending credentials.

## Phase 3 validation (authentication — repo-side complete)

**Files added/updated:**

- `app/auth/callback.tsx` — OAuth return URL screen (`createSessionFromUrl`, `ensureProfile`, redirect `/`)
- `hooks/useAuthDeepLink.ts` — cold-start + runtime `Linking` listener for `auth/callback`
- `app/_layout.tsx` — registers `auth/callback` stack screen; mounts `useAuthDeepLink`
- `contexts/AuthContext.tsx` — `ensureProfile()` on `SIGNED_IN`; `signOut()` → `router.replace('/(auth)')`
- `lib/auth.ts` — `isAuthCallbackUrl`, `isValidE164Phone`, `normalizePhone`
- `app/(auth)/index.tsx` — cancel notice, disabled when unconfigured, a11y labels
- `app/(auth)/phone.tsx` — E.164 validation, change number, a11y labels
- `components/ui.tsx` — `accessibilityLabel` on `Button`
- `docs/PHASE3_AUTH.md` — provider setup, redirect URLs, deferred live validation

**Repo-side checks:**

```bash
npm run typecheck   # pass
```

- `redirectTo` in `lib/auth.ts` matches `app/auth/callback.tsx`
- `ensureProfile` runs on `SIGNED_IN` in AuthProvider
- Sign-out navigates to `/(auth)`
- Hero disables buttons when Supabase unconfigured

**Live validation:** deferred until Phase 2 `db push` + `.env` keys — see `docs/PHASE3_AUTH.md`.

**Phase 3 repo exit:** 2026-07-09 — auth plumbing complete; device OAuth/OTP pending credentials.

## Phase 4 validation (venue picker — repo-side complete)

**Files added/updated:**

- `lib/venues.ts` — `fetchVenues`, `loadVenuePickerData` (parallel venues + counts)
- `app/(onboarding)/venue.tsx` — `isWithinVenueRange` UI gate, disabled far venues, config guard, empty state, settings link
- `components/TooltipOverlay.tsx` — dismiss a11y + `accessibilityViewIsModal`
- `docs/PHASE4_VENUE.md` — seed coords, simulator GPS, deferred live validation

**Repo-side checks:**

```bash
npm run typecheck   # pass
```

- `tooFar` uses `isWithinVenueRange` / `VENUE_MAX_DISTANCE_KM` (not magic `1`)
- Far venues disabled with `accessibilityState`
- `loadVenuePickerData` → `venues.select` + `venue_active_check_in_counts` RPC
- Config banner when placeholder Supabase keys

**Live validation:** deferred until Phase 2 push + seed + Phase 3 auth — see `docs/PHASE4_VENUE.md`.

**Phase 4 repo exit:** 2026-07-09 — venue picker hardened; simulator GPS pending credentials.

## Phase 5 validation (check-in — repo-side complete)

**Files added/updated:**

- `lib/checkin.ts` — `loadProfile`, `clearOwnCheckIns`, `buildModeProfileUpdate`, `validateCheckInForm`, `submitCheckIn`
- `lib/venues.ts` — `fetchVenueName`
- `app/(onboarding)/check-in.tsx` — venueId AsyncStorage fallback, profile prefill, mode validation, config guard, a11y
- `docs/PHASE5_CHECKIN.md` — mode field matrix, SQL validation, deferred live steps

**Repo-side checks:**

```bash
npm run typecheck   # pass
```

- Mode-scoped upsert does not wipe inactive mode profile fields
- `expires_at` computed at submit (`CHECK_IN_DURATION_HOURS`)
- Missing `venueId` → redirect to venue picker

**Live validation:** deferred until Phase 2 push + Phases 3–4 — see `docs/PHASE5_CHECKIN.md`.

**Phase 5 repo exit:** 2026-07-09 — check-in hardened; DB insert pending credentials.

## Phase 6 validation (room deck — repo-side complete)

**Files added/updated:**

- `lib/room.ts` — `loadRoomData` (peers + venue parallel fetch)
- `components/PeerCard.tsx` — incoming/outgoing/connected states; a11y labels
- `app/(main)/room.tsx` — config guard, error retry, empty refresh, `loadRoomData`, footer a11y
- `docs/PHASE6_ROOM.md` — two-user test, connection states, Realtime/refresh notes

**Repo-side checks:**

```bash
npm run typecheck   # pass
```

- PeerCard: `they_want && !i_want` → "Wants to connect" + Connect back
- Outgoing pending disables Connect; block reloads peers
- Empty state has Refresh room button

**Live validation:** deferred until Phases 2–5 — see `docs/PHASE6_ROOM.md`.

**Phase 6 repo exit:** 2026-07-09 — room deck hardened; two-user test pending credentials.

## Phase 7 validation (chat & checkout — repo-side complete)

**Files added/updated:**

- `lib/chat.ts` — `loadChat`, `sendChatMessage`, `appendMessageDeduped`, access/blocked errors
- `lib/checkout.ts` — `performCheckout` (RPC + `refreshCheckIn`)
- `lib/venues.ts` — `fetchVenueById` for layout venue coords
- `hooks/useAutoCheckout.ts` — uses `performCheckout`; permission cancelled flag
- `app/(main)/_layout.tsx` — mounts `useAutoCheckout` for room + chat stack
- `app/(main)/chat/[connectionId].tsx` — config guard, error retry, Realtime dedupe, checkout Alert, a11y
- `app/(main)/room.tsx` — uses `performCheckout`; removed local `useAutoCheckout`
- `docs/PHASE7_CHAT.md` — chat/checkout/auto-checkout validation procedure

**Repo-side checks:**

```bash
npm run typecheck   # pass
```

- Chat requires active check-in + connected participant
- Manual checkout confirms before leaving; auto-checkout on expiry or >1 km
- Realtime message dedupe by `message.id`

**Live validation:** deferred until Phases 2–6 — see `docs/PHASE7_CHAT.md`.

**Phase 7 repo exit:** 2026-07-09 — chat/checkout hardened; two-user chat test pending credentials.

## Phase 8 validation (safety & polish — repo-side complete)

**Files added/updated:**

- `lib/safety.ts` — `REPORT_REASONS`, `fetchMyBlocks`, `submitSafetyReport`
- `lib/errors.ts` — `isNetworkError`, `formatUserError`
- `constants/legal.ts` — privacy/terms URLs from app.config extra
- `components/ReportReasonModal.tsx`, `components/BlockedUsersModal.tsx`
- `app/(main)/room.tsx` — report modal, block list, network errors
- `app/(main)/chat/[connectionId].tsx` — report from chat
- `app/(onboarding)/check-in.tsx` — check-in tooltip, profile retry
- `app/(auth)/index.tsx` — privacy/terms links; `phone.tsx` config banner
- `hooks/useAutoCheckout.ts` — expiry Alert before redirect
- `lib/moderation.ts` — Edge Function placeholder comment
- `supabase/functions/README.md` — deferred AI moderation stub
- `app.config.ts`, `.env.example` — legal URL env vars
- `docs/PHASE8_SAFETY.md`

**Repo-side checks:**

```bash
npm run typecheck   # pass
```

- Report modal with optional details; room + chat wired
- Block list read-only from room footer
- Tooltips: venue, checkin, room (independent flags)
- Auth privacy/terms links when URLs set

**Live validation:** deferred until Phases 2–7 — see `docs/PHASE8_SAFETY.md`.

**Phase 8 repo exit:** 2026-07-09 — safety polish complete; report/block test pending credentials.

## Phase 9 validation (launch — repo-side prep complete)

**Files added/updated:**

- `docs/PHASE9_LAUNCH.md` — validation waterfall Phases 2–8 live
- `docs/PHASE9_SETUP.md` — expanded secrets contract + checklist
- `supabase/tests/phase9_rls_probe.sql` — RLS policy structure probe
- `supabase/tests/README.md` — phase9 probe docs
- `scripts/verify-env.sh` + `npm run verify:env`
- `eas.json` — EAS build skeleton
- `.cursor/TOOLS.md` — EAS CLI entry
- `README.md` — Launch (Phase 9) section

**Repo-side checks:**

```bash
npm run typecheck        # pass
npm run verify:env       # fails until .env with real keys
grep -r service_role app lib   # no matches
```

**Credential-gated (pending user secrets):**

- `supabase link` + `db push` + seed
- `phase2_smoke.sql` + `phase9_rls_probe.sql` on remote
- Phases 3–8 live validation per `docs/PHASE9_LAUNCH.md`
- MVP launch checklist sign-off in `docs/PHASE9_SETUP.md` §6

**Phase 9 repo exit:** 2026-07-09 — launch docs/tooling ready; live validation blocked on `.env` + Supabase project.

## Procedure

1. Scaffold: `npx create-expo-app@latest _expo-scaffold --template tabs` → rsync to repo root
2. `npm install` + Supabase, location, auth-session, async-storage packages
3. `supabase init` + hand-written migrations (CLI `migration new` hung; files created with timestamps manually)
4. Implement 5-screen flow per Phase 0 plan
5. `npx tsc --noEmit` — passes

## Apply schema to hosted Supabase

```bash
supabase login
supabase link --project-ref <ref> --yes
supabase db push --linked --yes
supabase db execute -f supabase/seed.sql --linked
```

## Validation status

- TypeScript: pass (`npm run typecheck`)
- Expo config: `Side Quest`, scheme `sidequest`
- Metro: starts on `http://localhost:8081` with placeholder Supabase keys
- Remote DB: repo-side Phase 2 complete; `db push` deferred until credentials

## Caveats

- OAuth (Google/Apple) requires dashboard + platform credentials (see `docs/PHASE3_AUTH.md`, `docs/PHASE9_SETUP.md`)
- Phone OTP requires Supabase SMS provider
- Simulator GPS: seed venues are Sydney CBD; may need location override for non-Sydney testing
- `Alert.prompt` replaced with `Alert.alert` reason picker for cross-platform reports

## Related files

- Plan: `docs/plans/side_quest_phase_0_50bd8a65.plan.md`
- Skill: `.cursor/skills/supabase-linked-migrations/SKILL.md`
