# Phase 3 — Authentication setup

Configure Supabase Auth for Side Quest (Google, Apple, phone OTP). Live testing requires Phase 2 `db push` and a populated `.env`.

## Prerequisites

1. [`.env`](../.env.example) copied and filled:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (Google native — Web client)
   - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (Google native — iOS client; required for iOS builds)
   - `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` (Google native — Android client; required for Android builds)
   - `EXPO_PUBLIC_APP_SCHEME=sidequest` (default)
2. Phase 2 remote push complete (`handle_new_user` trigger live)
3. **Development build required** — native Google/Apple SDKs do not work in Expo Go. Use `npx expo run:ios` / `run:android` or EAS.

## Native sign-in (implemented)

Google and Apple use **native OS dialogs** — no browser, no `supabase.co` URL shown to users.

| Provider | Library | User sees |
|----------|---------|-----------|
| Google | `@react-native-google-signin/google-signin` | Google account picker |
| Apple (iOS only) | `expo-apple-authentication` | Apple system sheet |
| Phone | Supabase OTP | SMS code entry |

Flow: native SDK → ID token → `supabase.auth.signInWithIdToken()` → session ([lib/auth.ts](../lib/auth.ts)).

**Verify config:**

```bash
npm run test:oauth
```

**Rebuild after `.env` or `app.config.ts` changes** (native modules + Google iOS URL scheme):

```bash
npx expo prebuild --clean
npx expo run:ios --device "Free Malware"
```

## Google native sign-in

### 1. Google Cloud Console

1. [OAuth consent screen](https://console.cloud.google.com/) — app name `Side Quest`, logo, privacy/terms URLs
2. **Credentials** → create three OAuth clients:

| Type | Purpose | Goes in |
|------|---------|---------|
| **Web application** | ID token for Supabase | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` + Supabase Google provider |
| **iOS** | Native Google on iOS | `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` + `app.config.ts` plugin (`iosUrlScheme`) |
| **Android** | Native Google on Android | `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` + package `au.enginelabs.sidequest` + SHA-1 ([ANDROID_GOOGLE_AUTH](./ANDROID_GOOGLE_AUTH.md)) |

**iOS client:** bundle ID `au.enginelabs.sidequest`

**Android client:** add debug + release SHA-1 fingerprints:

```bash
# Debug keystore (local dev builds)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

3. Web client **does not** need Supabase redirect URIs for native sign-in (no browser OAuth).

### 2. Supabase Dashboard

**Authentication → Providers → Google**:

| Field | Value |
|-------|-------|
| Enable | On |
| Client ID | Same as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (Web client) |
| Client Secret | From Google Web client (Dashboard only — never in app) |
| **Authorized Client IDs** | Web + iOS + Android IDs comma-separated, e.g. `300778226594-….apps.googleusercontent.com,<ios-client-id>,<android-client-id>` |
| **Skip nonce check** | **On** — required for native iOS Google Sign-In (SDK embeds a nonce in the ID token but does not expose the raw value to the app) |

Quick setup: `npm run setup:google-native`

Or patch via API after creating iOS client:

```bash
SUPABASE_ACCESS_TOKEN=sbp_... bash scripts/patch-supabase-native-auth.sh
```

### 3. App

`.env`:

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=….apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=….apps.googleusercontent.com
```

`app.config.ts` auto-derives `iosUrlScheme` (`com.googleusercontent.apps.…`) for the Google Sign-In config plugin.

## Apple native sign-in (iOS only)

Side Quest uses **`expo-apple-authentication`** + `signInWithIdToken` — not browser OAuth.

### 1. Apple Developer

1. [App ID](https://developer.apple.com/account/resources/identifiers/list) `au.enginelabs.sidequest` — enable **Sign in with Apple** (Primary App ID)
2. **No Services ID or web Return URLs required** for native-only sign-in
3. `expo-apple-authentication` plugin adds the Sign in with Apple entitlement on prebuild

### 2. Supabase Dashboard

**Authentication → Providers → Apple**:

| Field | Value |
|-------|-------|
| Enable | On |
| **Client IDs** | `au.enginelabs.sidequest,au.enginelabs.sidequest.web` (bundle ID **first**, then Services ID if you keep web secret) |

Native Apple tokens use the **bundle ID** (`au.enginelabs.sidequest`) as audience. If only the Services ID is listed, Apple sign-in returns an audience error.

`lib/auth.ts` generates a random nonce, sends SHA-256 (hex) to Apple, and passes the raw nonce to `signInWithIdToken`.

### 3. Test on device

Tap the **Continue with Apple** system button → Face ID / password → lands in app. No browser hop.

---

### Legacy: browser Apple OAuth (removed)

<details>
<summary>Previous browser OAuth setup (Services ID, Return URLs) — not used by the app anymore</summary>

See git history or archived steps if you need web-based Apple OAuth. Native sign-in uses bundle ID `au.enginelabs.sidequest` in Supabase **Client IDs** only.

</details>

## Phone OTP (recommended first for dev)

1. Supabase Dashboard → **Authentication → Providers → Phone**
2. Enable Phone provider
3. Configure SMS via **Twilio** (below) or use Supabase test numbers for development
4. In app: **Continue with phone** → E.164 format (any country, e.g. `+14155552671`, `+61412345678`)

### Twilio + Supabase Phone (production SMS)

Twilio credentials go in the **Supabase Dashboard only** — not in the mobile `.env`. Keep them in `.env` for local verification scripts only (`scripts/verify-phone-auth.sh`).

1. [Twilio Console](https://console.twilio.com/) → copy **Account SID** (`AC…`) and **Auth Token** from the project home dashboard.
2. **Messaging Service SID** (`MG…`):
   - **If you already have one:** Console → **Messaging** → **Services** → click your service → **Properties** → **Messaging Service SID** (starts with `MG`).
   - **If you need one:** **Messaging** → **Services** → **Create Messaging Service** → name it (e.g. `Side Quest OTP`) → add your Twilio phone number as sender → finish → copy the **SID** from the service overview.
3. Supabase → **Authentication → Providers → Phone** → enable **Phone** + **Enable phone sign-ups** → SMS provider **Twilio** → paste:
   - Twilio Account SID (`AC…`)
   - Twilio Auth Token
   - Twilio Message Service SID (`MG…`)
4. **Save.** Run `bash scripts/verify-phone-auth.sh` — must not return `phone_provider_disabled`.

Or patch via API (uses Twilio vars from `.env`):

```bash
bash scripts/patch-supabase-phone-auth.sh
```

**SMS copy:** Supabase sends the text (not Twilio’s default). Edit **Authentication → Providers → Phone → SMS template**, or set via the patch script. Current message: `Side Quest: Your code is 123456` (single code, no duplicate line).

5. Test from app with a real E.164 number.

**Common mistake:** Pasting a **phone number SID** (`PN…`) or raw `+1…` number into the Message Service SID field. Supabase needs the **Messaging Service** SID (`MG…`). Your service is named `sidequest` in Twilio.

**Verify wiring:**

```bash
bash scripts/verify-phone-auth.sh
```

### International users (non-Australia)

Side Quest accepts any valid E.164 number (`+` + country code + number). The app does **not** default to `+61` in the input.

**Twilio setup for global OTP:**

1. **Geo Permissions** (required) — [SMS Geo Permissions](https://www.twilio.com/docs/messaging/guides/sms-geo-permissions)
   - Console → **Messaging** → **Settings** → **Geo Permissions**
   - By default, only your **home country** (from signup verification) is enabled.
   - Enable every destination country your users may sign in from (e.g. United States, United Kingdom, New Zealand, Canada, etc.).
   - **Save geo permissions** (Account Owner/Admin only).
   - Disabled destinations return Twilio error **21408**.

2. **Trial vs paid account**
   - **Trial:** SMS only to [Verified Caller IDs](https://console.twilio.com/us1/develop/phone-numbers/manage/verified) — add each test handset manually.
   - **Production:** Upgrade account + add billing to send OTP to arbitrary numbers worldwide (subject to geo permissions).

3. **Messaging Service sender pool**
   - Keep your US (or local) SMS number in the `sidequest` Messaging Service sender pool.
   - One long-code sender can reach many countries when geo permissions allow it.
   - For high volume per country, consider in-country numbers or short codes later ([Twilio Messaging Services](https://www.twilio.com/docs/messaging/services)).

4. **Supabase rate limits**
   - Dashboard → **Authentication → Rate limits** — default 1 OTP / 60s per number; adjust before launch.

5. **Regulations**
   - Some countries require sender registration (e.g. US A2P 10DLC, India DLT). Review [country SMS guidelines](https://www.twilio.com/docs/glossary/what-is-an-sms-gateway) before enabling geo permissions for those markets.

### Phone auth troubleshooting

| Symptom | Fix |
|---------|-----|
| `phone_provider_disabled` from Supabase | Enable Phone provider + Twilio in Dashboard; click **Save** |
| Twilio `invalid Messaging Service Sid` | Use `MG…`, not `PN…` or phone number |
| Twilio error **21408** | Enable destination country in Geo Permissions |
| Trial: SMS never arrives | Add recipient under **Verified Caller IDs** |
| `Unsupported phone provider` in app | Same as `phone_provider_disabled` — Dashboard config |

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
- [ ] Google native: account picker on iOS and Android (dev build, not Expo Go)
- [ ] Apple native: system sheet on iOS
- [ ] Kill and reopen app — session persists (`AsyncStorage`)
- [ ] New user has `profiles` row in Supabase Table Editor
- [ ] Signed-in user without check-in lands on venue screen
- [ ] Sign out returns to hero screen

## Related

- [PHASE9_SETUP.md](./PHASE9_SETUP.md) — full env and store build secrets
- [supabase/tests/phase2_smoke.sql](../supabase/tests/phase2_smoke.sql) — DB smoke tests before auth
