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

- `platform`: nested routes — inspect, journal, backtest, datasets, playground —
  each with its own address, so a view can be linked, bookmarked, and opened in
  a new tab. The sidebar derives its active state from the URL, and the surface
  now has a mobile layout. `docs/releases/v0.2.0.md`.
- `platform`: versioned, runtime-validated contracts (`src/contracts/`) and a
  `PlatformGateway` (`src/data/platform/`). Views depend on the gateway rather
  than on fixture arrays, and a payload declaring an unsupported schema version
  is rejected before anything renders.
- `platform`: a real chart. TradingView Lightweight Charts renders timestamped
  candles, with structure overlays for markers, levels, zones, connections, and
  range highlights drawn as token-driven SVG. The design system's `CandleChart`
  is unchanged and still serves the marketing routes.
- `platform`: Final and Causal inspection views with an as-of replay cursor.
  For a cursor at `T` the surface shows only what was knowable at `T`, states
  which mode it is in, and keeps its state in the URL so an inspection is
  reproducible from its address.
- `platform`: a trade journal. One fixture trade renders its entry zone,
  historical stop, three targets, invalidation, and actual fills over the run's
  structures, with a synchronized timeline. Reported R and actual net R are
  shown as separate values and neither is computed in the frontend.
- `docs`: architecture decision records under `docs/architecture/` — the
  platform and journal ownership boundaries, and the backend contract this
  repository expects.
- `ci`: a test layer. Vitest and React Testing Library cover causal filtering,
  contract parsing, chart geometry, and the interactive library components; one
  Playwright spec proves the chart actually paints and walks the replay
  workflow. Both run in CI.
- `site`: marketing surface — home, engine, pricing, and the `/design` system
  showcase — sharing one nav and footer shell.
- `platform`: the platform surface, which began as a sidebar-switched shell and
  is now the frontend host described above.
- `ui`: the WickdAlgo component library, re-exported through
  `src/components/ui/index.ts`.
- `home`: animated pipeline section and hero structure background.
- `ui`: inline animated candlestick "W" brand mark and SVG favicon.
- `site`: web and Wickd.Core version markers in the site chrome. The web marker
  follows this repository's `package.json` version; the Core marker is synced
  from wickd-dotnet releases by `.github/workflows/core-version.yml` and moves
  independently of it.
- `ci`: lint, build, and design-system validation on every push to `main` and
  every pull request.
- `docs`: the development cycle and document hierarchy — `PRODUCT.md`,
  `AGENTS.md`, `DESIGN.md`, `docs/sprints/`, `docs/releases/`, and the pull
  request template.

### Changed

- `platform`: the surface is now the frontend host for the Wickd platform
  rather than a demonstration of one. `PRODUCT.md` is amended accordingly, with
  its rationale recorded in an Amendments section; the constraint that
  generated and fixture content must read as illustration is preserved and
  strengthened.
- `ci`: unit tests run before the build and a Playwright spec after it, so a
  logic regression fails in seconds rather than after a bundle.
- `design`: pages, the UI kit, and the animated logo were migrated onto design
  tokens. The migration is not complete — hex literals remain in the hero
  background and the favicon (`WEB-BL-006`); the platform view code blocks were
  moved onto tokens in this cycle.
- `ui`: redesigned nav bar and footer chrome.

### Fixed

- `build`: `pnpm build` emits the OpenNext bundle so Workers Builds deploys
  succeed, with the plain Next build moved to `pnpm build:next`.
- `build`: restored the `WORKER_SELF_REFERENCE` service binding, without which
  `/` fails with a Cloudflare 1042 error.
- `ci`: moved GitHub Actions off the deprecated Node 20 runtime and pinned a
  working pnpm release.
