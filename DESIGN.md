# Design

This document is the UI/UX source of truth for the WickdAlgo web surface. It
holds design *intent* — the conventions a change must honor and the reasons
behind them.

It deliberately does not restate token values. Those live in one place:

| Need | Source |
| --- | --- |
| Token values (colors, type scale, radii, shadows) | `src/app/globals.css` |
| Live component showcase | the `/design` route |
| How to add a library component | `.claude/skills/add-ui-component` |
| Why the surface exists and what it may claim | `PRODUCT.md` |

The design system originates from the "WickdAlgo Design System" Claude Design
project; `.design-sync/NOTES.md` records what was imported, in which direction,
and what was intentionally left behind.

## Principles

1. **The interface is an instrument, not a brochure.** Density, precision, and
   legibility beat decoration. If a visual element does not carry information,
   it needs a reason to exist.
2. **Structure is the brand.** Candles, swings, blocks, and levels are the
   visual language. Ornament that is not market structure is borrowed, and
   should be rare.
3. **Color carries meaning, never mood.** Every chart color means one thing
   (below). Reusing a structure color decoratively breaks the reading.
4. **Motion explains causality.** Animation shows how a structure came to be —
   sequence, flow, replay. Motion that only draws attention does not ship.
5. **One vocabulary.** Shared elements belong in the component library so every
   surface inherits the same behavior; page-specific composition stays out of
   it.

## Color Convention

The chart convention is shared with the engine's own output and is not
negotiable per-page:

| Color | Meaning |
| --- | --- |
| Rose | Bearish |
| Sage | Bullish |
| Blue | Imbalance / fair value gap |
| Amber | Breaker / OTE |
| Lilac | Support / resistance |
| Gray | Default lines and neutral structure |

Rules:

- Direction reads first: bullish and bearish must be distinguishable before any
  other encoding is applied.
- Use the semantic utilities (`bg-bullish`, `text-ic`, …) and the semantic
  surface/text utilities (`bg-canvas`, `bg-card`, `text-ink`,
  `text-ink-secondary`, `border-hairline`, `border-strong`). Never raw palette
  values, and never a hex literal — in markup, in SVG, or in a style attribute.
- The plain `:root` variables (`--structure-*`, `--chart-*`, `--transition-*`,
  `--page-max-width`) exist for SVG paints, dynamic values, layout, and motion.
  Markup uses utilities.
- Tone is expressed through surface and hairline, not through tinting text.

## Form

- **Radii:** structures are sharp (0) because market structures are drawn
  sharp; cards are 6px; buttons are full pills (`rounded-buttons`). A component
  that is neither a structure nor a card should say which one it is behaving
  like.
- **Typography:** Archivo (`font-display`) for headings and UI chrome, Inter
  (`font-ui`) for reading text. One grotesque carries the scale from poster
  headlines down to nav labels, so hierarchy comes from size and weight rather
  than from mixing families.
- **Elevation:** subtle and blue-tinted. Elevation separates layers; it does
  not imply importance.
- **Density:** the platform shell is denser than the marketing routes. Both use
  the same tokens; only the spacing rhythm differs.

## Motion

- Keyframes are prefixed `wa-` and belong at the bottom of `globals.css`. The
  exception is a component that ships its own `<style>` block to stay
  self-contained — `animated-logo.tsx` defines `wa-replay-grow` alongside the
  mark it animates, and keeps its reduced-motion fallback there too. Keep the
  prefix either way; a keyframe used by more than one component belongs in
  `globals.css`.
- Every animation must degrade: the reduced-motion fallback is part of the
  change, not a follow-up. Component-level opt-out uses
  `src/lib/use-reduced-motion.ts`.
- Ambient motion stays slow and non-looping-in-attention: it should be
  noticeable only when looked at.
- Hover animation is allowed to be expressive (the animated logo replays a
  market), but must never move layout.

## Layout And Responsiveness

- Page width is bounded by `--page-max-width`; full-bleed bands are the
  exception used to separate major sections.
- The scrollbar track is always reserved so fixed chrome does not shift when
  content height changes.
- Wide content (diagrams, tables, charts) scrolls inside its own container. The
  page body never scrolls horizontally.
- Every change is checked at desktop and mobile widths before it ships.

## Brand

The candlestick "W" mark is rendered inline by
`src/components/ui/animated-logo.tsx` in a `full` (17-candle) and a `compact`
(7-candle, legible at small sizes) variant, with a CSS-only "market replay"
hover animation. The source assets live in the org brand repo, not here. The
favicon is `src/app/icon.svg`.

## Changing The System

- Adding or changing a library component follows
  `.claude/skills/add-ui-component`, including the barrel export in
  `src/components/ui/index.ts` and the validation script.
- New tokens are added to `globals.css` and named semantically. A token that
  only one component uses is probably a component style, not a token.
- Changes that alter the conventions above — a new structure color, a different
  radius rule, a new type family — are design decisions and need a rationale in
  the pull request, the same as a `PRODUCT.md` change.
- Keep `/design` honest: a component that exists in the library should be
  visible there.
