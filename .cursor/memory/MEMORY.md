# Working memory

## Remember — execute; do not delegate to the user

When a user asks for work that can be performed with available tools, the agent should execute the work directly instead of giving the user a checklist to perform manually.

Use user-run steps only when:

- credentials, permissions, approvals, or physical access are required
- a tool is unavailable or blocked
- safety or policy constraints prevent direct execution
- the user explicitly asks for instructions rather than execution

## Project index — Side Quest

- **Product:** venue-anchored, time-limited, intent-segmented social discovery (Expo + Supabase).
- **UI theme:** **Active Open To mode drives app-wide primary** (buttons, tab bar, accents, chat bubbles) — friends purple `#4E1A7A`, networking blue `#2563EB`, dating pink `#EC4899`. Brand purple `#371259` is app icon / friends canonical only, not global default. Activity/inbox keep varied semantic colors (wave, request, check-in, reply). v5 ref `design/ui/sidequest-social-v5-inbox-activity-discovery.png`; v6 settings ref `design/ui/sidequest-settings-profile-v6-reference.png`. **Main tabs:** Home (discovery deck), Alerts, Map (coral pin FAB), Check-ins, Profile. Solid opaque UI — no glass/transparency.
- **App routes:** No bracket route groups — `app/auth/`, `app/onboarding/`, `app/main/tabs/` (paths like `/main/tabs/home`). Canonical list: `lib/routes.ts`. Chat back button → **Inbox**.
- **Semantic colors:** Alerts by type (wave purple, request pink, check-in green, reply blue). Check-ins tab: green active venue, muted purple past. Inbox requests pink. Wave button: green 3D → yellow 30s timer → red Un-Wave. First chat message uses same 30s timer.
- **Home / room deck:** View Room = same `RoomFeedScreen` as Home tab. Check-in status tag (green = checked in, coral = not). Green `WaveButton` with wave animation; tap profile photo/name for public profile (no separate profile button).
- **Solo check-in:** Never gate check-in or room access on other users being present. Empty room = valid state; positive copy + self in roster when checked in alone.
- **Attendee counters:** All viewer-facing presence/mode/map counts exclude the signed-in user when they are checked in at that venue — counts are **other people only** (`lib/venuePresence.ts`).
- **Social actions require check-in:** Waving and messaging blocked until checked in — `useCheckInGate` / `promptCheckInRequired` with **Go to Map** (`lib/checkInGate.ts`).
- **Device rebuilds:** After substantive changes, rebuild to connected iOS devices (`npx expo run:ios --device "<name>"`).
- **Plan:** `docs/plans/side_quest_phase_0_50bd8a65.plan.md`
- **Runbook:** `.cursor/memory/runbooks/sidequest-mvp.md`
- **Env / launch:** `docs/FINAL_CHECKLIST.md`, `docs/PHASE9_SETUP.md`, `docs/PHASE9_LAUNCH.md`, `scripts/verify-env.sh`, `.env.example`
- **Schema:** `supabase/migrations/` (profiles, venues, check_ins, connections, blocks, messages, reports, RLS, RPCs)
- **Maps / Social Radar:** `docs/GOOGLE_MAPS_SETUP.md`; Places via Edge Function `places-search` + secret `GOOGLE_MAPS_PLACES_API_KEY`; native keys `GOOGLE_MAPS_IOS_API_KEY`, `GOOGLE_MAPS_ANDROID_API_KEY`.
- **Native auth (Google/Apple/phone):** `docs/PHASE3_AUTH.md`, `docs/ANDROID_GOOGLE_AUTH.md`. Env: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`. Supabase Google authorized IDs = Web + iOS + Android (comma-separated in `external_google_client_id`). Patch: `bash scripts/patch-supabase-native-auth.sh`. Verify: `npm run test:oauth`.
- **Remote DB:** linked project `xzfxkybnjzlpguespkco`; `npm run verify:env` → `db push`

## Primary working memory role

**This file (`.cursor/memory/MEMORY.md`) is the agent's concise working memory.** Read it before substantive work in this workspace.

Keep this file focused on durable context only:

- standing directives
- durable user preferences
- major decisions
- current project index pointers
- high-level architecture notes
- references to relevant detailed memory, blocker, runbook, skill, or tool files

Do **not** use this file for:

- verbose project logs
- long attempted-fix chains
- one-off debugging history
- unresolved blocker narratives
- detailed runbook procedures
- secrets, passwords, private keys, or API tokens

## Credential and secret handling

- Never put passwords, private keys, or API tokens in this markdown file.
- Store only environment variable **names**, credential source **labels**, or non-sensitive paths when they are necessary for reproducibility.
- Do not guess hostnames, account names, project refs, or secret locations. Use the project’s configured environment, documented scripts, or explicit user-provided details.

## Project index

- **`.cursor/memory/MEMORY.md`** — standing directives and concise index.
- **`.cursor/memory/memories/YYYY-MM-DD-continuation.md`** — dated operational log (UTC); see **Continuation log** below.
- **`.cursor/memory/blockers/`** — unresolved blockers.
- **`.cursor/memory/blockers-fixed/`** — resolved blocker archives.
- **`.cursor/memory/runbooks/`** — exact how-it-was-done records.
- **`.cursor/SKILLS.md`** and **`.cursor/skills/`** — stable repeatable procedures.
- **`.cursor/TOOLS.md`** — available tools, capabilities, and resources.

## Cursor workspace index (tooling + layout)

Cross-project workflows and IDE layout pointers:

- **Vercel:** Git push → deployments when connected; CLI `vercel link` / `vercel` / `vercel --prod`; env pull. Skill — `.cursor/skills/vercel-deploy-workflow/SKILL.md`. Runbook — `.cursor/memory/runbooks/vercel-workflow.md`.
- **Supabase:** migrations, linking, macOS `npx` CLI fallback. Skill — `.cursor/skills/supabase-linked-migrations/SKILL.md`. Runbook — `.cursor/memory/runbooks/supabase-cli-macos.md`.
- **Always-on Cursor rules:** `.cursor/rules/*.mdc` (including `00-read-cursor-context-first.mdc`, `root-canonical.mdc`, `memory-governance.mdc`, `working-memory.mdc`). Workspace runbook — `.cursor/memory/runbooks/cursor-workspace.md`.

## Continuation log

Operational history lives in **per-day files** under this folder:

- **Pattern:** `.cursor/memory/memories/YYYY-MM-DD-continuation.md` (UTC calendar day from each entry’s timestamp).
- **When logging new work:** append a new bullet to **today’s** `*-continuation.md` (create the file if missing); keep **`.cursor/memory/MEMORY.md`** for standing directives and concise index sections only.

---
