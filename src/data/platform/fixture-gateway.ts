import type {
  BacktestRequest,
  DatasetSummary,
  InspectionDatasetV1,
  JournalEntry,
  RunSummary,
  StructureEventItem,
  TradeDetailV1,
  TradeSummary,
} from "@/contracts";
import {
  datasets,
  journalTail,
  runs,
  structureEvents,
} from "./fixtures/catalog";
import { may6Session } from "./fixtures/may6-session";
import { tradeBtc001 } from "./fixtures/trade-btc-001";
import { PlatformGatewayError, type PlatformGateway } from "./gateway";

/**
 * The gateway backed by fixtures.
 *
 * This is the only implementation until `Wickd.Platform.Api` exists. It is
 * intentionally boring: it looks data up and returns it. The one thing it does
 * *not* do is skip the failure paths — an unknown run id throws the same
 * `not_found` an HTTP gateway would, so the views have to handle it now rather
 * than acquiring the habit of assuming success.
 */

const trades: readonly TradeDetailV1[] = [tradeBtc001];
const inspectionRuns: readonly InspectionDatasetV1[] = [may6Session];

function toSummary(trade: TradeDetailV1): TradeSummary {
  return {
    id: trade.idea.id,
    instrument: trade.idea.instrument,
    source: trade.idea.source,
    direction: trade.idea.direction,
    status: trade.idea.status,
    signalTimeUtc: trade.idea.signalTimeUtc,
    setupName: trade.idea.setupName,
    mentorReportedR: trade.execution?.mentorReportedR,
    netR: trade.execution?.netR,
  };
}

export function createFixturePlatformGateway(): PlatformGateway {
  return {
    async listDatasets(): Promise<readonly DatasetSummary[]> {
      return datasets;
    },

    async listRuns(): Promise<readonly RunSummary[]> {
      return runs;
    },

    async getInspectionRun(runId: string): Promise<InspectionDatasetV1> {
      const found = inspectionRuns.find((r) => r.run.runId === runId);
      if (!found) {
        throw new PlatformGatewayError(
          "not_found",
          `no inspection run named "${runId}"`,
        );
      }
      return found;
    },

    async listStructureEvents(runId: string): Promise<readonly StructureEventItem[]> {
      if (runId !== may6Session.run.runId) return [];
      return structureEvents;
    },

    async getJournalTail(runId: string, limit = 20): Promise<readonly JournalEntry[]> {
      if (runId !== may6Session.run.runId) return [];
      return journalTail.slice(-limit);
    },

    async listTrades(): Promise<readonly TradeSummary[]> {
      return trades.map(toSummary);
    },

    async getTrade(tradeId: string): Promise<TradeDetailV1> {
      const found = trades.find((t) => t.idea.id === tradeId);
      if (!found) {
        throw new PlatformGatewayError("not_found", `no trade named "${tradeId}"`);
      }
      return found;
    },

    async startBacktest(
      request: BacktestRequest,
      signal?: AbortSignal,
    ): Promise<RunSummary> {
      // The shell's original 900ms `setTimeout`, kept because the delay is what
      // makes the running state visible — but abortable, which the original was
      // not. A backtest is the one call here that will really be slow.
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          signal?.removeEventListener("abort", onAbort);
          resolve();
        }, 900);
        const onAbort = () => {
          clearTimeout(timer);
          reject(new PlatformGatewayError("aborted", "backtest cancelled"));
        };
        if (signal?.aborted) return onAbort();
        signal?.addEventListener("abort", onAbort, { once: true });
      });

      const dataset = datasets.find((d) => d.alias === request.datasetAlias);
      if (!dataset) {
        throw new PlatformGatewayError(
          "not_found",
          `no dataset alias "${request.datasetAlias}"`,
        );
      }
      return {
        runId: request.runId,
        datasetAlias: request.datasetAlias,
        events: may6Session.entities.length + may6Session.lifecycle.length,
        status: "complete",
      };
    },
  };
}

/**
 * The gateway the platform routes use.
 *
 * A module constant rather than React context on purpose: the site is static
 * and these routes resolve their data at build time, so there is no client to
 * provide anything to. A provider becomes worth adding when a real request has
 * per-user state — not before.
 */
export const platformGateway: PlatformGateway = createFixturePlatformGateway();
