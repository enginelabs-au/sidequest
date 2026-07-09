# Phase 9 — Environment, secrets & launch checklist

**Remaining steps & env vars:** [FINAL_CHECKLIST.md](./FINAL_CHECKLIST.md) · **Orchestration:** [PHASE9_LAUNCH.md](./PHASE9_LAUNCH.md)

Complete these steps so the app can run against a live Supabase project.

**Orchestration guide:** [docs/PHASE9_LAUNCH.md](./PHASE9_LAUNCH.md) — full validation waterfall (Phases 2–8 live).

## 1. Create `.env`

```bash
cp .env.example .env
npm run verify:env   # after filling keys — must pass before push
```

| Variable | Required | Where to get it |
|----------|----------|-----------------|
| `EXPO_PUBLIC_SUPABASE_URL` | **Yes** | Supabase Dashboard → Project Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Same page (anon public key) |
| `EXPO_PUBLIC_APP_SCHEME` | No | Default `sidequest` (match `app.config.ts`) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | For Google OAuth | Google Cloud Console → OAuth 2.0 Web client |
| `EXPO_PUBLIC_PRIVACY_POLICY_URL` | Before store | Your privacy policy URL |
| `EXPO_PUBLIC_TERMS_URL` | Before store | Your terms URL |

**Never** put `SUPABASE_SERVICE_ROLE_KEY` in the mobile app.

Verify Expo picks up keys:

```bash
npx expo config --type public | grep -E 'supabaseUrl|scheme'
# Expect real *.supabase.co URL, not placeholder
```

## 2. Supabase project

### You (manual)

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Copy URL + anon key into `.env`
3. Enable Auth providers — see [docs/PHASE3_AUTH.md](./PHASE3_AUTH.md) for redirect URLs and per-provider steps
4. **Phone OTP recommended first** for dev testing

### Agent (after `.env` ready)

```bash
npm run verify:env
supabase login
supabase link --project-ref <ref> --yes
supabase db push --linked --yes
supabase db execute -f supabase/seed.sql --linked
supabase migration list --linked   # 6 migrations, Local = Remote
```

5. Realtime for `messages` and `check_ins` is enabled by migration `20260709164005` on push.

6. Post-push tests in SQL Editor:
   - [supabase/tests/phase2_smoke.sql](../supabase/tests/phase2_smoke.sql) — schema smoke
   - [supabase/tests/phase9_rls_probe.sql](../supabase/tests/phase9_rls_probe.sql) — RLS policy structure
   - See [supabase/tests/README.md](../supabase/tests/README.md)

7. Optional: `npm run db:types` — compare `types/database.generated.ts` vs hand-written `types/database.ts`

## 3. Google Cloud (manual)

1. OAuth consent screen
2. Credentials: Web, iOS, Android clients
3. Add bundle ID `com.sidequest.app` and Android package + SHA-1 for EAS builds

## 4. Apple Developer (manual, iOS)

1. Enable Sign in with Apple on App ID `com.sidequest.app`
2. Create Services ID and key for Supabase Apple provider

## 5. Live validation (after push + auth)

Follow [docs/PHASE9_LAUNCH.md](./PHASE9_LAUNCH.md) in order:

| Phase | Doc | Users needed |
|-------|-----|--------------|
| 3 Auth | [PHASE3_AUTH.md](./PHASE3_AUTH.md) | 1 |
| 4 Venue | [PHASE4_VENUE.md](./PHASE4_VENUE.md) | 1 |
| 5 Check-in | [PHASE5_CHECKIN.md](./PHASE5_CHECKIN.md) | 1 |
| 6 Room | [PHASE6_ROOM.md](./PHASE6_ROOM.md) | **2** |
| 7 Chat | [PHASE7_CHAT.md](./PHASE7_CHAT.md) | **2** (connected) |
| 8 Safety | [PHASE8_SAFETY.md](./PHASE8_SAFETY.md) | **2** |

**Two-user setup:** Two simulators or device + simulator. Same GPS near Sydney seed venue. Phone auth fastest for second account.

**Agent-automated after secrets:**

- [ ] `npm run verify:env` passes
- [ ] `supabase db push --linked --yes` — migrations applied
- [ ] `phase2_smoke.sql` all checks pass
- [ ] `npm run db:types` (optional)
- [ ] `npm start` — no config banners in app
- [ ] Phase 3–8 live validation per PHASE9_LAUNCH

## 6. MVP launch checklist

### Core

- [ ] Signup → venue → check-in → discover → mutual connect → chat → checkout
- [ ] Auto checkout on geo exit and `expires_at`
- [ ] Block removes peer from deck
- [ ] Venue counts show aggregates only (no PII)

### Security

- [ ] `phase9_rls_probe.sql` passes; app-level RLS tests documented
- [ ] No `service_role` in app bundle (`grep -r service_role app lib`)
- [ ] `.env` gitignored; `.env.example` committed

### Quality

- [ ] iOS + Android smoke test (simulator OK for dev sign-off)
- [ ] Error states: no GPS, no network, expired session
- [ ] Accessibility labels on primary actions — Phases 4–8

### Documentation

- [ ] `.cursor/memory/runbooks/sidequest-mvp.md` — Phase 9 exit recorded
- [ ] Launch validation notes captured

### Deferred (post-MVP)

- Venue partnerships / heatmaps / specials
- Premium boosts and filters
- Event organizer tier
- Production AI moderation Edge Function
- Server-side checkout cron
- Push notifications
- App Store / Play Store submission

## 7. EAS (optional, store builds)

Repo includes [`eas.json`](../eas.json) skeleton.

```bash
npm i -g eas-cli
eas login
eas init    # merges with existing eas.json
eas build --profile preview --platform ios
```

Not required for Expo dev-client E2E. See [PHASE9_LAUNCH.md](./PHASE9_LAUNCH.md) § EAS.
