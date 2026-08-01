# Development Cycle

The full loop for `wickd-web`, with this repository's commands and channels
resolved. `AGENTS.md` is the short contract; this document explains each stage.

```text
idea -> backlog -> sprint -> implementation -> validation
     -> changelog + release contract -> PR/review -> merge
     -> Workers Builds deploy -> release record
```

## 1. Idea

Anything worth doing and not doing right now goes to `docs/sprints/backlog.md`
with a stable `WEB-BL-NNN` ID, area, user value, acceptance criteria, and
validation. Write it from an observed fact, not a hunch.

## 2. Backlog

Grooming moves an item from `Candidate` to `Ready` by making it concrete enough
to implement: what changes, what "done" looks like, how it will be proven, and
which release contract it belongs to.

## 3. Sprint

One-week sprints, `docs/sprints/YYYY-MM-DD-sprint-N.md`, from
`docs/sprints/templates/sprint.md`. Non-trivial work is claimed in the current
sprint before implementation, and names its release target —
`docs/releases/vX.Y.Z.md` or `Not release-relevant`.

Small, obvious changes (a typo, a dependency bump) may skip the sprint. Anything
user-visible, risky, or cross-cutting may not.

## 4. Implementation

Work on a branch. Follow `DESIGN.md` for anything visual and
`.claude/skills/add-ui-component` for anything entering `src/components/ui/`.
Append work-log bullets only for material updates: status changes, blockers,
scope changes, decisions, and verification.

## 5. Validation

There is no test suite, so evidence is explicit:

```sh
pnpm lint
pnpm build
bash .claude/skills/add-ui-component/scripts/validate.sh
git diff --check
```

Then run `pnpm dev` or `pnpm preview` and check the affected routes at desktop
and mobile widths, plus reduced motion for anything animated. Record what was
checked in the sprint work log. "It builds" does not validate a visual change.

## 6. Changelog And Release Contract

Release-relevant work adds an entry to `CHANGELOG.md` under `Unreleased` and is
reflected in its target contract under `docs/releases/`. Delivery detail stays
in the sprint file.

## 7. Pull Request And Review

Use `.github/pull_request_template.md`. Conventional Commits:
`type(scope): summary`. Attach before/after screenshots for visual changes. CI
must be green: lint, build, and the design-system validator.

## 8. Merge And Deploy

Merge to `main`. Cloudflare Workers Builds deploys every `main` commit, so
**merging is deploying** — `main` is production. Confirm the deployment
succeeded before moving on.

## 9. Release Record

A version is not a tag here. When a contract's scope is complete:

1. Finalize its `CHANGELOG.md` section and link the contract.
2. Set `version` in `package.json`.
3. Satisfy the contract's launch gate.
4. Merge the release-prep pull request, confirm the deploy, and flip the
   contract to `Shipped` with its deployment record.

`docs/releases/README.md` holds the full release profile, versioning rules,
deploy runbook, and rollback path.
