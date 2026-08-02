# Development Cycle

The full loop for `wickd-web`, with this repository's commands and channels
resolved. `AGENTS.md` is the short contract; this document explains each stage.

```text
idea -> backlog -> sprint -> implementation -> validation
     -> changelog + release contract -> PR/review -> dev
     -> stage rehearsal -> main deploy -> release record
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

Create feature and fix branches from `dev`. Follow `DESIGN.md` for anything
visual and `.claude/skills/add-ui-component` for anything entering
`src/components/ui/`. Append work-log bullets only for material updates:
status changes, blockers, scope changes, decisions, and verification.

## 5. Validation

```sh
pnpm lint
pnpm test
pnpm build
bash .claude/skills/add-ui-component/scripts/validate.sh
pnpm test:e2e
git diff --check
```

The suite covers what can be wrong without looking wrong — causal filtering,
contract parsing, chart geometry — and one Playwright spec proves the chart
actually paints. It does not cover whether the result looks right.

Then run `pnpm dev` or `pnpm preview` and check the affected routes at desktop
and mobile widths, plus reduced motion for anything animated. Record what was
checked in the sprint work log. "It builds" does not validate a visual change.

## 6. Changelog And Release Contract

Release-relevant work adds an entry to `CHANGELOG.md` under `Unreleased` and is
reflected in its target contract under `docs/releases/`. Delivery detail stays
in the sprint file.

## 7. Pull Request And Review

Open feature and fix pull requests against `dev` and use
`.github/pull_request_template.md`. Conventional Commits:
`type(scope): summary`. Attach before/after screenshots for visual changes.
CI runs on every pull request and on pushes to `dev`, `stage`, and `main`.
Lint, tests, build, the design-system validator, and the end-to-end workflow
must be green.

## 8. Merge And Deploy

The merge path is a promotion pipeline:

1. Merge feature and fix pull requests into `dev`. Feature work may squash;
   direct pushes are also allowed. Workers Builds does not build `dev`, so
   integration publishes no public hostname.
2. Open a `dev` to `stage` promotion pull request, wait for the up-to-date
   `verify` check, and use a merge commit. Workers Builds publishes `stage` to
   the persistent public staging hostname.
3. Rehearse the integrated result on `stage`.
4. Open a `stage` to `main` promotion pull request, wait for the up-to-date
   `verify` check, and use a merge commit. Every `main` commit deploys to
   production, so this promotion is the deploy event.

Promotion pull requests never squash or rebase because the source branch must
retain a merged ancestry link. A hotfix branches from and returns to `main`,
then back-merges from `main` to `stage` and from `stage` to `dev` before the
next promotion. The next promotion can otherwise restore the pre-hotfix state.
`docs/releases/README.md` holds the full rationale and protection details.

## 9. Release Record

A version is not a tag here. When a contract's scope is complete:

1. Finalize its `CHANGELOG.md` section and link the contract on `dev`.
2. Set `version` in `package.json` on `dev`.
3. Promote `dev` to `stage` and satisfy the contract's launch gate against the
   exact version staged for production.
4. Merge the `stage` to `main` promotion pull request, confirm the deployment,
   and flip the contract to `Shipped` with its deployment record.

`docs/releases/README.md` holds the full release profile, versioning rules,
deploy runbook, and rollback path.
