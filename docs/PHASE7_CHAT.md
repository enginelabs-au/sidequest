# Phase 7 — Chat, checkout & auto lifecycle

Ephemeral chat for connected matches, manual check-out, and automatic invisibility on expiry or geo exit. Live testing requires Phases 2–6 complete (mutual connect).

## Prerequisites

1. Phase 2 remote push + migration 006 (`messages` + `check_ins` in Realtime)
2. Two authenticated users mutually connected (Phase 6)
3. Both users have active non-expired `check_ins`
4. `.env` with real Supabase keys

## Chat access rules

Client guards ([`app/(main)/chat/[connectionId].tsx`](../app/(main)/chat/[connectionId].tsx)):

- Active `checkIn` required (AuthContext)
- Valid `connectionId` param
- Connection `status === 'connected'`
- User is `user_one` or `user_two`

Server (RLS on `messages`):

- SELECT/INSERT only when connection is `connected` and user is participant

Discovery still only via `get_room_peers` — chat does not expose new profile data.

## Message flow

1. `loadChat(connectionId, userId)` — validates access + loads history
2. `sendChatMessage` — `sanitizeMessage` → `containsBlockedContent` → insert
3. Realtime `INSERT` on `messages` — deduped by `message.id` in UI
4. Profanity filter MVP: [`lib/moderation.ts`](../lib/moderation.ts) (`spam`, `scam`, `abuse` substrings)

## Manual checkout

Shared helper: [`lib/checkout.ts`](../lib/checkout.ts) `performCheckout(refreshCheckIn)`:

1. `checkout_user` RPC — deletes `check_ins` row
2. `refreshCheckIn()` — clears AuthContext state
3. Navigate to `/(onboarding)/venue`

Triggered from:

- Room screen — Alert confirmation
- Chat screen — Alert confirmation

## Auto-checkout

[`hooks/useAutoCheckout.ts`](../hooks/useAutoCheckout.ts) mounted on [`app/(main)/_layout.tsx`](../app/(main)/_layout.tsx) (covers room + chat stack):

| Trigger | Condition |
|---------|-------------|
| `expired` | `expires_at` reached (4h from check-in by default) |
| `left_venue_area` | User > 1 km from venue (`watchPositionAsync`) |

Geo watch requires foreground location permission; skipped silently if denied. Manual checkout still works.

Venue coords loaded via [`fetchVenueById`](../lib/venues.ts) when `checkIn` is present.

## Validation order (when credentials ready)

1. Complete Phase 6 mutual connect
2. Open chat from room or post-connect navigation
3. User A sends message → appears on User B via Realtime
4. User B replies → both see thread
5. Try blocked word (e.g. "spam") → client rejects send
6. Manual checkout from chat → lands on venue picker; chat guard blocks re-entry
7. Re-check-in → room works; old chat may still exist in DB but requires new connect flow

**Auto-checkout tests (optional):**

- **Expiry:** temporarily set `expires_at` in past via SQL, reload app → auto redirect to venue
- **Geo:** simulator location far from venue while in chat → auto checkout (needs location permission)

## SQL validation

```sql
-- Messages for connection
select id, sender_id, body, created_at
from public.messages
where connection_id = '<connection_id>'
order by created_at;

-- Check-in cleared after checkout
select * from public.check_ins where user_id = '<uid>';

-- Connection still exists (MVP keeps row)
select id, status, user_one_wants, user_two_wants
from public.connections
where id = '<connection_id>';
```

## Code map

| Piece | Path |
|-------|------|
| Chat screen | [app/(main)/chat/[connectionId].tsx](../app/(main)/chat/[connectionId].tsx) |
| Chat logic | [lib/chat.ts](../lib/chat.ts) |
| Checkout helper | [lib/checkout.ts](../lib/checkout.ts) |
| Auto-checkout | [hooks/useAutoCheckout.ts](../hooks/useAutoCheckout.ts) |
| Main layout hook mount | [app/(main)/_layout.tsx](../app/(main)/_layout.tsx) |
| Moderation | [lib/moderation.ts](../lib/moderation.ts) |

## Handoff to Phase 8

Phase 8 polishes safety (report flow), onboarding tooltips across screens, and store privacy strings — not core chat rewrites.

## Related docs

- Room / connect: [docs/PHASE6_ROOM.md](./PHASE6_ROOM.md)
- Check-in: [docs/PHASE5_CHECKIN.md](./PHASE5_CHECKIN.md)
- Launch: [docs/PHASE9_SETUP.md](./PHASE9_SETUP.md)
