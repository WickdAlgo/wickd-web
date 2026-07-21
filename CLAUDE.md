# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (pnpm-workspace.yaml at root).

- `pnpm dev` — start the Next.js dev server (http://localhost:3000)
- `pnpm build` — production build
- `pnpm start` — serve the production build
- `pnpm lint` — run ESLint (flat config, `eslint.config.mjs`, next/core-web-vitals + TypeScript)

There is no test suite.

## What this is

Marketing site and web platform for **WickdAlgo** ("market structure, made visible") — a product that turns price action into deterministic market structures (swings, order blocks, FVGs, liquidity). Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS v4. No backend/API routes — everything is static/client-side; chart data is generated (`genCandles` in `candle-chart.tsx`).

## Architecture

Two route groups with different shells (`src/app/`):

- `(site)/` — marketing pages (home, engine, pricing, design) wrapped by `SiteNav` + `Footer` in `(site)/layout.tsx`.
- `platform/` — the app shell: a single client page with a sidebar switching between views (`InspectView`, `BacktestView`, `DatasetsView`) from `src/components/platform/`. No nested routes — view switching is React state.

Components:

- `src/components/ui/` — the WickdAlgo component library, imported from the "WickdAlgo Design System" project. Everything is re-exported (components + prop types) through `src/components/ui/index.ts`; import from `@/components/ui`, and add new library components to that barrel.
- `src/components/home/` — home-page sections (hero background, pipeline diagram/section).
- `src/lib/` — `cx.ts` (classname join helper), `styles.ts` (shared class strings: `container`, `panel`), `use-controllable.ts`, `use-reduced-motion.ts`.

Path alias: `@/*` → `src/*`.

## Design system (important)

All styling flows through design tokens defined in `src/app/globals.css` (Tailwind v4 `@theme` — there is no tailwind.config file):

- **Chart color convention**: rose = bearish, sage = bullish, blue = IC/FVG, amber = breaker/OTE, lilac = S/R, gray = default lines. Semantic utilities exist for these (`bg-bullish`, `text-ic`, …).
- **Semantic surface/text utilities**: `bg-canvas`, `bg-card`, `text-ink`, `text-ink-secondary`, `border-hairline`, `border-strong`, etc. Use these, not raw palette colors or hex values.
- Markup styling uses Tailwind utilities; the plain `:root` variables (`--structure-*`, `--chart-*`, `--transition-*`, `--page-max-width`) are for SVG paints, dynamic values, and motion only.
- **Fonts**: Archivo (`font-display`, headings/UI chrome) + Inter (`font-ui`) via next/font in `src/app/layout.tsx`.
- **Radii convention**: structures sharp (0), cards 6px, buttons full pills (`rounded-buttons`).
- Motion keyframes are prefixed `wa-` and respect reduced motion via `use-reduced-motion.ts`.

The candlestick "W" brand mark is rendered inline by `src/components/ui/animated-logo.tsx` (CSS-only hover animation, `full` and `compact` variants); the source assets live in the org brand repo, not here. The favicon is `src/app/icon.svg`.

## Skills

- `.claude/skills/add-ui-component` — step-by-step workflow for adding a component to the design-system library (pattern, token rules, barrel export, validation script). Use it whenever adding or reviewing `src/components/ui/` components.

## Git conventions

- Do not add `Co-Authored-By: Claude ...` trailers to commits in this repo.
- When a commit message or PR description includes an attribution footer, use `Generated with [Claude Code](https://claude.com/claude-code) (<model name and version>)` — no robot emoji, and name the actual model used (e.g. `(Fable 5)`, `(Sonnet 5)`).
