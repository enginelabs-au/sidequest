# Supabase Edge Functions

## Deployed

### `places-search`

Proxies **Google Places API (New)** for the Social Radar search bar. Keeps the Places API key server-side.

| Action | Body | Response |
|--------|------|----------|
| `autocomplete` | `{ action, input, sessionToken? }` | `{ suggestions: PlaceSuggestion[] }` |
| `details` | `{ action, placeId }` | `{ location: PlaceLocation }` |

**Secret (Supabase Dashboard or CLI):** `GOOGLE_MAPS_PLACES_API_KEY`

**Client:** `lib/googlePlaces.ts` → `supabase.functions.invoke('places-search', …)`

**Deploy:**

```bash
# From repo root — set secret once (use GOOGLE_MAPS_PLACES_API_KEY from .env)
supabase secrets set GOOGLE_MAPS_PLACES_API_KEY="<your-places-key>" --project-ref xzfxkybnjzlpguespkco

supabase functions deploy places-search --project-ref xzfxkybnjzlpguespkco
```

`verify_jwt = false` so search works with simulator dev bypass (anon invoke). The Google key never ships in the mobile bundle.

---

## Planned (post-MVP)

### `moderate-report`

- **Trigger:** Database webhook on `reports` insert
- **Secrets:** `OPENAI_API_KEY`

### `moderate-message`

- **Trigger:** Database webhook on `messages` insert

## Related

- Maps setup: [`docs/GOOGLE_MAPS_SETUP.md`](../../docs/GOOGLE_MAPS_SETUP.md)
- Client: [`lib/googlePlaces.ts`](../../lib/googlePlaces.ts)
- UI: [`components/MapSearchBar.tsx`](../../components/MapSearchBar.tsx)
