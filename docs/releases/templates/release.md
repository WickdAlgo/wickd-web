# Release vX.Y.Z

- **Status:** Draft
- **Target channel:** Cloudflare Workers Builds deployment of `main`
- **Target date:** YYYY-MM-DD or "when scope completes"
- **Prereleases:** State whether `X.Y.Z-preview.N` versions ship under this
  contract.

## Scope: Includes

- Feature or fix — `docs/sprints/YYYY-MM-DD-sprint-N.md`

## Scope: Excludes

- Explicit non-goal and its backlog or later-contract destination.

## Acceptance Criteria

- [ ] Observable outcome tied to included scope.
- [ ] Content, accessibility, or responsive expectation.

## Launch Gate

- [ ] Acceptance evidence is linked from sprint records.
- [ ] `pnpm lint` passes.
- [ ] `pnpm build` passes.
- [ ] `bash .claude/skills/add-ui-component/scripts/validate.sh` passes.
- [ ] `CHANGELOG.md` section is finalized and linked here.
- [ ] `version` in `package.json` matches `X.Y.Z`.
- [ ] `pnpm preview` serves the affected routes correctly at desktop and mobile
  widths, including reduced motion.
- [ ] Release prep has landed on `dev`, and the `stage` -> `main` promotion
  pull request is ready.
- [ ] `stage` has been checked at
  `stage-wickd-web.<subdomain>.workers.dev` and is not behind `main`.

## Deployment Record

- **Deployed:** YYYY-MM-DD, Workers Builds deployment of `<commit>`.
- **Verified:** What was checked on the live site.

## Lifecycle Log

- YYYY-MM-DD — Created as Draft.
