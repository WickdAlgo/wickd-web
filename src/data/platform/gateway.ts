import type {
  AppendFillInput,
  AppendSignalEventInput,
  BacktestRequest,
  CreateExecutionInput,
  CreateTradeIdeaInput,
  DatasetSummary,
  Execution,
  Fill,
  InspectionDatasetV1,
  JournalEntry,
  MoveTradeLevelInput,
  RunSummary,
  SaveTradeReviewInput,
  SignalEvent,
  StructureEventItem,
  TradeDetailV1,
  TradeReview,
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
  listStructureEvents(runId: string): Promise<readonly StructureEventItem[]>;
  getJournalTail(runId: string, limit?: number): Promise<readonly JournalEntry[]>;

  listTrades(): Promise<readonly TradeSummary[]>;
  /** Throws `PlatformGatewayError` when the trade does not exist. */
  getTrade(tradeId: string): Promise<TradeDetailV1>;

  startBacktest(request: BacktestRequest, signal?: AbortSignal): Promise<RunSummary>;

  // ---------------------------------------------------------------------------
  // Writes
  //
  // `Wickd.Platform.Api` with PostgreSQL owns these once it exists; the fixture
  // implementation keeps them in memory for the session so the capture flow is
  // exercisable and testable now. Adding them here rather than to a separate
  // interface is the point — when the HTTP gateway lands, no view changes.
  //
  // None of them accepts or returns a derived figure. R, PnL, and net risk are
  // computed by the domain layer and arrive on later reads; a capture path that
  // returned them would make this browser the source of truth for exactly the
  // numbers the journal exists to keep honest.
  // ---------------------------------------------------------------------------

  createTrade(input: CreateTradeIdeaInput): Promise<TradeDetailV1>;

  appendSignalEvent(
    tradeId: string,
    input: AppendSignalEventInput,
  ): Promise<SignalEvent>;

  /**
   * Closes the level in force and opens its replacement at the same instant.
   *
   * Named `move` rather than `update` because nothing is updated: the old row
   * keeps its price and gains an end. Overwriting it would destroy the history
   * causal replay reads.
   */
  moveTradeLevel(tradeId: string, input: MoveTradeLevelInput): Promise<TradeDetailV1>;

  createExecution(tradeId: string, input: CreateExecutionInput): Promise<Execution>;
  appendFill(tradeId: string, input: AppendFillInput): Promise<Fill>;
  saveReview(tradeId: string, input: SaveTradeReviewInput): Promise<TradeReview>;
}

export type PlatformGatewayErrorCode =
  | "not_found"
  | "aborted"
  | "unavailable"
  /** The input failed its contract. Carries the issues for the form to show. */
  | "invalid"
  /** Accepted here but not durable yet — see `FixturePlatformGateway`. */
  | "not_persisted";

export class PlatformGatewayError extends Error {
  readonly code: PlatformGatewayErrorCode;

  constructor(code: PlatformGatewayErrorCode, message: string) {
    super(message);
    this.name = "PlatformGatewayError";
    this.code = code;
  }
}
