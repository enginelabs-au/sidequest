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

## Apple Sign In (iOS) — OAuth via Supabase

Side Quest uses **browser OAuth** (`signInWithOAuth({ provider: 'apple' })`), not native `expo-apple-authentication`.

Sources: [Apple — Configure Sign in with Apple for the web](https://developer.apple.com/help/account/configure-app-capabilities/configure-sign-in-with-apple-for-the-web/), [Register a Services ID](https://developer.apple.com/help/account/identifiers/register-a-services-id/), [Supabase Apple auth](https://supabase.com/docs/guides/auth/social-login/auth-apple#configuration-web-oauth).

### What you need

| Artifact | Apple Developer location | Used in Supabase |
|----------|--------------------------|------------------|
| Team ID | Membership | Secret generator |
| **Primary** App ID | Identifiers → App IDs | Links Services ID + Key |
| Services ID | Identifiers → Services IDs | **Client ID** |
| Signing Key (`.p8`) | **Keys** (left sidebar) | Generate **Secret Key** |

---

### Step 1 — Team ID

[developer.apple.com/account](https://developer.apple.com/account) → **Membership** → copy **Team ID** (10 characters).

---

### Step 2 — App ID (enable as **Primary**)

1. [Identifiers](https://developer.apple.com/account/resources/identifiers/list) → **+** → **App IDs** → Continue
2. Description: `Side Quest`
3. Bundle ID: **Explicit** → `au.enginelabs.sidequest`
4. Capabilities: enable **Sign in with Apple**
   - When prompted, choose **Enable as a primary App ID** (not “group with existing” unless you already have a primary for this app family)
   - Leave **Server-to-Server notification endpoint** blank (Supabase does not use it)
5. Continue → Register

This step does **not** create a `.p8` key.

---

### Step 3 — Register Services ID (no web config yet)

Per [Register a Services ID](https://developer.apple.com/help/account/identifiers/register-a-services-id/) — register first, configure **after** from the list.

1. [Identifiers](https://developer.apple.com/account/resources/identifiers/list) → **+** → **Services IDs** → Continue
2. Description: `Side Quest Web Auth`
3. Identifier: e.g. `au.enginelabs.sidequest.web` (reverse-DNS; unique in your team)
4. Continue → **Register**

Do **not** expect domain/return URL fields on this screen — they appear in Step 4.

---

### Step 4 — Configure web auth on the Services ID (this is the step that often fails)

Apple’s flow: **select the Services ID from the list**, then configure.

1. Open [Services IDs list](https://developer.apple.com/account/resources/identifiers/list/serviceId) (or Identifiers → filter **Services IDs** top-right)
2. **Click the Services ID you just registered** (e.g. `au.enginelabs.sidequest.web`) — opens its detail/edit page
3. Check **Sign in with Apple** → click **Configure** (opens **Web Authentication Configuration** modal)
4. **Primary App ID:** select `au.enginelabs.sidequest`
5. **Website URLs** — the modal has separate fields (do not mix formats):

   | Field | Correct value for Side Quest | Wrong (causes errors) |
   |-------|------------------------------|------------------------|
   | **Domains and Subdomains** | `xzfxkybnjzlpguespkco.supabase.co` | `https://xzfxkybnjzlpguespkco.supabase.co` |
   | **Return URLs** | `https://xzfxkybnjzlpguespkco.supabase.co/auth/v1/callback` | bare domain, or missing `https://` |

   Rules from Apple docs:
   - Domains: hostname only, **no** `https://`, **no** trailing `/`
   - Return URLs: **absolute** URI with `https://`, host, and path ([Apple documentation](https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple))
   - If the UI only shows one comma-delimited box, enter domain and return URL as separate comma-separated entries using the formats above

6. Modal: **Done**
7. Services ID page: **Continue** → **Save** (required — skipping Save drops the config)

**If Return URLs won’t stick or you get `invalid redirect_uri`:** Apple sometimes strips `https://` when editing an existing Services ID. Delete the Services ID, recreate it, and enter the return URL with `https://` on first setup ([Apple Developer Forums](https://developer.apple.com/forums/thread/132915)).

Copy the **Services ID identifier** (e.g. `au.enginelabs.sidequest.web`) — this is Supabase **Client ID**, **not** the App ID / bundle ID.

---

### Step 5 — Signing Key (`.p8`) — Keys section, not Identifiers

Per Apple: create a private key in **Keys**, associated with your primary App ID.

1. [Keys](https://developer.apple.com/account/resources/authkeys/list) → **+**
2. **Key Name** — a human-readable label **for your reference only** (Apple docs: “name is for your reference only and isn’t part of the key itself”):
   - Use e.g. `Side Quest Apple Auth` or `SideQuestAppleAuth`
   - **Do not** put `au.enginelabs.sidequest` here — that is the App ID / bundle ID, not a key name
   - **Avoid dots** (`.`) in the Key Name — `au.enginelabs.sidequest` triggers **“invalid name”**
   - Avoid special characters; stick to letters, numbers, and spaces
3. Enable **Sign in with Apple** → click **Configure** (separate step)
4. In **Configure Key** modal: **Primary App ID** → select `au.enginelabs.sidequest` from the **dropdown** (do not type into Key Name)
5. Modal → **Save** → back on key page → **Continue** → **Register**
6. **Download** `AuthKey_XXXXXXXXXX.p8` (one-time download)
7. Note **Key ID** from the Keys list (10 characters)

| Field on Keys page | What to enter |
|--------------------|---------------|
| **Key Name** | `Side Quest Apple Auth` (friendly label) |
| **Configure → Primary App ID** | `au.enginelabs.sidequest` (from dropdown) |


---

### Step 6 — Generate Apple **Client Secret**

Supabase needs two values for Apple: **Client ID** (Services ID) and **Client Secret** (a JWT you generate — not the raw `.p8` file).

| Supabase field | Apple name | Your value |
|----------------|------------|------------|
| **Client IDs** | Client ID / Services ID | `au.enginelabs.sidequest.web` (from Step 4) |
| **Secret Key** | Client Secret | JWT generated below |

1. Open the **Generate Apple client secret** tool in [Supabase Apple auth docs](https://supabase.com/docs/guides/auth/social-login/auth-apple#configuration-web-oauth) (Chrome/Firefox — Safari often fails)
2. Fill in:

   | Generator input | Where you have it |
   |-----------------|-------------------|
   | Team ID | `.env` → `APPLE_TEAM_ID` |
   | Key ID | `.env` → `APPLE_AUTH_KEY_ID` |
   | Client ID | **Services ID** e.g. `au.enginelabs.sidequest.web` (not the App ID) |
   | Private key | `.env` → `APPLE_AUTH_KEY` contents, or upload the `.p8` file |

3. Click generate → copy the long JWT string — this is your **Client Secret**

**Note:** The Client Secret expires every **6 months**. Regenerate with the same `.p8` / `APPLE_AUTH_KEY` and update Supabase. Store Team ID, Key ID, Services ID, and `.p8` in `.env` for reference only — the mobile app never reads them; only Supabase Dashboard uses Client ID + Client Secret.

---

### Step 7 — Supabase Dashboard (Client ID + Client Secret)

**Authentication → Providers → Apple**:

| Supabase field | Paste |
|----------------|-------|
| Enable | On |
| **Client IDs** | `au.enginelabs.sidequest.web` (Apple **Client ID** = Services ID) |
| **Secret Key** | JWT from Step 6 (Apple **Client Secret**) |

**Authentication → URL Configuration → Redirect URLs** — confirm:

```
sidequest://auth/callback
```

---

### Step 8 — Test in app

```bash
npm start
```

On iOS: tap **Continue with Apple** → browser consent → should return via `sidequest://auth/callback` and land on venue screen (new user) or room (if checked in).

Verify in Supabase **Authentication → Users** that a new user appears after sign-in.


### Troubleshooting

| Symptom | Fix |
|---------|-----|
| No **Configure** button on Services ID | Register first (Step 3), then open the Services ID from the [list](https://developer.apple.com/account/resources/identifiers/list/serviceId) |
| **Invalid domain** | Remove `https://` from Domains field |
| **`invalid redirect_uri`** | Return URL must match exactly; recreate Services ID if Apple stripped `https://` |
| OAuth uses wrong client | Supabase **Client IDs** = Services ID, not `au.enginelabs.sidequest` |
| No `.p8` from App ID wizard | Keys are only created under **Keys** (Step 5) |
| **Invalid name** when creating Key | You entered the bundle ID in **Key Name** — use `Side Quest Apple Auth`; put `au.enginelabs.sidequest` only in **Configure → Primary App ID** dropdown |

### Maintenance

Regenerate the Supabase secret every **6 months** with the same `.p8` file.



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
