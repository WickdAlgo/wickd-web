# Release Workflow

`wickd-web` is a publicly deployed static site. It publishes no packages and
cuts no tags: a version ships as a **deployment record**. Each planned version
has a scope contract in this directory.

`AGENTS.md` governs the repository development loop; `../sprints/` contains
planning and delivery evidence.

## Branch Topology

Work moves through three long-lived branches:

```text
feature/*, fix/* --PR--> dev --PR--> stage --PR--> main
                          |            |            |
                     public branch  public stage  production
```

| Branch | Role | Workers Builds |
| --- | --- | --- |
| `dev` | Default integration | Public branch hostname |
| `stage` | Rehearsal | Persistent public staging build |
| `main` | Production | Every commit deploys |

`dev` is the GitHub default branch. Direct pushes are allowed so integration
stays fast. Feature and fix pull requests target `dev`.

Workers Builds has no per-branch include list — *Branch control* offers a
production-branch dropdown and one **Builds for non-production branches**
checkbox covering every non-production branch at once. That checkbox is
enabled, so `dev` and every pushed feature branch build to their own public
hostnames exactly as before. Restricting the build to `stage` alone would
mean a second Workers Builds connection with its own `wrangler.jsonc`
environment, because `WORKER_SELF_REFERENCE` must match the Worker name.
That is deliberately not done: `WEB-BL-016` is the item that closes the
public-exposure question, and splitting the deploy first would only move it.

`stage` accepts pull requests with a green `verify` check. Workers Builds
publishes it at the persistent, unauthenticated hostname
`https://stage-wickd-web.<subdomain>.workers.dev`. `main` has the same pull
request and check requirements, and every commit on it deploys to production.

Two ancestry rules are load-bearing:

1. Promotion pull requests from `dev` to `stage` and from `stage` to `main`
   must use a merge commit, never squash or rebase. Squashing creates a target
   commit with no ancestry link to the source branch. The source therefore
   never registers as merged, so each later promotion re-diffs the same work
   and raises the same conflicts again. Feature pull requests into `dev` may
   squash freely. The `protect-stage` and `protect-main` rulesets enforce this
   by setting `allowed_merge_methods` to `merge` only.
2. A hotfix to `main` must return down the branch chain. Branch from `main`,
   open a pull request into `main`, then open back-merge pull requests from
   `main` to `stage` and from `stage` to `dev`. A later promotion will not
   usually undo the fix — a three-way merge keeps `main`'s side when only
   `main` touched those lines — but until the back-merges land, `dev` and
   `stage` build, test, and rehearse code that still contains the bug, and
   every subsequent touch of those files risks a conflict resolved against
   stale context. Back-merge while the reason is still fresh.

### Promotion leaves the source branch behind, and that is fine

Merging a promotion pull request creates a merge commit on the *target*, so
`dev` is immediately one commit behind `stage`, and `stage` one behind `main`.
Nothing needs to be done about it. Git's merge base advances correctly, so the
next promotion carries only genuinely new work and does not re-diff what has
already shipped.

This is why `strict_required_status_checks_policy` is **off**. "Require
branches to be up to date before merging" suits a feature-branch model where
the head is expected to catch up to its base. In a promotion pipeline the
source is structurally behind after every lap, so a strict policy would block
each promotion until a back-merge, turning a two-pull-request cycle into a
four-pull-request one and buying nothing: `verify` already runs against the
merge result rather than the head commit.

All three GitHub rulesets have `enforcement: active` and empty
`bypass_actors`, so they apply to the administrator as well:

- `protect-main` and `protect-stage` require a pull request and the `verify`
  check, with `strict_required_status_checks_policy` **disabled** for the
  reason above. They allow only merge commits and block deletion and
  non-fast-forward pushes.
- Their `required_approving_review_count` is `0`. A sole maintainer cannot
  approve their own pull request, so any higher value would deadlock every
  merge without adding review.
- `guard-dev` blocks deletion of `dev` only. Direct pushes remain available.
- `delete_branch_on_merge` remains `false`. Automatic deletion would remove
  `dev` itself after merging a `dev` to `stage` promotion pull request.

## Release Profile

- **Visibility:** Public repository, public site.
- **Audience:** Visitors evaluating WickdAlgo, and operators using the platform
  shell — see `PRODUCT.md`.
- **Artifact:** The `wickd-web` Cloudflare Worker. No packages, no downloads.
- **Channel:** Cloudflare Workers Builds, deploying every commit on `main`.
- **Release branch:** `main`.
- **Release trigger:** Merging the `stage` to `main` promotion pull request.
  There is no tag, no GitHub Release, and no release workflow.

Because every `main` commit deploys, a "release" here records *scope reaching
production*, not a separate publishing event. A version closes when its
contract's launch gate is satisfied and its `stage` to `main` promotion is
confirmed live.

## Contract Index

| Version | Status | Target |
| --- | --- | --- |
| [v0.1.0](v0.1.0.md) | Draft | first stable marketing surface and platform shell |
| [v0.2.0](v0.2.0.md) | Draft | platform as frontend host: routes, contracts, real chart, causal replay |

Lifecycle: `Draft` -> `Committed` -> `Shipped`. Use `Cancelled` for an
abandoned contract. Record scope changes after commitment in the lifecycle log.

## Versioning

- **Source:** `version` in `package.json`.
- **Read command:**

  ```sh
  node -p "require('./package.json').version"
  ```

- The site versions on its own stream. It does not track the Wickd.Core
  version.
- Stable versions use `X.Y.Z`. Prereleases use `X.Y.Z-preview` or
  `X.Y.Z-preview.N`.
- The source currently declares `0.1.0-preview`.
- `next.config.ts` inlines the version as `NEXT_PUBLIC_WEB_VERSION`, and
  `src/lib/version.ts` exposes it as `WEB_VERSION`. Bumping `package.json` is
  what changes the number visitors see.
- Where the markers actually render:
  - **Marketing footer** (`src/app/(site)/layout.tsx` -> `Footer` ->
    `VersionList`) — both `web` and `core`. This is the only place the Core
    version appears.
  - **Platform sidebar** (`src/components/platform/platform-sidebar.tsx`) — the
    `web` version only, as a mono `Tag`. At the bottom of the rail on desktop;
    at the right-hand end of the strip below `sm`.

  Neither marker appears in the nav bar or the mobile drawer. Verify a bump in
  the footer and the platform sidebar; the nav will not change.
- Version changes land on `dev` in release-prep pull requests and ride the
  `dev` to `stage` to `main` promotion train.

### Core version is not the site version

`core-version.json` records the Wickd.Core version for display beside the site
version. Wickd.Core ships from wickd-dotnet and has no source of truth here.
`.github/workflows/core-version.yml` rewrites the file on a `core-released`
repository dispatch; edit it by hand only to correct a bad sync.

That workflow explicitly checks out and pushes to `dev`. The bump rides the
promotion train and appears live at the next `stage` to `main` promotion
instead of deploying within minutes. It still pushes with a PAT rather than
the default `GITHUB_TOKEN`: pushes made with `GITHUB_TOKEN` do not trigger
downstream workflows, so `verify` would never run on the bump.

## Changelog Rules

- Release-relevant changes enter `CHANGELOG.md` under `Unreleased`.
- Entries name a real area such as `site`, `platform`, `ui`, `home`, `lib`,
  `design`, `docs`, `build`, or `ci`.
- Sprint logs retain delivery detail; finalized changelog sections summarize
  shipped behavior and link their contract.
- Not every deployment is a changelog entry. Copy fixes and internal refactors
  can be `Not release-relevant`.

## Deploy Runbook

Deploys run through **Workers Builds**, whose commands are `pnpm run build`
then `npx wrangler deploy`.

```sh
pnpm build     # next build + the OpenNext bundle in .open-next/
pnpm preview   # build and serve the Worker locally through Wrangler
```

### Staging, branch, and local preview URLs

Workers Builds builds every branch it is pushed, and publishes each at its own
**public** hostname:

```text
https://stage-wickd-web.<subdomain>.workers.dev   # persistent staging
https://<branch-slug>-wickd-web.<subdomain>.workers.dev   # follows the branch
https://<hash>-wickd-web.<subdomain>.workers.dev          # pinned to a commit
```

`stage` is the only one of these that is stable and worth linking. The rest
come and go with their branches, and the Cloudflare bot posts them into the
pull request. All of them are unauthenticated and indexable by anyone holding
the URL. `pnpm preview` above is the *local* Wrangler server and is unrelated
— the collision in the word "preview" is easy to trip over.

The consequence worth internalizing is unchanged by the branch topology:
**a push publishes, not only a merge.** Treat opening or updating a pull
request as putting that build on the public internet. Anything that must not
be public — private datasets, personal or third-party trade data, unreleased
copy — cannot be in a pushed branch until `WEB-BL-016` gates the branch and
staging hostnames as well as the production one. Adding `stage` added one
more permanent public hostname; it removed none.

### Manual deploys

`pnpm deploy` builds and pushes straight to the production Worker from a local
machine. It is a real second path to production, and it bypasses review, CI,
the changelog, and the deployment record — a manual deploy can put code live
that is on no `main` commit at all, after which the repository and production
silently disagree.

Do not use it to release. It exists for an incident where Workers Builds itself
is unavailable and the site must be fixed now. If it is used:

1. Land the same change on `main` as soon as the incident allows, so the next
   Workers Builds deploy is not a regression.
2. Record the manual deploy — what, why, and by whom — in the sprint work log
   and in the affected contract's deployment record.

Load-bearing configuration — change with care:

- `wrangler deploy` delegates to `opennextjs-cloudflare deploy`, which only
  deploys, never builds. `pnpm build` therefore has to emit `.open-next/` or
  the deploy fails with "Could not find compiled Open Next config". That is why
  `build` is the OpenNext build and the Next build lives in `build:next`:
  `opennextjs-cloudflare build` shells out to the package manager's `build`
  script by default, which would recurse into itself. Do not point `build` back
  at `next build`.
- The site is fully static — no ISR, no `next/image`, no API routes — so
  `wrangler.jsonc` intentionally omits the R2 incremental-cache and Images
  bindings that the adapter's `migrate` scaffolder adds by default. Add them
  back only if the app gains dynamic rendering or image optimization.
- The `WORKER_SELF_REFERENCE` service binding is **not** only for R2 caching.
  Removing it breaks `/` with a Cloudflare 1042 error, because OpenNext's
  bundled server performs an internal self-fetch even on a static site. Keep
  it, and keep its service name equal to the worker name.

## Release Prep

The ceremony is unchanged: `CHANGELOG.md` still finalizes the version's
`Unreleased` section, and release contracts retain their existing launch-gate
obligations. Only the merge path changes. Landing the finalized changelog and
`package.json` version on `dev` lets `stage` rehearse the exact version that
ships and removes a later back-merge solely to reconcile `package.json`.

1. Confirm scope and acceptance evidence in sprint records and the contract.
2. Finalize the `CHANGELOG.md` section for the version and link its contract.
3. Set `version` in `package.json` to the intended version.
4. Run `pnpm lint`, `pnpm build`, and
   `bash .claude/skills/add-ui-component/scripts/validate.sh`.
5. Serve `pnpm preview` and check the affected routes at desktop and mobile
   widths, including the version markers in the chrome.
6. Open the release-prep pull request against `dev` and land it there.
7. Open the `dev` to `stage` promotion pull request, wait for `verify`, and
   merge it with a merge commit.
8. Confirm the staging deployment serves the intended version and satisfies
   the contract's launch gate.
9. Open the `stage` to `main` promotion pull request, wait for `verify`, and
   merge it with a merge commit. This is the release trigger.
10. Confirm the production Workers Builds deployment succeeded and the live
    site serves the new version marker.
11. Set the contract to `Shipped`, record the deployment date in its lifecycle
    log, and update the index above.

## Rollback

There is no tag to revert to. Roll back by redeploying a previous Workers
Builds deployment from the Cloudflare dashboard for an immediate fix, then
revert the offending commit on `main` so the repository and production agree.
Merge that revert back down from `main` to `stage` and from `stage` to `dev`
before the next promotion, following the hotfix rule above. Otherwise the next
promotion can reintroduce the offending change. Record both the rollback and
the back-merges in the sprint work log.
