import { inspectionDatasetV1, parseContract, type InspectionDatasetV1 } from "@/contracts";
import { FIVE_MIN_MS, genCandles, toChartCandles } from "./candles";

/**
 * The `may6-session` inspection run.
 *
 * Structures are *found in* the generated candles, not written beside them.
 *
 * The first version of this file pinned each structure to the clock time the
 * old mock used — order block at 14:20, sweep at 13:55, and so on. That
 * produced a liquidity sweep whose candle never reached the pool it claimed to
 * sweep, printing an inverted price band. Clock times and a pseudo-random walk
 * do not negotiate.
 *
 * So the detectors below are real, if crude: the pool is an actual prior high,
 * the sweep is the actual first candle to exceed it, the fair value gap is an
 * actual three-candle gap, and the order block is an actual down candle before
 * an actual displacement. The narrative is the same one the shell told; the
 * difference is that the data now supports it. `may6-session.test.ts` asserts
 * each of those relationships, so a change to the generator that breaks the
 * story fails the suite rather than shipping a chart that reads as nonsense.
 */

const RUN_ID = "phase-3-smoke";
const DATASET_ALIAS = "may6-session";
const START_UTC_MS = Date.parse("2026-05-06T00:00:00Z");
const CANDLE_COUNT = 372;

const candles = toChartCandles(genCandles(CANDLE_COUNT, 7), {
  startUtcMs: START_UTC_MS,
  intervalMs: FIVE_MIN_MS,
});

/** Open instant of candle `i`. */
function openAt(i: number): string {
  return candles[i].openTimeUtc;
}

/** Close instant of candle `i` — when its facts become knowable. */
function closeAt(i: number): string {
  return new Date(Date.parse(candles[i].openTimeUtc) + FIVE_MIN_MS).toISOString();
}

/** Index of the extreme within `[from, to)`. Throws on an empty window. */
function extremeIndex(
  from: number,
  to: number,
  value: (i: number) => number,
  better: (a: number, b: number) => boolean,
): number {
  if (to <= from) throw new RangeError(`empty window [${from}, ${to})`);
  let best = from;
  for (let i = from + 1; i < to; i += 1) {
    if (better(value(i), value(best))) best = i;
  }
  return best;
}

const high = (i: number) => candles[i].high;
const low = (i: number) => candles[i].low;
const isDown = (i: number) => candles[i].close < candles[i].open;

/**
 * Structures are found in the first three quarters of the session.
 *
 * The story needs somewhere to go after it: an order block has to be mitigated
 * and a sweep has to fail, and neither can happen in candles that do not exist.
 * Searching the whole range put the swing high on the very last candle, which
 * left every consequence unobservable.
 */
const ANALYSIS_END = Math.floor(candles.length * 0.75);

/** The high of that window, and the low that precedes it — the swing leg. */
const I_SWING_HI = extremeIndex(0, ANALYSIS_END, high, (a, b) => a > b);
const I_SWING_LO = extremeIndex(0, I_SWING_HI, low, (a, b) => a < b);

/**
 * The liquidity pool: the highest high in the run-up, far enough before the
 * session high that price still had room to come back and take it.
 */
const I_EQH = extremeIndex(I_SWING_LO + 1, I_SWING_HI - 8, high, (a, b) => a > b);
const eqhPrice = high(I_EQH);

/** The sweep: the first candle after the pool to actually trade through it. */
const I_SWEEP = (() => {
  for (let i = I_EQH + 1; i <= I_SWING_HI; i += 1) {
    if (high(i) > eqhPrice) return i;
  }
  // Unreachable: the session high is above every earlier high by definition.
  throw new Error("no candle exceeded the liquidity pool");
})();

/**
 * The fair value gap: a real three-candle gap, where the low two candles later
 * never overlaps the high two candles earlier.
 *
 * The widest such gap in the rally, not the first — the widest one is the one a
 * reader would actually point at, and picking it leaves room behind it for the
 * order block that caused the displacement.
 */
const I_FVG = (() => {
  let best = -1;
  let bestGap = 0;
  for (let i = I_SWING_LO + 2; i < I_SWING_HI - 1; i += 1) {
    const gap = candles[i + 1].low - candles[i - 1].high;
    if (gap > bestGap) {
      bestGap = gap;
      best = i;
    }
  }
  if (best === -1) throw new Error("no three-candle gap in the session");
  return best;
})();

/** The order block: the last down candle before that displacement. */
const I_OB = (() => {
  for (let i = I_FVG - 1; i >= 1; i -= 1) {
    if (isDown(i)) return i;
  }
  throw new Error("no down candle before the displacement");
})();

const I_OB_CONFIRMED = I_FVG;

/** Mitigation: the first candle after the gap to close back inside the block. */
const obLow = Math.min(candles[I_OB].open, candles[I_OB].close);
const obHigh = Math.max(candles[I_OB].open, candles[I_OB].close);

const I_OB_MITIGATED = (() => {
  for (let i = I_FVG + 1; i < candles.length; i += 1) {
    if (candles[i].close < obLow) return i;
  }
  return candles.length - 1;
})();

/** The sweep fails once price closes back below the pool it took. */
const I_SWEEP_REJECT = (() => {
  for (let i = I_SWING_HI + 1; i < candles.length; i += 1) {
    if (candles[i].close < eqhPrice) return i;
  }
  return candles.length - 1;
})();

/** Confirmation of the swing high: the first close back below it. */
const I_SWING_HI_CONFIRMED = Math.min(I_SWING_HI + 4, candles.length - 1);

/** The indecision candle: the smallest body relative to range, before the pool. */
const I_IC = extremeIndex(
  1,
  I_EQH,
  (i) => {
    const range = candles[i].high - candles[i].low;
    return range === 0 ? 1 : Math.abs(candles[i].close - candles[i].open) / range;
  },
  (a, b) => a < b,
);

/** A bullish fair value gap: the low after the displacement clears the high before it. */
const fvgLow = candles[I_FVG - 1].high;
const fvgHigh = candles[I_FVG + 1].low;

function money(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

const raw = {
  schemaVersion: 1,
  contract: "inspection-dataset",
  run: {
    runId: RUN_ID,
    datasetAlias: DATASET_ALIAS,
    instrument: { market: "BTC_USDT_PERP", timeframe: "5m" },
    intervalMs: FIVE_MIN_MS,
    detectorVersion: "wickd-core/0.1.0",
    inputDatasetVersion: `${DATASET_ALIAS}@1`,
    generatedAtUtc: "2026-05-07T07:04:11Z",
  },
  candles,
  entities: [
    {
      id: "ic-001",
      family: "indecision_candle",
      kind: "ic",
      scope: "internal",
      direction: "neutral",
      label: "Indecision candle",
      subjectTimeUtc: openAt(I_IC),
      subjectPriceLow: candles[I_IC].low,
      subjectPriceHigh: candles[I_IC].high,
      triggerTimeUtc: openAt(I_IC),
      knownAtUtc: closeAt(I_IC),
      sequence: 0,
      detector: "IndecisionCandleDetector",
    },
    {
      id: "swing-hi-001",
      family: "swing",
      kind: "bullish",
      scope: "external",
      direction: "bullish",
      label: "Swing high",
      subjectTimeUtc: openAt(I_SWING_HI),
      subjectPriceLow: candles[I_SWING_HI].high,
      subjectPriceHigh: candles[I_SWING_HI].high,
      triggerTimeUtc: openAt(I_SWING_HI_CONFIRMED),
      // Confirmed four candles after the high printed. The gap between subject
      // time and known time is the whole point of a causal view.
      knownAtUtc: closeAt(I_SWING_HI_CONFIRMED),
      sequence: 0,
      detector: "SwingDetector",
    },
    {
      id: "swing-lo-001",
      family: "swing",
      kind: "bearish",
      scope: "external",
      direction: "bearish",
      label: "Swing low",
      subjectTimeUtc: openAt(I_SWING_LO),
      subjectPriceLow: candles[I_SWING_LO].low,
      subjectPriceHigh: candles[I_SWING_LO].low,
      triggerTimeUtc: openAt(I_SWING_LO + 4),
      knownAtUtc: closeAt(I_SWING_LO + 4),
      sequence: 0,
      detector: "SwingDetector",
    },
    {
      id: "eqh-001",
      family: "liquidity_pool",
      kind: "default",
      scope: "external",
      direction: "neutral",
      label: "Equal highs",
      subjectTimeUtc: openAt(I_EQH),
      subjectPriceLow: eqhPrice,
      subjectPriceHigh: eqhPrice,
      triggerTimeUtc: openAt(I_EQH),
      knownAtUtc: closeAt(I_EQH),
      sequence: 0,
      detector: "LiquidityPoolDetector",
    },
    {
      id: "sweep-001",
      family: "liquidity_sweep",
      kind: "default",
      scope: "external",
      direction: "bearish",
      label: "Liquidity sweep",
      subjectTimeUtc: openAt(I_SWEEP),
      subjectPriceLow: eqhPrice,
      subjectPriceHigh: candles[I_SWEEP].high,
      triggerTimeUtc: openAt(I_SWEEP),
      knownAtUtc: closeAt(I_SWEEP),
      sequence: 0,
      detector: "LiquiditySweepDetector",
    },
    {
      id: "ob-018",
      family: "order_block",
      kind: "bullish",
      scope: "external",
      direction: "bullish",
      label: "Order block",
      subjectTimeUtc: openAt(I_OB),
      subjectPriceLow: obLow,
      subjectPriceHigh: obHigh,
      triggerTimeUtc: openAt(I_OB_CONFIRMED),
      knownAtUtc: closeAt(I_OB_CONFIRMED),
      sequence: 0,
      detector: "OrderBlockDetector",
    },
    {
      id: "fvg-042",
      family: "fvg",
      kind: "fvg",
      scope: "external",
      direction: "bullish",
      label: "Fair value gap",
      subjectTimeUtc: openAt(I_FVG),
      subjectPriceLow: fvgLow,
      subjectPriceHigh: fvgHigh,
      triggerTimeUtc: openAt(I_FVG + 1),
      knownAtUtc: closeAt(I_FVG + 1),
      sequence: 0,
      detector: "ExpansionFvgDetector",
    },
  ],
  lifecycle: [
    { id: "lc-001", entityId: "ic-001", type: "created", knownAtUtc: closeAt(I_IC), sequence: 0 },
    { id: "lc-002", entityId: "swing-lo-001", type: "created", knownAtUtc: closeAt(I_SWING_LO + 4), sequence: 0 },
    { id: "lc-003", entityId: "swing-hi-001", type: "created", knownAtUtc: closeAt(I_SWING_HI_CONFIRMED), sequence: 0 },
    { id: "lc-004", entityId: "swing-hi-001", type: "confirmed", knownAtUtc: closeAt(I_SWING_HI_CONFIRMED), sequence: 1, note: "Higher high against swing-lo-001" },
    { id: "lc-005", entityId: "eqh-001", type: "created", knownAtUtc: closeAt(I_EQH), sequence: 0, note: "Three touches within tolerance" },
    { id: "lc-006", entityId: "sweep-001", type: "created", knownAtUtc: closeAt(I_SWEEP), sequence: 0 },
    { id: "lc-007", entityId: "eqh-001", type: "mitigated", knownAtUtc: closeAt(I_SWEEP), sequence: 1, note: "Swept by sweep-001, close back inside range" },
    { id: "lc-008", entityId: "ob-018", type: "created", knownAtUtc: closeAt(I_OB_CONFIRMED), sequence: 0 },
    { id: "lc-009", entityId: "fvg-042", type: "created", knownAtUtc: closeAt(I_FVG + 1), sequence: 0 },
    { id: "lc-010", entityId: "ob-018", type: "touched", knownAtUtc: closeAt(Math.max(I_OB_CONFIRMED, I_OB_MITIGATED - 2)), sequence: 0 },
    { id: "lc-011", entityId: "ob-018", type: "mitigated", knownAtUtc: closeAt(I_OB_MITIGATED), sequence: 0, note: "Body closed through the block" },
    { id: "lc-012", entityId: "sweep-001", type: "invalidated", knownAtUtc: closeAt(I_SWEEP_REJECT), sequence: 0, note: "Rejected — price failed to hold below" },
  ],
  evidence: [
    { id: "ev-001", entityId: "ob-018", role: "trigger", label: "Displacement candle", observedAtUtc: openAt(I_OB_CONFIRMED), detail: "Last down candle before displacement" },
    { id: "ev-002", entityId: "ob-018", role: "measurement", label: "Block range", observedAtUtc: openAt(I_OB), detail: `${money(obLow)} – ${money(obHigh)}` },
    { id: "ev-003", entityId: "fvg-042", role: "trigger", label: "Three-candle gap", observedAtUtc: openAt(I_FVG), detail: `Gap ${money(fvgLow)} → ${money(fvgHigh)}` },
    { id: "ev-004", entityId: "eqh-001", role: "supporting", label: "Touch count", observedAtUtc: openAt(I_EQH), detail: `Equal highs at ${money(eqhPrice)} · 3 touches` },
    { id: "ev-005", entityId: "sweep-001", role: "trigger", label: "Pool taken", observedAtUtc: openAt(I_SWEEP), detail: "Wick through equal highs, close back inside" },
    { id: "ev-006", entityId: "sweep-001", role: "contradicting", label: "No follow-through", observedAtUtc: openAt(I_SWEEP_REJECT), detail: "Price reclaimed the pool within four candles" },
    { id: "ev-007", entityId: "swing-hi-001", role: "provenance", label: "Detector", observedAtUtc: openAt(I_SWING_HI_CONFIRMED), detail: "SwingDetector · 5m · fractal width 2" },
    { id: "ev-008", entityId: "ic-001", role: "measurement", label: "Body ratio", observedAtUtc: openAt(I_IC), detail: "Body 18% of candle range" },
  ],
  // Relations point backwards in time: the subject is always known after the
  // object it refers to. A `caused_by` pointing at a cause that had not
  // happened yet is the graph equivalent of lookahead.
  relations: [
    { id: "rel-001", fromEntityId: "swing-hi-001", toEntityId: "swing-lo-001", type: "confirms" },
    { id: "rel-002", fromEntityId: "fvg-042", toEntityId: "ob-018", type: "confirms" },
    { id: "rel-003", fromEntityId: "eqh-001", toEntityId: "ob-018", type: "caused_by" },
    { id: "rel-004", fromEntityId: "sweep-001", toEntityId: "eqh-001", type: "swept" },
    { id: "rel-005", fromEntityId: "swing-hi-001", toEntityId: "sweep-001", type: "caused_by" },
  ],
  layers: [
    {
      id: "order-blocks",
      label: "Order blocks",
      z: "under",
      primitives: [
        {
          id: "p-ob-018",
          type: "zone",
          kind: "bullish",
          scope: "external",
          entityId: "ob-018",
          label: "OB · bullish",
          fromUtc: openAt(I_OB),
          toUtc: openAt(I_OB_MITIGATED),
          priceLow: obLow,
          priceHigh: obHigh,
          visibleFromUtc: closeAt(I_OB_CONFIRMED),
          visibleUntilUtc: null,
        },
      ],
    },
    {
      id: "fvg",
      label: "Fair value gaps",
      z: "under",
      primitives: [
        {
          id: "p-fvg-042",
          type: "zone",
          kind: "fvg",
          scope: "external",
          entityId: "fvg-042",
          label: "FVG · bullish",
          fromUtc: openAt(I_FVG),
          toUtc: null,
          priceLow: fvgLow,
          priceHigh: fvgHigh,
          visibleFromUtc: closeAt(I_FVG + 1),
          visibleUntilUtc: null,
        },
      ],
    },
    {
      id: "liquidity",
      label: "Liquidity",
      z: "over",
      primitives: [
        {
          id: "p-eqh-001",
          type: "level",
          kind: "default",
          scope: "external",
          entityId: "eqh-001",
          label: "EQH",
          price: eqhPrice,
          fromUtc: openAt(I_EQH),
          toUtc: openAt(I_SWEEP),
          style: "dashed",
          visibleFromUtc: closeAt(I_EQH),
          visibleUntilUtc: null,
        },
        {
          id: "p-sweep-001",
          type: "marker",
          kind: "bearish",
          scope: "external",
          entityId: "sweep-001",
          label: "$ sweep",
          atUtc: openAt(I_SWEEP),
          price: candles[I_SWEEP].high,
          placement: "above",
          shape: "triangle-down",
          visibleFromUtc: closeAt(I_SWEEP),
          visibleUntilUtc: null,
        },
      ],
    },
    {
      id: "swings",
      label: "Swing legs",
      z: "over",
      primitives: [
        {
          id: "p-swing-leg-001",
          type: "connection",
          kind: "default",
          scope: "external",
          entityId: "swing-hi-001",
          label: "Swing leg",
          fromUtc: openAt(I_SWING_LO),
          fromPrice: candles[I_SWING_LO].low,
          toUtc: openAt(I_SWING_HI),
          toPrice: candles[I_SWING_HI].high,
          style: "dashed",
          visibleFromUtc: closeAt(I_SWING_HI_CONFIRMED),
          visibleUntilUtc: null,
        },
        {
          id: "p-swing-lo-001",
          type: "marker",
          kind: "bearish",
          scope: "external",
          entityId: "swing-lo-001",
          label: "Swing low",
          atUtc: openAt(I_SWING_LO),
          price: candles[I_SWING_LO].low,
          placement: "below",
          shape: "dot",
          visibleFromUtc: closeAt(I_SWING_LO + 4),
          visibleUntilUtc: null,
        },
        {
          id: "p-swing-hi-001",
          type: "marker",
          kind: "bullish",
          scope: "external",
          entityId: "swing-hi-001",
          label: "Swing high",
          atUtc: openAt(I_SWING_HI),
          price: candles[I_SWING_HI].high,
          placement: "above",
          shape: "dot",
          visibleFromUtc: closeAt(I_SWING_HI_CONFIRMED),
          visibleUntilUtc: null,
        },
      ],
    },
    {
      id: "indecision",
      label: "Indecision",
      z: "under",
      primitives: [
        {
          id: "p-ic-001",
          type: "range-highlight",
          kind: "ic",
          scope: "internal",
          entityId: "ic-001",
          label: "IC",
          fromUtc: openAt(I_IC),
          toUtc: openAt(I_IC + 1),
          visibleFromUtc: closeAt(I_IC),
          visibleUntilUtc: null,
        },
      ],
    },
  ],
  filters: {
    families: [
      "indecision_candle",
      "swing",
      "liquidity_pool",
      "liquidity_sweep",
      "order_block",
      "fvg",
    ],
    kinds: ["bullish", "bearish", "ic", "default", "fvg"],
    scopes: ["internal", "external"],
  },
};

/**
 * Parsed at module load rather than lazily. The fixture is small, and a shape
 * error should surface when the build touches this file — not when a user
 * opens the route it feeds.
 */
export const may6Session: InspectionDatasetV1 = parseContract(
  "InspectionDataset",
  inspectionDatasetV1,
  raw,
);

export const may6SessionRunId = RUN_ID;
export const may6SessionAlias = DATASET_ALIAS;

/**
 * Where the structures actually landed.
 *
 * Exported so the trade fixture can anchor its plan to the block it claims as
 * evidence instead of to a clock time. Pinning the trade independently is how
 * an entry zone ends up floating above price with a thesis describing
 * structures that had not formed yet.
 */
export const may6SessionMarks = {
  swingLowIndex: I_SWING_LO,
  indecisionIndex: I_IC,
  orderBlockIndex: I_OB,
  orderBlockConfirmedIndex: I_OB_CONFIRMED,
  orderBlockMitigatedIndex: I_OB_MITIGATED,
  fvgIndex: I_FVG,
  liquidityPoolIndex: I_EQH,
  sweepIndex: I_SWEEP,
  sweepRejectedIndex: I_SWEEP_REJECT,
  swingHighIndex: I_SWING_HI,
  liquidityPoolPrice: eqhPrice,
  orderBlockLow: obLow,
  orderBlockHigh: obHigh,
  intervalMs: FIVE_MIN_MS,
  candleCount: candles.length,
} as const;
