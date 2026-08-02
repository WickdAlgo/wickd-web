import { describe, expect, it } from "vitest";
import { ContractError } from "@/contracts";
import { sliceTradeAsOf } from "@/features/replay";
import { tradeBtc001 } from "./fixtures/trade-btc-001";
import { createJournalStore } from "./journal-store";

const idea = {
  instrument: { market: "BTC_USDT_PERP", timeframe: "5m" },
  source: "self" as const,
  direction: "long" as const,
  status: "planned" as const,
  signalTimeUtc: "2026-05-06T15:45:00.000Z",
  setupName: "OB retest",
  levels: [
    { role: "entry" as const, ordinal: 0, zoneLow: "69000.00", zoneHigh: "69100.00" },
    { role: "stop" as const, ordinal: 0, price: "68800.00" },
    { role: "target" as const, ordinal: 1, price: "69500.00" },
  ],
};

function store() {
  return createJournalStore([tradeBtc001]);
}

describe("journal store", () => {
  it("creates a trade that validates against the read contract", () => {
    const s = store();
    const trade = s.createTrade(idea);

    expect(trade.idea.setupName).toBe("OB retest");
    expect(trade.levels).toHaveLength(3);
    // Normalization ran, which is what proves the payload is contract-shaped
    // rather than merely object-shaped.
    expect(trade.levels[0].validFromMs).toBe(Date.parse(idea.signalTimeUtc));
    expect(s.list()).toHaveLength(2);
  });

  it("opens levels at the signal time when none is given", () => {
    const trade = store().createTrade(idea);
    for (const level of trade.levels) {
      expect(level.validFromUtc).toBe(idea.signalTimeUtc);
      expect(level.validUntilUtc).toBeNull();
    }
  });

  it("rejects a level with neither a price nor both zone bounds", () => {
    const s = store();
    expect(() =>
      s.createTrade({
        ...idea,
        levels: [{ role: "stop", ordinal: 0, zoneLow: "1.00" }],
      } as never),
    ).toThrow();
  });

  it("never returns a computed result from capture", () => {
    // R and PnL come from the domain layer. A placeholder here would be a
    // number this browser invented, in the one place that must not invent them.
    const s = store();
    const trade = s.createTrade(idea);
    const execution = s.createExecution(trade.idea.id, {
      accountId: "acct-main",
      mode: "paper",
      plannedRiskPct: "0.5",
      plannedRiskAmount: "125.00",
    });

    expect(execution.netR).toBeUndefined();
    expect(execution.grossR).toBeUndefined();
    expect(execution.netPnl).toBeUndefined();
    expect(execution.grossPnl).toBeUndefined();
  });

  it("keeps a reported R, because it is reported rather than derived", () => {
    const s = store();
    const trade = s.createTrade({ ...idea, source: "mentor" });
    const execution = s.createExecution(trade.idea.id, {
      accountId: "acct-main",
      mode: "live_copy",
      plannedRiskPct: "0.75",
      plannedRiskAmount: "187.50",
      mentorReportedR: "3.20",
    });
    expect(execution.mentorReportedR).toBe("3.20");
    expect(execution.netR).toBeUndefined();
  });

  describe("moving a level", () => {
    it("closes the old row instead of editing it", () => {
      const s = store();
      const trade = s.createTrade(idea);
      const before = trade.levels.find((l) => l.role === "stop")!;

      const moved = s.moveTradeLevel(trade.idea.id, {
        role: "stop",
        ordinal: 0,
        price: "69050.00",
        effectiveFromUtc: "2026-05-06T16:30:00.000Z",
      });

      const stops = moved.levels.filter((l) => l.role === "stop");
      expect(stops).toHaveLength(2);

      const original = stops.find((l) => l.id === before.id)!;
      // The original keeps its price and gains an end.
      expect(original.price).toBe("68800.00");
      expect(original.validUntilUtc).toBe("2026-05-06T16:30:00.000Z");

      const replacement = stops.find((l) => l.id !== before.id)!;
      expect(replacement.price).toBe("69050.00");
      expect(replacement.validFromUtc).toBe("2026-05-06T16:30:00.000Z");
      expect(replacement.validUntilUtc).toBeNull();
    });

    it("produces exactly one stop in force at every instant", () => {
      // Half-open validity is what guarantees this. The instant of the move is
      // the case that breaks under closed intervals.
      const s = store();
      const trade = s.createTrade(idea);
      const moveAt = "2026-05-06T16:30:00.000Z";
      s.moveTradeLevel(trade.idea.id, {
        role: "stop",
        ordinal: 0,
        price: "69050.00",
        effectiveFromUtc: moveAt,
      });
      const updated = s.get(trade.idea.id);
      const moveMs = Date.parse(moveAt);

      for (const cursor of [moveMs - 1, moveMs, moveMs + 1]) {
        const stops = sliceTradeAsOf(updated, cursor).levels.filter(
          (l) => l.role === "stop",
        );
        expect(stops).toHaveLength(1);
      }

      expect(
        sliceTradeAsOf(updated, moveMs - 1).levels.find((l) => l.role === "stop")!.price,
      ).toBe("68800.00");
      expect(
        sliceTradeAsOf(updated, moveMs).levels.find((l) => l.role === "stop")!.price,
      ).toBe("69050.00");
    });

    it("refuses to move a level to before it opened", () => {
      const s = store();
      const trade = s.createTrade(idea);
      expect(() =>
        s.moveTradeLevel(trade.idea.id, {
          role: "stop",
          ordinal: 0,
          price: "1.00",
          effectiveFromUtc: "2026-05-06T10:00:00.000Z",
        }),
      ).toThrow(/before it opened/);
    });
  });

  describe("signals and fills", () => {
    it("sequences two events at the same instant", () => {
      const s = store();
      const trade = s.createTrade(idea);
      const at = "2026-05-06T16:00:00.000Z";

      const first = s.appendSignalEvent(trade.idea.id, {
        type: "entry",
        messageTimeUtc: at,
        summary: "filled",
      });
      const second = s.appendSignalEvent(trade.idea.id, {
        type: "commentary",
        messageTimeUtc: at,
        summary: "and a note",
      });

      expect(first.sequence).toBe(0);
      expect(second.sequence).toBe(1);
    });

    it("refuses a fill with no execution to belong to", () => {
      const s = store();
      const trade = s.createTrade(idea);
      expect(() =>
        s.appendFill(trade.idea.id, {
          role: "entry",
          side: "buy",
          price: "69050.00",
          quantity: "0.1",
          filledAtUtc: "2026-05-06T16:00:00.000Z",
        }),
      ).toThrow(/needs an execution/);
    });

    it("records a fill once an execution exists", () => {
      const s = store();
      const trade = s.createTrade(idea);
      s.createExecution(trade.idea.id, {
        accountId: "acct-main",
        mode: "paper",
        plannedRiskPct: "0.5",
        plannedRiskAmount: "125.00",
        openedAtUtc: "2026-05-06T16:00:00.000Z",
      });
      const fill = s.appendFill(trade.idea.id, {
        role: "entry",
        side: "buy",
        price: "69050.00",
        quantity: "0.100",
        filledAtUtc: "2026-05-06T16:00:00.000Z",
      });
      expect(fill.price).toBe("69050.00");
      expect(s.get(trade.idea.id).fills).toHaveLength(1);
    });

    it("rejects a price that is not a decimal string", () => {
      const s = store();
      const trade = s.createTrade(idea);
      s.createExecution(trade.idea.id, {
        accountId: "a",
        mode: "paper",
        plannedRiskPct: "0.5",
        plannedRiskAmount: "1",
        openedAtUtc: "2026-05-06T16:00:00.000Z",
      });
      expect(() =>
        s.appendFill(trade.idea.id, {
          role: "entry",
          side: "buy",
          price: 69050.5 as unknown as string,
          quantity: "0.1",
          filledAtUtc: "2026-05-06T16:00:00.000Z",
        }),
      ).toThrow(ContractError);
    });
  });

  it("stores a review and makes it visible only from when it was written", () => {
    const s = store();
    const trade = s.createTrade(idea);
    const review = s.saveReview(trade.idea.id, {
      followedPlan: false,
      summary: "Took the exit early.",
      writtenAtUtc: "2026-05-07T09:00:00.000Z",
    });
    expect(review.summary).toBe("Took the exit early.");

    const updated = s.get(trade.idea.id);
    expect(sliceTradeAsOf(updated, "2026-05-07T08:59:59.000Z").review).toBeNull();
    expect(sliceTradeAsOf(updated, "2026-05-07T09:00:00.000Z").review).not.toBeNull();
  });

  it("throws not_found for an unknown trade", () => {
    expect(() => store().get("nope")).toThrow(/no trade named/);
  });

  it("does not disturb the seeded trade", () => {
    const s = store();
    s.createTrade(idea);
    const seeded = s.get("trade-btc-001");
    expect(seeded.execution?.netR).toBe("2.41");
    expect(seeded.fills).toHaveLength(4);
  });
});
