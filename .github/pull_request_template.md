## Summary

-

## Changed Areas

-

## Sprint Or Backlog Link

-

## Release Contract

- Target contract or `Not release-relevant`:

## Validation

- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] `bash .claude/skills/add-ui-component/scripts/validate.sh`
- [ ] `git diff --check`
- [ ] Routes and widths checked (and reduced motion, if animated):
- [ ] Before/after screenshots attached for visual changes.

## Changelog

- [ ] `CHANGELOG.md` updated for release-relevant changes.
- [ ] Not release-relevant.

## Deployment And Version Impact

**Base branch:**

- [ ] Feature or fix into `dev`.
- [ ] Promotion: `dev` to `stage` or `stage` to `main` (merge commit only).
- [ ] Hotfix into `main`; back-merge pull requests from `main` to `stage` and
      from `stage` to `dev` follow.

**Version:**

- [ ] No version impact.
- [ ] Release-prep change; lands on `dev` with the `package.json` version and
      deployment notes:

## Configuration And Breaking Changes

- [ ] No configuration impact.
- [ ] Touches `wrangler.jsonc`, `open-next.config.ts`, `next.config.ts`, or CI
      — impact and rollback notes:

## Risks And Follow-Ups

-
