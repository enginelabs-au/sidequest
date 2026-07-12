# Google Maps setup for Side Quest (detailed)

This guide walks through **every Google Cloud Console choice** needed for Side Quest’s Social Radar: map search, map tiles, and API key restrictions.

**Official references:**
- [Getting started with Google Maps Platform](https://developers.google.com/maps/get-started)
- [Set up Places API (New)](https://developers.google.com/maps/documentation/places/web-service/cloud-setup)
- [API security best practices](https://developers.google.com/maps/api-security-best-practices)
- [March 2025 billing changes](https://developers.google.com/maps/billing-and-pricing/march-2025)
- [Legacy services](https://developers.google.com/maps/legacy)

---

## What Side Quest needs

| Feature | Google product | Where the key lives | Required? |
|---------|----------------|---------------------|-----------|
| Search bar (autocomplete + place details) | **Places API (New)** | Supabase secret `GOOGLE_MAPS_PLACES_API_KEY` → Edge Function `places-search` | **Yes** for search |
| Google map tiles on iOS dev/production build | **Maps SDK for iOS** | `.env` → `GOOGLE_MAPS_IOS_API_KEY` (prebuild only) | Optional (Expo Go uses Apple Maps) |
| Google map tiles on Android dev/production build | **Maps SDK for Android** | `.env` → `GOOGLE_MAPS_ANDROID_API_KEY` (prebuild only) | Optional |

**The Places key is never bundled in the mobile app.** Search calls `supabase.functions.invoke('places-search')`.

**App identifiers** (used when restricting native map keys):
- iOS bundle ID: `au.enginelabs.sidequest`
- Android package: `au.enginelabs.sidequest`

**Recommended:** create **three separate API keys** (search, iOS maps, Android maps). Google recommends one key per app surface.

---

## Important: Legacy vs Places API (New)

As of **1 March 2025**, Google marked the old **Places API** as **Legacy**. New Cloud projects **cannot enable Legacy Places API** in the normal API Library.

Side Quest’s search runs in the **`places-search` Supabase Edge Function**, which calls Places API (New):
- `POST https://places.googleapis.com/v1/places:autocomplete`
- `GET https://places.googleapis.com/v1/places/{placeId}`

In Google Cloud Console enable **Places API (New)** (`places.googleapis.com`). Restrict the Places key to **IP addresses** (Supabase Edge egress) or **None** during setup, then tighten to [Supabase Edge Function IPs](https://supabase.com/docs/guides/functions/rate-limits) when documented for your region.

---

## Part 1 — Account, billing, and project

### 1.1 Sign in

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Sign in with the Google account that will own billing (personal or org).

### 1.2 Create a billing account (first time only)

1. Go to **Billing** → [Manage billing accounts](https://console.cloud.google.com/billing).
2. Click **Create account**.
3. Fill in:
   - **Country** (affects pricing and terms)
   - **Business or individual** name
   - **Payment method** (card required even for free tier)
4. Finish setup.

**Billing notes (2025+):**
- The old **$200/month universal credit** was replaced by **per-SKU free monthly caps** (varies by API).
- New accounts may get a **$300 trial credit** (90 days or until spent).
- You are only charged after free caps are exceeded. Set a [budget alert](https://console.cloud.google.com/billing/budgets) (e.g. $10/month) under **Billing → Budgets & alerts**.

### 1.3 Create a Cloud project

1. Open the [project selector](https://console.cloud.google.com/projectselector2/home/dashboard) (top bar).
2. Click **New project**.
3. **Project name:** e.g. `Side Quest Maps`
4. **Organization:** leave as-is unless you use Google Workspace.
5. Click **Create**.
6. Select the new project in the top bar.

### 1.4 Link billing to the project

1. **Billing** → **Account management** or project **Billing**.
2. If prompted, **Link a billing account** to this project.
3. Confirm the project shows an active billing account.

Without billing linked, Maps APIs return errors even with a valid key.

---

## Part 2 — Enable APIs (Library)

Open: [APIs & Services → Library](https://console.cloud.google.com/apis/library)

Enable **only** what you need:

### 2.1 Places API (New) — **required for search**

1. Search: `Places API (New)`
2. Open the result (service ID: `places.googleapis.com`).
3. Click **Enable**.
4. Button should change to **Manage**.

Direct link: [Enable Places API (New)](https://console.cloud.google.com/apis/library/places.googleapis.com)

### 2.2 Maps SDK for iOS — optional

Only if you want **Google** map tiles on a **native iOS build** (`npx expo run:ios` or EAS), not Expo Go.

1. Search: `Maps SDK for iOS`
2. Click **Enable**

Service ID: `maps-ios-backend.googleapis.com`

### 2.3 Maps SDK for Android — optional

Same for Android native builds.

1. Search: `Maps SDK for Android`
2. Click **Enable**

Service ID: `maps-android-backend.googleapis.com`

### 2.4 Do **not** enable (unless you add features later)

Skip these for Side Quest’s current radar:
- Maps JavaScript API (web only)
- Geocoding API, Routes API, Directions API, Distance Matrix API
- Places API **(Legacy)** — hidden/disabled for new projects

**Verify enabled APIs:** [APIs & Services → Enabled APIs](https://console.cloud.google.com/apis/dashboard)

---

## Part 3 — Create API keys

Open: [Google Maps Platform → Credentials](https://console.cloud.google.com/google/maps-apis/credentials)

Or: **APIs & Services → Credentials**

---

### Key A — Places search (Supabase secret `GOOGLE_MAPS_PLACES_API_KEY`)

Used only by Edge Function `places-search` — **not** in the mobile client.

#### Google Cloud key setup

1. **Create credentials** → **API key**
2. **Name:** `sidequest-places-server`
3. **Application restrictions:** **IP addresses** (recommended for production) or **None** while testing
4. **API restrictions:** **Places API (New)** only

#### Supabase secret + deploy

```bash
# From repo root (use the value from .env GOOGLE_MAPS_PLACES_API_KEY)
supabase secrets set GOOGLE_MAPS_PLACES_API_KEY="AIza..." --project-ref xzfxkybnjzlpguespkco
supabase functions deploy places-search --project-ref xzfxkybnjzlpguespkco
```

Local `.env` keeps `GOOGLE_MAPS_PLACES_API_KEY` for reference when running `supabase secrets set`; production builds use the Edge Function only.

#### Dev fallback (simulator / `__DEV__` only)

For faster local iteration without deploying the Edge Function, set in `.env`:

```bash
DEV_PLACES_API_KEY=AIza...
# DEV_PLACES_FALLBACK=false   # force Edge Function even in dev
```

`DEV_PLACES_API_KEY` is **not** `EXPO_PUBLIC_` — it is read at Metro startup and passed through `app.config.ts` → `extra.devPlacesApiKey`. Omit it in production/EAS env so release builds always use `places-search`.

---

### Key B — iOS map tiles (`GOOGLE_MAPS_IOS_API_KEY`)

Only for native iOS builds with Google map provider.

#### Create

1. **Create credentials** → **API key**
2. **Name:** `sidequest-maps-ios`

#### Application restrictions

| Field | Select |
|-------|--------|
| Application restrictions | **iOS apps** |
| Add an item | Bundle ID: `au.enginelabs.sidequest` |

#### API restrictions

| Field | Select |
|-------|--------|
| API restrictions | **Restrict key** |
| Select APIs | **Maps SDK for iOS** |

**Save.**

```bash
GOOGLE_MAPS_IOS_API_KEY=AIzaSy...
```

Rebuild native app (keys are baked in at prebuild):

```bash
npx expo prebuild --clean
npx expo run:ios
```

---

### Key C — Android map tiles (`GOOGLE_MAPS_ANDROID_API_KEY`)

#### Create

1. **Create credentials** → **API key**
2. **Name:** `sidequest-maps-android`

#### Application restrictions

| Field | Select |
|-------|--------|
| Application restrictions | **Android apps** |
| Package name | `au.enginelabs.sidequest` |
| SHA-1 certificate fingerprint | see below |

**SHA-1 for Expo debug builds** (simulator / `expo run:android`):

```bash
keytool -list -v \
  -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android -keypass android
```

Copy the **SHA1** line. Console wants colon format, e.g. `AA:BB:CC:...`

For **Play Store / EAS production**, also add the **release** keystore SHA-1 from EAS credentials or Play App Signing.

#### API restrictions

| Field | Select |
|-------|--------|
| API restrictions | **Restrict key** |
| Select APIs | **Maps SDK for Android** |

```bash
GOOGLE_MAPS_ANDROID_API_KEY=AIzaSy...
```

---

## Part 4 — Console screens cheat sheet

When editing any API key you will see:

```
┌─────────────────────────────────────────┐
│ Name: [sidequest-places-search      ] │
├─────────────────────────────────────────┤
│ Key restrictions                        │
│                                         │
│ Application restrictions                │
│ ○ None                                  │
│ ○ HTTP referrers (web sites)            │
│ ○ IP addresses                          │
│ ○ Android apps                          │
│ ○ iOS apps                              │
│                                         │
│ API restrictions                        │
│ ○ Don't restrict key                    │
│ ● Restrict key                          │
│   [Select APIs ▼]                       │
│                                         │
│ [Save]  [Cancel]                        │
└─────────────────────────────────────────┘
```

**Rules Google enforces:**
- If you pick **iOS apps**, that key cannot be used for Android or server REST.
- If you pick **Android apps**, same for iOS.
- **Never** use “Don’t restrict key” in production without a good reason.
- You are **financially responsible** for abuse of unrestricted keys.

---

## Part 5 — Verify setup

### 5.1 Test Places API (New) from terminal

Replace `YOUR_KEY`:

```bash
curl -s -X POST \
  'https://places.googleapis.com/v1/places:autocomplete' \
  -H 'Content-Type: application/json' \
  -H "X-Goog-Api-Key: YOUR_KEY" \
  -d '{
    "input": "Sydney Opera",
    "includedRegionCodes": ["au"]
  }' | head -c 500
```

**Success:** JSON with `suggestions` array.  
**Failure:** `error` with `PERMISSION_DENIED` or `API_KEY_INVALID`.

### 5.2 Test in Side Quest

1. Deploy `places-search` and set `GOOGLE_MAPS_PLACES_API_KEY` secret (above)
2. `npx expo start --ios --clear`
3. Open **Social Radar**
4. Type in search bar → suggestions appear
5. Select a place → map pans
6. Tap a venue hotspot → venue profile → CHECK-IN

### 5.3 Monitor usage

- [Maps Platform Metrics](https://console.cloud.google.com/google/maps-apis/metrics)
- [Billing reports](https://console.cloud.google.com/billing)

---

## Part 6 — Troubleshooting

| Error / symptom | Likely cause | Fix |
|-----------------|--------------|-----|
| `REQUEST_DENIED` / not authorized | Places API (New) not enabled | Enable in Library (Part 2.1) |
| `Function not found` | Edge function not deployed | `supabase functions deploy places-search` |
| `GOOGLE_MAPS_PLACES_API_KEY is not configured` | Supabase secret missing | `supabase secrets set GOOGLE_MAPS_PLACES_API_KEY=...` |
| Search placeholder “Configure Supabase” | Supabase env missing in app | Set `EXPO_PUBLIC_SUPABASE_URL` + anon key |
| Map shows in Expo Go but not Google style | Expected on iOS Expo Go | Use `npx expo run:ios` + `GOOGLE_MAPS_IOS_API_KEY` |
| Android map blank | Wrong SHA-1 on key | Add debug SHA-1; rebuild |
| `LegacyApiNotActivatedMapError` | Calling legacy API | Enable Places API (New); ensure app uses New endpoints |

---

## Part 7 — Cost expectations (dev)

Places Autocomplete (New) and Place Details (New) are billed per session/request with **monthly free caps** per SKU category (see [pricing](https://developers.google.com/maps/billing-and-pricing/overview)).

For local dev and a small test group, usage usually stays within free tiers. Set a budget alert anyway.

---

## Part 8 — Security before App Store

1. **Never commit** `.env` or keys to git.
2. Prefer **separate keys** per platform (already above).
3. Places search already uses a **Supabase Edge Function** — restrict the Places key to server/IP use only.
4. Enable [budget alerts](https://console.cloud.google.com/billing/budgets).

---

## Side Quest file mapping

| `.env` variable | Used by |
|-----------------|---------|
| `GOOGLE_MAPS_PLACES_API_KEY` | Supabase secret → `places-search` Edge Function |
| `DEV_PLACES_API_KEY` | Dev fallback — `app.config.ts` extra → direct Places in `__DEV__` |
| `GOOGLE_MAPS_IOS_API_KEY` | `app.config.ts` → `react-native-maps` iOS plugin |
| `GOOGLE_MAPS_ANDROID_API_KEY` | `app.config.ts` → `react-native-maps` Android plugin |

Related code:
- `supabase/functions/places-search/index.ts`
- `lib/googlePlaces.ts`
- `components/MapSearchBar.tsx`
- `app/(onboarding)/venue/index.tsx`
- `components/SocialRadarMap.tsx`
