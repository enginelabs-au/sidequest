# Phase 8 — Privacy, safety & onboarding polish

Report/block flows, onboarding tooltips, error-state fixes, and store privacy strings. Live testing requires Phases 2–7 complete.

## Prerequisites

1. Phase 2 remote push (migrations 001–006, RLS on `blocks` + `reports`)
2. Two authenticated users checked in at same venue + mode (Phases 5–6 live)
3. Optional: connected chat pair for chat report test (Phase 7 live)
4. `.env` with Supabase keys; optional `EXPO_PUBLIC_PRIVACY_POLICY_URL` / `EXPO_PUBLIC_TERMS_URL`

## Report flow

**Entry points**

- Room: PeerCard → Report → [`components/ReportReasonModal.tsx`](../components/ReportReasonModal.tsx)
- Chat: footer "Report user" → same modal

**API:** [`lib/safety.ts`](../lib/safety.ts) `submitSafetyReport` → `reports` table insert (RLS `reports_insert_own`)

**Reasons:** harassment, spam, inappropriate, other (from `REPORT_REASONS`)

**Optional details:** multiline TextInput; emphasized for "Other"

**Server:** no report RPC — direct insert. Reporter can SELECT own rows only.

## Block flow

**Block:** Room → PeerCard Block → confirm → `block_user` RPC → peer hidden via `get_room_peers` filter

**Block list:** Room footer "Blocked users" → [`components/BlockedUsersModal.tsx`](../components/BlockedUsersModal.tsx)

- Loads `fetchMyBlocks()` — `blocked_id` + `created_at` only
- Anonymized label ("Blocked user") — profiles RLS prevents reading other users' names
- Read-only; **unblock not in MVP**

## Moderation MVP

| Layer | Implementation |
|-------|----------------|
| Client message filter | [`lib/moderation.ts`](../lib/moderation.ts) — `spam`, `scam`, `abuse` substrings |
| Chat integration | [`lib/chat.ts`](../lib/chat.ts) `sendChatMessage` |
| Reports storage | `reports` table + RLS |
| Server AI | **Deferred** — see [`supabase/functions/README.md`](../supabase/functions/README.md) |

## Tooltip sequence (screens 2–4)

Independent first-visit flags in AsyncStorage (`tooltip:{key}`):

| Screen | Key | File |
|--------|-----|------|
| 2 Venue | `venue` | [`app/(onboarding)/venue.tsx`](../app/(onboarding)/venue.tsx) |
| 3 Check-in | `checkin` | [`app/(onboarding)/check-in.tsx`](../app/(onboarding)/check-in.tsx) |
| 4 Room | `room` | [`app/(main)/room.tsx`](../app/(main)/room.tsx) |

Retest: clear AsyncStorage keys or reinstall app.

## Privacy & store strings

**Location permissions** (already in [`app.config.ts`](../app.config.ts)):

- iOS: `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`
- Android: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
- `expo-location` plugin permission strings

**Legal URLs** (`.env`):

```bash
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://your-domain.com/privacy
EXPO_PUBLIC_TERMS_URL=https://your-domain.com/terms
```

Read via [`constants/legal.ts`](../constants/legal.ts); auth screen shows tappable Privacy / Terms links when set.

### App Store Privacy (questionnaire guide)

- **Location:** used for venue proximity + auto-checkout (not for ads)
- **User ID:** account identifier for auth and check-in
- **Tracking:** No — no `NSUserTrackingUsageDescription`
- **Data linked to user:** profile fields, check-in, messages (connected only)

### Play Data Safety (guide)

- Location: approximate/precise, app functionality
- Personal info: name, user IDs — account management + social features
- Not sold; not used for advertising

Set real URLs before store submission (Phase 9).

## Error-state fixes

| Area | Fix |
|------|-----|
| [`lib/errors.ts`](../lib/errors.ts) | `isNetworkError`, `formatUserError` — appends connection hint |
| Phone auth | Config banner when Supabase unset |
| Check-in | Profile load error + Try again |
| Auto-checkout | Expiry shows Alert before venue redirect |
| Room / chat | Network-aware error messages on load failures |

## Validation order (when credentials ready)

1. User A in room → Report User B with reason + details → confirm SQL row
2. Connected pair → Report from chat → `connection_id` populated
3. User A blocks User B → B vanishes from A's deck
4. Open "Blocked users" → entry with date
5. User B cannot see A in deck (bidirectional block filter)
6. Clear tooltip keys → venue, check-in, room tooltips each show once
7. Set legal URLs → Privacy/Terms open in browser from auth screen

## SQL validation

```sql
-- Reports
select id, reason, details, connection_id, created_at
from public.reports
where reporter_id = '<uid>'
order by created_at desc;

-- Blocks
select blocked_id, created_at
from public.blocks
where blocker_id = '<uid>';

-- Blocked user hidden from discovery (as blocked user)
-- Run get_room_peers as User B after User A blocked B — should not include A
```

## Code map

| Piece | Path |
|-------|------|
| Safety module | [lib/safety.ts](../lib/safety.ts) |
| Error helpers | [lib/errors.ts](../lib/errors.ts) |
| Legal URLs | [constants/legal.ts](../constants/legal.ts) |
| Report modal | [components/ReportReasonModal.tsx](../components/ReportReasonModal.tsx) |
| Block list modal | [components/BlockedUsersModal.tsx](../components/BlockedUsersModal.tsx) |
| Edge stub | [supabase/functions/README.md](../supabase/functions/README.md) |

## Handoff to Phase 9

Phase 9: `.env` secrets, `supabase db push`, OAuth providers, E2E launch checklist, optional Edge Function deploy — not safety rewrites.

## Related docs

- Room: [docs/PHASE6_ROOM.md](./PHASE6_ROOM.md)
- Chat: [docs/PHASE7_CHAT.md](./PHASE7_CHAT.md)
- Launch: [docs/PHASE9_SETUP.md](./PHASE9_SETUP.md)
