# Changelog

Shipped release history for the WickdAlgo web surface. Work logs live in
`docs/sprints/`; forward-looking scope lives in `docs/releases/`.

Merging to `main` deploys, so entries here describe what a *version* shipped,
not every deployment. `Unreleased` holds everything live on `main` that no
release contract has closed yet.

The site has been continuously deployed since before this changelog existed;
history prior to the first entry below is in git.

## [Unreleased]

### Added

- `site`: marketing surface — home, engine, pricing, and the `/design` system
  showcase — sharing one nav and footer shell.
- `platform`: platform shell with sidebar-switched inspect, backtest, and
  dataset views.
- `ui`: the WickdAlgo component library, re-exported through
  `src/components/ui/index.ts`.
- `home`: animated pipeline section and hero structure background.
- `ui`: inline animated candlestick "W" brand mark and SVG favicon.
- `site`: Wickd.Core and web version markers in the site chrome, synced from
  wickd-dotnet releases by `.github/workflows/core-version.yml`.
- `ci`: lint, build, and design-system validation on every push and pull
  request.
- `docs`: the development cycle and document hierarchy — `PRODUCT.md`,
  `AGENTS.md`, `DESIGN.md`, `docs/sprints/`, `docs/releases/`, and the pull
  request template.

### Changed

- `design`: pages, the UI kit, and the animated logo were migrated onto design
  tokens. The migration is not complete — hex literals remain in the hero
  background, the platform view code blocks, and the favicon (`WEB-BL-006`).
- `ui`: redesigned nav bar and footer chrome.

### Fixed

- `build`: `pnpm build` emits the OpenNext bundle so Workers Builds deploys
  succeed, with the plain Next build moved to `pnpm build:next`.
- `build`: restored the `WORKER_SELF_REFERENCE` service binding, without which
  `/` fails with a Cloudflare 1042 error.
- `ci`: moved GitHub Actions off the deprecated Node 20 runtime and pinned a
  working pnpm release.
