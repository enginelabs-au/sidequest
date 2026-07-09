# Phase 6 — Discovery deck & connections

The Room screen shows discoverable peers at your venue in your mode. Live testing requires Phases 2–5 complete (two users, same venue + mode).

## Prerequisites

1. Phase 2 remote push + seed
2. Phase 3 authenticated session (two test users)
3. Phase 4 venue selection (same venue for both users)
4. Phase 5 check-in (same **mode** for both users, e.g. friends)
5. `.env` with real Supabase keys

## Privacy model

- No direct `SELECT` on other users' profiles or check-ins from the client
- Discovery only via `get_room_peers` RPC (security definer)
- Blocked users filtered server-side in the RPC

## RPC summary

| RPC | Purpose | Path |
|-----|---------|------|
| `get_room_peers` | List peers: same venue + mode, active check-in, not blocked | [supabase/migrations/20260709164003_rpc_functions.sql](../supabase/migrations/20260709164003_rpc_functions.sql) |
| `request_connection` | Upsert connection pair; mutual wants → `status = connected` | same |
| `block_user` | Insert block row; peer hidden on next `get_room_peers` | same |

Client wrappers: [lib/connections.ts](../lib/connections.ts). Room loader: [lib/room.ts](../lib/room.ts) `loadRoomData`.

## Connection states (UI)

| State | RPC flags | PeerCard UI |
|-------|-----------|-------------|
| Fresh | `!i_want && !they_want` | "Connect" button |
| Outgoing pending | `i_want && !they_want` | "Waiting for them to connect back"; Connect disabled |
| Incoming pending | `they_want && !i_want` | "Wants to connect"; **Connect back** button |
| Connected | `connection_status === 'connected'` | "Connected" + Chat button |

## Realtime & refresh

- **check_ins** is in `supabase_realtime` (migration 006) — room subscribes for peer check-in/check-out
- **connections** is NOT in Realtime publication — mutual connect state may be stale on the other device until pull-to-refresh
- After you tap Connect, your screen reloads via `load()`
- Empty room: use **Refresh room** button
- Peer list: pull-to-refresh

## Two-user test procedure

1. Configure Supabase + seed + two auth users (phone OTP is simplest)
2. Two simulators or device + simulator; set both to same GPS near a seed venue
3. User A: sign in → venue → check-in (**friends** mode)
4. User B: sign in → same venue → check-in (**friends** mode)
5. Both open The Room → each should see the other
6. User A taps **Connect** → sees "Waiting for them to connect back"
7. User B pulls to refresh (if needed) → sees "Wants to connect" → taps **Connect back**
8. Both see Connected; initiator of second connect may navigate to chat automatically
9. **Negative test:** User C checks in same venue but **dating** mode → A and B should NOT see C
10. **Block test:** A blocks B → B disappears from A's deck immediately after reload

## SQL validation (when credentials ready)

Inspect as service role or via table queries:

```sql
-- Check-ins for test users
select user_id, venue_id, mode, group_size, expires_at
from public.check_ins
where expires_at > timezone('utc', now());

-- Connection pair (canonical user_one < user_two)
select id, venue_id, user_one, user_two, user_one_wants, user_two_wants, status
from public.connections
where user_one = least('<uidA>'::uuid, '<uidB>'::uuid)
  and user_two = greatest('<uidA>'::uuid, '<uidB>'::uuid);

-- Blocks
select * from public.blocks;
```

`get_room_peers()` requires `auth.uid()` context — use the app UI or Supabase Auth test JWT for RPC calls from SQL editor.

## Expected behavior

| Action | Result |
|--------|--------|
| Open room with active check-in | Peers load via `loadRoomData` |
| Connect (first tap) | `request_connection` → pending |
| Connect back (mutual) | `status = connected`; chat navigation |
| Block | `block_user` → peer removed on reload |
| Check out | Phase 7 — `checkout_user` RPC |
| No Supabase keys | Config banner; load skipped |

## Code map

| Piece | Path |
|-------|------|
| Room screen | [app/(main)/room.tsx](../app/(main)/room.tsx) |
| Peer card | [components/PeerCard.tsx](../components/PeerCard.tsx) |
| Room data | [lib/room.ts](../lib/room.ts) |
| RPC wrappers | [lib/connections.ts](../lib/connections.ts) |

## Handoff to Phase 7

Mutual connect opens [app/(main)/chat/[connectionId].tsx](../app/(main)/chat/[connectionId].tsx). Phase 7 validates messages, checkout button, and [hooks/useAutoCheckout.ts](../hooks/useAutoCheckout.ts).

## Related docs

- Check-in: [docs/PHASE5_CHECKIN.md](./PHASE5_CHECKIN.md)
- Venue picker: [docs/PHASE4_VENUE.md](./PHASE4_VENUE.md)
- Launch checklist: [docs/PHASE9_SETUP.md](./PHASE9_SETUP.md)
