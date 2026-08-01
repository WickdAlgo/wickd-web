import { describe, expect, it } from "vitest";
import { createFixturePlatformGateway } from "./fixture-gateway";
import { PlatformGatewayError } from "./gateway";

describe("fixture platform gateway", () => {
  const gateway = createFixturePlatformGateway();

  it("lists datasets and runs", async () => {
    await expect(gateway.listDatasets()).resolves.toHaveLength(3);
    await expect(gateway.listRuns()).resolves.toHaveLength(3);
  });

  it("resolves a known inspection run", async () => {
    const run = await gateway.getInspectionRun("phase-3-smoke");
    expect(run.run.datasetAlias).toBe("may6-session");
    expect(run.candles.length).toBeGreaterThan(0);
  });

  it("throws not_found for an unknown run rather than returning empty", async () => {
    // The failure path has to exist now. A gateway that returns `undefined`
    // today teaches every caller to assume success, and those callers break
    // when it becomes a network request.
    await expect(gateway.getInspectionRun("no-such-run")).rejects.toThrow(
      PlatformGatewayError,
    );
    await expect(gateway.getInspectionRun("no-such-run")).rejects.toMatchObject({
      code: "not_found",
    });
  });

  it("throws not_found for an unknown trade", async () => {
    await expect(gateway.getTrade("no-such-trade")).rejects.toMatchObject({
      code: "not_found",
    });
  });

  it("summarizes trades without collapsing reported and actual R", async () => {
    const [trade] = await gateway.listTrades();
    expect(trade.mentorReportedR).toBe("3.20");
    expect(trade.netR).toBe("2.41");
    expect(trade.mentorReportedR).not.toBe(trade.netR);
  });

  it("keeps the journal tail consistent with the inspection run", async () => {
    const tail = await gateway.getJournalTail("phase-3-smoke");
    const run = await gateway.getInspectionRun("phase-3-smoke");
    // Facts become knowable at a candle's close, so the session's last fact can
    // be stamped one interval past the last candle's open — but no later.
    const sessionEndMs =
      Date.parse(run.candles.at(-1)!.openTimeUtc) + run.run.intervalMs;
    expect(tail.length).toBeGreaterThan(0);
    for (const entry of tail) {
      expect(Date.parse(entry.timeUtc)).toBeLessThanOrEqual(sessionEndMs);
    }
  });

  it("runs a backtest and reports a complete run", async () => {
    const run = await gateway.startBacktest({
      datasetAlias: "may6-session",
      runId: "test-run",
      writeStructures: true,
      writeLifecycle: true,
      writeEvidence: false,
    });
    expect(run.status).toBe("complete");
    expect(run.events).toBeGreaterThan(0);
  });

  it("aborts a backtest that is cancelled mid-flight", async () => {
    const controller = new AbortController();
    const pending = gateway.startBacktest(
      {
        datasetAlias: "may6-session",
        runId: "cancelled",
        writeStructures: true,
        writeLifecycle: true,
        writeEvidence: false,
      },
      controller.signal,
    );
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: "aborted" });
  });

  it("rejects a backtest against an unknown dataset", async () => {
    await expect(
      gateway.startBacktest({
        datasetAlias: "nope",
        runId: "r",
        writeStructures: true,
        writeLifecycle: true,
        writeEvidence: false,
      }),
    ).rejects.toMatchObject({ code: "not_found" });
  });
});
