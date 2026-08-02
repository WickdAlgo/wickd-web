import { describe, expect, it } from "vitest";
import {
  linearProjection,
  projectConnection,
  projectLevel,
  projectMarker,
  projectRangeHighlight,
  projectZone,
} from "./projection";

const p = linearProjection({
  timeFromMs: 1_000,
  timeToMs: 2_000,
  priceLow: 100,
  priceHigh: 200,
  width: 500,
  height: 400,
  barHalfWidth: 4,
});

describe("linearProjection", () => {
  it("maps time linearly across the pane", () => {
    expect(p.x(1_000)).toBe(0);
    expect(p.x(1_500)).toBe(250);
    expect(p.x(2_000)).toBe(500);
  });

  it("inverts price, because y grows downward and price grows upward", () => {
    expect(p.y(200)).toBe(0);
    expect(p.y(150)).toBe(200);
    expect(p.y(100)).toBe(400);
  });

  it("returns null outside the visible range", () => {
    expect(p.x(999)).toBeNull();
    expect(p.x(2_001)).toBeNull();
    expect(p.y(99)).toBeNull();
    expect(p.y(201)).toBeNull();
  });

  it("clamps into the pane on demand", () => {
    expect(p.xClamped(0)).toBe(0);
    expect(p.xClamped(9_999)).toBe(500);
    expect(p.yClamped(0)).toBe(400);
    expect(p.yClamped(9_999)).toBe(0);
  });

  it("survives a degenerate domain instead of dividing by zero", () => {
    const flat = linearProjection({
      timeFromMs: 5,
      timeToMs: 5,
      priceLow: 10,
      priceHigh: 10,
      width: 100,
      height: 80,
    });
    expect(flat.x(5)).toBe(50);
    expect(flat.y(10)).toBe(40);
    expect(Number.isFinite(flat.xClamped(99))).toBe(true);
  });
});

describe("projectZone", () => {
  it("places a zone on its price band and time span", () => {
    const r = projectZone(p, { fromMs: 1_200, toMs: 1_600, priceLow: 120, priceHigh: 160 })!;
    expect(r.x).toBe(100);
    expect(r.width).toBe(200);
    expect(r.y).toBe(160); // price 160 -> y 160
    expect(r.height).toBe(160); // down to price 120 -> y 320
    expect(r.clippedStart).toBe(false);
    expect(r.clippedEnd).toBe(false);
  });

  it("extends an open-ended zone to the right edge", () => {
    const r = projectZone(p, { fromMs: 1_800, toMs: null, priceLow: 120, priceHigh: 160 })!;
    expect(r.x + r.width).toBe(500);
  });

  it("renders the visible part of a zone that starts off-pane", () => {
    // Dropping it would make structures vanish while scrolling, which reads as
    // a rendering bug rather than as scrolling.
    const r = projectZone(p, { fromMs: 0, toMs: 1_500, priceLow: 120, priceHigh: 160 })!;
    expect(r.x).toBe(0);
    expect(r.width).toBe(250);
    expect(r.clippedStart).toBe(true);
    expect(r.clippedEnd).toBe(false);
  });

  it("returns null only when the zone misses the view entirely", () => {
    expect(projectZone(p, { fromMs: 0, toMs: 500, priceLow: 120, priceHigh: 160 })).toBeNull();
    expect(
      projectZone(p, { fromMs: 5_000, toMs: 6_000, priceLow: 120, priceHigh: 160 }),
    ).toBeNull();
  });

  it("keeps a zero-width zone visible", () => {
    const r = projectZone(p, { fromMs: 1_500, toMs: 1_500, priceLow: 120, priceHigh: 160 })!;
    expect(r.width).toBe(8); // barHalfWidth * 2
  });

  it("does not clamp price, so an off-pane band keeps its true position", () => {
    // Clamping would paste the band onto the pane edge as a misleading sliver.
    const r = projectZone(p, { fromMs: 1_200, toMs: 1_600, priceLow: 300, priceHigh: 400 })!;
    expect(r.y).toBeLessThan(0);
  });
});

describe("projectLevel", () => {
  it("draws a horizontal segment at its price", () => {
    const s = projectLevel(p, { price: 150, fromMs: 1_200, toMs: 1_800 })!;
    expect(s.y1).toBe(200);
    expect(s.y2).toBe(200);
    expect(s.x1).toBe(100);
    expect(s.x2).toBe(400);
  });

  it("runs an open-ended level to the right edge", () => {
    const s = projectLevel(p, { price: 150, fromMs: 1_200, toMs: null })!;
    expect(s.x2).toBe(500);
  });
});

describe("projectConnection", () => {
  it("keeps its slope", () => {
    const s = projectConnection(p, {
      fromMs: 1_000,
      fromPrice: 100,
      toMs: 2_000,
      toPrice: 200,
    })!;
    expect(s).toMatchObject({ x1: 0, y1: 400, x2: 500, y2: 0 });
  });

  it("keeps its slope when an endpoint is off-pane", () => {
    // The bug this guards: clamping x alone drags the endpoint sideways while
    // its price stays put, so the visible line is at an angle it never had.
    // A swing leg starting before the visible range showed this immediately.
    const s = projectConnection(p, {
      fromMs: 500, // half a window before the left edge
      fromPrice: 50, // and below the visible prices
      toMs: 2_000,
      toPrice: 200,
    })!;

    const slope = (s.y2 - s.y1) / (s.x2 - s.x1);
    const onPane = projectConnection(p, {
      fromMs: 1_000,
      fromPrice: 100,
      toMs: 2_000,
      toPrice: 200,
    })!;
    const referenceSlope = (onPane.y2 - onPane.y1) / (onPane.x2 - onPane.x1);

    // Same physical line, extended: identical slope.
    expect(slope).toBeCloseTo(referenceSlope, 10);
    expect(s.x1).toBeLessThan(0);
    expect(s.y1).toBeGreaterThan(p.height);
    expect(s.clippedStart).toBe(true);
  });
});

describe("projectMarker", () => {
  it("returns a point inside the view", () => {
    expect(projectMarker(p, { atMs: 1_500, price: 150 })).toEqual({ x: 250, y: 200 });
  });

  it("returns null when its candle is off-pane", () => {
    // Unlike a zone, a marker has no visible part once its candle is gone.
    expect(projectMarker(p, { atMs: 500, price: 150 })).toBeNull();
  });
});

describe("projectRangeHighlight", () => {
  it("spans the full pane height", () => {
    const r = projectRangeHighlight(p, { fromMs: 1_200, toMs: 1_400 })!;
    expect(r.y).toBe(0);
    expect(r.height).toBe(400);
    expect(r.x).toBe(100);
    expect(r.width).toBe(100);
  });
});
