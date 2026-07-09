# Phase 4 — Venue picker & proximity

GPS-gated venue selection with aggregate check-in counts. Live testing requires Phase 2 `db push` + seed and an authenticated session (Phase 3).

## Prerequisites

1. Phase 2 remote push complete — see [README.md](../README.md) Supabase setup
2. Seed applied: `supabase db execute -f supabase/seed.sql --linked`
3. `.env` filled with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
4. Signed-in user (Phase 3 auth) — venue screen is behind session guard

## Seed venues (Sydney CBD)

From [supabase/seed.sql](../supabase/seed.sql). Reference point: CBD `-33.8688, 151.2093`.

| Venue | Latitude | Longitude |
|-------|----------|-----------|
| The Ivy | -33.8655 | 151.2099 |
| Oxford Art Factory | -33.8842 | 151.2103 |
| The Beresford | -33.8848 | 151.2201 |
| Frankie's Pizza | -33.8712 | 151.2068 |
| Maybe Sammy | -33.8615 | 151.2108 |

## Simulator GPS setup

### iOS Simulator

1. Run the app (`npm start` → press `i`)
2. **Features → Location → Custom Location…**
3. For in-range test: `-33.8655, 151.2099` (The Ivy)
4. For far/blocked test: `-37.8136, 144.9631` (Melbourne CBD)

### Android Emulator

1. Run the app (`npm start` → press `a`)
2. Open **Extended controls** (⋯) → **Location**
3. Enter the same coordinates as above

Grant location permission when prompted. Use **Refresh location** on the venue screen after changing simulator coords.

## Expected behavior

| Condition | Result |
|-----------|--------|
| Within 1 km of venue | Venue card selectable → navigates to check-in with `venueId` |
| Beyond 1 km | Card dimmed, disabled, "Too far" label |
| No location permission | Error banner + **Open location settings** button |
| No Supabase keys | Config banner; list disabled |
| Empty `venues` table | "No venues found — run seed after db push" |
| First visit | Tooltip overlay (`tooltip:venue` in AsyncStorage); dismiss persists |
| Counts RPC | Shows aggregate "N here" per venue; no names (privacy) |

Proximity gate uses `VENUE_MAX_DISTANCE_KM` (1) from [constants/theme.ts](../constants/theme.ts) via [lib/geo.ts](../lib/geo.ts) `isWithinVenueRange`.

## RPC validation

After push, in Supabase SQL Editor:

```sql
select * from public.venue_active_check_in_counts();
```

Empty result is OK before any check-ins. Also covered by [supabase/tests/phase2_smoke.sql](../supabase/tests/phase2_smoke.sql) check #7.

Venue list loads via `venues` table (public read RLS). Counts load via [lib/connections.ts](../lib/connections.ts) `fetchVenueCounts()` → `venue_active_check_in_counts` RPC.

## Validation order (when credentials ready)

1. Confirm 5 venues in DB: `select count(*) from public.venues;`
2. Sign in → land on venue picker (no active check-in)
3. Set simulator near The Ivy → venue selectable
4. Set simulator to Melbourne → venue blocked (disabled)
5. First visit tooltip shows once; dismiss → does not reappear on reload
6. Select in-range venue → check-in screen opens with `venueId` param
7. Pull-to-refresh reloads venues + counts

## Code map

| Piece | Path |
|-------|------|
| Venue screen | [app/(onboarding)/venue.tsx](../app/(onboarding)/venue.tsx) |
| Venue data loader | [lib/venues.ts](../lib/venues.ts) |
| Counts RPC | [lib/connections.ts](../lib/connections.ts) |
| Geo helpers | [lib/geo.ts](../lib/geo.ts) |
| Location hook | [hooks/useLocation.ts](../hooks/useLocation.ts) |
| First-visit tooltip | [hooks/useTooltipFlag.ts](../hooks/useTooltipFlag.ts), [components/TooltipOverlay.tsx](../components/TooltipOverlay.tsx) |

## Handoff to Phase 5

Selecting a venue stores `sidequest:selectedVenueId` in AsyncStorage and navigates to [app/(onboarding)/check-in.tsx](../app/(onboarding)/check-in.tsx) with `venueId`. Phase 5 validates profile upsert + `check_ins` insert.

## Related docs

- Auth setup: [docs/PHASE3_AUTH.md](./PHASE3_AUTH.md)
- Full launch checklist: [docs/PHASE9_SETUP.md](./PHASE9_SETUP.md)
