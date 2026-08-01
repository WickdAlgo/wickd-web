# Product Backlog

Canonical pool for planned `wickd-web` product, engineering, maintenance, and
documentation work.

IDs are repository-local and never reused. wickd-dotnet numbers its own
`WKD-BL-NNN` series independently.

Every item below was written from an observable fact about the repository at
the time the cycle was established. Groom, reprioritize, or drop them freely —
an unclaimed candidate is not a commitment.

## Candidate

### WEB-BL-001: Automated Regression Coverage For The UI Surface

- **State:** Candidate
- **Area:** repository-wide, `.github/workflows/ci.yml`
- **User value:** Catch broken routes, broken interaction, and design-token
  regressions before they deploy, since merging to `main` deploys immediately.
- **Release target:** `Not release-relevant` until scoped
- **Acceptance:** A test layer exists and runs in CI. It must at minimum prove
  every route renders, and cover the interactive library components (`Tabs`,
  `Switch`, `Select`, `Checkbox`, `Field`).
- **Technical constraints:**
  - CI currently proves `pnpm lint`, `pnpm build`, and the design-system
    validator only. Nothing exercises a rendered page.
  - Decide deliberately between component-level and route-level coverage
    before adding a runner; do not add both by default.
  - Keep the check fast enough to stay in the pre-merge gate.
- **Validation:** The new suite runs green in CI on a pull request.

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
- **Validation:** Keyboard walkthrough of `/`, `/engine`, `/pricing`,
  `/design`, and `/platform`, plus a reduced-motion run.

## Ready

_None yet. Groom a candidate before committing it to a sprint._

## Blocked

_None._

## Done

_None yet._
