import { genCandles, type Candle } from "@/components/ui";
import type { ChartCandle } from "@/contracts";

/** 5 minutes, the timeframe every fixture in this directory uses. */
export const FIVE_MIN_MS = 5 * 60 * 1000;

/**
 * `genCandles` produces OHLC with no time — it was written for a brand
 * illustration where the x-axis is just an index. A real chart needs instants,
 * so the fixture supplies them.
 *
 * The generator stays untouched: it is deterministic by design ("same inputs,
 * same journal" is the product's claim, and the marketing routes render it at
 * build time), and this converter is additive.
 */
export function toChartCandles(
  candles: readonly Candle[],
  opts: { startUtcMs: number; intervalMs: number },
): ChartCandle[] {
  return candles.map((c, i) => ({
    openTimeUtc: new Date(opts.startUtcMs + i * opts.intervalMs).toISOString(),
    open: round2(c.o),
    high: round2(c.h),
    low: round2(c.l),
    close: round2(c.c),
  }));
}

/** Exchange-plausible precision. Raw generator output has 12 decimal places. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export { genCandles };
export type { Candle };
