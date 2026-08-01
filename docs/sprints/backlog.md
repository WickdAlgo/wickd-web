# Product Backlog

Canonical pool for planned `wickd-web` product, engineering, maintenance, and
documentation work.

IDs are repository-local and never reused. wickd-dotnet numbers its own
`WKD-BL-NNN` series independently.

Every item below was written from an observable fact about the repository at
the time the cycle was established. Groom, reprioritize, or drop them freely —
an unclaimed candidate is not a commitment.

## Candidate

### WEB-BL-002: Pricing Calls To Action Have No Destination

- **State:** Candidate
- **Area:** `src/app/(site)/pricing/page.tsx`
- **User value:** "Get the CLI", "Join the waitlist", and "Read the roadmap"
  are the page's only conversion points, and all three currently render as
  buttons with no `href` — clicking them does nothing.
- **Release target:** `docs/releases/v0.1.0.md`
- **Acceptance:** Each call to action either navigates somewhere real or is
  removed. Unavailable tiers may keep a disabled control, but it must read as
  unavailable rather than broken.
- **Technical constraints:**
  - The waitlist has no backend and `PRODUCT.md` excludes one; an external
    destination or a removed control are the honest options.
  - "Get the CLI" should reach the engine's own install path, not a copy of it.
- **Validation:** Click every call to action in `pnpm preview`.

### WEB-BL-003: `/design` Showcase Coverage Is Not Enforced

- **State:** Candidate
- **Area:** `src/app/(site)/design/page.tsx`, `src/components/ui/index.ts`
- **User value:** The showcase is the design system's shop window; a component
  that is not in it is invisible to anyone evaluating the system.
- **Release target:** `docs/releases/v0.1.0.md`
- **Acceptance:** Every component exported from the barrel is either shown in
  `/design` or explicitly classified as site chrome, and drift is caught
  automatically.
- **Technical constraints:**
  - `Field` and `IconButton` are exported but not shown. `NavBar`, `Footer`,
    `AnimatedLogo`, and `VersionList` are chrome rendered on every page and may
    reasonably be exempt — decide, then encode the decision.
  - The check belongs in
    `.claude/skills/add-ui-component/scripts/validate.sh`, which already runs
    in CI.
- **Validation:** The validator fails when a new barrel export is missing from
  the showcase.

### WEB-BL-004: Platform Shell Does Not Say Its Data Is Illustrative

- **State:** Candidate
- **Area:** `src/app/platform/page.tsx`, `src/components/platform/`
- **User value:** `PRODUCT.md` requires generated content to read as
  illustration. The inspect, backtest, and dataset views render generated
  candles and journal rows with no in-page signal that nothing is being
  analyzed.
- **Release target:** `docs/releases/v0.1.0.md`
- **Acceptance:** A visitor cannot mistake the shell for a running product, and
  the signal survives at mobile width.
- **Technical constraints:**
  - Do not undercut the demonstration; the workflow still has to be legible.
  - Use the existing `Tag` vocabulary rather than inventing a banner style.
  - The area moves under `WEB-BL-008`: the shell becomes nested routes, so the
    signal belongs in the shared platform layout rather than in each view.
  - Sprint 2 raises the stakes. `WEB-BL-012` adds a trade journal with mentor
    signals and execution fills — fixture data that looks far more like a
    running product than generated candles do. This item is what keeps that
    honest, so it ships in the same pull request as the routes.
- **Validation:** Check `/platform` at desktop and mobile widths in
  `pnpm preview`.

### WEB-BL-005: No Recorded Accessibility Pass

- **State:** Candidate
- **Area:** repository-wide
- **User value:** The site has never had a recorded accessibility review, so
  its keyboard, contrast, and motion behavior is unproven rather than known
  good.
- **Release target:** `Not release-relevant` until scoped
- **Acceptance:** A first pass is recorded with findings: keyboard reachability
  and focus visibility across the interactive components, contrast against the
  semantic surface tokens, heading order, and the reduced-motion fallback on
  every `wa-` animation.
- **Technical constraints:**
  - `src/lib/use-reduced-motion.ts` and the global fallback already exist;
    verify coverage rather than adding a second mechanism.
  - Record findings as new backlog items rather than fixing everything in one
    sprint.
  - **First finding, from Sprint 2's component tests:** `Field` wraps the
    label, the control, and the hint in one `<label>`, so a control's
    accessible name is the label and the hint concatenated — "Run ID Writes
    runs/{runId}/structures.jsonl". The hint wants `aria-describedby` instead.
    `src/components/ui/interactive.test.tsx` documents the current behavior, so
    fixing it will fail that test loudly rather than silently.
- **Validation:** Keyboard walkthrough of `/`, `/engine`, `/pricing`,
  `/design`, and `/platform`, plus a reduced-motion run.

### WEB-BL-006: Finish The Design-Token Migration

- **State:** Candidate
- **Area:** `src/components/home/hero-background.tsx`,
  `src/components/platform/`, `src/app/icon.svg`
- **User value:** `DESIGN.md` forbids hex literals so color keeps its meaning
  and themes stay changeable in one place. The migration covered the pages, the
  UI kit, and the animated logo, but not everything.
- **Release target:** `docs/releases/v0.1.0.md`
- **Acceptance:** No hex color literal in `.ts`/`.tsx` outside
  `src/app/globals.css`; `src/app/icon.svg` is either migrated or recorded in
  `DESIGN.md` as a stated exemption; and the rule is enforced by the validator
  rather than remembered.
- **Technical constraints:**
  - `hero-background.tsx` holds 15 literals in its block table plus the grid
    gradient — these are decorative colors with no current token, so the fix is
    partly a token decision, not a find-and-replace.
  - `inspect-view.tsx` and `backtest-view.tsx` use `text-[#d7e0e2]` for code
    blocks on the inverse surface; that wants a semantic token. Sprint 2's
    `WEB-BL-008` edits both files anyway and closes this part there — the rest
    of the item (hero background, favicon, validator) stays open.
  - `src/app/icon.svg` carries the brand palette. Decide whether the favicon is
    exempt — it renders outside the page and cannot read CSS variables.
  - Add the check to `.claude/skills/add-ui-component/scripts/validate.sh` so
    it cannot regress.
- **Validation:**
  `grep -rnE '#[0-9a-fA-F]{3,8}' src --include='*.tsx' --include='*.ts' --include='*.svg'`
  returns nothing except lines covered by a stated exemption — the `--include`
  list must cover `.svg` so the favicon cannot pass unnoticed — and the
  validator fails when a literal is reintroduced.

## Ready

`WEB-BL-007` through `WEB-BL-012` come from
`Wickd_Web_Integrated_Trade_Journal_Handoff.md`, which decides that the
WickdAlgo trade journal is neither a standalone application nor part of
`Wickd.Core`. It is a platform module, and this repository is its frontend
host. The handoff's phases W0–W5 map one-to-one onto these six items; its
phases W6 (remaining journal pages) and W7 (HTTP integration) are deliberately
not groomed yet, because W7 depends on a `wickd-dotnet` API that does not
exist.

`docs/architecture/001-platform-and-journal-boundaries.md` records the
ownership split these items assume.

### WEB-BL-001: Automated Regression Coverage For The UI Surface

- **State:** Ready
- **Area:** repository-wide, `.github/workflows/ci.yml`
- **User value:** Catch broken routes, broken interaction, and design-token
  regressions before they deploy, since merging to `main` deploys immediately.
- **Release target:** `docs/releases/v0.2.0.md`
- **Acceptance:** A test layer exists and runs in CI. It must at minimum prove
  every route renders, and cover the interactive library components (`Tabs`,
  `Switch`, `Select`, `Checkbox`, `Field`). It must also cover the causal
  filtering in `WEB-BL-011`, which is the one piece of logic here that can be
  wrong without looking wrong.
- **Technical constraints:**
  - CI currently proves `pnpm lint`, `pnpm build`, and the design-system
    validator only. Nothing exercises a rendered page.
  - Groomed with a decision the candidate deferred: **both** levels, because
    they answer different questions. Component-level (Vitest + React Testing
    Library) proves causal correctness; one route-level Playwright spec proves
    the chart actually paints, which no jsdom test can.
  - `.claude/worktrees/` holds full untracked checkouts of this project. The
    Vitest `include` glob must be scoped to `src/`, or the runner collects a
    second copy of the entire suite — `eslint.config.mjs` already carries the
    same guard for the same reason.
  - Keep the check fast enough to stay in the pre-merge gate: unit tests run
    before `pnpm build` so they fail in seconds rather than after the bundle.
- **Validation:** The new suite runs green in CI on a pull request.

### WEB-BL-007: Platform Boundaries Are Undocumented And Unenforced

- **State:** Ready
- **Area:** `docs/architecture/`, `PRODUCT.md`, `AGENTS.md`
- **User value:** The journal spans two repositories and four planned .NET
  projects. Without a written boundary, trade accounting and risk logic drift
  into React components, where they cannot be tested, versioned, or trusted.
- **Release target:** `docs/releases/v0.2.0.md`
- **Acceptance:** An architecture decision record states what `Wickd.Core`,
  `Wickd.Inspection`, the planned platform backend, and this repository each
  own, and `PRODUCT.md` describes the platform surface as it will actually
  behave.
- **Technical constraints:**
  - `PRODUCT.md` currently says the surface has "no backend, no API routes, no
    accounts, no user data" and that the platform route is "a shell
    demonstrating the intended workflow, not a running product". Both become
    false. Its own Governance section requires a product-level rationale in the
    pull request, so this is an amendment, not an edit.
  - Amend for the anticipated backend stage, not only today's fixture stage —
    otherwise the same document has to be reopened at W7.
  - The constraint that generated and fixture content must read as illustration
    is preserved, not dropped. See `WEB-BL-004`.
  - `AGENTS.md` asserts there are no nested platform routes; `WEB-BL-008`
    makes that false in the same pull request.
- **Validation:** Every documented path resolves on disk; `git diff --check`
  is clean.

### WEB-BL-008: Platform Navigation State Is Not Addressable

- **State:** Ready
- **Area:** `src/app/platform/`, `src/components/platform/`
- **User value:** `/platform` is one client component holding its view in
  `useState`, so no platform view can be linked, bookmarked, shared, or opened
  in a new tab. Every view is the same URL.
- **Release target:** `docs/releases/v0.2.0.md`
- **Acceptance:** Each platform view is its own route with its own address, the
  sidebar derives its active state from the URL, and the visual design is
  unchanged.
- **Technical constraints:**
  - `src/components/site-nav.tsx` already derives active state from
    `usePathname()`. Follow that pattern rather than adding a second mechanism.
  - The page is `"use client"` in its entirety today, so no view can export
    `metadata`. Nested routes should restore server components wherever a view
    has no interaction — `datasets-view.tsx` has no state at all.
  - The `WEB_VERSION` marker currently renders from `src/app/platform/page.tsx`.
    `docs/releases/README.md` names that path and its deploy runbook sends
    operators there to verify a version bump — moving the marker without
    updating the runbook breaks the release process, not just a link.
  - Carries the `WEB-BL-004` labeling and the `WEB-BL-006` code-block literals,
    since both live in the files being rewritten.
- **Validation:** `pnpm preview`; every platform route at desktop and mobile
  width; `/platform` redirects; the version marker still renders in the
  sidebar.

### WEB-BL-009: Platform Mock Data Is Not Behind A Contract

- **State:** Ready
- **Area:** `src/contracts/`, `src/data/platform/`
- **User value:** Mock rows are module-level arrays inside the view components,
  so the UI is written against fixtures rather than against a shape a backend
  could ever return. Replacing fixtures with a real API would mean rewriting
  the views.
- **Release target:** `docs/releases/v0.2.0.md`
- **Acceptance:** Views depend on a `PlatformGateway` interface, not on
  fixture arrays. Payloads are versioned, validated at runtime, and an
  unsupported schema version is rejected before anything renders.
- **Technical constraints:**
  - The frontend must not invent a second structure schema. `Wickd.Inspection`
    will be canonical and will generate its own declarations, so these
    contracts are explicitly provisional and sit behind one adapter boundary.
  - Authoritative financial values are decimal strings, never JavaScript
    numbers. Parse to `number` only for chart geometry.
  - Keep the validator off the client: the site is static and fixtures are
    local modules, so routes can resolve data at build time and pass plain
    objects into client views.
  - `genCandles` produces `{o,h,l,c}` with no time field. Timestamped candles
    need a converter, not a rewrite — the marketing routes still use the
    original.
- **Validation:** Unit tests for parsing and version rejection; `pnpm build`.

### WEB-BL-010: Platform Chart Cannot Render Timestamped Data

- **State:** Ready
- **Area:** `src/features/chart/`
- **User value:** `CandleChart` is a fixed `1000x560` SVG with no time axis, no
  crosshair, no zoom, and overlays positioned by index arithmetic
  (`length * 0.28`). It is a convincing brand illustration and cannot inspect a
  real run.
- **Release target:** `docs/releases/v0.2.0.md`
- **Acceptance:** The platform renders real timestamped candles with markers,
  levels, zones, connections, and range highlights; supports selection, hover,
  layer visibility, resize, and fit-to-content; and stays on design tokens.
- **Technical constraints:**
  - `CandleChart` is not replaced. It stays a server component serving the
    marketing routes, so `/`'s bundle does not move. The platform gets a
    separate component.
  - The new chart must never enter `src/components/ui/index.ts`. That barrel is
    imported by every marketing page, and a barrel export would pull a canvas
    library into the home-page chunk.
  - TradingView Lightweight Charts takes colors as JavaScript strings, not
    `var()`. Resolving tokens at runtime is required; hardcoding hex is a CI
    failure, since the design-system validator greps for it.
  - `structure-block.tsx` already holds the canonical `kind -> var(--structure-*)`
    mapping. Export and reuse it; a second copy will drift.
  - Overlay geometry should be testable without a canvas — jsdom returns `null`
    from `getContext`.
- **Validation:** `pnpm preview` at desktop and mobile width; reduced motion;
  confirm the canvas bitmap is sized rather than blank.

### WEB-BL-011: Inspection Has No Causal Replay

- **State:** Ready
- **Area:** `src/features/replay/`
- **User value:** The product's claim is that structures are causal and
  inspectable. Reviewing a decision with data that had not printed yet is
  hindsight, and it is the failure mode the engine exists to prevent.
- **Release target:** `docs/releases/v0.2.0.md`
- **Acceptance:** For a cursor at time `T`, the UI shows only candles closed at
  or before `T`, entities and lifecycle events known at or before `T`, and
  levels valid at `T`. Moving the cursor backward removes later facts. The view
  states plainly whether it is Final or Causal as of a timestamp.
- **Technical constraints:**
  - Filtering must be a pure function with no React and no DOM. It is the one
    piece of this work that can be silently wrong, so it has to be directly
    testable.
  - Ordering uses run-local sequence when timestamps are equal.
  - Candle visibility keys off close time, not open time. A bar whose high has
    not printed is lookahead.
  - Prefer making lookahead unrepresentable over filtering it: if terminal
    state is derived from lifecycle events rather than stored on the entity,
    there is no final-state field to leak.
  - Chart state belongs in URL search parameters so an inspection is
    reproducible from its address.
- **Validation:** Unit tests covering equal timestamps, cursor-on-boundary,
  half-open level validity, and monotonicity across every cursor in a fixture.

### WEB-BL-012: Trade Journal Has No Chart-Compatible Representation

- **State:** Ready
- **Area:** `src/app/platform/journal/`
- **User value:** A trade review needs the mentor's plan, the user's actual
  fills, and the engine's structures on one chart at one point in time.
  Nothing in the repository can represent that today.
- **Release target:** `docs/releases/v0.2.0.md`
- **Acceptance:** One fixture trade renders its entry zone, historical stop,
  targets, invalidation, and actual fills on the chart, with a synchronized
  signal timeline, and replays causally.
- **Technical constraints:**
  - Levels are time-valid, not snapshots. A stop update closes the old level
    and opens a new one; overwriting it destroys the history replay depends on.
  - Mentor-reported R and the user's actual net R are different numbers and
    must render as different, separately labeled values. Neither is computed in
    React — the backend owns that, and until it exists the fixture states both.
  - Do not couple the chart or its components to mentor-specific names.
  - The trade list, quick-capture form, and review form are W6 and out of
    scope; this item is the trade-detail view only.
- **Validation:** Walk the acceptance path in `pnpm preview` — open the trade,
  enter causal mode, move the cursor before the stop update, and confirm the
  new stop and later fills disappear.

## Blocked

_None._

## Done

_None yet._
