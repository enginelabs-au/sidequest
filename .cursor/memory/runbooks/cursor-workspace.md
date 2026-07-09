# Domain: Cursor workspace operating layout

## Purpose

Document the canonical `.cursor/` tree and which paths are involved so the same layout can be reproduced or audited across projects.

## Paths touched

- `.cursor/AGENTS.md`
- `.cursor/USER.md`
- `.cursor/STATE.md`
- `.cursor/memory/MEMORY.md`
- `.cursor/memory/memories/`
- `.cursor/memory/blockers/.gitkeep`
- `.cursor/memory/blockers-fixed/.gitkeep`
- `.cursor/memory/runbooks/cursor-workspace.md`
- `.cursor/rules/*.mdc`
- `.cursor/SKILLS.md`
- `.cursor/skills/<skill-id>/`
- `.cursor/TOOLS.md`

## Procedure

- Keep AGENTS, USER, STATE, and MEMORY content aligned with the workspace bootstrap specification.
- Rules live at the top level of `.cursor/rules/` with filenames matching rule names.
- Rule frontmatter: `description` and `alwaysApply: true`; omit empty `globs` for always-apply rules unless a Cursor version requires otherwise.
- Use `.mdc` files for Cursor project rules unless the active Cursor version expects a different extension.
- Convert numbered lists to bullet lists when numbering is only for readability.

## Additions (skills, tools, primary rules)

- `.cursor/SKILLS.md` — high-level skill registry; `.cursor/skills/<skill-id>/` — per-skill `SKILL.md`, `assets/`, `references` (distinct from `memory/runbooks/`).
- `.cursor/TOOLS.md` — canonical tool and capability registry.
- `.cursor/rules/root-canonical.mdc` — highest-priority canonical directives; lists `SKILLS.md` and `TOOLS.md` in the read set.
- `.cursor/rules/skills-file.mdc` — maintain `SKILLS.md`.
- `.cursor/rules/tools-file.mdc` — maintain `TOOLS.md`.
- Keep `.cursor/AGENTS.md`, `.cursor/rules/core-operating-context.mdc`, `.cursor/rules/state-and-compactification.mdc`, `.cursor/memory/MEMORY.md`, and `.cursor/STATE.md` aligned when the layout changes.

## Result

Full tree present under `.cursor` with memory subdirs, skills/tools docs, and always-on rules.

## Validation

- Verify with `find .cursor` listing all files and directories.
- Confirm Cursor recognizes the active rule files for the installed version.

## Caveats

- Cursor’s expected rule extension and path may change. If the IDE does not load rules, align with the active Cursor version’s expected rule extension and path.

## Related

- `.cursor/memory/runbooks/supabase-cli-macos.md` — Supabase CLI on macOS (`npx` vs Gatekeeper)
- `.cursor/memory/runbooks/vercel-workflow.md` — Vercel Git + CLI deploy workflow

---
