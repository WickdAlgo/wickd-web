import {
  datasetSummary,
  journalEntry,
  parseContract,
  runSummary,
  structureEventItem,
  type DatasetSummary,
  type JournalEntry,
  type RunSummary,
  type StructureEventItem,
} from "@/contracts";
import { z } from "zod";
import { may6Session } from "./may6-session";

/**
 * Dataset, run, and journal listings.
 *
 * These were module-level arrays inside the platform view components. Moving
 * them here is most of the point of the gateway: three separate files each
 * hardcoded the same dataset alias list, and they were already inconsistent
 * with one another about what a run contained.
 */

export const datasets: readonly DatasetSummary[] = parseContract(
  "DatasetSummary[]",
  z.array(datasetSummary),
  [
    {
      alias: "may6-session",
      instrument: { market: "BTC_USDT_PERP", timeframe: "5m" },
      rangeFromUtc: "2026-05-06T00:00:00Z",
      rangeToUtc: "2026-05-07T07:00:00Z",
      candles: 372,
    },
    {
      alias: "apr-range",
      instrument: { market: "BTC_USDT_PERP", timeframe: "15m" },
      rangeFromUtc: "2026-04-01T00:00:00Z",
      rangeToUtc: "2026-04-14T00:00:00Z",
      candles: 1248,
    },
    {
      alias: "q1-trend",
      instrument: { market: "ETH_USDT_PERP", timeframe: "1h" },
      rangeFromUtc: "2026-01-01T00:00:00Z",
      rangeToUtc: "2026-03-31T00:00:00Z",
      candles: 2160,
    },
  ],
);

export const runs: readonly RunSummary[] = parseContract(
  "RunSummary[]",
  z.array(runSummary),
  [
    { runId: "phase-3-smoke", datasetAlias: "may6-session", events: 1284, status: "complete" },
    { runId: "ob-tuning-04", datasetAlias: "apr-range", events: 4907, status: "complete" },
    { runId: "sweep-check", datasetAlias: "q1-trend", events: 0, status: "failed" },
  ],
);

/**
 * The journal tail, as structured records rather than a template literal.
 *
 * The previous version was a single pre-formatted string, which meant the
 * "journal" could say anything at all — including things the inspection run
 * disagreed with. Deriving the lines from `may6Session` keeps the backtest
 * output and the inspection view describing the same session.
 */
export const journalTail: readonly JournalEntry[] = parseContract(
  "JournalEntry[]",
  z.array(journalEntry),
  [
    ...may6Session.entities.slice(-3).map((e) => ({
      timeUtc: e.knownAtUtc,
      type: e.family,
      detail:
        e.subjectPriceLow !== undefined && e.subjectPriceHigh !== undefined
          ? `${e.label} · ${e.subjectPriceLow} – ${e.subjectPriceHigh}`
          : e.label,
    })),
    ...may6Session.lifecycle
      .filter((l) => l.type === "mitigated" || l.type === "invalidated")
      .map((l) => ({
        timeUtc: l.knownAtUtc,
        type: "lifecycle" as const,
        detail: `${l.entityId} · ${l.type}${l.note ? ` · ${l.note}` : ""}`,
      })),
  ].sort((a, b) => Date.parse(a.timeUtc) - Date.parse(b.timeUtc)),
);

/**
 * The structure list the inspect panel renders.
 *
 * Projected from the dataset's entities rather than maintained separately, so
 * the list and the chart cannot disagree about what the run found.
 */
export const structureEvents: readonly StructureEventItem[] = parseContract(
  "StructureEventItem[]",
  z.array(structureEventItem),
  may6Session.entities.map((e) => ({
    id: `row-${e.id}`,
    entityId: e.id,
    timeUtc: e.knownAtUtc,
    family: e.family,
    label: e.label,
    detail:
      may6Session.evidence.find((ev) => ev.entityId === e.id && ev.role === "trigger")?.detail ??
      may6Session.evidence.find((ev) => ev.entityId === e.id)?.detail ??
      e.detector,
  })),
);
