# Supabase Edge Functions (deferred)

Side Quest MVP uses **client-side moderation** only. Server-side AI moderation is planned for post-MVP.

## Planned functions

### `moderate-report` (placeholder)

- **Trigger:** Database webhook on `reports` insert, or client invoke after `submitSafetyReport`
- **Input:** `report_id`, `reason`, `details`, optional message excerpts
- **Action:** OpenAI Moderation API classification; store result in a future `report_reviews` table
- **Secrets:** `OPENAI_API_KEY` — server-only, never in the mobile client (see `.env.example`)

### `moderate-message` (placeholder)

- **Trigger:** Database webhook on `messages` insert
- **Action:** Secondary scan beyond client `containsBlockedContent` in `lib/moderation.ts`
- **Fallback:** MVP relies on client filter + user reports

## Deployment (Phase 9+)

```bash
supabase functions new moderate-report
# Implement handler; deploy with:
supabase functions deploy moderate-report --project-ref <ref>
```

Not deployed in Phase 8. Reports are stored via RLS `reports_insert_own` for manual review.

## Related

- Client filter: [`lib/moderation.ts`](../../lib/moderation.ts)
- Report API: [`lib/safety.ts`](../../lib/safety.ts)
- Phase 8 docs: [`docs/PHASE8_SAFETY.md`](../../docs/PHASE8_SAFETY.md)
