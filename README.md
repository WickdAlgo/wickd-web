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

| Command            | Description                                            |
| ------------------ | ------------------------------------------------------ |
| `pnpm dev`         | Start the dev server                                   |
| `pnpm build`       | Production build — `next build` plus the OpenNext bundle |
| `pnpm build:next`  | The plain `next build`                                 |
| `pnpm start`       | Serve the production build                             |
| `pnpm lint`        | Run ESLint                                             |
| `pnpm preview`     | Build and serve the Worker locally via Wrangler        |
| `pnpm deploy`      | Deploy straight to production from a local machine — incident escape hatch, not a release path ([why](docs/releases/README.md#manual-deploys)) |

There is no test suite. CI runs `pnpm lint`, `pnpm build`, and
`bash .claude/skills/add-ui-component/scripts/validate.sh`.

## Documentation

| Document | Role |
| --- | --- |
| [PRODUCT.md](PRODUCT.md) | What the web surface is for, and what it must never become |
| [DESIGN.md](DESIGN.md) | UI/UX source of truth — conventions, color meaning, motion |
| [AGENTS.md](AGENTS.md) | Repository contract for agents and contributors |
| [CHANGELOG.md](CHANGELOG.md) | Shipped release history |
| [docs/development-cycle.md](docs/development-cycle.md) | The full idea-to-deploy loop |
| [docs/architecture/](docs/architecture/) | Decision records — why the platform is shaped this way |
| [docs/sprints/](docs/sprints/) | Backlog, sprint commitments, work logs |
| [docs/releases/](docs/releases/) | Release contracts, versioning, deploy runbook |

WickdAlgo's product-wide vision lives in
[wickd-dotnet's PRODUCT.md](https://github.com/WickdAlgo/wickd-dotnet/blob/master/PRODUCT.md).

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
