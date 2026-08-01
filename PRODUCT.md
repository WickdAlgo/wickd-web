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

This produces two surfaces with different jobs, and conflating them is the
main way this document gets misread:

- The **marketing surface** argues. It is static, self-contained, and its
  content is generated from a fixed seed.
- The **platform surface** hosts. It is where an operator inspects runs and
  reviews trades, and it exists to *render data it is given* — from fixtures
  today, from a Wickd platform API later.

The platform surface is a frontend host, not a product of its own. It presents
structures produced by `Wickd.Core` and, in time, journal and execution records
produced by a platform backend in `wickd-dotnet`. It computes none of them.

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
- **This repository owns no authoritative number.** It may preview a
  calculation, but any value that is persisted, reported, or acted on comes
  from the domain layer. Profit and loss, R, risk, position sizing, and
  portfolio state are rendered here, never derived here. This is the boundary
  that matters most, and it does not relax when a backend arrives.
- The marketing surface is static: no backend, no API routes, no accounts, no
  user data, no live market feed. Its chart content is generated from a fixed
  seed and must read as illustration.
- The platform surface renders data supplied to it through one gateway
  boundary. Today that gateway is backed by fixtures; a later authenticated
  API stage is anticipated and is governed by a release contract, not by
  amending this document again. Until an operator can sign in and see their own
  run, **everything shown is illustration and must be labeled as such** — the
  more the surface resembles a working journal, the more that labeling matters.
- The engine's semantics are not reimplemented here. Structure detection,
  inspection projection, trade accounting, risk enforcement, exchange
  reconciliation, backtest settlement, and live order execution belong to
  `wickd-dotnet`. Fixture endpoints for local development are acceptable only
  while clearly isolated.
- Private mentor content is never exposed publicly, and reusable components are
  never coupled to an individual mentor's naming.
- Nothing here is financial advice, a signal service, a broker, or a
  performance promise.
- Visual and interaction decisions are governed by `DESIGN.md`; the component
  library is the shared vocabulary, and page-specific composition stays out of
  it.

## Identity

- **Positioning:** the visible face of a deterministic trading-research
  platform — "market structure, made visible".
- **Surfaces:** the marketing routes (home, engine, pricing, design system) and
  the platform surface (inspection, journal, backtests, datasets).
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

## Amendments

### 2026-08-01 — The platform surface becomes a frontend host

**What changed.** Purpose gained the marketing/platform split. Boundaries
replaced two clauses: that the whole web surface is static with "no backend, no
API routes, no accounts, no user data", and that the platform route is "a shell
demonstrating the intended workflow, not a running product".

**Why.** `Wickd_Web_Integrated_Trade_Journal_Handoff.md` decides that the
WickdAlgo trade journal is a platform module rather than a standalone
application or part of `Wickd.Core`, and that this repository is its frontend
host. The old clauses described a demonstration, and would have made the
product's own roadmap — stage three, "let people inspect their own runs" —
unreachable without amending this document under deadline. Amending it now, at
the point the decision was made, is the honest sequence.

**What was deliberately preserved.** The constraint that generated and fixture
content must read as illustration was kept and strengthened rather than
dropped: it now scales with how convincing the surface looks. The prohibition
on authoritative calculation in this repository was added explicitly, because
a journal is exactly where that boundary would erode first.

**What this does not authorize.** No backend, authentication, or user data
ships under this amendment. The gateway boundary exists so that stage can be
committed to by a release contract when it is real —
`docs/architecture/001-platform-and-journal-boundaries.md` records the split.
