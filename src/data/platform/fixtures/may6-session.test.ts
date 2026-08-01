import { describe, expect, it } from "vitest";
import { compareStamp, epochMs } from "@/contracts";
import { may6Session } from "./may6-session";

/**
 * The fixture is the substrate every replay test stands on, so its internal
 * consistency is worth asserting directly. A fixture that quietly contains
 * lookahead would make the causal tests pass while the feature is broken.
 */
describe("may6-session fixture", () => {
  const d = may6Session;

  it("parses and covers the advertised range", () => {
    expect(d.candles).toHaveLength(372);
    expect(d.candles[0].openTimeUtc).toBe("2026-05-06T00:00:00.000Z");
    expect(d.candles.at(-1)!.openTimeUtc).toBe("2026-05-07T06:55:00.000Z");
  });

  it("sorts every causally-ordered array at parse time", () => {
    const sorted = <T extends { atUtcMs: number; sequence: number }>(xs: readonly T[]) =>
      xs.every((x, i) => i === 0 || compareStamp(xs[i - 1], x) <= 0);

    expect(sorted(d.candles)).toBe(true);
    expect(sorted(d.entities)).toBe(true);
    expect(sorted(d.lifecycle)).toBe(true);
    for (const layer of d.layers) expect(sorted(layer.primitives)).toBe(true);
  });

  it("never makes a structure knowable before its trigger", () => {
    for (const e of d.entities) {
      expect(epochMs(e.knownAtUtc)).toBeGreaterThanOrEqual(epochMs(e.triggerTimeUtc));
    }
  });

  it("confirms the swing high strictly after the candle that printed it", () => {
    const swing = d.entities.find((e) => e.id === "swing-hi-001")!;
    // The gap between subject and known time is what a causal view exists to
    // show. If a fixture makes them equal, the replay demo proves nothing.
    expect(epochMs(swing.knownAtUtc)).toBeGreaterThan(epochMs(swing.subjectTimeUtc));
  });

  it("orders the sweep after the pool it sweeps", () => {
    const pool = d.entities.find((e) => e.id === "eqh-001")!;
    const sweep = d.entities.find((e) => e.id === "sweep-001")!;
    expect(epochMs(sweep.knownAtUtc)).toBeGreaterThan(epochMs(pool.knownAtUtc));
  });

  it("never emits a lifecycle event before its entity is known", () => {
    const knownAt = new Map(d.entities.map((e) => [e.id, e.atUtcMs]));
    for (const ev of d.lifecycle) {
      expect(knownAt.has(ev.entityId)).toBe(true);
      expect(ev.atUtcMs).toBeGreaterThanOrEqual(knownAt.get(ev.entityId)!);
    }
  });

  it("stores no terminal state on any entity", () => {
    // The schema omits these fields entirely; this asserts the fixture did not
    // smuggle them in as excess properties.
    for (const e of d.entities) {
      expect(e).not.toHaveProperty("state");
      expect(e).not.toHaveProperty("mitigatedAt");
      expect(e).not.toHaveProperty("invalidatedAt");
    }
  });

  it("points every primitive and relation at a real entity", () => {
    const ids = new Set(d.entities.map((e) => e.id));
    for (const layer of d.layers) {
      for (const p of layer.primitives) {
        if (p.entityId) expect(ids.has(p.entityId)).toBe(true);
      }
    }
    for (const r of d.relations) {
      expect(ids.has(r.fromEntityId)).toBe(true);
      expect(ids.has(r.toEntityId)).toBe(true);
    }
    for (const ev of d.evidence) expect(ids.has(ev.entityId)).toBe(true);
  });

  it("makes each primitive visible no earlier than its entity is known", () => {
    const knownAt = new Map(d.entities.map((e) => [e.id, e.atUtcMs]));
    for (const layer of d.layers) {
      for (const p of layer.primitives) {
        if (!p.entityId) continue;
        expect(p.atUtcMs).toBeGreaterThanOrEqual(knownAt.get(p.entityId)!);
      }
    }
  });

  /**
   * The narrative has to be true of the data, not merely asserted beside it.
   * An earlier version of this fixture pinned structures to clock times, which
   * produced a liquidity sweep whose candle never reached the pool it swept and
   * an inverted price band on the chart. These assertions are what caught it.
   */
  describe("structures are real features of the candles", () => {
    const candleAt = (iso: string) => d.candles.find((c) => c.openTimeUtc === iso)!;

    it("sweeps a pool that price actually traded through", () => {
      const pool = d.entities.find((e) => e.id === "eqh-001")!;
      const sweep = d.entities.find((e) => e.id === "sweep-001")!;
      const poolPrice = pool.subjectPriceHigh!;
      const sweepCandle = candleAt(sweep.subjectTimeUtc);

      expect(sweepCandle.high).toBeGreaterThan(poolPrice);
      expect(sweep.subjectPriceHigh!).toBeGreaterThanOrEqual(sweep.subjectPriceLow!);
    });

    it("places the pool at an actual prior high", () => {
      const pool = d.entities.find((e) => e.id === "eqh-001")!;
      expect(candleAt(pool.subjectTimeUtc).high).toBe(pool.subjectPriceHigh);
    });

    it("draws the fair value gap across a real three-candle gap", () => {
      const fvg = d.entities.find((e) => e.id === "fvg-042")!;
      const i = d.candles.findIndex((c) => c.openTimeUtc === fvg.subjectTimeUtc);
      expect(i).toBeGreaterThan(0);
      // The defining property: the low after never overlaps the high before.
      expect(d.candles[i + 1].low).toBeGreaterThan(d.candles[i - 1].high);
      expect(fvg.subjectPriceHigh!).toBeGreaterThan(fvg.subjectPriceLow!);
    });

    it("puts the order block immediately before the displacement it caused", () => {
      // Proximity is the property that matters, and the one whose absence
      // caused real damage: an unbounded search found the last down candle
      // anywhere earlier in the session, producing a block thousands of points
      // below its own gap — and a trade drawn on it had its stop above its
      // entry. Being a down candle is preferred but the data cannot always
      // supply one during a sustained rally.
      const ob = d.entities.find((e) => e.id === "ob-018")!;
      const fvg = d.entities.find((e) => e.id === "fvg-042")!;
      const obIndex = d.candles.findIndex((c) => c.openTimeUtc === ob.subjectTimeUtc);
      const fvgIndex = d.candles.findIndex((c) => c.openTimeUtc === fvg.subjectTimeUtc);

      expect(obIndex).toBeLessThan(fvgIndex);
      expect(fvgIndex - obIndex).toBeLessThanOrEqual(8);
    });

    it("keeps the order block within touching distance of its gap", () => {
      const ob = d.entities.find((e) => e.id === "ob-018")!;
      const fvg = d.entities.find((e) => e.id === "fvg-042")!;
      const gapSize = fvg.subjectPriceHigh! - fvg.subjectPriceLow!;
      // A block more than a few gap-widths away is not the origin of the move,
      // whatever the index arithmetic says.
      const distance = Math.abs(fvg.subjectPriceLow! - ob.subjectPriceHigh!);
      expect(distance).toBeLessThan(Math.max(gapSize * 40, 1_000));
    });

    it("puts the swing high at the actual high of the analysed window", () => {
      const swing = d.entities.find((e) => e.id === "swing-hi-001")!;
      const window = d.candles.slice(0, Math.floor(d.candles.length * 0.75));
      expect(candleAt(swing.subjectTimeUtc).high).toBe(
        Math.max(...window.map((c) => c.high)),
      );
    });

    it("leaves room after the swing high for its consequences", () => {
      // The order block's mitigation and the sweep's rejection both happen
      // after the high. Detecting the high on the last candle would make every
      // consequence unobservable, which is what searching the full range did.
      const swing = d.entities.find((e) => e.id === "swing-hi-001")!;
      const i = d.candles.findIndex((c) => c.openTimeUtc === swing.subjectTimeUtc);
      expect(i).toBeLessThan(d.candles.length - 1);

      const consequences = d.lifecycle.filter(
        (l) => l.type === "mitigated" || l.type === "invalidated",
      );
      expect(consequences.length).toBeGreaterThan(0);
      for (const c of consequences) {
        expect(c.atUtcMs).toBeLessThanOrEqual(
          d.candles.at(-1)!.atUtcMs + d.run.intervalMs,
        );
      }
    });

    it("puts the swing low at an actual low before that high", () => {
      const lo = d.entities.find((e) => e.id === "swing-lo-001")!;
      const hi = d.entities.find((e) => e.id === "swing-hi-001")!;
      const before = d.candles.filter(
        (c) => Date.parse(c.openTimeUtc) < Date.parse(hi.subjectTimeUtc),
      );
      expect(candleAt(lo.subjectTimeUtc).low).toBe(Math.min(...before.map((c) => c.low)));
    });

    it("never emits an inverted price band on any entity or zone", () => {
      for (const e of d.entities) {
        if (e.subjectPriceLow !== undefined && e.subjectPriceHigh !== undefined) {
          expect(e.subjectPriceHigh).toBeGreaterThanOrEqual(e.subjectPriceLow);
        }
      }
      for (const layer of d.layers) {
        for (const p of layer.primitives) {
          if (p.type === "zone") expect(p.priceHigh).toBeGreaterThanOrEqual(p.priceLow);
        }
      }
    });
  });

  it("points every relation backwards in time", () => {
    // A `caused_by` naming a cause that had not happened yet is the graph
    // equivalent of lookahead, and it is easy to introduce when the structures
    // are derived rather than hand-ordered.
    const knownAt = new Map(d.entities.map((e) => [e.id, e.atUtcMs]));
    for (const r of d.relations) {
      expect(knownAt.get(r.toEntityId)!).toBeLessThanOrEqual(
        knownAt.get(r.fromEntityId)!,
      );
    }
  });

  it("derives zone geometry from the candles rather than restating it", () => {
    const ob = d.layers
      .find((l) => l.id === "order-blocks")!
      .primitives.find((p) => p.type === "zone")!;
    const candle = d.candles.find((c) => c.openTimeUtc === ob.fromUtc)!;
    expect(ob.priceLow).toBe(Math.min(candle.open, candle.close));
    expect(ob.priceHigh).toBe(Math.max(candle.open, candle.close));
    expect(ob.priceHigh).toBeGreaterThanOrEqual(ob.priceLow);
  });
});
