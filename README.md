# Side Quest

Venue-anchored social discovery — see who's here, right now. Invisible by default until you check in.

## Stack

- **Expo** (iOS + Android) with `expo-router`
- **Supabase** (Auth, Postgres, RLS, Realtime)
- **Styling:** React Native `StyleSheet` + `constants/theme.ts` (not NativeWind — keeps Phase 1 toolchain minimal)

## Configuration

App config lives in [`app.config.ts`](app.config.ts), not `app.json`. It defines bundle IDs (`com.sidequest.app`), OAuth scheme (`sidequest`), and location permission strings. Verify with:

```bash
npx expo config --type public
```

Environment variables are loaded from `.env` (copy from [`.env.example`](.env.example)). Only `EXPO_PUBLIC_*` keys belong in the mobile client.

## Quick start

```bash
cp .env.example .env
# Fill EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY

npm install
npm run typecheck
npm start
```

Press `i` for iOS simulator or `a` for Android emulator.

## Authentication

See [docs/PHASE3_AUTH.md](docs/PHASE3_AUTH.md) for Google, Apple, and phone OTP provider setup. Live auth testing requires Phase 2 `db push` and `.env` keys.

## Venue picker (Phase 4)

See [docs/PHASE4_VENUE.md](docs/PHASE4_VENUE.md) for simulator GPS setup, seed venue coordinates, and proximity validation. Set simulator location near Sydney CBD seed venues before testing check-in.

## Check-in (Phase 5)

See [docs/PHASE5_CHECKIN.md](docs/PHASE5_CHECKIN.md) for mode-specific profile fields, check-in validation, and SQL verification after remote push.

## Supabase setup

Migrations live in [`supabase/migrations/`](supabase/migrations/) (6 files). Audit notes: [`supabase/MIGRATION_AUDIT.md`](supabase/MIGRATION_AUDIT.md).

**When credentials are ready** (remote push was deferred during Phase 2 repo work):

```bash
cp .env.example .env   # fill EXPO_PUBLIC_SUPABASE_URL + anon key
supabase login
supabase link --project-ref <your-ref> --yes
supabase db push --linked --yes
supabase db execute -f supabase/seed.sql --linked
supabase migration list --linked   # Local = Remote for all 6 versions
```

Post-push validation: run [`supabase/tests/phase2_smoke.sql`](supabase/tests/phase2_smoke.sql) in SQL Editor (see [`supabase/tests/README.md`](supabase/tests/README.md)).

Optional — regenerate types after link:

```bash
npm run db:types
```

Hand-written [`types/database.ts`](types/database.ts) remains canonical until you compare against `types/database.generated.ts`.

See [docs/PHASE9_SETUP.md](docs/PHASE9_SETUP.md) for secrets checklist, [docs/PHASE9_LAUNCH.md](docs/PHASE9_LAUNCH.md) for validation waterfall, and **[docs/FINAL_CHECKLIST.md](docs/FINAL_CHECKLIST.md)** for remaining steps + env vars.

```bash
cp .env.example .env
# Fill EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
npm run verify:env   # must pass before remote push
```

## Launch (Phase 9)

Phases 1–8 are **code-complete**. To go live:

1. **Secrets** — create Supabase project, fill `.env`, run `npm run verify:env`
2. **Push** — `supabase link` → `db push` → seed → `phase2_smoke.sql`
3. **Auth** — enable providers in dashboard ([PHASE3_AUTH](docs/PHASE3_AUTH.md)); phone OTP first
4. **Validate** — follow [PHASE9_LAUNCH.md](docs/PHASE9_LAUNCH.md) waterfall (Phases 3–8 live)
5. **Sign off** — MVP checklist in [PHASE9_SETUP.md](docs/PHASE9_SETUP.md) §6

Optional store builds: [`eas.json`](eas.json) + `eas build` ([PHASE9_SETUP](docs/PHASE9_SETUP.md) §7).

## App flow

1. **Auth** — Google, Apple (iOS), or phone OTP
2. **Venue** — GPS-gated picker within 1km; shows active check-in counts
3. **Check-in** — Mode (friends / dating / networking), profile fields, group size
4. **Room** — Discovery deck; Connect (mutual) and Block
5. **Chat** — Ephemeral messages while connected; Check out to go invisible

## Two-user local test

See [docs/PHASE6_ROOM.md](docs/PHASE6_ROOM.md) for the full discovery deck procedure. Summary:

1. Configure Supabase + seed venues
2. Use two simulators or a device + simulator (same GPS near a seed venue)
3. Sign in as two users, pick the **same venue** and **same mode** (e.g. friends)
4. Both appear in each other's room → Connect → mutual Connect back → chat

## Project structure

```text
app.config.ts        Expo config (canonical — no app.json)
app/(auth)/          Hero + phone OTP
app/(onboarding)/    Venue picker + check-in
app/(main)/          Room deck + chat
lib/                 Supabase client, healthcheck, auth, geo, connections
supabase/migrations/ Database schema (6 migrations) + RLS + RPCs
supabase/tests/       Post-push smoke SQL
```

## Phase 6 room notes

- Screen: [app/(main)/room.tsx](app/(main)/room.tsx); data: [lib/room.ts](lib/room.ts); card: [components/PeerCard.tsx](components/PeerCard.tsx)
- Connection states: incoming / outgoing pending / connected; block via `block_user` RPC
- Realtime on `check_ins` only; pull-to-refresh for connect state until connections Realtime
- Two-user test: [docs/PHASE6_ROOM.md](docs/PHASE6_ROOM.md)
- Live validation deferred until Phases 2–5 ready

## Phase 7 chat & checkout notes

- Chat screen: [app/(main)/chat/[connectionId].tsx](app/(main)/chat/[connectionId].tsx); logic: [lib/chat.ts](lib/chat.ts)
- Checkout helper: [lib/checkout.ts](lib/checkout.ts); auto-checkout: [hooks/useAutoCheckout.ts](hooks/useAutoCheckout.ts) on [app/(main)/_layout.tsx](app/(main)/_layout.tsx)
- Realtime `INSERT` on `messages` (migration 006); profanity filter in [lib/moderation.ts](lib/moderation.ts)
- Manual checkout from room + chat with confirmation; auto-checkout on expiry or >1 km from venue
- Two-user chat test: [docs/PHASE7_CHAT.md](docs/PHASE7_CHAT.md)
- Live validation deferred until Phases 2–6 ready

## Phase 8 safety & polish notes

- Safety: [lib/safety.ts](lib/safety.ts); modals: [components/ReportReasonModal.tsx](components/ReportReasonModal.tsx), [components/BlockedUsersModal.tsx](components/BlockedUsersModal.tsx)
- Report from room + chat with optional details; read-only block list from room footer
- Tooltips: venue, check-in, room (`useTooltipFlag`); error helpers in [lib/errors.ts](lib/errors.ts)
- Legal URLs: `EXPO_PUBLIC_PRIVACY_POLICY_URL`, `EXPO_PUBLIC_TERMS_URL` in `.env`; links on auth screen
- Edge Function stub: [supabase/functions/README.md](supabase/functions/README.md)
- Validation: [docs/PHASE8_SAFETY.md](docs/PHASE8_SAFETY.md)
- Live validation deferred until Phases 2–7 ready

## Phase 5 check-in notes

- Screen: [app/(onboarding)/check-in.tsx](app/(onboarding)/check-in.tsx); logic: [lib/checkin.ts](lib/checkin.ts)
- Mode-scoped profile upsert (inactive mode fields preserved); `expires_at` at submit time
- `venueId` from params or AsyncStorage; missing venue → redirect to picker
- Live check-in validation deferred until credentials + Phases 2–4 ready

## Phase 4 venue picker notes

- Screen: [app/(onboarding)/venue.tsx](app/(onboarding)/venue.tsx); data: [lib/venues.ts](lib/venues.ts)
- 1 km gate via `isWithinVenueRange`; far venues disabled; counts from `venue_active_check_in_counts` RPC
- First-visit tooltip + location settings affordance
- Simulator GPS + seed coords: [docs/PHASE4_VENUE.md](docs/PHASE4_VENUE.md)
- Live GPS validation deferred until credentials + Phase 2 push + Phase 3 auth

## Phase 3 authentication notes

- Hero: [app/(auth)/index.tsx](app/(auth)/index.tsx); phone: [app/(auth)/phone.tsx](app/(auth)/phone.tsx)
- OAuth callback: [app/auth/callback.tsx](app/auth/callback.tsx) + [hooks/useAuthDeepLink.ts](hooks/useAuthDeepLink.ts)
- `ensureProfile` on `SIGNED_IN`; sign-out routes to `/(auth)`
- Provider setup: [docs/PHASE3_AUTH.md](docs/PHASE3_AUTH.md)
- Live auth validation deferred until credentials + Phase 2 push

## Phase 2 database notes

- Guide: [docs/PHASE2_DATABASE.md](docs/PHASE2_DATABASE.md)
- Migrations `20260709164000`–`20260709164005` — schema, RLS, RPCs, auth trigger, Realtime + seed fix
- [`supabase/seed.sql`](supabase/seed.sql) — 5 Sydney CBD venues (idempotent)
- [`supabase/MIGRATION_AUDIT.md`](supabase/MIGRATION_AUDIT.md) — Phase 0 alignment review
- Remote `db push` deferred until `.env` + Supabase project ref are provided

## Phase 1 foundation notes

- [`lib/supabase.ts`](lib/supabase.ts) — typed Supabase client; placeholder keys allow boot without a live project
- [`lib/healthcheck.ts`](lib/healthcheck.ts) — startup session probe (console only)
- Feature routes (`auth`, `onboarding`, `main`) were pre-built for later phases; Phase 1 exit criteria is a runnable shell + client wiring

## Privacy model

- No `check_ins` row = invisible
- Discovery only via `get_room_peers` RPC (same venue + mode, not blocked)
- Check-out deletes check-in immediately; auto checkout on geo exit or session expiry
