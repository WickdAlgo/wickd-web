import type { ChartCandle, InspectionPrimitive } from "@/contracts";
import { epochMs } from "@/contracts";

/**
 * The window an inspection should open on.
 *
 * Not the whole dataset. A 31-hour session of five-minute candles is 372 bars
 * across roughly 750px, which makes a single-candle order block about two
 * pixels wide and one pixel tall — accurate, and impossible to inspect. The
 * view opens on the structures instead, with room either side for context.
 *
 * Pure so the padding rule is testable without a chart.
 */
export function focusRangeForPrimitives(
  primitives: readonly InspectionPrimitive[],
  candles: readonly ChartCandle[],
  options: { paddingRatio?: number; minCandles?: number } = {},
): { fromUtc: string; toUtc: string } | null {
  if (candles.length === 0) return null;

  const { paddingRatio = 0.35, minCandles = 40 } = options;

  // Anchor on when each structure became knowable, not on how far it is drawn.
  // A swing leg spans the session low to the session high by definition, so
  // including geometry would always return the whole dataset.
  const times = primitives.map((p) => p.atUtcMs).sort((a, b) => a - b);
  if (times.length === 0) return null;

  const firstCandle = candles[0].openTimeUtc;
  const lastCandle = candles[candles.length - 1].openTimeUtc;
  const sessionFrom = epochMs(firstCandle);
  const sessionTo = epochMs(lastCandle);
  const intervalMs =
    candles.length > 1 ? epochMs(candles[1].openTimeUtc) - sessionFrom : 60_000;

  // The middle of the distribution rather than its extremes. One structure
  // detected early and one detected late would otherwise force the full-session
  // view that this function exists to avoid, and at that zoom nothing is
  // legible. Outliers stay reachable by panning.
  const from = percentile(times, 0.2);
  const to = percentile(times, 0.8);

  // Widen a narrow cluster so the structures are not flush against the edges.
  const span = Math.max(to - from, intervalMs * minCandles);
  const padding = span * paddingRatio;
  const centre = (from + to) / 2;
  const half = span / 2 + padding;

  // Never ask for a range the data does not cover; the time scale is pinned to
  // fixed edges and would otherwise show blank space.
  const start = Math.max(centre - half, sessionFrom);
  const end = Math.min(centre + half, sessionTo);
  if (end <= start) return { fromUtc: firstCandle, toUtc: lastCandle };

  return {
    fromUtc: new Date(start).toISOString(),
    toUtc: new Date(end).toISOString(),
  };
}

/** Linear-interpolated percentile of a sorted array. */
function percentile(sorted: readonly number[], q: number): number {
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}
