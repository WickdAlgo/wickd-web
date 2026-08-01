# Claude Code Context

@AGENTS.md

`AGENTS.md` is the repository contract: document hierarchy, development cycle,
structure, commands, style, and commit conventions. `DESIGN.md` governs
anything visual. `docs/releases/README.md` holds the deploy runbook and the
load-bearing Cloudflare and OpenNext configuration notes — read it before
touching `wrangler.jsonc`, `open-next.config.ts`, or the build scripts.

## Skills

- `.claude/skills/add-ui-component` — step-by-step workflow for adding a
  component to the design-system library (pattern, token rules, barrel export,
  validation script). Use it whenever adding or reviewing
  `src/components/ui/` components.
