# Repository Guidelines

## Development Cycle And Document Hierarchy

Each source has one role:

| Question | Source |
| --- | --- |
| What is shipped and how do I run it? | `README.md` |
| What is the web surface for and what governs it? | `PRODUCT.md` |
| How should it look and behave? | `DESIGN.md` |
| What work is planned or committed? | `docs/sprints/` |
| What does a version include and require? | `docs/releases/` |
| How does a version reach production? | `docs/releases/README.md` |
| What has shipped? | `CHANGELOG.md` |

Product-wide vision and principles live in the
[wickd-dotnet `PRODUCT.md`](https://github.com/WickdAlgo/wickd-dotnet/blob/master/PRODUCT.md).
This repository owns the web surface only.

Use this lightweight cycle:

```text
idea -> backlog -> sprint -> implementation -> validation
     -> changelog + release contract -> PR/review -> merge
     -> Workers Builds deploy -> release record
```

`docs/development-cycle.md` describes each stage in full.

Workflow rules:

- Capture ideas, bugs, refactors, and documentation work in
  `docs/sprints/backlog.md` with a stable `WEB-BL-NNN` ID, acceptance criteria,
  and validation.
- Before non-trivial implementation, claim the work in the current one-week
  sprint. Name its release contract or mark it `Not release-relevant`.
- During implementation, append only meaningful status, scope, decision,
  blocker, and verification updates to the sprint work log.
- Run the smallest relevant checks. The repository defaults are `pnpm lint`,
  `pnpm build`, `bash .claude/skills/add-ui-component/scripts/validate.sh`, and
  `git diff --check`.
- Release-relevant work updates `CHANGELOG.md` under `Unreleased` and the
  target contract under `docs/releases/`. Sprint files retain delivery detail.
- Use Conventional Commits and `.github/pull_request_template.md`. Pull
  requests identify sprint/backlog, validation, changelog, release,
  deployment, configuration, risk, and follow-up impact.
- Merge reviewed work to `main` after required checks pass.
- Merging to `main` deploys. Cloudflare Workers Builds is the only deploy path
  and it runs on every `main` commit, so `main` is always production.
- A version ships as a deployment record, not a tag: release-prep work
  finalizes the changelog section, sets `version` in `package.json`, satisfies
  the contract launch gate, and the contract flips to `Shipped` once the deploy
  is confirmed live. This repository publishes no packages and cuts no tags.

## Project Structure & Module Organization

- `PRODUCT.md` is the web-surface constitution.
- `DESIGN.md` is the UI/UX source of truth.
- `docs/sprints/` is the active execution layer.
- `docs/releases/` contains release scope contracts, the versioning rules, and
  the deploy runbook.
- `src/app/(site)/` contains the marketing routes (home, engine, pricing,
  design) sharing the `SiteNav` + `Footer` shell from `(site)/layout.tsx`.
- `src/app/platform/` is the platform shell: one client page whose sidebar
  switches between views in React state. There are no nested platform routes.
- `src/components/ui/` is the WickdAlgo component library, re-exported through
  `src/components/ui/index.ts`. Import from `@/components/ui`.
- `src/components/home/` and `src/components/platform/` contain
  page-specific composition that is deliberately not part of the library.
- `src/lib/` contains `cx.ts`, `styles.ts`, `use-controllable.ts`,
  `use-reduced-motion.ts`, and `version.ts`.
- `src/app/globals.css` holds every design token. There is no
  `tailwind.config` file.
- `core-version.json` records the Wickd.Core version for display only. It is
  rewritten by `.github/workflows/core-version.yml` when wickd-dotnet
  publishes a release; it is not this repository's version.
- `.claude/skills/` contains the repository-local agent skills listed below.

| Invoke | Use |
| --- | --- |
| `add-ui-component` | Add or review a component in `src/components/ui/`. |

Path alias: `@/*` -> `src/*`.

## Build, Test, and Development Commands

Run commands from the repository root. The package manager is pnpm.

```text
pnpm install
pnpm dev
pnpm lint
pnpm build
pnpm preview
```

- `dev` starts the Next.js dev server on http://localhost:3000.
- `lint` runs ESLint (flat config, `next/core-web-vitals` + TypeScript).
- `build` produces the deployable Worker: `next build` plus the OpenNext bundle
  in `.open-next/`. The plain Next build is `pnpm build:next`.
- `preview` builds and serves the Worker locally through Wrangler.

There is no test suite. `.github/workflows/ci.yml` runs `pnpm lint`,
`pnpm build`, and the design-system validator on every push to `main` and every
pull request. Validation for UI work is the preview plus the checks named in
the sprint item.

## Coding Style & Naming Conventions

Use TypeScript with the Next.js App Router and React 19. Prefer server
components; add `"use client"` only where interaction or browser APIs require
it. Keep 2-space indentation and the existing double-quote, semicolon style.

Style through the design tokens in `src/app/globals.css` and the semantic
utilities they generate. Do not introduce raw hex values, and do not add a
`tailwind.config` file. `DESIGN.md` states the conventions; the skill states
the component pattern.

Name files in kebab-case and components in PascalCase. Keep comments focused on
non-obvious layout, motion, deployment, or design-system decisions.

## Testing Guidelines

There is no automated test suite. Prove UI work instead:

```text
pnpm lint
pnpm build
bash .claude/skills/add-ui-component/scripts/validate.sh
```

Run `pnpm dev` or `pnpm preview` and check the affected routes at desktop and
mobile widths, including reduced-motion behavior for animated work. Record what
was checked in the sprint work log; screenshots belong in the pull request for
visual changes.

## Commit & Pull Request Guidelines

Use Conventional Commits:

```text
<type>(<scope>): <imperative summary>
```

- Keep the subject line lower-case after the type, imperative, specific, under
  72 characters, and without a trailing period.
- Prefer a scope for non-trivial changes. Common scopes are `site`,
  `platform`, `ui`, `home`, `lib`, `design`, `docs`, `workflow`, `ci`, and
  `deps`.
- Use these types: `feat`, `fix`, `docs`, `refactor`, `perf`, `build`, `ci`,
  `chore`, and `revert`.
- Add a blank line and a short bullet body only when the commit spans multiple
  important changes or needs context.
- Mark breaking changes with `!` after the scope or type and include a
  `BREAKING CHANGE:` footer.
- Do not use vague subjects such as `update stuff`, duplicate phrasing such as
  `fix: fix ...`, or bundle unrelated work.

Examples:

```text
feat(site): add the engine pipeline section
fix(ui): keep the nav aligned when the scrollbar track appears
docs(workflow): establish sprint and release hierarchy
refactor(ui): replace hardcoded hex in animated-logo with chart tokens
ci(deps): move GitHub Actions off the deprecated Node 20 runtime
```

Pull requests should use `.github/pull_request_template.md` and link the
relevant sprint or backlog item and release contract. Include before/after
screenshots for any visual change.

Repository commit conventions:

- Do not add `Co-Authored-By: Claude ...` trailers.
- When a commit message or pull request description includes an attribution
  footer, use
  `Generated with [Claude Code](https://claude.com/claude-code) (<model name and version>)` —
  no robot emoji, and name the actual model used, for example `(Fable 5)`.

## Security & Configuration Tips

Do not commit secrets. `.dev.vars` and `.env.local` are local-only. The site is
fully static — no API routes, no backend, no user data — so anything inlined at
build time is public: `next.config.ts` deliberately inlines only the two
version strings rather than importing manifests from client code.

Cloudflare configuration lives in `wrangler.jsonc` and `open-next.config.ts`.
Read `docs/releases/README.md` before changing either; several of its settings
are load-bearing in non-obvious ways.
