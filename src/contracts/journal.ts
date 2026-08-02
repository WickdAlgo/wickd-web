import { z } from "zod";
import { instrumentRef } from "./chart-scene";
import {
  decimal,
  entityId,
  epochMs,
  identifier,
  sequence,
  utcInstant,
} from "./scalars";
import { compareStamp } from "./stamp";
import { versioned } from "./version";

/**
 * The trade journal.
 *
 * Every monetary and quantity value here is a decimal string, and none of it is
 * computed in this repository. A platform backend in `wickd-dotnet` will own
 * the arithmetic; until it exists, the fixture states the results. Rendering a
 * number the frontend derived would make the journal's totals a property of
 * whichever component ran last.
 */

export const tradeSource = z.enum([
  "mentor",
  "self",
  "wickd_core",
  "wickd_ai",
  "external",
]);
export const tradeDirection = z.enum(["long", "short"]);
export const tradeStatus = z.enum([
  "draft",
  "planned",
  "active",
  "triggered",
  "cancelled",
  "expired",
  "closed",
]);

export const tradeIdea = z.object({
  id: identifier,
  instrument: instrumentRef,
  source: tradeSource,
  direction: tradeDirection,
  status: tradeStatus,
  signalTimeUtc: utcInstant,
  setupName: z.string().optional(),
  thesis: z.string().optional(),
  invalidationSummary: z.string().optional(),
  /** Where the signal came from. Never a link to private mentor content. */
  sourceReference: z.string().optional(),
});
export type TradeIdea = z.infer<typeof tradeIdea>;

/**
 * A time-valid level.
 *
 * Levels are intervals, not snapshots. When a stop moves, the old level's
 * `validUntilUtc` closes at the update time and a new level opens there — the
 * old row is never rewritten. Overwriting it would make the chart unable to
 * answer "where was the stop when this fill happened?", which is most of what
 * a review is for.
 *
 * Validity is half-open: `[validFromUtc, validUntilUtc)`. A cursor exactly at
 * `validUntilUtc` sees the replacement, not the level being replaced, so the
 * two never both appear.
 */
export const tradeLevel = z.object({
  id: identifier,
  tradeIdeaId: identifier,
  role: z.enum(["entry", "stop", "target", "breakeven", "invalidation"]),
  ordinal: z.number().int().nonnegative().default(0),
  price: decimal.optional(),
  zoneLow: decimal.optional(),
  zoneHigh: decimal.optional(),
  validFromUtc: utcInstant,
  validUntilUtc: utcInstant.nullable().default(null),
  sourceSignalEventId: identifier.optional(),
});
export type TradeLevel = z.infer<typeof tradeLevel>;

export const signalEventType = z.enum([
  "setup",
  "entry",
  "entry_update",
  "stop_update",
  "target_update",
  "partial_take_profit",
  "move_stop_to_breakeven",
  "close",
  "cancel",
  "commentary",
]);

export const signalEvent = z.object({
  id: identifier,
  tradeIdeaId: identifier,
  type: signalEventType,
  messageTimeUtc: utcInstant,
  seenAtUtc: utcInstant.optional(),
  summary: z.string().min(1),
  sequence: sequence.default(0),
});
export type SignalEvent = z.infer<typeof signalEvent>;

export const execution = z.object({
  id: identifier,
  tradeIdeaId: identifier,
  accountId: identifier,
  mode: z.enum(["live_copy", "paper", "shadow", "backtest"]),
  status: z.enum([
    "planned",
    "open",
    "partially_closed",
    "closed",
    "cancelled",
    "missed",
    "skipped",
  ]),
  openedAtUtc: utcInstant.optional(),
  closedAtUtc: utcInstant.optional(),
  plannedRiskPct: decimal,
  plannedRiskAmount: decimal,
  /**
   * What the signal source claimed. Kept separate from `netR` on purpose —
   * they are different numbers, and collapsing them hides exactly the gap a
   * review exists to find.
   */
  mentorReportedR: decimal.optional(),
  grossPnl: decimal.optional(),
  netPnl: decimal.optional(),
  grossR: decimal.optional(),
  /** What the user actually got, after fees and slippage. */
  netR: decimal.optional(),
});
export type Execution = z.infer<typeof execution>;

export const fill = z.object({
  id: identifier,
  executionId: identifier,
  /** The signal that authorized this fill, when there was one. */
  signalEventId: identifier.optional(),
  role: z.enum([
    "entry",
    "entry_add",
    "partial_exit",
    "take_profit",
    "stop",
    "manual_exit",
    "liquidation",
  ]),
  side: z.enum(["buy", "sell"]),
  price: decimal,
  quantity: decimal,
  feeAmount: decimal.optional(),
  feeAsset: z.string().optional(),
  filledAtUtc: utcInstant,
  sequence: sequence.default(0),
});
export type Fill = z.infer<typeof fill>;

/** Links a thesis to the structures that support it. */
export const tradeEvidenceLink = z.object({
  id: identifier,
  tradeIdeaId: identifier,
  inspectionRunId: identifier,
  inspectionEntityId: entityId,
  role: z.enum([
    "bias_evidence",
    "entry_evidence",
    "confirmation_evidence",
    "invalidation_evidence",
    "target_evidence",
    "liquidity_target",
  ]),
  note: z.string().optional(),
});
export type TradeEvidenceLink = z.infer<typeof tradeEvidenceLink>;

export const strategyMatch = z.object({
  id: identifier,
  tradeIdeaId: identifier,
  modelName: z.string().min(1),
  status: z.enum(["matched", "partial", "unmatched", "not_evaluated"]),
  score: z.number().min(0).max(1).optional(),
  note: z.string().optional(),
});
export type StrategyMatch = z.infer<typeof strategyMatch>;

export const tradeReview = z.object({
  tradeIdeaId: identifier,
  writtenAtUtc: utcInstant,
  followedPlan: z.boolean(),
  summary: z.string().min(1),
  lesson: z.string().optional(),
});
export type TradeReview = z.infer<typeof tradeReview>;

const tradeDetailShape = versioned.extend({
  contract: z.literal("trade-detail"),
  idea: tradeIdea,
  levels: z.array(tradeLevel),
  signals: z.array(signalEvent),
  execution: execution.nullable().default(null),
  fills: z.array(fill),
  evidenceLinks: z.array(tradeEvidenceLink),
  strategyMatches: z.array(strategyMatch),
  review: tradeReview.nullable().default(null),
  /** The inspection run whose structures this trade is reviewed against. */
  inspectionRunId: identifier,
});

/** Same normalization contract as the inspection dataset: stamp, then sort. */
export const tradeDetailV1 = tradeDetailShape.transform((d) => ({
  ...d,
  signals: d.signals
    .map((s) => ({ ...s, atUtcMs: epochMs(s.messageTimeUtc) }))
    .sort(compareStamp),
  fills: d.fills
    .map((f) => ({ ...f, atUtcMs: epochMs(f.filledAtUtc) }))
    .sort(compareStamp),
  levels: d.levels.map((l) => ({
    ...l,
    validFromMs: epochMs(l.validFromUtc),
    validUntilMs: l.validUntilUtc === null ? null : epochMs(l.validUntilUtc),
  })),
}));

export type TradeDetailV1 = z.infer<typeof tradeDetailV1>;
export type NormalizedTradeLevel = TradeDetailV1["levels"][number];
export type NormalizedSignalEvent = TradeDetailV1["signals"][number];
export type NormalizedFill = TradeDetailV1["fills"][number];

/** Row shape for the journal list. Summary only — no levels, no fills. */
export const tradeSummary = z.object({
  id: identifier,
  instrument: instrumentRef,
  source: tradeSource,
  direction: tradeDirection,
  status: tradeStatus,
  signalTimeUtc: utcInstant,
  setupName: z.string().optional(),
  mentorReportedR: decimal.optional(),
  netR: decimal.optional(),
});
export type TradeSummary = z.infer<typeof tradeSummary>;
