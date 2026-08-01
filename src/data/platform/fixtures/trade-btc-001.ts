import { parseContract, tradeDetailV1, type TradeDetailV1 } from "@/contracts";
import { FIVE_MIN_MS } from "./candles";
import { may6Session, may6SessionMarks } from "./may6-session";

/**
 * One mentor trade on the `may6-session` run.
 *
 * Prices come from the same candles the inspection view renders, so the plan
 * lands on the structures it claims to be based on. A trade fixture with
 * invented prices would draw an entry zone floating somewhere off the price
 * action, which is exactly the bug this view exists to catch.
 *
 * The trade is deliberately *imperfect*: the mentor reported 3.2R, the user
 * actually netted 2.41R. Fees, two partial exits taken early, and a stop moved
 * to breakeven account for the difference. A fixture where both numbers agree
 * would make the comparison look decorative.
 */

const candles = may6Session.candles;
const marks = may6SessionMarks;

function closeAt(i: number): string {
  return new Date(Date.parse(candles[i].openTimeUtc) + FIVE_MIN_MS).toISOString();
}
/** Decimal string at exchange precision. Never a number — see `contracts/scalars`. */
function px(n: number): string {
  return n.toFixed(2);
}

/**
 * The plan is anchored to the structures it cites, not to clock times.
 *
 * The signal fires once the order block is confirmed — which is the moment the
 * evidence exists — and everything after is spaced relative to it, clamped so
 * the trade closes inside the session.
 */
function step(offset: number): number {
  return Math.min(marks.orderBlockConfirmedIndex + offset, candles.length - 1);
}

const I_SETUP = marks.orderBlockConfirmedIndex;
const I_ENTRY = step(3);
const I_STOP_UPDATE = step(11);
const I_TP1 = step(16);
const I_TP2 = step(28);
const I_EXIT = step(40);

const entryLow = marks.orderBlockLow;
const entryHigh = marks.orderBlockHigh;

/**
 * Filled inside the block, which is what the plan says to do.
 *
 * Using whatever price happened to print a few candles later put the fill far
 * above the zone during a fast move, which then placed the breakeven stop above
 * the entry and pushed the targets thousands of points beyond any price the
 * session reached.
 */
const entryFillPrice = round2((entryLow + entryHigh) / 2);
const initialStop = round2(entryLow - (entryHigh - entryLow) - 60);
const risk = entryFillPrice - initialStop;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const raw = {
  schemaVersion: 1,
  contract: "trade-detail",
  inspectionRunId: may6Session.run.runId,
  idea: {
    id: "trade-btc-001",
    instrument: { market: "BTC_USDT_PERP", timeframe: "5m" },
    source: "mentor",
    direction: "long",
    status: "closed",
    signalTimeUtc: closeAt(I_SETUP),
    setupName: "OB + FVG continuation",
    thesis:
      "Displacement out of a bullish order block left an unmitigated fair value gap above it. Long the block on the retrace, targeting the equal highs resting overhead.",
    invalidationSummary:
      "A five-minute body close below the order block invalidates the continuation read.",
    sourceReference: "signal-log/2026-05-06#14",
  },
  levels: [
    {
      id: "lvl-entry",
      tradeIdeaId: "trade-btc-001",
      role: "entry",
      ordinal: 0,
      zoneLow: px(entryLow),
      zoneHigh: px(entryHigh),
      validFromUtc: closeAt(I_SETUP),
      validUntilUtc: null,
      sourceSignalEventId: "sig-001",
    },
    {
      // The original stop. It is NOT rewritten when the stop moves — it closes.
      id: "lvl-stop-0",
      tradeIdeaId: "trade-btc-001",
      role: "stop",
      ordinal: 0,
      price: px(initialStop),
      validFromUtc: closeAt(I_SETUP),
      validUntilUtc: closeAt(I_STOP_UPDATE),
      sourceSignalEventId: "sig-001",
    },
    {
      // Its replacement, opening exactly where the first one closed.
      id: "lvl-stop-1",
      tradeIdeaId: "trade-btc-001",
      role: "stop",
      ordinal: 1,
      price: px(entryFillPrice),
      validFromUtc: closeAt(I_STOP_UPDATE),
      validUntilUtc: null,
      sourceSignalEventId: "sig-003",
    },
    {
      id: "lvl-tp-1",
      tradeIdeaId: "trade-btc-001",
      role: "target",
      ordinal: 1,
      price: px(entryFillPrice + risk * 1.5),
      validFromUtc: closeAt(I_SETUP),
      validUntilUtc: null,
      sourceSignalEventId: "sig-001",
    },
    {
      id: "lvl-tp-2",
      tradeIdeaId: "trade-btc-001",
      role: "target",
      ordinal: 2,
      price: px(entryFillPrice + risk * 3),
      validFromUtc: closeAt(I_SETUP),
      validUntilUtc: null,
      sourceSignalEventId: "sig-001",
    },
    {
      id: "lvl-tp-3",
      tradeIdeaId: "trade-btc-001",
      role: "target",
      ordinal: 3,
      price: px(entryFillPrice + risk * 4.5),
      validFromUtc: closeAt(I_SETUP),
      validUntilUtc: null,
      sourceSignalEventId: "sig-001",
    },
    {
      id: "lvl-invalidation",
      tradeIdeaId: "trade-btc-001",
      role: "invalidation",
      ordinal: 0,
      price: px(entryLow - 10),
      validFromUtc: closeAt(I_SETUP),
      validUntilUtc: null,
      sourceSignalEventId: "sig-001",
    },
  ],
  signals: [
    {
      id: "sig-001",
      tradeIdeaId: "trade-btc-001",
      type: "setup",
      messageTimeUtc: closeAt(I_SETUP),
      seenAtUtc: closeAt(I_SETUP),
      summary: `Long ${px(entryLow)}–${px(entryHigh)}, stop ${px(initialStop)}, three targets.`,
      sequence: 0,
    },
    {
      id: "sig-002",
      tradeIdeaId: "trade-btc-001",
      type: "entry",
      messageTimeUtc: closeAt(I_ENTRY),
      seenAtUtc: closeAt(I_ENTRY),
      summary: "Filled in the block.",
      sequence: 0,
    },
    {
      id: "sig-003",
      tradeIdeaId: "trade-btc-001",
      type: "move_stop_to_breakeven",
      messageTimeUtc: closeAt(I_STOP_UPDATE),
      seenAtUtc: closeAt(I_STOP_UPDATE),
      summary: "Stop to breakeven now that the FVG held.",
      sequence: 0,
    },
    {
      id: "sig-004",
      tradeIdeaId: "trade-btc-001",
      type: "partial_take_profit",
      messageTimeUtc: closeAt(I_TP1),
      seenAtUtc: closeAt(I_TP1),
      summary: "First target hit — taking a third off.",
      sequence: 0,
    },
    {
      id: "sig-005",
      tradeIdeaId: "trade-btc-001",
      type: "partial_take_profit",
      messageTimeUtc: closeAt(I_TP2),
      seenAtUtc: closeAt(I_TP2),
      summary: "Second target hit — another third off.",
      sequence: 0,
    },
    {
      id: "sig-006",
      tradeIdeaId: "trade-btc-001",
      type: "close",
      messageTimeUtc: closeAt(I_EXIT),
      seenAtUtc: closeAt(I_EXIT),
      summary: "Momentum stalling into the range high — closing the balance.",
      sequence: 0,
    },
  ],
  execution: {
    id: "exec-btc-001",
    tradeIdeaId: "trade-btc-001",
    accountId: "acct-main",
    mode: "live_copy",
    status: "closed",
    openedAtUtc: closeAt(I_ENTRY),
    closedAtUtc: closeAt(I_EXIT),
    plannedRiskPct: "0.75",
    plannedRiskAmount: "187.50",
    // Reported by the signal source. Kept beside, never merged with, netR.
    mentorReportedR: "3.20",
    grossPnl: "471.60",
    netPnl: "451.88",
    grossR: "2.52",
    // What the account actually saw, after fees.
    netR: "2.41",
  },
  fills: [
    {
      id: "fill-001",
      executionId: "exec-btc-001",
      signalEventId: "sig-002",
      role: "entry",
      side: "buy",
      price: px(entryFillPrice),
      quantity: "0.350",
      feeAmount: "7.88",
      feeAsset: "USDT",
      filledAtUtc: closeAt(I_ENTRY),
      sequence: 0,
    },
    {
      id: "fill-002",
      executionId: "exec-btc-001",
      signalEventId: "sig-004",
      role: "partial_exit",
      side: "sell",
      price: px(entryFillPrice + risk * 1.5),
      quantity: "0.120",
      feeAmount: "2.74",
      feeAsset: "USDT",
      filledAtUtc: closeAt(I_TP1),
      sequence: 0,
    },
    {
      id: "fill-003",
      executionId: "exec-btc-001",
      signalEventId: "sig-005",
      role: "partial_exit",
      side: "sell",
      price: px(entryFillPrice + risk * 3),
      quantity: "0.115",
      feeAmount: "2.68",
      feeAsset: "USDT",
      filledAtUtc: closeAt(I_TP2),
      sequence: 0,
    },
    {
      id: "fill-004",
      executionId: "exec-btc-001",
      signalEventId: "sig-006",
      role: "manual_exit",
      side: "sell",
      price: px(entryFillPrice + risk * 2.2),
      quantity: "0.115",
      feeAmount: "2.62",
      feeAsset: "USDT",
      filledAtUtc: closeAt(I_EXIT),
      sequence: 0,
    },
  ],
  evidenceLinks: [
    {
      id: "link-001",
      tradeIdeaId: "trade-btc-001",
      inspectionRunId: may6Session.run.runId,
      inspectionEntityId: "ob-018",
      role: "entry_evidence",
      note: "The block the entry zone is drawn from.",
    },
    {
      id: "link-002",
      tradeIdeaId: "trade-btc-001",
      inspectionRunId: may6Session.run.runId,
      inspectionEntityId: "fvg-042",
      role: "confirmation_evidence",
      note: "Displacement gap above the block.",
    },
    {
      id: "link-003",
      tradeIdeaId: "trade-btc-001",
      inspectionRunId: may6Session.run.runId,
      inspectionEntityId: "swing-lo-001",
      role: "bias_evidence",
      note: "Higher low off the session low set the direction.",
    },
    {
      id: "link-004",
      tradeIdeaId: "trade-btc-001",
      inspectionRunId: may6Session.run.runId,
      inspectionEntityId: "eqh-001",
      role: "liquidity_target",
      note: "The pool the upper targets sit under.",
    },
  ],
  strategyMatches: [
    {
      id: "match-001",
      tradeIdeaId: "trade-btc-001",
      modelName: "wickd/ob-continuation-v2",
      status: "partial",
      score: 0.78,
      note: "Entry and invalidation match the model; the manual exit does not.",
    },
  ],
  review: {
    tradeIdeaId: "trade-btc-001",
    writtenAtUtc: "2026-05-07T08:15:00Z",
    followedPlan: false,
    summary:
      "Thesis and entry were correct. The balance was closed by hand at 2.2R instead of being left for the third target, which is where the gap to the reported 3.2R comes from.",
    lesson:
      "The exit was a reaction to a stalling candle, not to anything in the plan. The plan had no discretionary-exit rule, so there was nothing to follow.",
  },
};

export const tradeBtc001: TradeDetailV1 = parseContract(
  "TradeDetail",
  tradeDetailV1,
  raw,
);
