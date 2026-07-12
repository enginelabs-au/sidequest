# STATE.md

## Current Objective

- **Forward swipe + solo check-in** — users can navigate forward via edge swipe; check-in and room access work alone (no peer-count gates).

## Active Items

- **User:** Verify right→left forward swipe after navigating back (e.g. venue → back → forward returns to venue)
- **User:** Verify solo check-in — View Room before/after check-in, empty room copy, Home feed with solo banner

## Files in Active Use

- `lib/navHistory.ts`, `components/SwipeNavEdges.tsx`
- `lib/venueNavigation.ts`, `lib/venuePresence.ts`, `lib/venueRoom.ts`
- `app/(onboarding)/venue/[venueId]/{index,room}.tsx`, `components/RoomFeedScreen.tsx`

## Open Blockers

- None — pending user device verification

## Attempts Performed

- 2026-07-12: Forward nav — manual `recordBackFrom` before `router.back()`, `consumeForward` on forward swipe; full-screen forward gesture when history allows
- 2026-07-12: Solo check-in — fixed `venueRoomRoute` pre-check-in path; self always in roster; positive empty/solo UX; `USER.md` standing rule

## Next Actions

1. User tests forward swipe + solo check-in on Free Malware
2. Report any remaining peer-count gates or broken room routes

## Last Updated

- 2026-07-12 — forward swipe + solo check-in fix; rebuilt Free Malware

---
