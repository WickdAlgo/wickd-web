import { describe, expect, it } from "vitest";
import { epochMs } from "@/contracts";
import { may6Session } from "./may6-session";
import { tradeBtc001 } from "./trade-btc-001";

describe("trade-btc-001 fixture", () => {
  const t = tradeBtc001;

  it("belongs to the inspection run it cites", () => {
    expect(t.inspectionRunId).toBe(may6Session.run.runId);
    for (const link of t.evidenceLinks) {
      expect(link.inspectionRunId).toBe(may6Session.run.runId);
      expect(may6Session.entities.some((e) => e.id === link.inspectionEntityId)).toBe(
        true,
      );
    }
  });

  /**
   * The plan has to sit on the structures it claims. An earlier version pinned
   * the trade to clock times while the structures were derived from the data,
   * which put the entry zone in a completely different part of the session from
   * the order block the thesis described.
   */
  it("draws its entry zone on the order block it cites", () => {
    const ob = may6Session.layers
      .find((l) => l.id === "order-blocks")!
      .primitives.find((p) => p.type === "zone")!;
    const entry = t.levels.find((l) => l.role === "entry")!;

    expect(entry.zoneLow).toBe(ob.priceLow.toFixed(2));
    expect(entry.zoneHigh).toBe(ob.priceHigh.toFixed(2));
    expect(t.evidenceLinks.some((l) => l.inspectionEntityId === ob.entityId)).toBe(true);
  });

  it("signals only after its evidence is knowable", () => {
    const ob = may6Session.entities.find((e) => e.id === "ob-018")!;
    expect(epochMs(t.idea.signalTimeUtc)).toBeGreaterThanOrEqual(
      epochMs(ob.knownAtUtc),
    );
  });

  it("stays inside the session", () => {
    const sessionEnd =
      may6Session.candles.at(-1)!.atUtcMs + may6Session.run.intervalMs;
    for (const f of t.fills) expect(f.atUtcMs).toBeLessThanOrEqual(sessionEnd);
    for (const s of t.signals) expect(s.atUtcMs).toBeLessThanOrEqual(sessionEnd);
  });

  it("orders the lifecycle: signal, entry, stop move, partials, exit", () => {
    const types = t.signals.map((s) => s.type);
    expect(types).toEqual([
      "setup",
      "entry",
      "move_stop_to_breakeven",
      "partial_take_profit",
      "partial_take_profit",
      "close",
    ]);
    const fillRoles = t.fills.map((f) => f.role);
    expect(fillRoles).toEqual(["entry", "partial_exit", "partial_exit", "manual_exit"]);
  });

  it("closes the old stop exactly where the new one opens", () => {
    const stops = t.levels
      .filter((l) => l.role === "stop")
      .sort((a, b) => a.ordinal - b.ordinal);
    expect(stops).toHaveLength(2);
    expect(stops[0].validUntilMs).toBe(stops[1].validFromMs);
    expect(stops[0].validUntilMs).not.toBeNull();
    expect(stops[1].validUntilMs).toBeNull();
  });

  it("moves the stop to the entry price, which is what breakeven means", () => {
    const entryFill = t.fills.find((f) => f.role === "entry")!;
    const newStop = t.levels.find((l) => l.id === "lvl-stop-1")!;
    expect(newStop.price).toBe(entryFill.price);
  });

  it("keeps three targets, ascending, above the entry", () => {
    const targets = t.levels
      .filter((l) => l.role === "target")
      .sort((a, b) => a.ordinal - b.ordinal);
    expect(targets).toHaveLength(3);

    const entryFill = Number(t.fills.find((f) => f.role === "entry")!.price);
    const prices = targets.map((l) => Number(l.price));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    for (const p of prices) expect(p).toBeGreaterThan(entryFill);
  });

  it("reports a different R from the one the account saw", () => {
    // The gap is the point. A fixture where these agree makes the comparison
    // look decorative rather than diagnostic.
    expect(t.execution!.mentorReportedR).toBe("3.20");
    expect(t.execution!.netR).toBe("2.41");
    expect(Number(t.execution!.netR)).toBeLessThan(
      Number(t.execution!.mentorReportedR),
    );
  });

  it("exits below the reported target, which is what the review explains", () => {
    const exit = Number(t.fills.find((f) => f.role === "manual_exit")!.price);
    const lastTarget = Math.max(
      ...t.levels.filter((l) => l.role === "target").map((l) => Number(l.price)),
    );
    expect(exit).toBeLessThan(lastTarget);
    expect(t.review!.followedPlan).toBe(false);
  });

  it("authorizes every fill with a visible signal", () => {
    const signalIds = new Set(t.signals.map((s) => s.id));
    for (const f of t.fills) {
      expect(f.signalEventId).toBeDefined();
      expect(signalIds.has(f.signalEventId!)).toBe(true);
    }
  });

  it("never lets a fill precede the signal that authorized it", () => {
    const signalAt = new Map(t.signals.map((s) => [s.id, s.atUtcMs]));
    for (const f of t.fills) {
      expect(f.atUtcMs).toBeGreaterThanOrEqual(signalAt.get(f.signalEventId!)!);
    }
  });

  it("does not sell more than it bought", () => {
    const bought = t.fills
      .filter((f) => f.side === "buy")
      .reduce((sum, f) => sum + Number(f.quantity), 0);
    const sold = t.fills
      .filter((f) => f.side === "sell")
      .reduce((sum, f) => sum + Number(f.quantity), 0);
    expect(sold).toBeLessThanOrEqual(bought + 1e-9);
  });
});
