import type {
  BacktestRequest,
  DatasetSummary,
  InspectionDatasetV1,
  JournalEntry,
  RunSummary,
  StructureEventRow,
  TradeDetailV1,
  TradeSummary,
} from "@/contracts";

/**
 * The platform's one data boundary.
 *
 * Every view depends on this interface rather than on the module that happens
 * to hold the data today. When `Wickd.Platform.Api` exists, an
 * `HttpPlatformGateway` implements the same methods and no component changes.
 *
 * Two rules keep that promise real:
 *
 * 1. **Everything is async, including the fixture implementation.** A method
 *    that is synchronous today acquires synchronous callers, and every one of
 *    them breaks when it becomes a network call.
 * 2. **Everything returns parsed contract types.** Validation happens on this
 *    side of the boundary, so a view never sees a payload that has not been
 *    checked.
 */
export interface PlatformGateway {
  listDatasets(): Promise<readonly DatasetSummary[]>;
  listRuns(): Promise<readonly RunSummary[]>;

  /** Throws `PlatformGatewayError` when the run does not exist. */
  getInspectionRun(runId: string): Promise<InspectionDatasetV1>;
  listStructureEvents(runId: string): Promise<readonly StructureEventRow[]>;
  getJournalTail(runId: string, limit?: number): Promise<readonly JournalEntry[]>;

  listTrades(): Promise<readonly TradeSummary[]>;
  /** Throws `PlatformGatewayError` when the trade does not exist. */
  getTrade(tradeId: string): Promise<TradeDetailV1>;

  startBacktest(request: BacktestRequest, signal?: AbortSignal): Promise<RunSummary>;
}

export type PlatformGatewayErrorCode = "not_found" | "aborted" | "unavailable";

export class PlatformGatewayError extends Error {
  readonly code: PlatformGatewayErrorCode;

  constructor(code: PlatformGatewayErrorCode, message: string) {
    super(message);
    this.name = "PlatformGatewayError";
    this.code = code;
  }
}
