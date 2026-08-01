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
