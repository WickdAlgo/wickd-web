import { describe, expect, it } from "vitest";
import { compareStamp, epochMs, type Stamped } from "@/contracts";
import { may6Session } from "@/data/platform/fixtures/may6-session";
import { tradeBtc001 } from "@/data/platform/fixtures/trade-btc-001";
import {
  cursorFrom,
  FINAL_CURSOR,
  filterCandlesAsOf,
  filterFillsAsOf,
  filterLevelsAsOf,
  isVisibleAt,
  resolveEntitiesAsOf,
  sliceInspectionAsOf,
  sliceTradeAsOf,
  takeVisible,
  visibleCount,
} from "./causal";

const stamp = (atUtcMs: number, sequence = 0): Stamped => ({ atUtcMs, sequence });

describe("cursorFrom", () => {
  it("treats null as the end of time", () => {
    expect(cursorFrom(null)).toEqual(FINAL_CURSOR);
    expect(cursorFrom(undefined)).toEqual(FINAL_CURSOR);
  });

  it("accepts ISO strings and epoch numbers identically", () => {
    const iso = cursorFrom("2026-05-06T14:35:00Z");
    const ms = cursorFrom(Date.parse("2026-05-06T14:35:00Z"));
    expect(iso.atUtcMs).toBe(ms.atUtcMs);
  });

  it("throws on an unparseable cursor rather than producing NaN", () => {
    // The highest-risk latent bug in this area: NaN fails every comparison, so
    // a bad cursor would silently return everything or nothing.
    expect(() => cursorFrom("sometime tuesday")).toThrow(RangeError);
    expect(() => cursorFrom(Number.NaN)).toThrow(RangeError);
  });

  it("defaults to including everything at its instant", () => {
    const cursor = cursorFrom("2026-05-06T14:35:00Z");
    const at = epochMs("2026-05-06T14:35:00Z");
    expect(isVisibleAt(stamp(at, 0), cursor)).toBe(true);
    expect(isVisibleAt(stamp(at, 9_999), cursor)).toBe(true);
  });
});

describe("isVisibleAt", () => {
  const cursor = cursorFrom(1_000, 4);

  it("includes a fact stamped exactly at the cursor", () => {
    expect(isVisibleAt(stamp(1_000, 4), cursor)).toBe(true);
  });

  it("excludes a fact one millisecond later", () => {
    expect(isVisibleAt(stamp(1_001, 0), cursor)).toBe(false);
  });

  it("breaks ties at the same instant by run-local sequence", () => {
    expect(isVisibleAt(stamp(1_000, 4), cursor)).toBe(true);
    expect(isVisibleAt(stamp(1_000, 5), cursor)).toBe(false);
  });

  it("excludes everything at an instant when the cursor sits at sequence 0", () => {
    const atZero = cursorFrom(1_000, 0);
    expect(isVisibleAt(stamp(1_000, 0), atZero)).toBe(true);
    expect(isVisibleAt(stamp(1_000, 1), atZero)).toBe(false);
  });
});

describe("visibleCount", () => {
  const sorted = [stamp(10, 0), stamp(20, 0), stamp(20, 1), stamp(30, 0)];

  it("agrees with a linear filter at every cursor", () => {
    for (const at of [0, 10, 15, 20, 25, 30, 99]) {
      for (const seq of [0, 1, Number.POSITIVE_INFINITY]) {
        const cursor = cursorFrom(at, seq);
        const expected = sorted.filter((s) => compareStamp(s, cursor) <= 0).length;
        expect(visibleCount(sorted, cursor)).toBe(expected);
      }
    }
  });

  it("returns 0 before the first fact and the length after the last", () => {
    expect(visibleCount(sorted, cursorFrom(0))).toBe(0);
    expect(visibleCount(sorted, FINAL_CURSOR)).toBe(4);
    expect(visibleCount([], cursorFrom(5))).toBe(0);
  });
});

describe("filterCandlesAsOf", () => {
  const intervalMs = 300_000;
  const candles = may6Session.candles;

  it("shows a candle only once it has closed", () => {
    const third = candles[2];
    const closeMs = third.atUtcMs + intervalMs;

    // At the exact close, the candle is complete and visible.
    const atClose = filterCandlesAsOf(candles, cursorFrom(closeMs), intervalMs);
    expect(atClose.closed).toHaveLength(3);

    // One millisecond earlier it is still forming — its high has not printed,
    // so including it would be lookahead.
    const before = filterCandlesAsOf(candles, cursorFrom(closeMs - 1), intervalMs);
    expect(before.closed).toHaveLength(2);
    expect(before.forming?.openTimeUtc).toBe(third.openTimeUtc);
  });

  it("returns nothing before the session opens", () => {
    const result = filterCandlesAsOf(candles, cursorFrom(candles[0].atUtcMs - 1), intervalMs);
    expect(result.closed).toHaveLength(0);
    expect(result.forming).toBeNull();
  });

  it("returns every candle at the final cursor", () => {
    const result = filterCandlesAsOf(candles, FINAL_CURSOR, intervalMs);
    expect(result.closed).toHaveLength(candles.length);
    expect(result.forming).toBeNull();
  });
});

describe("resolveEntitiesAsOf", () => {
  const { entities, lifecycle } = may6Session;
  const ob = entities.find((e) => e.id === "ob-018")!;
  const mitigation = lifecycle.find(
    (l) => l.entityId === "ob-018" && l.type === "mitigated",
  )!;

  it("reports an entity as active before its mitigation is knowable", () => {
    const cursor = cursorFrom(mitigation.atUtcMs - 1);
    const resolved = resolveEntitiesAsOf(entities, lifecycle, cursor);
    const found = resolved.find((e) => e.id === "ob-018")!;
    expect(found.state).toBe("active");
    // And the mitigation is not merely hidden from the label — it is absent
    // from the record entirely, so nothing downstream can read it.
    expect(found.events.some((e) => e.type === "mitigated")).toBe(false);
  });

  it("reports it as mitigated once the event is knowable", () => {
    const resolved = resolveEntitiesAsOf(entities, lifecycle, cursorFrom(mitigation.atUtcMs));
    expect(resolved.find((e) => e.id === "ob-018")!.state).toBe("mitigated");
  });

  it("hides an entity entirely before it is known", () => {
    const resolved = resolveEntitiesAsOf(entities, lifecycle, cursorFrom(ob.atUtcMs - 1));
    expect(resolved.find((e) => e.id === "ob-018")).toBeUndefined();
  });

  it("drops an orphan lifecycle event rather than resurrecting its entity", () => {
    const orphan = {
      ...lifecycle[0],
      id: "orphan",
      entityId: "does-not-exist",
      atUtcMs: 0,
      sequence: 0,
    };
    const resolved = resolveEntitiesAsOf(
      entities,
      [orphan, ...lifecycle],
      FINAL_CURSOR,
    );
    expect(resolved.some((e) => e.id === "does-not-exist")).toBe(false);
    expect(resolved).toHaveLength(entities.length);
  });
});

describe("filterLevelsAsOf", () => {
  const levels = tradeBtc001.levels;
  const oldStop = levels.find((l) => l.id === "lvl-stop-0")!;
  const newStop = levels.find((l) => l.id === "lvl-stop-1")!;
  const updateMs = oldStop.validUntilMs!;

  it("closes the old level rather than overwriting it", () => {
    expect(newStop.validFromMs).toBe(updateMs);
    expect(oldStop.price).not.toBe(newStop.price);
  });

  it("shows only the original stop before the update", () => {
    const visible = filterLevelsAsOf(levels, cursorFrom(updateMs - 1));
    const stops = visible.filter((l) => l.role === "stop");
    expect(stops).toHaveLength(1);
    expect(stops[0].id).toBe("lvl-stop-0");
  });

  it("shows only the replacement at the exact update instant", () => {
    // Half-open validity is what prevents both stops rendering for one
    // instant at the moment of the change.
    const stops = filterLevelsAsOf(levels, cursorFrom(updateMs)).filter(
      (l) => l.role === "stop",
    );
    expect(stops).toHaveLength(1);
    expect(stops[0].id).toBe("lvl-stop-1");
  });

  it("keeps an open-ended level visible forever after it opens", () => {
    const entry = levels.find((l) => l.id === "lvl-entry")!;
    expect(entry.validUntilMs).toBeNull();
    expect(filterLevelsAsOf(levels, FINAL_CURSOR).some((l) => l.id === entry.id)).toBe(true);
  });

  it("never shows a zero-width level", () => {
    const instant = levels[0].validFromMs;
    const degenerate = [
      { ...levels[0], id: "zero-width", validFromMs: instant, validUntilMs: instant },
    ];
    expect(filterLevelsAsOf(degenerate, cursorFrom(instant))).toHaveLength(0);
  });
});

describe("filterFillsAsOf", () => {
  const fills = tradeBtc001.fills;
  const entryFill = fills.find((f) => f.id === "fill-001")!;

  it("hides a fill whose authorizing signal is not yet visible", () => {
    // Temporal visibility alone is not enough. An execution appearing before
    // its instruction reads as prescience, which is the thing under audit.
    const visible = filterFillsAsOf(fills, new Set(), cursorFrom(entryFill.atUtcMs));
    expect(visible).toHaveLength(0);
  });

  it("shows it once the signal is visible", () => {
    const visible = filterFillsAsOf(
      fills,
      new Set([entryFill.signalEventId!]),
      cursorFrom(entryFill.atUtcMs),
    );
    expect(visible.map((f) => f.id)).toEqual(["fill-001"]);
  });
});

describe("sliceInspectionAsOf", () => {
  it("is equivalent to the whole dataset at the final cursor", () => {
    const slice = sliceInspectionAsOf(may6Session, null);
    expect(slice.isFinal).toBe(true);
    expect(slice.candles).toHaveLength(may6Session.candles.length);
    expect(slice.entities).toHaveLength(may6Session.entities.length);
  });

  it("is empty before the session opens", () => {
    const slice = sliceInspectionAsOf(may6Session, "2026-05-05T00:00:00Z");
    expect(slice.candles).toHaveLength(0);
    expect(slice.entities).toHaveLength(0);
    expect(slice.layers.every((l) => l.primitives.length === 0)).toBe(true);
  });

  it("hides a structure at its subject time and reveals it at its known time", () => {
    const swing = may6Session.entities.find((e) => e.id === "swing-hi-001")!;

    const atSubject = sliceInspectionAsOf(may6Session, swing.subjectTimeUtc);
    expect(atSubject.entities.some((e) => e.id === "swing-hi-001")).toBe(false);

    const atKnown = sliceInspectionAsOf(may6Session, swing.knownAtUtc);
    expect(atKnown.entities.some((e) => e.id === "swing-hi-001")).toBe(true);
  });

  /**
   * The property test. Everything above checks a specific boundary; this checks
   * that no boundary anywhere in the fixture behaves differently.
   */
  it("grows monotonically — every earlier slice is a prefix of every later one", () => {
    const cursors = [
      ...may6Session.entities.map((e) => e.atUtcMs),
      ...may6Session.lifecycle.map((l) => l.atUtcMs),
      ...may6Session.candles.filter((_, i) => i % 37 === 0).map((c) => c.atUtcMs),
    ].sort((a, b) => a - b);

    let previous = sliceInspectionAsOf(may6Session, cursors[0]);
    for (const cursor of cursors.slice(1)) {
      const current = sliceInspectionAsOf(may6Session, cursor);

      expect(current.candles.length).toBeGreaterThanOrEqual(previous.candles.length);
      expect(current.entities.length).toBeGreaterThanOrEqual(previous.entities.length);
      expect(current.lifecycle.length).toBeGreaterThanOrEqual(previous.lifecycle.length);

      const currentIds = current.entities.map((e) => e.id);
      expect(currentIds.slice(0, previous.entities.length)).toEqual(
        previous.entities.map((e) => e.id),
      );

      const currentCandles = current.candles.map((c) => c.openTimeUtc);
      expect(currentCandles.slice(0, previous.candles.length)).toEqual(
        previous.candles.map((c) => c.openTimeUtc),
      );

      previous = current;
    }
  });
});

describe("sliceTradeAsOf", () => {
  const stopUpdate = tradeBtc001.signals.find((s) => s.id === "sig-003")!;

  it("removes the new stop and later fills when the cursor moves back", () => {
    // This is the acceptance path from the handoff, asserted rather than
    // eyeballed in a browser.
    const after = sliceTradeAsOf(tradeBtc001, null);
    const before = sliceTradeAsOf(tradeBtc001, stopUpdate.atUtcMs - 1);

    expect(after.levels.some((l) => l.id === "lvl-stop-1")).toBe(true);
    expect(before.levels.some((l) => l.id === "lvl-stop-1")).toBe(false);
    expect(before.levels.some((l) => l.id === "lvl-stop-0")).toBe(true);

    expect(before.fills.length).toBeLessThan(after.fills.length);
    expect(before.signals.length).toBeLessThan(after.signals.length);
  });

  it("hides the execution entirely until it opens", () => {
    const beforeOpen = sliceTradeAsOf(tradeBtc001, tradeBtc001.idea.signalTimeUtc);
    expect(beforeOpen.execution).toBeNull();

    const atEnd = sliceTradeAsOf(tradeBtc001, null);
    expect(atEnd.execution?.netR).toBe("2.41");
  });

  it("shows an open execution but withholds its result until it closes", () => {
    // Visibility has two stages. The reviewer needs to see that a position
    // exists — size, risk — while replaying. They must not see how it ended.
    // Collapsing the two showed "net R 2.41" during the entry, handing over the
    // answer before the decision had been judged.
    const opened = Date.parse(tradeBtc001.execution!.openedAtUtc!);
    const closed = Date.parse(tradeBtc001.execution!.closedAtUtc!);
    const midTrade = sliceTradeAsOf(tradeBtc001, (opened + closed) / 2);

    expect(midTrade.execution).not.toBeNull();
    expect(midTrade.execution!.status).toBe("open");
    expect(midTrade.execution!.plannedRiskPct).toBe("0.75");

    expect(midTrade.execution!.netR).toBeUndefined();
    expect(midTrade.execution!.grossR).toBeUndefined();
    expect(midTrade.execution!.netPnl).toBeUndefined();
    expect(midTrade.execution!.grossPnl).toBeUndefined();
    // The reported figure is an outcome too, and leaks just as much.
    expect(midTrade.execution!.mentorReportedR).toBeUndefined();
    expect(midTrade.execution!.closedAtUtc).toBeUndefined();
  });

  it("reveals the result at the moment the execution closes", () => {
    const closed = Date.parse(tradeBtc001.execution!.closedAtUtc!);
    expect(sliceTradeAsOf(tradeBtc001, closed - 1).execution!.netR).toBeUndefined();
    expect(sliceTradeAsOf(tradeBtc001, closed).execution!.netR).toBe("2.41");
  });

  it("withholds the review until it was written", () => {
    const atClose = sliceTradeAsOf(tradeBtc001, tradeBtc001.execution!.closedAtUtc!);
    expect(atClose.review).toBeNull();
    expect(sliceTradeAsOf(tradeBtc001, null).review).not.toBeNull();
  });

  it("grows monotonically across every signal and fill boundary", () => {
    const cursors = [
      ...tradeBtc001.signals.map((s) => s.atUtcMs),
      ...tradeBtc001.fills.map((f) => f.atUtcMs),
    ].sort((a, b) => a - b);

    let previous = sliceTradeAsOf(tradeBtc001, cursors[0]);
    for (const cursor of cursors.slice(1)) {
      const current = sliceTradeAsOf(tradeBtc001, cursor);
      expect(current.signals.length).toBeGreaterThanOrEqual(previous.signals.length);
      expect(current.fills.length).toBeGreaterThanOrEqual(previous.fills.length);
      expect(current.signals.map((s) => s.id).slice(0, previous.signals.length)).toEqual(
        previous.signals.map((s) => s.id),
      );
      previous = current;
    }
  });
});

describe("takeVisible", () => {
  it("returns a prefix, never a reordering", () => {
    const sorted = may6Session.entities;
    const cursor = cursorFrom(sorted[3].atUtcMs);
    const taken = takeVisible(sorted, cursor);
    expect(taken).toEqual(sorted.slice(0, taken.length));
  });
});
