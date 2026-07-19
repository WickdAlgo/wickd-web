# Design sync notes

- 2026-07-18: Imported the "WickdAlgo Design System" Claude Design project
  (fc858be6-88be-4792-a0ae-d84528192ba4) INTO this repo (reverse direction:
  design → code). Tokens live in `src/app/globals.css` as Tailwind v4 `@theme`
  + semantic `:root` aliases; components ported 1:1 from the project's
  `components/**.jsx` to typed TSX in `src/components/ui/`.
- Fonts: the project ships Archivo + Inter variable TTFs; this repo loads the
  same faces via `next/font/google` instead (exposed as `--font-archivo` /
  `--font-inter`, consumed by `--font-display` / `--font-ui`).
- Logos copied to `public/logo.svg` (light, primary) and `public/logo-dark.svg`
  (reserved for dark contexts).
- Not imported: `guidelines/` specimen cards, `_ds_bundle.js` (design-tool
  runtime artifacts, not app code).
- 2026-07-18 (2nd pass): `ui_kits/` ported as real routes — website kit →
  `/` (home), `/engine`, `/pricing` under `src/app/(site)/` (shared NavBar +
  Footer layout); platform kit → `/platform` (left-rail dashboard, views in
  `src/components/platform/`). Component showcase moved to `/design`.
- 2026-07-19: Home hero structure blocks gained ambient drift motion; new custom
  "pipeline" section (Monad-inspired animated flow diagram + journal feed) lives
  in `src/components/home/`. Site-specific composition — intentionally NOT part
  of the `ui/` library or the Claude Design project (candidate for a future
  upload sync). Motion keyframes (`wa-*`) at the bottom of `globals.css` with a
  prefers-reduced-motion fallback.
- 2026-07-19 (rework): Pipeline section rebuilt from boxed PoC to full-bleed
  cream band (`--chart-canvas`, hairline y-borders) with centered header, per
  the Monad reference. Diagram geometry rebudgeted on a 1320×470 viewBox so
  sources / engine / lane / strategies / decision fan never collide or clip at
  desktop widths (no scroll container ≥ ~1060px; overflow-x only below that).
  Traveling payloads are Monad-style objects, not dots: white payload chips
  (ohlcv/ccxt/alias/5m/funding) + amber ticks on the source lines, the five
  structure chips (OB/FVG/sweep/BoS/breaker) traveling the 300px lane with
  ~60px spacing, and color-coded ticks (rotate="auto") on the decision
  branches. All payloads fade out before convergence points so they never
  stack at the engine or strategies node. Reduced motion renders payload
  chips at line midpoints and the structure chips static on the lane.
  Source lines are Monad-style rails: each sweeps with horizontal tangents
  both ends in its own bend window (`RAIL_BEND`), nested inner-first /
  outer-last — inner rails join the parallel bundle (5px apart) early, outer
  rails wrap around them and join closest to the engine — so sweeps never
  cross and there is no single-point convergence. Decision branches start from a
  matching 5px-offset bundle at the strategies node. The journal-tail
  terminal panel was removed (user call, 2026-07-19); the section is a
  server component again — only the diagram stays a client component, and
  the `wa-feed-in` keyframe was dropped from `globals.css`.
  Engine glow is sage-only (cotton-candy stop removed); stage diamonds paint
  over the engine tile so all four are visible.
