# Release Workflow

`wickd-web` is a publicly deployed static site. It publishes no packages and
cuts no tags: a version ships as a **deployment record**. Each planned version
has a scope contract in this directory.

`AGENTS.md` governs the repository development loop; `../sprints/` contains
planning and delivery evidence.

## Release Profile

- **Visibility:** Public repository, public site.
- **Audience:** Visitors evaluating WickdAlgo, and operators using the platform
  shell — see `PRODUCT.md`.
- **Artifact:** The `wickd-web` Cloudflare Worker. No packages, no downloads.
- **Channel:** Cloudflare Workers Builds, deploying every commit on `main`.
- **Release branch:** `main`.
- **Release trigger:** Merging a release-prep pull request. There is no tag, no
  GitHub Release, and no release workflow.

Because `main` deploys continuously, a "release" here records *scope reaching
production*, not a separate publishing event. Ordinary merges deploy without
ceremony; a version closes when its contract's launch gate is satisfied.

## Contract Index

| Version | Status | Target |
| --- | --- | --- |
| [v0.1.0](v0.1.0.md) | Draft | first stable marketing surface and platform shell |

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
  `src/lib/version.ts` exposes it as `WEB_VERSION` in the nav bar, mobile
  drawer, and platform sidebar. Bumping `package.json` is what changes the
  number visitors see.
- Version changes occur in release-prep pull requests.

### Core version is not the site version

`core-version.json` records the Wickd.Core version for display beside the site
version. Wickd.Core ships from wickd-dotnet and has no source of truth here.
`.github/workflows/core-version.yml` rewrites the file on a `core-released`
repository dispatch; edit it by hand only to correct a bad sync.

That workflow pushes with a PAT rather than the default `GITHUB_TOKEN` on
purpose: pushes made with `GITHUB_TOKEN` deliberately do not trigger downstream
workflows, so CI would never run on the bump — and the push is what deploys.

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
pnpm deploy    # build and deploy directly (bypasses Workers Builds)
```

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

1. Confirm scope and acceptance evidence in sprint records and the contract.
2. Finalize the `CHANGELOG.md` section for the version and link its contract.
3. Set `version` in `package.json` to the intended version.
4. Run `pnpm lint`, `pnpm build`, and
   `bash .claude/skills/add-ui-component/scripts/validate.sh`.
5. Serve `pnpm preview` and check the affected routes at desktop and mobile
   widths, including the version markers in the chrome.
6. Open the release-prep pull request and merge it to `main`.
7. Confirm the Workers Builds deployment succeeded and the live site serves the
   new version marker.
8. Set the contract to `Shipped`, record the deployment date in its lifecycle
   log, and update the index above.

## Rollback

There is no tag to revert to. Roll back by redeploying a previous Workers
Builds deployment from the Cloudflare dashboard for an immediate fix, then
revert the offending commit on `main` so the repository and production agree.
Record both in the sprint work log.
