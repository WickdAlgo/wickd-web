import { z } from "zod";
import { instrumentRef } from "./chart-scene";
import { decimal, identifier, utcInstant } from "./scalars";
import {
  signalEventType,
  tradeDirection,
  tradeSource,
  tradeStatus,
} from "./journal";

/**
 * Write inputs.
 *
 * Deliberately not the read shapes. A `TradeIdea` has an `id` the server
 * assigns; a `CreateTradeIdeaInput` does not. Reusing the read type for writes
 * is how a client ends up inventing identifiers, and how a server ends up
 * trusting them.
 *
 * **Nothing here accepts a computed value.** There is no `netR`, no `netPnl`,
 * no `grossR` — those are results, and results come from the domain layer in
 * `wickd-dotnet`. A capture form that posted them would make the browser the
 * source of truth for the numbers the journal exists to be honest about.
 */

/** Prices arrive as decimal strings for the same reason they leave as them. */
const priceOrZone = z
  .object({
    price: decimal.optional(),
    zoneLow: decimal.optional(),
    zoneHigh: decimal.optional(),
  })
  .refine((v) => v.price !== undefined || (v.zoneLow !== undefined && v.zoneHigh !== undefined), {
    message: "a level needs either a price or both zone bounds",
  })
  .refine(
    (v) =>
      v.zoneLow === undefined ||
      v.zoneHigh === undefined ||
      Number(v.zoneHigh) >= Number(v.zoneLow),
    { message: "zoneHigh must be greater than or equal to zoneLow", path: ["zoneHigh"] },
  );

export const createTradeLevelInput = z
  .object({
    role: z.enum(["entry", "stop", "target", "breakeven", "invalidation"]),
    ordinal: z.number().int().nonnegative().default(0),
    /** Omit to open the level at the trade's signal time. */
    validFromUtc: utcInstant.optional(),
  })
  .and(priceOrZone);
export type CreateTradeLevelInput = z.infer<typeof createTradeLevelInput>;

export const createTradeIdeaInput = z.object({
  instrument: instrumentRef,
  source: tradeSource,
  direction: tradeDirection,
  status: tradeStatus.default("planned"),
  signalTimeUtc: utcInstant,
  setupName: z.string().min(1).optional(),
  thesis: z.string().optional(),
  invalidationSummary: z.string().optional(),
  sourceReference: z.string().optional(),
  /** The plan, captured with the idea. Levels can also be appended later. */
  levels: z.array(createTradeLevelInput).default([]),
  /** Which inspection run's structures this thesis is argued against. */
  inspectionRunId: identifier.optional(),
});
export type CreateTradeIdeaInput = z.infer<typeof createTradeIdeaInput>;

export const appendSignalEventInput = z.object({
  type: signalEventType,
  messageTimeUtc: utcInstant,
  seenAtUtc: utcInstant.optional(),
  summary: z.string().min(1),
});
export type AppendSignalEventInput = z.infer<typeof appendSignalEventInput>;

/**
 * Moving a stop is not an update.
 *
 * It closes the level in force and opens a replacement at the same instant.
 * The server does both; the client says only "the stop is now X as of T".
 */
export const moveTradeLevelInput = z.object({
  role: z.enum(["entry", "stop", "target", "breakeven", "invalidation"]),
  ordinal: z.number().int().nonnegative().default(0),
  price: decimal,
  effectiveFromUtc: utcInstant,
  sourceSignalEventId: identifier.optional(),
});
export type MoveTradeLevelInput = z.infer<typeof moveTradeLevelInput>;

export const createExecutionInput = z.object({
  accountId: identifier,
  mode: z.enum(["live_copy", "paper", "shadow", "backtest"]),
  plannedRiskPct: decimal,
  plannedRiskAmount: decimal,
  openedAtUtc: utcInstant.optional(),
  /** What the signal source claimed. An input because it is reported, not derived. */
  mentorReportedR: decimal.optional(),
});
export type CreateExecutionInput = z.infer<typeof createExecutionInput>;

export const appendFillInput = z.object({
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
  signalEventId: identifier.optional(),
});
export type AppendFillInput = z.infer<typeof appendFillInput>;

export const saveTradeReviewInput = z.object({
  followedPlan: z.boolean(),
  summary: z.string().min(1),
  lesson: z.string().optional(),
  writtenAtUtc: utcInstant.optional(),
});
export type SaveTradeReviewInput = z.infer<typeof saveTradeReviewInput>;

/**
 * A screenshot, referenced rather than embedded.
 *
 * The mentor diary demonstrates why: its images are hotlinked to a third-party
 * host, so they consume someone else's bandwidth and vanish on link rot.
 * Uploads go to object storage and the journal keeps the key.
 */
export const attachScreenshotInput = z.object({
  role: z.enum(["before", "after", "annotation"]),
  /** Storage key, assigned by whatever accepted the upload. */
  storageKey: z.string().min(1),
  caption: z.string().optional(),
  capturedAtUtc: utcInstant.optional(),
});
export type AttachScreenshotInput = z.infer<typeof attachScreenshotInput>;
