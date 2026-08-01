import {
  compareStamp,
  epochMs,
  type InspectionCandle,
  type InspectionDatasetV1,
  type InspectionEntity,
  type InspectionLifecycleEvent,
  type InspectionPrimitive,
  type NormalizedFill,
  type NormalizedSignalEvent,
  type NormalizedTradeLevel,
  type Stamped,
  type StructureState,
  type TradeDetailV1,
} from "@/contracts";

/**
 * Causal filtering — the no-lookahead rule, as pure functions.
 *
 * No React, no DOM, no schema. Everything here is a function of its arguments,
 * because this is the one part of the platform that can be wrong without
 * looking wrong: a chart showing a structure four candles before it was
 * detectable renders perfectly and is a lie.
 *
 * All inputs are assumed sorted by `compareStamp`. The contract layer sorts at
 * parse time, so that assumption is a property of the gateway boundary rather
 * than something each caller re-establishes.
 */

export interface Cursor {
  readonly atUtcMs: number;
  readonly sequence: number;
}

/**
 * The cursor meaning "everything". Not a null check scattered through the
 * filters — an actual point after every fact, so Final view is just Causal view
 * at the end of time and there is only one code path to get wrong.
 */
export const FINAL_CURSOR: Cursor = {
  atUtcMs: Number.POSITIVE_INFINITY,
  sequence: Number.POSITIVE_INFINITY,
};

/**
 * Build a cursor from a timestamp.
 *
 * `sequence` defaults to positive infinity, so "as of 14:35" includes
 * everything that became known at 14:35 rather than an arbitrary prefix of it.
 * Pass an explicit sequence to step *within* one instant.
 *
 * Throws on an unparseable string rather than producing NaN — see `epochMs`.
 */
export function cursorFrom(
  asOfUtc: string | number | null | undefined,
  sequence: number = Number.POSITIVE_INFINITY,
): Cursor {
  if (asOfUtc === null || asOfUtc === undefined) return FINAL_CURSOR;
  if (typeof asOfUtc === "number") {
    if (!Number.isFinite(asOfUtc)) {
      throw new RangeError(`cursor must be a finite instant, got ${asOfUtc}`);
    }
    return { atUtcMs: asOfUtc, sequence };
  }
  return { atUtcMs: epochMs(asOfUtc), sequence };
}

export function isFinalCursor(cursor: Cursor): boolean {
  return cursor.atUtcMs === Number.POSITIVE_INFINITY;
}

/**
 * Is this fact knowable at the cursor?
 *
 * Inclusive on both fields: a fact stamped exactly at the cursor is visible.
 * The cursor names a moment that has happened, not one that is about to.
 */
export function isVisibleAt(stamp: Stamped, cursor: Cursor): boolean {
  return compareStamp(stamp, cursor) <= 0;
}

/**
 * How many leading elements of a sorted list are visible.
 *
 * Binary search rather than a filter: the replay cursor moves continuously
 * while a user drags it, and this runs against every array on every frame.
 */
export function visibleCount(sorted: readonly Stamped[], cursor: Cursor): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (compareStamp(sorted[mid], cursor) <= 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** The visible prefix of a sorted list. */
export function takeVisible<T extends Stamped>(
  sorted: readonly T[],
  cursor: Cursor,
): readonly T[] {
  return sorted.slice(0, visibleCount(sorted, cursor));
}

/**
 * Candles closed at or before the cursor, plus the one still forming.
 *
 * Visibility keys off **close** time, not open time. A candle whose high has
 * not printed yet is future information wearing a past timestamp — the single
 * most common way a replay leaks.
 */
export function filterCandlesAsOf(
  candles: readonly InspectionCandle[],
  cursor: Cursor,
  intervalMs: number,
): { closed: readonly InspectionCandle[]; forming: InspectionCandle | null } {
  if (isFinalCursor(cursor)) return { closed: candles, forming: null };

  let closedCount = 0;
  let hi = candles.length;
  while (closedCount < hi) {
    const mid = (closedCount + hi) >>> 1;
    if (candles[mid].atUtcMs + intervalMs <= cursor.atUtcMs) closedCount = mid + 1;
    else hi = mid;
  }

  const next = candles[closedCount];
  const forming =
    next !== undefined && next.atUtcMs <= cursor.atUtcMs ? next : null;
  return { closed: candles.slice(0, closedCount), forming };
}

/**
 * Structure entities with their state folded from lifecycle events.
 *
 * State is *derived here*, never read from the entity — the schema has no such
 * field. An entity mitigated at 14:55, viewed at 14:30, is `active`, and there
 * is no stored value that could have said otherwise.
 */
export interface ResolvedEntity extends InspectionEntity {
  readonly state: StructureState;
  readonly events: readonly InspectionLifecycleEvent[];
}

export function resolveEntitiesAsOf(
  entities: readonly InspectionEntity[],
  lifecycle: readonly InspectionLifecycleEvent[],
  cursor: Cursor,
): readonly ResolvedEntity[] {
  const visibleEntities = takeVisible(entities, cursor);
  const known = new Set(visibleEntities.map((e) => e.id));

  const byEntity = new Map<string, InspectionLifecycleEvent[]>();
  for (const event of takeVisible(lifecycle, cursor)) {
    // An event for an entity that is not yet knowable is dropped rather than
    // resurrecting it. Malformed input should narrow the view, never widen it.
    if (!known.has(event.entityId)) continue;
    const list = byEntity.get(event.entityId);
    if (list) list.push(event);
    else byEntity.set(event.entityId, [event]);
  }

  return visibleEntities.map((entity) => {
    const events = byEntity.get(entity.id) ?? [];
    let state: StructureState = "active";
    for (const event of events) {
      if (event.type === "mitigated") state = "mitigated";
      else if (event.type === "invalidated") state = "invalidated";
      else if (event.type === "expired") state = "expired";
    }
    return { ...entity, state, events };
  });
}

/**
 * Chart primitives visible at the cursor.
 *
 * Two conditions, not one: the primitive must have become visible, and must not
 * have stopped being visible. `visibleUntilUtc` is exclusive, matching level
 * validity below.
 */
export function filterPrimitivesAsOf(
  primitives: readonly InspectionPrimitive[],
  cursor: Cursor,
): readonly InspectionPrimitive[] {
  return takeVisible(primitives, cursor).filter(
    (p) => p.untilUtcMs === null || cursor.atUtcMs < p.untilUtcMs,
  );
}

/**
 * Trade levels valid at the cursor.
 *
 * Validity is half-open — `[validFrom, validUntil)`. That boundary choice is
 * what stops a stop-loss and its replacement from both appearing for one
 * instant at the moment of the update: the cursor at `validUntil` sees the new
 * level only.
 */
export function filterLevelsAsOf(
  levels: readonly NormalizedTradeLevel[],
  cursor: Cursor,
): readonly NormalizedTradeLevel[] {
  return levels.filter(
    (l) =>
      l.validFromMs <= cursor.atUtcMs &&
      (l.validUntilMs === null || cursor.atUtcMs < l.validUntilMs),
  );
}

/**
 * Fills visible at the cursor.
 *
 * A fill is also hidden when the signal that authorized it is not yet visible,
 * even if the fill's own timestamp has passed. Causality here is referential,
 * not only temporal — an execution that appears before its instruction reads as
 * prescience, and in a review that is the exact thing being audited.
 */
export function filterFillsAsOf(
  fills: readonly NormalizedFill[],
  visibleSignalIds: ReadonlySet<string>,
  cursor: Cursor,
): readonly NormalizedFill[] {
  return takeVisible(fills, cursor).filter(
    (f) => f.signalEventId === undefined || visibleSignalIds.has(f.signalEventId),
  );
}

export interface InspectionSlice {
  readonly cursor: Cursor;
  readonly isFinal: boolean;
  readonly candles: readonly InspectionCandle[];
  readonly formingCandle: InspectionCandle | null;
  readonly entities: readonly ResolvedEntity[];
  readonly lifecycle: readonly InspectionLifecycleEvent[];
  readonly layers: readonly {
    readonly id: string;
    readonly label: string;
    readonly z: "under" | "over";
    readonly defaultVisible: boolean;
    readonly primitives: readonly InspectionPrimitive[];
  }[];
}

/** The single entry point for inspection replay. */
export function sliceInspectionAsOf(
  dataset: InspectionDatasetV1,
  asOfUtc: string | number | null,
): InspectionSlice {
  const cursor = cursorFrom(asOfUtc);
  const { closed, forming } = filterCandlesAsOf(
    dataset.candles,
    cursor,
    dataset.run.intervalMs,
  );
  return {
    cursor,
    isFinal: isFinalCursor(cursor),
    candles: closed,
    formingCandle: forming,
    entities: resolveEntitiesAsOf(dataset.entities, dataset.lifecycle, cursor),
    lifecycle: takeVisible(dataset.lifecycle, cursor),
    layers: dataset.layers.map((layer) => ({
      id: layer.id,
      label: layer.label,
      z: layer.z,
      defaultVisible: layer.defaultVisible,
      primitives: filterPrimitivesAsOf(layer.primitives, cursor),
    })),
  };
}

export interface TradeSlice {
  readonly cursor: Cursor;
  readonly isFinal: boolean;
  readonly signals: readonly NormalizedSignalEvent[];
  readonly levels: readonly NormalizedTradeLevel[];
  readonly fills: readonly NormalizedFill[];
  /** Null until the execution has opened at or before the cursor. */
  readonly execution: TradeDetailV1["execution"];
  /** Null until the review was written at or before the cursor. */
  readonly review: TradeDetailV1["review"];
}

/** The single entry point for trade replay. */
export function sliceTradeAsOf(
  trade: TradeDetailV1,
  asOfUtc: string | number | null,
): TradeSlice {
  const cursor = cursorFrom(asOfUtc);
  const signals = takeVisible(trade.signals, cursor);
  const visibleSignalIds = new Set(signals.map((s) => s.id));

  const openedAt = trade.execution?.openedAtUtc;
  const executionVisible =
    trade.execution !== null &&
    (openedAt === undefined || epochMs(openedAt) <= cursor.atUtcMs);

  const reviewVisible =
    trade.review !== null && epochMs(trade.review.writtenAtUtc) <= cursor.atUtcMs;

  return {
    cursor,
    isFinal: isFinalCursor(cursor),
    signals,
    levels: filterLevelsAsOf(trade.levels, cursor),
    fills: filterFillsAsOf(trade.fills, visibleSignalIds, cursor),
    // The outcome fields — netR, netPnl — are part of the execution record, so
    // hiding it before it opens also hides the result. Showing a closed trade's
    // R while replaying its entry would give away the answer being reviewed.
    execution: executionVisible ? trade.execution : null,
    review: reviewVisible ? trade.review : null,
  };
}
