# WickdAlgo Web Surface

This document is the constitution for WickdAlgo's public web surface. It
defines what the site is for, who it serves, what it must never become, and how
its scope is governed.

WickdAlgo's product-wide vision, principles, and boundaries are canonical in
[wickd-dotnet's `PRODUCT.md`](https://github.com/WickdAlgo/wickd-dotnet/blob/master/PRODUCT.md).
This repository does not restate them. Current behavior belongs in `README.md`;
design intent belongs in `DESIGN.md`; planned work belongs in `docs/sprints/`;
version scope belongs in `docs/releases/`; shipped history belongs in
`CHANGELOG.md`.

## Purpose

The engine proves that market structure can be made deterministic. The web
surface exists to make that proof *visible* — to show, before anyone installs
anything, that structures are observable, causal, and inspectable rather than
asserted.

The surface develops in the same order the product does:

```text
explain the engine
  -> show the structures
  -> let people inspect their own runs
  -> host strategies and agents
```

Each stage may only claim what the engine can already do.

## Audiences

- **Visitor** — arrives from a link or search, has minutes. Must leave knowing
  what WickdAlgo determines and why that is different from a signal service.
- **Evaluator** — a technical trader or developer deciding whether to install
  the CLI. Must be able to see real structure behavior and reach the engine.
- **Operator** — someone already running WickdAlgo, using the platform surface
  to inspect runs and backtests.

The site is written for people who will read the details. It does not chase
audiences the product cannot serve.

## Boundaries

- The site presents the product; it does not redefine market-structure
  semantics. Terminology follows the engine, never the other way round.
- No claim ships ahead of the engine. Tiers that are not available say so.
- The web surface is static: no backend, no API routes, no accounts, no user
  data, no live market feed. Chart and journal content is generated from a
  fixed seed — at build time or in the browser, depending on the route — and
  must read as illustration. Nothing here is fetched, and nothing is real
  market data.
- The platform route is a shell demonstrating the intended workflow, not a
  running product. It must not imply that it is executing real analysis.
- Nothing here is financial advice, a signal service, a broker, or a
  performance promise.
- Visual and interaction decisions are governed by `DESIGN.md`; the component
  library is the shared vocabulary, and page-specific composition stays out of
  it.

## Identity

- **Positioning:** the visible face of a deterministic trading-research
  platform — "market structure, made visible".
- **Surfaces:** the marketing routes (home, engine, pricing, design system) and
  the platform shell.
- **Technical identity:** the `wickd-web` Worker, deployed on Cloudflare; the
  candlestick "W" mark; Archivo and Inter; the chart color convention shared
  with the engine's own output.
- **Visibility:** public repository, publicly deployed site.

## Governance

- The maintainer decides site scope, release scope, and public claims.
- Ideas enter `docs/sprints/backlog.md`; committed work enters a sprint;
  release scope is governed by contracts under `docs/releases/`.
- Changes to this constitution require an explicit product-level rationale in a
  pull request.
- When the site and the engine disagree about what the product does, the engine
  is right and the site is a bug.
