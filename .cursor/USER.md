# USER.md

Store durable user-specific instructions, preferences, and standing directives here.

- **Per-turn procedure:** Agents must **Read** `.cursor/AGENTS.md` (then this file, `STATE.md`, `SKILLS.md`, `TOOLS.md`, `.cursor/memory/MEMORY.md`, blockers as needed) at the **start of each turn** that uses tools—not only at session start. See `.cursor/rules/00-read-cursor-context-first.mdc`.

- **Vercel:** skill body `.cursor/skills/vercel-deploy-workflow/SKILL.md`; registry `.cursor/SKILLS.md`; `.cursor/TOOLS.md`. MCP (`plugin-vercel-vercel`) requires auth — prefer CLI + dashboard when MCP is unavailable.

- **Supabase:** skill body `.cursor/skills/supabase-linked-migrations/SKILL.md`; registry `.cursor/SKILLS.md`; `.cursor/TOOLS.md`. On macOS, prefer a working CLI path such as an `npx` wrapper when the GitHub binary is blocked by Gatekeeper.

- **Solo check-in (never gate on others):** Users must always be able to check in and enter a room alone. Never require other users to be present for check-in, room access, or navigation. Empty rooms are a valid state — use positive copy (“You're here — room is open”) and always allow the flow. Do not reintroduce peer-count gates in UI or logic.

- **Rebuild after changes:** After each substantive code change, rebuild and install to all connected iOS devices (e.g. `npx expo run:ios --device "Free Malware"`). Do not skip device rebuilds when the user expects to test on hardware.

- **No UI transparency:** Do not use glassmorphism or semi-transparent menu surfaces — use solid opaque colors from `constants/theme.ts` (`colors.card`, `colors.tabBar`, etc.).

- **Design/UI assets:** Whenever the user provides a design mockup, screenshot, or UI reference image, automatically copy it into `design/ui/` with a descriptive filename (e.g. `sidequest-<feature>-vN-reference.png`). Update `.cursor/memory/MEMORY.md` project index to reference new assets. Do not leave design images only in chat attachments or `.cursor/projects/.../assets/`.

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
