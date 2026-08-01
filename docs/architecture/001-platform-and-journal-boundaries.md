# ADR 001: Platform And Journal Boundaries

- **Status:** Accepted
- **Date:** 2026-08-01
- **Sprint:** `docs/sprints/2026-08-01-sprint-2.md`
- **Contract:** `docs/releases/v0.2.0.md`
- **Source:** `Wickd_Web_Integrated_Trade_Journal_Handoff.md`

## Context

WickdAlgo needs a trade journal: a place where a trade thesis, the actual
execution, the outcome, and the engine's structures can be reviewed together at
a chosen point in time.

Three shapes were available, and two of them are traps.

Building it as a **standalone trade diary** is the obvious one. It is also the
one that destroys the product: a diary that does not share identity, charts,
structures, and executions with the platform is a CRUD app, and the entire
value here is the link between a deterministic structure and a decision made
because of it.

Building it **inside `Wickd.Core`** is the other. `Wickd.Core` is the reason
the product has a claim at all — it is deterministic, and it stays deterministic
only because entry, stop, target, sizing, and risk decisions are not in it. A
journal inside Core would put a user's opinion inside the thing whose value is
that it has none.

The third shape, adopted here: the journal is a **platform module**, and this
repository is its frontend host.

## Decision

Ownership splits as follows. The rule that generates the whole table: **a layer
may depend on facts from the layer below it, never on decisions from the layer
above.**

| Concern | Owner |
| --- | --- |
| Deterministic market observations and structures | `Wickd.Core` (`wickd-dotnet`) |
| Regenerable structure entities, lifecycles, evidence graphs, renderer-neutral projections | `Wickd.Inspection` (`wickd-dotnet`, planned) |
| Accounts, trade ideas, mentor signals, executions, fills, reviews, risk, equity, persistence, API orchestration | new projects in `wickd-dotnet`, outside Core |
| Marketing site, platform shell, journal UI, chart rendering, replay controls | `wickd-web` (this repository) |
| Reusable chart/inspection component | a module inside `wickd-web` for now |

### What `Wickd.Core` must never know

Users, mentors, trade records, entries, stops, targets, position sizing, risk
percentage, PnL, database persistence, Next.js, chart libraries, pixel
coordinates, or visual colors.

Core owns `Swing`, `MarketStructureBreak`, `LiquidityPool`, `LiquiditySweep`,
`ExpansionFvg`, `OrderBlock`, `LifecycleEvent`, `Evidence`, `Relation`, and
`KnownAtUtc` — facts and the time they became known, nothing that interprets
them.

### What `Wickd.Inspection` owns

The canonical, regenerable, renderer-neutral contract: the dataset, entities,
ordered lifecycles, evidence and relation graphs, Final and Causal projections,
chart primitives, available filters, and the schema version. It preserves
subject geometry, trigger observation, `knownAtUtc`, run-local sequence,
detector provenance, and input dataset version.

It must not emit chart-library objects or browser coordinates. The moment it
does, the projection stops being renderer-neutral and this repository's
renderer becomes its API.

### What this repository owns

Routes, layouts, forms, the chart renderer, layer and replay controls, the
timeline, journal and analytics views, API clients, frontend validation, and
loading, error, and empty states.

**It owns no authoritative number.** The frontend may preview a calculation;
anything persisted or reported comes from the domain layer. PnL, R, risk, and
portfolio values are rendered, never derived, in React.

## Consequences

### One-way dependencies inside `src/`

```text
app/ -> features/ -> data/ -> contracts/
```

`contracts/` imports nothing from the layers above it. `features/` does not
import from `app/`. A renderer never queries a gateway; it receives typed data
and emits callbacks.

### Contracts are provisional and versioned

`Wickd.Inspection` will eventually generate JSON Schema and TypeScript
declarations, and those become canonical. Until then this repository carries a
clearly versioned temporary contract, and every payload passes one adapter
boundary — so replacing the contract does not rewrite the renderers.

The frontend does not invent a second structure schema. Where a name exists in
Core, it is used unchanged.

### Financial values are decimal strings

Authoritative money and quantity values cross the boundary as strings. IEEE-754
doubles are not an acceptable representation for a number a user reconciles
against an exchange statement. Parsing to `number` is permitted only for chart
geometry, where the value is being turned into a pixel anyway.

### Causal replay is a correctness property, not a feature

For a cursor at `T`, the UI may show only what was knowable at `T`. Where
possible this is enforced structurally rather than by filtering: terminal state
is derived from lifecycle events rather than stored on an entity, so there is
no final-state field available to leak.

Time-valid records are never overwritten. A stop update closes the old level
and opens a new one; overwriting it destroys the history replay depends on.

### No third repository, and no workspace split yet

Backend projects are added to `wickd-dotnet` rather than a new repository. This
avoids cross-repository package and version management between Core,
Inspection, and the API while all three are still moving.

Frontend modules stay under `src/` rather than becoming `packages/*`. The
handoff asks for workspace packages immediately; the boundary above is what
actually matters, and it is enforceable with import discipline today. Extraction
into packages remains available once the boundary has proven stable — a
disruptive move first does not.

A split is justified when deployment cadence diverges materially, ownership
changes, the solution becomes operationally difficult, or independent release
governance is required. None of those is true today.

### Next.js route handlers are not a backend

Temporary fixture endpoints are acceptable for local UI development and must be
clearly isolated. Trade accounting, risk enforcement, exchange reconciliation,
research provenance, Core execution, and Inspection generation must not live
here — not even briefly, because "temporary" backends acquire callers.

## Non-goals

Not built in this repository as authoritative systems: Core structure
detection, Inspection projection generation, trade accounting formulas, risk
enforcement, exchange API secrets, Telegram ingestion, PostgreSQL migrations,
research labeling truth, backtest settlement, or live order execution.

Also: no generic strategy marketplace, no global state store until real
cross-route requirements justify one, no public exposure of private mentor
content, and no coupling of reusable chart components to any individual
mentor's naming.

## Follow-up in `wickd-dotnet`

`docs/architecture/002-expected-platform-api.md` records the backend contract
this repository expects, so it can enter the `wickd-dotnet` backlog without
disrupting the current Core release. The suggested projects are
`Wickd.TradeJournal`, `Wickd.Platform.Application`,
`Wickd.Platform.Infrastructure.Postgres`, and `Wickd.Platform.Api`.
