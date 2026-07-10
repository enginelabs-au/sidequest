# Phase 3 — Authentication setup

Configure Supabase Auth for Side Quest (Google, Apple, phone OTP). Live testing requires Phase 2 `db push` and a populated `.env`.

## Prerequisites

1. [`.env`](../.env.example) copied and filled:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_APP_SCHEME=sidequest` (default)
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (for Google OAuth)
2. Phase 2 remote push complete (`handle_new_user` trigger live)
3. App scheme matches [app.config.ts](../app.config.ts): `sidequest`

## Redirect URLs (Supabase Dashboard)

**Authentication → URL Configuration → Redirect URLs**, add:

| URL | When |
|-----|------|
| `sidequest://auth/callback` | Production / dev client builds |
| Expo dev URI | Local development |

To find your Expo dev redirect URI, run the app and check logs, or temporarily log in code:

```typescript
import { makeRedirectUri } from 'expo-auth-session';
console.log(makeRedirectUri({ scheme: 'sidequest', path: 'auth/callback' }));
```

Add every variant Supabase and Google/Apple may redirect to. Mismatch is the most common OAuth failure.

Canonical redirect path is defined in [lib/auth.ts](../lib/auth.ts) as `auth/callback`, handled by [app/auth/callback.tsx](../app/auth/callback.tsx) and [hooks/useAuthDeepLink.ts](../hooks/useAuthDeepLink.ts).

## Phone OTP (recommended first for dev)

1. Supabase Dashboard → **Authentication → Providers → Phone**
2. Enable Phone provider
3. Configure SMS via **Twilio** (below) or use Supabase test numbers for development
4. In app: **Continue with phone** → E.164 format (`+61412345678`)

### Twilio + Supabase Phone (production SMS)

Twilio credentials go in the **Supabase Dashboard only** — not in the mobile `.env`.

1. [Twilio Console](https://console.twilio.com/) → copy **Account SID** (`AC…`) and **Auth Token** from the project home dashboard.
2. **Messaging Service SID** (`MG…`):
   - **If you already have one:** Console → **Messaging** → **Services** → click your service → **Properties** → **Messaging Service SID** (starts with `MG`).
   - **If you need one:** **Messaging** → **Services** → **Create Messaging Service** → name it (e.g. `Side Quest OTP`) → add your Twilio phone number as sender → finish → copy the **SID** from the service overview.
3. Supabase → **Authentication → Providers → Phone** → enable Twilio and paste:
   - Twilio Account SID
   - Twilio Auth Token
   - Twilio Message Service SID (`MG…`)
4. Save. Send a test OTP from the app with a real E.164 number (`+61…`).

**Note:** A bare Twilio phone number alone is not the Messaging Service SID. Supabase expects the `MG…` service SID for reliable OTP delivery.

## Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) → OAuth 2.0 credentials
2. Create **Web client** — copy Client ID to `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
3. Supabase Dashboard → **Authentication → Providers → Google** — paste Web client ID + secret
4. For store builds: add iOS bundle ID `au.enginelabs.sidequest` and Android package + SHA-1 (see [PHASE9_SETUP.md](./PHASE9_SETUP.md))
5. In app: **Continue with Google** — opens browser, returns via `sidequest://auth/callback`

## Apple Sign In (iOS)

1. Apple Developer → register App ID `au.enginelabs.sidequest` → enable Sign in with Apple
2. Create Services ID and key for Supabase Apple provider
3. Supabase Dashboard → **Authentication → Providers → Apple** — configure Services ID, secret key, bundle ID
4. MVP uses **browser OAuth** via `signInWithOAuth({ provider: 'apple' })`, not native `expo-apple-authentication`

## Profile creation

On sign-up, a `profiles` row is created by:

1. **Server:** [supabase/migrations/20260709164004_auth_trigger.sql](../supabase/migrations/20260709164004_auth_trigger.sql) (`handle_new_user` trigger)
2. **Client fallback:** [lib/auth.ts](../lib/auth.ts) `ensureProfile()` on `SIGNED_IN` in [contexts/AuthContext.tsx](../contexts/AuthContext.tsx)

Both paths are idempotent.

## Session and routing

| State | Route |
|-------|-------|
| No session | `/(auth)` hero |
| Session, no check-in | `/(onboarding)/venue` |
| Session + active check-in | `/(main)/room` |

Sign out ([contexts/AuthContext.tsx](../contexts/AuthContext.tsx)) clears session and navigates to `/(auth)`.

## Live validation checklist (deferred until credentials)

Run in this order:

- [ ] Phone OTP: send + verify on simulator or device
- [ ] Google OAuth: full flow on iOS and Android
- [ ] Apple OAuth: full flow on iOS
- [ ] Kill and reopen app — session persists (`AsyncStorage`)
- [ ] New user has `profiles` row in Supabase Table Editor
- [ ] Signed-in user without check-in lands on venue screen
- [ ] Sign out returns to hero screen

## Related

- [PHASE9_SETUP.md](./PHASE9_SETUP.md) — full env and store build secrets
- [supabase/tests/phase2_smoke.sql](../supabase/tests/phase2_smoke.sql) — DB smoke tests before auth
