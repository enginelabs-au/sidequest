# USER.md

Store durable user-specific instructions, preferences, and standing directives here.

- **Per-turn procedure:** Agents must **Read** `.cursor/AGENTS.md` (then this file, `STATE.md`, `SKILLS.md`, `TOOLS.md`, `.cursor/memory/MEMORY.md`, blockers as needed) at the **start of each turn** that uses tools—not only at session start. See `.cursor/rules/00-read-cursor-context-first.mdc`.

- **Vercel:** skill body `.cursor/skills/vercel-deploy-workflow/SKILL.md`; registry `.cursor/SKILLS.md`; `.cursor/TOOLS.md`. MCP (`plugin-vercel-vercel`) requires auth — prefer CLI + dashboard when MCP is unavailable.

- **Supabase:** skill body `.cursor/skills/supabase-linked-migrations/SKILL.md`; registry `.cursor/SKILLS.md`; `.cursor/TOOLS.md`. On macOS, prefer a working CLI path such as an `npx` wrapper when the GitHub binary is blocked by Gatekeeper.

Include and maintain:

- the user wants instructions preserved faithfully without drifting from their intended wording or meaning
- do not cut anything pertinent to the user’s immediate instructions
- optimize prompts and rules for maximum effectiveness for the agent
- make instructions easier for the agent to understand without weakening specificity
- keep outputs copyable and directly usable
- prefer structured clarity over stylistic flourish
- preserve the user’s operational intent even when improving phrasing
- retain specifics around project memory, blockers, runbooks, and current-state logging
- retain exactness around unresolved issues, files touched, changes made, and processes attempted
- when a user instruction is durable or recurring, store it here
- when a user instruction is live and task-specific, also reflect it in `STATE.md` as needed

Add newly discovered durable preferences to the top of this file.

---
