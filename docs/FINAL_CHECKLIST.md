# Final checklist — Side Quest MVP

**Status (2026-07-09):** Phases 1–8 **code-complete**. Phase 9 **launch docs/tooling complete**. Everything below marked ⏳ is blocked on your secrets, dashboards, or live E2E.

**Quick links:** [PHASE9_SETUP](./PHASE9_SETUP.md) · [PHASE9_LAUNCH](./PHASE9_LAUNCH.md) · [.env.example](../.env.example)

---

## Repo complete (no action needed)

- [x] Expo app scaffold + TypeScript (`npm run typecheck` passes)
- [x] 6 Supabase migrations + seed + smoke/RLS probe SQL
- [x] Auth (Google, Apple, phone) + callback deep links
- [x] Venue picker (1 km gate) + check-in + room + chat + safety
- [x] Phase docs PHASE2–PHASE9 + launch orchestration
- [x] `npm run verify:env`, `eas.json` skeleton, no `service_role` in app/lib
- [x] `.env` gitignored; `.env.example` committed

---

## What you must provide (agent cannot proceed without this)

### 1. Local `.env` file (copy from `.env.example`)

Create `/Users/camdouglas/sidequest/.env` — **never commit this file**.

| Variable | Required for agent? | Where to get it |
|----------|----------------------|-----------------|
| `EXPO_PUBLIC_SUPABASE_URL` | **YES** | Supabase Dashboard → Project Settings → API → Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | **YES** | Same page → `anon` `public` key |
| `EXPO_PUBLIC_APP_SCHEME` | No (default `sidequest`) | Only change if you customize deep links |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | For Google OAuth testing | Google Cloud → OAuth 2.0 → Web client ID |
| `EXPO_PUBLIC_PRIVACY_POLICY_URL` | Before store; optional for dev E2E | Your hosted privacy page |
| `EXPO_PUBLIC_TERMS_URL` | Before store; optional for dev E2E | Your hosted terms page |

**Project ref for CLI:** extract from URL — `https://<project-ref>.supabase.co` → use `<project-ref>` with `supabase link`.

### 2. Supabase Dashboard (not `.env` — configure in browser)

| Setting | Required for | Notes |
|---------|--------------|-------|
| Auth → Phone provider | Phase 3 live (recommended first) | Twilio in Dashboard — see [PHASE3_AUTH](./PHASE3_AUTH.md) § Twilio |
| Auth → Google provider | Google sign-in | Web client ID + secret from Google Cloud |
| Auth → Apple provider | Apple sign-in (iOS) | Services ID + key from Apple Developer |
| Auth → Redirect URLs | All OAuth | `sidequest://auth/callback` + Expo dev URI ([PHASE3_AUTH](./PHASE3_AUTH.md)) |

### 3. One-time CLI auth (your machine)

```bash
supabase login   # opens browser — agent needs this session to push
```

---

## Agent will run (after `.env` exists)

Run `npm run verify:env` first — must print `READY for supabase link + db push`.
Run `npm run verify:connections` — Supabase REST/Auth, DB smoke, legal URL reachability.

- [x] `supabase link --project-ref <ref> --yes`
- [x] `supabase db push --linked --yes`
- [x] Seed venues (psql or SQL Editor — `supabase seed --linked` has no SQL subcommand on CLI 2.53)
- [x] `supabase migration list --linked` — migrations synced (incl. legacy `20260709064007`)
- [x] Postgres smoke — 5 tables + 3 RPCs + 5 venues
- [x] `npm run db:types` (optional type diff)
- [x] Agent infra: `verify:env`, `verify:connections`, `test:oauth` (2026-07-10)
- [ ] ⏳ `npm start` — live auth + venue E2E on device/simulator

---

## Live validation waterfall (after push)

Follow [PHASE9_LAUNCH.md](./PHASE9_LAUNCH.md) in order. Check off as you validate.

### Phase 3 — Auth ([PHASE3_AUTH](./PHASE3_AUTH.md))

- [ ] ⏳ Phone OTP send + verify
- [x] Google OAuth — `npm run test:oauth` redirects to `accounts.google.com` (2026-07-10)
- [x] Apple OAuth — `npm run test:oauth` redirects to `appleid.apple.com` + Services ID (2026-07-10)
- [ ] ⏳ Session persists after app kill
- [ ] ⏳ New user gets `profiles` row
- [ ] ⏳ No check-in → venue; sign-out → hero

### Phase 4 — Venue ([PHASE4_VENUE](./PHASE4_VENUE.md))

- [ ] ⏳ 5 seed venues load
- [ ] ⏳ GPS near The Ivy → selectable; Melbourne → disabled
- [ ] ⏳ Venue tooltip once
- [ ] ⏳ Tap venue → check-in with `venueId`

### Phase 5 — Check-in ([PHASE5_CHECKIN](./PHASE5_CHECKIN.md))

- [ ] ⏳ Mode fields validate; check-in inserts row
- [ ] ⏳ Lands on room; SQL confirms `check_ins` row

### Phase 6 — Room — **two users** ([PHASE6_ROOM](./PHASE6_ROOM.md))

- [ ] ⏳ Same venue + mode → see each other
- [ ] ⏳ Mutual connect → chat (pull-to-refresh if connect state lags)
- [ ] ⏳ Block removes peer; different mode → invisible

### Phase 7 — Chat ([PHASE7_CHAT](./PHASE7_CHAT.md))

- [ ] ⏳ Realtime messages both ways
- [ ] ⏳ Profanity filter blocks send
- [ ] ⏳ Manual checkout from chat

### Phase 8 — Safety ([PHASE8_SAFETY](./PHASE8_SAFETY.md))

- [ ] ⏳ Report room + chat with details → SQL row
- [ ] ⏳ Block list modal shows entry
- [ ] ⏳ Tooltips venue / check-in / room
- [ ] ⏳ Privacy/Terms links (if URLs set)

---

## MVP launch sign-off ([PHASE9_SETUP](./PHASE9_SETUP.md) §6)

### Core

- [ ] ⏳ Full E2E: signup → venue → check-in → connect → chat → checkout
- [ ] ⏳ Auto checkout (expiry; geo optional)
- [ ] ⏳ Block removes peer; venue counts = aggregates only

### Security

- [x] No `service_role` in client bundle (verified)
- [x] `.env` gitignored
- [ ] ⏳ App-level RLS tests documented (profiles, check_ins, RPC-only discovery)

### Quality

- [ ] ⏳ iOS + Android smoke (simulator OK for dev sign-off)
- [ ] ⏳ Error states: no GPS, network, expired session
- [x] A11y labels on primary actions (code present; spot-check in live run)

---

## Explicitly post-MVP (not blocking)

- App Store / Play Store submission
- Production AI moderation Edge Function (`OPENAI_API_KEY` server-only)
- Connections Realtime publication (use pull-to-refresh today)
- Push notifications, unblock UI, custom non-Sydney seed
- EAS production builds (skeleton exists; run when ready)

---

## Copy-paste: minimum `.env` for agent to finish push + phone auth

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_APP_SCHEME=sidequest
```

Then tell the agent: **".env is ready"** (or share that verify:env passes). Agent will push schema and guide live validation.

### Optional additions (same file)

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://your-domain.com/privacy
EXPO_PUBLIC_TERMS_URL=https://your-domain.com/terms
```

---

## Never put in mobile `.env`

| Variable | Why |
|----------|-----|
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS — server/Edge only |
| `OPENAI_API_KEY` | Edge Function only — configure in Supabase secrets post-MVP |

---

## Doc index

| Phase | Guide |
|-------|-------|
| 2 DB | [PHASE2_DATABASE.md](./PHASE2_DATABASE.md) |
| 3 Auth | [PHASE3_AUTH.md](./PHASE3_AUTH.md) |
| 4 Venue | [PHASE4_VENUE.md](./PHASE4_VENUE.md) |
| 5 Check-in | [PHASE5_CHECKIN.md](./PHASE5_CHECKIN.md) |
| 6 Room | [PHASE6_ROOM.md](./PHASE6_ROOM.md) |
| 7 Chat | [PHASE7_CHAT.md](./PHASE7_CHAT.md) |
| 8 Safety | [PHASE8_SAFETY.md](./PHASE8_SAFETY.md) |
| 9 Setup | [PHASE9_SETUP.md](./PHASE9_SETUP.md) |
| 9 Launch | [PHASE9_LAUNCH.md](./PHASE9_LAUNCH.md) |
