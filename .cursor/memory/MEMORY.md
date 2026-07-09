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
- **Plan:** `docs/plans/side_quest_phase_0_50bd8a65.plan.md`
- **Runbook:** `.cursor/memory/runbooks/sidequest-mvp.md`
- **Env / launch:** `docs/FINAL_CHECKLIST.md`, `docs/PHASE9_SETUP.md`, `docs/PHASE9_LAUNCH.md`, `scripts/verify-env.sh`, `.env.example`
- **Schema:** `supabase/migrations/` (profiles, venues, check_ins, connections, blocks, messages, reports, RLS, RPCs)
- **App routes:** `app/(auth)`, `app/(onboarding)`, `app/(main)`
- **Remote DB:** not linked yet — user creates Supabase project + `.env`; then `npm run verify:env` → `db push`

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
