/**
 * The seam between the chart library and everything drawn on top of it.
 *
 * Pure: no DOM, no chart library, no React. Overlay geometry is therefore
 * assertable in jsdom, which returns `null` from `getContext` and cannot
 * exercise a canvas at all.
 *
 * The map is linear in both axes. That is exact rather than approximate for
 * this chart: candles are uniformly spaced in time, and the price scale is
 * pinned to linear mode. It means the hot path does no per-primitive chart
 * library calls — the library is read twice per frame for the visible ranges,
 * and everything else is arithmetic.
 */

export interface Projection {
  /** Time -> px. `null` outside the visible range. */
  x(timeUtcMs: number): number | null;
  /** Time -> px, clamped into the pane. Never null. */
  xClamped(timeUtcMs: number): number;
  /** Price -> px, measured from the top. `null` outside the visible range. */
  y(price: number): number | null;
  /** Price -> px, clamped into the pane. Never null. */
  yClamped(price: number): number;
  /**
   * Unclamped coordinates, which may fall outside the pane.
   *
   * Needed by anything diagonal. Clamping only the x of a sloped line moves one
   * endpoint horizontally while leaving its price where it was, which changes
   * the slope — a swing leg running off the left edge would render at the wrong
   * angle. Let the SVG viewport clip instead; it clips along the true line.
   */
  xRaw(timeUtcMs: number): number;
  yRaw(price: number): number;

  readonly timeFromMs: number;
  readonly timeToMs: number;
  readonly priceLow: number;
  readonly priceHigh: number;
  /** Half a bar in px — marker and zone widths key off this. */
  readonly barHalfWidth: number;
  readonly width: number;
  readonly height: number;
  /** Bumped whenever the geometry changes. The memo key for overlay children. */
  readonly epoch: number;
}

export interface ProjectionInput {
  timeFromMs: number;
  timeToMs: number;
  priceLow: number;
  priceHigh: number;
  width: number;
  height: number;
  barHalfWidth?: number;
  epoch?: number;
}

export function linearProjection(input: ProjectionInput): Projection {
  const {
    timeFromMs,
    timeToMs,
    priceLow,
    priceHigh,
    width,
    height,
    barHalfWidth = 3,
    epoch = 0,
  } = input;

  // Degenerate domains collapse to the pane's midpoint rather than dividing by
  // zero. A single-candle chart is unusual but not an error.
  const timeSpan = timeToMs - timeFromMs;
  const priceSpan = priceHigh - priceLow;

  const toX = (ms: number) =>
    timeSpan === 0 ? width / 2 : ((ms - timeFromMs) / timeSpan) * width;
  // Inverted: price grows upward, y grows downward.
  const toY = (price: number) =>
    priceSpan === 0 ? height / 2 : ((priceHigh - price) / priceSpan) * height;

  return {
    x: (ms) => (ms < timeFromMs || ms > timeToMs ? null : toX(ms)),
    xClamped: (ms) => clamp(toX(clamp(ms, timeFromMs, timeToMs)), 0, width),
    y: (price) => (price < priceLow || price > priceHigh ? null : toY(price)),
    yClamped: (price) => clamp(toY(clamp(price, priceLow, priceHigh)), 0, height),
    xRaw: toX,
    yRaw: toY,
    timeFromMs,
    timeToMs,
    priceLow,
    priceHigh,
    barHalfWidth,
    width,
    height,
    epoch,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  /** True when the shape ran past the pane edge and was cut. */
  clippedStart: boolean;
  clippedEnd: boolean;
}

export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  clippedStart: boolean;
  clippedEnd: boolean;
}

export interface Point {
  x: number;
  y: number;
}

/** True when `[fromMs, toMs]` overlaps the visible range at all. */
function intersectsTime(p: Projection, fromMs: number, toMs: number): boolean {
  return toMs >= p.timeFromMs && fromMs <= p.timeToMs;
}

export interface ZoneGeometry {
  fromMs: number;
  /** `null` extends the zone to the right edge. */
  toMs: number | null;
  priceLow: number;
  priceHigh: number;
}

/**
 * A price band across a time span.
 *
 * Returns a rect even when the band is partly off-pane — a zone that starts
 * before the visible range still has to render its visible part, and reporting
 * it as `null` would make structures vanish while scrolling. `null` means it
 * does not overlap the view at all.
 *
 * The band is *not* clamped in price: a zone above or below the visible prices
 * still overlaps in time, and clamping it would paste it onto the pane edge as
 * a misleading sliver. It is clipped by the SVG viewport instead.
 */
export function projectZone(p: Projection, z: ZoneGeometry): Rect | null {
  const toMs = z.toMs ?? p.timeToMs;
  if (!intersectsTime(p, z.fromMs, toMs)) return null;

  const x1 = p.xClamped(z.fromMs);
  const x2 = p.xClamped(toMs);
  const yTop = rawY(p, z.priceHigh);
  const yBottom = rawY(p, z.priceLow);

  return {
    x: Math.min(x1, x2),
    y: Math.min(yTop, yBottom),
    // A zero-width zone would be invisible; give it a bar so a single-candle
    // block still reads as a block.
    width: Math.max(Math.abs(x2 - x1), p.barHalfWidth * 2),
    height: Math.max(Math.abs(yBottom - yTop), 1),
    clippedStart: z.fromMs < p.timeFromMs,
    clippedEnd: toMs > p.timeToMs,
  };
}

/** Unclamped price -> y, so off-pane geometry keeps its true slope. */
function rawY(p: Projection, price: number): number {
  return p.yRaw(price);
}

export interface LevelGeometry {
  price: number;
  fromMs: number;
  toMs: number | null;
}

export function projectLevel(p: Projection, l: LevelGeometry): Segment | null {
  const toMs = l.toMs ?? p.timeToMs;
  if (!intersectsTime(p, l.fromMs, toMs)) return null;

  const y = rawY(p, l.price);
  return {
    x1: p.xClamped(l.fromMs),
    y1: y,
    x2: p.xClamped(toMs),
    y2: y,
    clippedStart: l.fromMs < p.timeFromMs,
    clippedEnd: toMs > p.timeToMs,
  };
}

export interface ConnectionGeometry {
  fromMs: number;
  fromPrice: number;
  toMs: number;
  toPrice: number;
}

export function projectConnection(
  p: Projection,
  c: ConnectionGeometry,
): Segment | null {
  if (!intersectsTime(p, Math.min(c.fromMs, c.toMs), Math.max(c.fromMs, c.toMs))) {
    return null;
  }
  // Raw on both axes. Clamping x alone would drag an endpoint sideways while
  // leaving its price fixed, tilting the line — a swing leg whose low is off
  // the left edge would render at an angle it never had.
  return {
    x1: p.xRaw(c.fromMs),
    y1: p.yRaw(c.fromPrice),
    x2: p.xRaw(c.toMs),
    y2: p.yRaw(c.toPrice),
    clippedStart: c.fromMs < p.timeFromMs,
    clippedEnd: c.toMs > p.timeToMs,
  };
}

/** A point annotation. `null` when its candle is off-pane. */
export function projectMarker(
  p: Projection,
  m: { atMs: number; price: number },
): Point | null {
  const x = p.x(m.atMs);
  if (x === null) return null;
  return { x, y: rawY(p, m.price) };
}

/** A full-height time span. */
export function projectRangeHighlight(
  p: Projection,
  r: { fromMs: number; toMs: number },
): Rect | null {
  if (!intersectsTime(p, r.fromMs, r.toMs)) return null;
  const x1 = p.xClamped(r.fromMs);
  const x2 = p.xClamped(r.toMs);
  return {
    x: Math.min(x1, x2),
    y: 0,
    width: Math.max(Math.abs(x2 - x1), p.barHalfWidth * 2),
    height: p.height,
    clippedStart: r.fromMs < p.timeFromMs,
    clippedEnd: r.toMs > p.timeToMs,
  };
}
