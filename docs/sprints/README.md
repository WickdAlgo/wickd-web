# Sprint Documentation

`docs/sprints/` is the canonical execution layer for `wickd-web`. Use it for
the backlog, one-week commitments, meaningful work logs, reviews,
retrospectives, and carryover.

The repository workflow is:

```text
idea -> backlog -> sprint -> implementation -> validation
     -> changelog + release contract -> PR/review -> merge
     -> Workers Builds deploy -> release record
```

`AGENTS.md` governs the full repository workflow. This directory owns planning
and delivery evidence.

## Current Sprint

- [Sprint 2: Platform as frontend host](2026-08-01-sprint-2.md)

Previous:

- [Sprint 1: Establish the development cycle](2026-08-01-sprint-1.md) — closed
  on its opening day, so Sprint 2 shares its window.

## Cadence

- One week.
- Filename: `YYYY-MM-DD-sprint-N.md`.
- The date is the sprint start date; `N` is a running human-readable number.

## Backlog

Use `backlog.md` before commitment. Each item has a stable `WEB-BL-NNN` ID,
state, area, user value, release target, acceptance criteria, and validation.

States:

- `Candidate`: needs grooming or scheduling.
- `Ready`: clear enough to commit.
- `Blocked`: waiting on a decision or dependency.
- `Done`: completed and retained for traceability.

IDs are repository-local. wickd-dotnet numbers its own `WKD-BL-NNN` series
independently; never assume the two refer to each other.

## Sprint Records

At planning time, capture the goal, dates, assumptions, committed items,
release targets, changelog impact, acceptance criteria, and validation.

During delivery, append dated work-log bullets for material updates only. At
the end, record completed work, verification, incomplete items, a short retro,
and carryover.

## Proving Web Work

There is no test suite, so evidence is explicit. A completed item names:

- the commands run (`pnpm lint`, `pnpm build`, the design-system validator),
- the routes checked and at which widths,
- reduced-motion behavior for anything animated,
- and, for visual changes, the before/after screenshots attached to the pull
  request.

"It builds" is not verification of a visual change.
