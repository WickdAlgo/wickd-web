# ADR 002: The Platform API This Repository Expects

- **Status:** Proposed — nothing here is built
- **Date:** 2026-08-01
- **Consumer:** `wickd-web`, `src/data/platform/`
- **Producer:** `Wickd.Platform.Api` in `wickd-dotnet`, not yet created
- **Related:** `001-platform-and-journal-boundaries.md`

## Why this exists

`wickd-web` now renders a complete platform surface against fixtures behind one
interface, `PlatformGateway`. This document records the contract that interface
implies, so it can enter the `wickd-dotnet` backlog as a specification rather
than as a guess — and so the .NET side is not designed around whatever shape
the frontend happened to invent.

Everything here is *provisional*. `Wickd.Inspection` will own the inspection
payload and should generate its own JSON Schema and TypeScript declarations;
where this document and that generator disagree, the generator wins and
`src/contracts/` is regenerated.

This document does not commit `wickd-dotnet` to anything. It states what the
frontend would consume if the API existed today.

## The shape already implemented against

`src/data/platform/gateway.ts` is the authoritative version of the following.
It is small on purpose: every method is one round trip that returns something
renderable.

```ts
listDatasets(): DatasetSummary[]
listRuns(): RunSummary[]
getInspectionRun(runId): InspectionDatasetV1
listStructureEvents(runId): StructureEventItem[]
getJournalTail(runId, limit?): JournalEntry[]
listTrades(): TradeSummary[]
getTrade(tradeId): TradeDetailV1
startBacktest(request, signal?): RunSummary
```

Suggested HTTP mapping:

| Method | Endpoint |
| --- | --- |
| `listDatasets` | `GET /api/datasets` |
| `listRuns` | `GET /api/runs` |
| `getInspectionRun` | `GET /api/runs/{runId}/inspection` |
| `listStructureEvents` | `GET /api/runs/{runId}/structures` |
| `getJournalTail` | `GET /api/runs/{runId}/journal?limit=` |
| `listTrades` | `GET /api/trades` |
| `getTrade` | `GET /api/trades/{tradeId}` |
| `startBacktest` | `POST /api/runs` |

## What the payloads must carry

The schemas are in `src/contracts/`. Four properties matter more than the field
lists, because the frontend's correctness depends on them and it cannot check
them itself.

### 1. Every fact carries when it became knowable

Not when it happened — when it became *detectable*. A swing high printed at
13:05 and confirmed at 13:25 is knowable at 13:25, and a replay at 13:10 must
not show it. Structure entities therefore carry `subjectTimeUtc` (geometry),
`triggerTimeUtc` (the observation), and `knownAtUtc` (knowability) as three
separate fields.

### 2. Terminal state is not a field

`StructureEntity` has no `state`, no `mitigatedAt`, no `invalidatedAt`. State is
folded from `LifecycleEvent`s at or before the cursor.

This is a request, not an accident of the frontend's design: if the API returns
a final state on the entity, every consumer has to remember to ignore it during
replay, and one that forgets produces a plausible-looking view containing
hindsight. Omitting the field makes the mistake unrepresentable.

### 3. Ordering needs a run-local sequence

Several structures can become knowable from the same candle. `sequence` makes
their order deterministic within one run, and the frontend sorts by
`(knownAtUtc, sequence)`. Without it, a cursor between two same-instant facts
lands arbitrarily.

### 4. Money is a decimal string

Prices, quantities, fees, PnL, and R cross the boundary as strings. These are
values a user reconciles against an exchange statement and IEEE-754 doubles
cannot represent them exactly. The frontend parses to `number` only for chart
geometry, where the value is becoming a pixel.

## Time-valid records

Trade levels are intervals, not snapshots: `validFromUtc` and a nullable
`validUntilUtc`, half-open. When a stop moves, close the old row and insert a
new one; do not update in place. The chart's ability to answer "where was the
stop when this fill happened?" depends on it, and that question is most of what
a review is.

## Versioning

Every top-level payload carries `schemaVersion`. The frontend rejects an
unsupported version before rendering anything, with an error naming the
contract. A newer producer therefore fails loudly against an older consumer
rather than rendering something subtly wrong.

Additive changes may keep the version. Anything that changes the meaning of an
existing field must bump it.

## What the API must never require the frontend to do

- Join raw records. The frontend receives assembled payloads, not tables.
- Compute an authoritative number. PnL, R, risk, and equity arrive computed.
- Decide what is visible at a replay cursor. The API sends everything the run
  knows and the frontend filters causally; it must not receive a pre-filtered
  view that hides its own provenance.

## Open questions for `wickd-dotnet`

1. Does `Wickd.Inspection` emit chart primitives, or does the API assemble them
   from entities? The frontend currently expects primitives in the dataset and
   would adapt either way, but the answer decides where the geometry lives.
2. Should `ChartScene` exist as a distinct endpoint that merges inspection and
   journal layers server-side, or should the frontend keep composing them? The
   handoff proposes the former; the fixture slice proved the latter is
   workable, so this is now a real choice rather than an assumption.
3. Pagination for `listTrades` and `getJournalTail` — not needed at fixture
   scale, required at real scale.
4. What identifies a run across regenerations? `runId` is currently a name a
   human chose.

## Suggested backlog items for `wickd-dotnet`

```text
Add Wickd.TradeJournal domain
Add Wickd.Platform.Api host
Add PostgreSQL persistence and migrations
Add ChartScene assembler
Add journal/inspection evidence links
Add account, risk, execution, and equity APIs
Add authentication and ownership boundaries
```

These are downstream of the current Core release and must not disturb it.
