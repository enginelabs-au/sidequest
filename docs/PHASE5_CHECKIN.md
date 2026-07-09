# Phase 5 — Check-in & profile

Mode-specific profile fields and active check-in creation. Live testing requires Phase 2 `db push`, Phase 3 auth, and Phase 4 venue selection.

## Prerequisites

1. Phase 2 remote push + seed — see [README.md](../README.md)
2. Authenticated session — [docs/PHASE3_AUTH.md](./PHASE3_AUTH.md)
3. Venue selected within 1 km — [docs/PHASE4_VENUE.md](./PHASE4_VENUE.md)
4. `.env` filled with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Expected flow

1. User selects in-range venue → navigates to check-in with `venueId` param
2. Form prefills from existing `profiles` row (if any)
3. User picks mode, fills mode-specific fields, group size
4. Submit → delete own `check_ins` row → mode-scoped profile upsert → insert new check-in
5. `refreshCheckIn()` → redirect to `/(main)/room`

`venueId` resolves from route params or `sidequest:selectedVenueId` in AsyncStorage (set by venue picker).

## Mode field matrix

| Mode | UI fields | `profiles` columns updated |
|------|-----------|---------------------------|
| friends | Interests, music, hobbies, fun fact | `friends_interests`, `friends_music`, `friends_hobbies`, `friends_fun_facts` |
| networking | Role, industry, skills | `networking_role`, `networking_industry`, `networking_skills` |
| dating | Aesthetic, chemistry / vibe | `dating_aesthetic`, `dating_chemistry_notes` |
| all modes | Display name | `display_name` |

Only the **active mode's** columns are upserted on submit — inactive mode data is preserved.

## Validation (client-side)

- Display name required (trimmed)
- Friends: at least one tag field or fun fact
- Networking: role or industry
- Dating: aesthetic or chemistry notes

Session duration: `CHECK_IN_DURATION_HOURS` (4) — `expires_at` computed at submit time in [lib/checkin.ts](../lib/checkin.ts).

## One check-in per user

`check_ins` has `unique(user_id)`. [lib/checkin.ts](../lib/checkin.ts) `clearOwnCheckIns()` deletes the user's row before insert (handles expired leftovers blocking re-check-in).

## SQL validation (when credentials ready)

Replace `<uid>` with your test user's UUID:

```sql
-- Active check-in row
select id, venue_id, mode, group_size, expires_at
from public.check_ins
where user_id = '<uid>';

-- Profile fields (mode-specific columns)
select display_name, friends_interests, networking_role, dating_aesthetic
from public.profiles
where id = '<uid>';

-- Venue count should include your check-in
select * from public.venue_active_check_in_counts();
```

## Validation order

1. Complete Phase 4 venue selection (simulator near The Ivy)
2. Check-in screen shows venue name in subtitle
3. Friends mode: fill display name + one field → submit
4. Verify `check_ins` row and profile columns in SQL Editor
5. App lands on room screen
6. Reload app → still on room (AuthContext restores non-expired check-in)
7. Check out (Phase 7) or delete row manually → returns to venue picker
8. Second check-in in networking mode → networking fields saved; friends fields unchanged

## Code map

| Piece | Path |
|-------|------|
| Check-in screen | [app/(onboarding)/check-in.tsx](../app/(onboarding)/check-in.tsx) |
| Submit logic | [lib/checkin.ts](../lib/checkin.ts) |
| Venue name lookup | [lib/venues.ts](../lib/venues.ts) `fetchVenueName` |
| Session check-in state | [contexts/AuthContext.tsx](../contexts/AuthContext.tsx) `refreshCheckIn` |

## Handoff to Phase 6

Room discovery requires an active non-expired `check_ins` row with matching `venue_id` and `mode` as another user. See [app/(main)/room.tsx](../app/(main)/room.tsx) and `get_room_peers` RPC.

## Related docs

- Venue picker: [docs/PHASE4_VENUE.md](./PHASE4_VENUE.md)
- Auth: [docs/PHASE3_AUTH.md](./PHASE3_AUTH.md)
- Launch checklist: [docs/PHASE9_SETUP.md](./PHASE9_SETUP.md)
