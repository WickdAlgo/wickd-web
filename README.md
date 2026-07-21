# wickd-web

Marketing site and web platform for **WickdAlgo** — market structure, made visible.
Built with [Next.js](https://nextjs.org) (App Router), TypeScript, and Tailwind CSS.

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command      | Description                          |
| ------------ | ------------------------------------ |
| `pnpm dev`   | Start the dev server                 |
| `pnpm build` | Production build                     |
| `pnpm start` | Serve the production build           |
| `pnpm lint`  | Run ESLint                           |

## Structure

```
src/
  app/
    (site)/          Marketing pages (home, engine, pricing, design) with shared nav/footer
    platform/        Platform app shell (datasets, inspect, backtest views)
    icon.svg         Favicon — static candlestick W mark
  components/
    ui/              WickdAlgo component library (imported from the design system)
    home/            Home-page sections (hero background, pipeline)
    platform/        Platform views
```

## Brand

The candlestick "W" mark lives in the org brand repo
(`.github/profile/assets/brand/`). In this app it is rendered by
`src/components/ui/animated-logo.tsx` — an inline SVG with a CSS-only
"market replay" hover animation, in a `full` (17-candle) and a `compact`
(7-candle, small-size legible) variant.
