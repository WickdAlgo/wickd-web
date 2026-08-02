import {
  appendFillInput,
  appendSignalEventInput,
  createExecutionInput,
  createTradeIdeaInput,
  epochMs,
  moveTradeLevelInput,
  parseContract,
  saveTradeReviewInput,
  tradeDetailV1,
  type AppendFillInput,
  type AppendSignalEventInput,
  type CreateExecutionInput,
  type CreateTradeIdeaInput,
  type Execution,
  type Fill,
  type MoveTradeLevelInput,
  type SaveTradeReviewInput,
  type SignalEvent,
  type TradeDetailV1,
  type TradeReview,
} from "@/contracts";
import { PlatformGatewayError } from "./gateway";

/**
 * An in-memory journal, for the session only.
 *
 * `Wickd.Platform.Api` with PostgreSQL owns this data. This exists so the
 * capture flow can be built and tested before that API does — the forms, the
 * validation, and the write surface are all real; only the storage is not.
 *
 * It is deliberately *not* dressed up as persistence. Nothing writes to
 * `localStorage` or IndexedDB, because a journal that silently survives a
 * refresh but not a device is worse than one that is honestly ephemeral: the
 * first quietly becomes the only copy of something you care about.
 *
 * Everything it produces validates against `TradeDetailV1`, so a captured trade
 * can be exported as JSON and replayed into the API later, or committed as a
 * fixture. That is what stops today's capture from being wasted work.
 */

/** Ids are provisional. The server assigns real ones; these are session-local. */
function localId(prefix: string): string {
  return `${prefix}-local-${Math.random().toString(36).slice(2, 10)}`;
}

export interface JournalStore {
  list(): readonly TradeDetailV1[];
  get(tradeId: string): TradeDetailV1;
  createTrade(input: CreateTradeIdeaInput): TradeDetailV1;
  appendSignalEvent(tradeId: string, input: AppendSignalEventInput): SignalEvent;
  moveTradeLevel(tradeId: string, input: MoveTradeLevelInput): TradeDetailV1;
  createExecution(tradeId: string, input: CreateExecutionInput): Execution;
  appendFill(tradeId: string, input: AppendFillInput): Fill;
  saveReview(tradeId: string, input: SaveTradeReviewInput): TradeReview;
}

export function createJournalStore(seed: readonly TradeDetailV1[]): JournalStore {
  const trades = new Map<string, TradeDetailV1>(seed.map((t) => [t.idea.id, t]));

  function require(tradeId: string): TradeDetailV1 {
    const found = trades.get(tradeId);
    if (!found) {
      throw new PlatformGatewayError("not_found", `no trade named "${tradeId}"`);
    }
    return found;
  }

  /**
   * Re-parses after every mutation.
   *
   * Slower than mutating in place and worth it: the store cannot drift from the
   * contract without failing loudly here, rather than at render time in a view
   * that assumed the payload was already valid.
   */
  function commit(raw: unknown): TradeDetailV1 {
    const parsed = parseContract("TradeDetail", tradeDetailV1, raw);
    trades.set(parsed.idea.id, parsed);
    return parsed;
  }

  /** Drops the fields parsing adds, so a re-parse re-derives them. */
  function stripDerived(
    record: object,
    keys: readonly string[],
  ): Record<string, unknown> {
    const copy = { ...record } as Record<string, unknown>;
    for (const key of keys) delete copy[key];
    return copy;
  }

  /**
   * The wire shape, before normalization re-attaches stamps and sorts.
   *
   * Epoch stamps and sort order are *derived* by the contract's transform, so
   * they are stripped here rather than fed back in. Round-tripping a derived
   * field is how it eventually diverges from the value it was derived from.
   */
  function toRaw(trade: TradeDetailV1): Record<string, unknown> {
    return {
      schemaVersion: 1,
      contract: "trade-detail",
      inspectionRunId: trade.inspectionRunId,
      idea: trade.idea,
      levels: trade.levels.map((l) => stripDerived(l, ["validFromMs", "validUntilMs"])),
      signals: trade.signals.map((s) => stripDerived(s, ["atUtcMs"])),
      execution: trade.execution,
      fills: trade.fills.map((f) => stripDerived(f, ["atUtcMs"])),
      evidenceLinks: trade.evidenceLinks,
      strategyMatches: trade.strategyMatches,
      review: trade.review,
    };
  }

  return {
    list: () => [...trades.values()],
    get: require,

    createTrade(raw) {
      // Inputs are validated on the way in, not merely typed. TypeScript stops
      // at the compiler; a form posting a half-filled level is a runtime fact,
      // and catching it here means the error names the field rather than
      // surfacing later as a trade whose stop has no price.
      const input = parseContract("CreateTradeIdea", createTradeIdeaInput, raw);
      const tradeId = localId("trade");
      const levels = input.levels.map((level) => ({
        id: localId("lvl"),
        tradeIdeaId: tradeId,
        role: level.role,
        ordinal: level.ordinal,
        price: level.price,
        zoneLow: level.zoneLow,
        zoneHigh: level.zoneHigh,
        validFromUtc: level.validFromUtc ?? input.signalTimeUtc,
        validUntilUtc: null,
      }));

      return commit({
        schemaVersion: 1,
        contract: "trade-detail",
        // Optional at capture: a trade thought of before a run was inspected
        // still belongs in the journal. The link can be added later.
        inspectionRunId: input.inspectionRunId ?? "unlinked",
        idea: {
          id: tradeId,
          instrument: input.instrument,
          source: input.source,
          direction: input.direction,
          status: input.status,
          signalTimeUtc: input.signalTimeUtc,
          setupName: input.setupName,
          thesis: input.thesis,
          invalidationSummary: input.invalidationSummary,
          sourceReference: input.sourceReference,
        },
        levels,
        signals: [],
        execution: null,
        fills: [],
        evidenceLinks: [],
        strategyMatches: [],
        review: null,
      });
    },

    appendSignalEvent(tradeId, rawInput) {
      const input = parseContract("AppendSignalEvent", appendSignalEventInput, rawInput);
      const trade = require(tradeId);
      const atMs = epochMs(input.messageTimeUtc);
      // Sequence disambiguates two events at one instant. Counting existing
      // events at the same millisecond is what a server would do.
      const sequence = trade.signals.filter((s) => s.atUtcMs === atMs).length;

      const signal = {
        id: localId("sig"),
        tradeIdeaId: tradeId,
        type: input.type,
        messageTimeUtc: input.messageTimeUtc,
        seenAtUtc: input.seenAtUtc,
        summary: input.summary,
        sequence,
      };

      const raw = toRaw(trade);
      raw.signals = [...(raw.signals as unknown[]), signal];
      const updated = commit(raw);
      return updated.signals.find((s) => s.id === signal.id)!;
    },

    moveTradeLevel(tradeId, rawInput) {
      const input = parseContract("MoveTradeLevel", moveTradeLevelInput, rawInput);
      const trade = require(tradeId);
      const effectiveMs = epochMs(input.effectiveFromUtc);

      const current = trade.levels.find(
        (l) =>
          l.role === input.role &&
          l.ordinal === input.ordinal &&
          l.validUntilMs === null,
      );
      if (current && current.validFromMs > effectiveMs) {
        throw new PlatformGatewayError(
          "invalid",
          "a level cannot be moved to a time before it opened",
        );
      }

      const raw = toRaw(trade);
      const levels = raw.levels as Record<string, unknown>[];

      // Close the level in force rather than editing it, then open its
      // replacement at the same instant. Half-open validity means the two never
      // both appear, and the old price stays readable in replay.
      for (const level of levels) {
        if (level.id === current?.id) level.validUntilUtc = input.effectiveFromUtc;
      }
      levels.push({
        id: localId("lvl"),
        tradeIdeaId: tradeId,
        role: input.role,
        ordinal: input.ordinal,
        price: input.price,
        validFromUtc: input.effectiveFromUtc,
        validUntilUtc: null,
        sourceSignalEventId: input.sourceSignalEventId,
      });

      return commit(raw);
    },

    createExecution(tradeId, rawInput) {
      const input = parseContract("CreateExecution", createExecutionInput, rawInput);
      const trade = require(tradeId);
      if (trade.execution) {
        throw new PlatformGatewayError(
          "invalid",
          `trade "${tradeId}" already has an execution`,
        );
      }

      const execution = {
        id: localId("exec"),
        tradeIdeaId: tradeId,
        accountId: input.accountId,
        mode: input.mode,
        status: input.openedAtUtc ? "open" : "planned",
        openedAtUtc: input.openedAtUtc,
        plannedRiskPct: input.plannedRiskPct,
        plannedRiskAmount: input.plannedRiskAmount,
        mentorReportedR: input.mentorReportedR,
        // grossR, netR, grossPnl, netPnl are absent on purpose. They are
        // computed by the domain layer, and a placeholder here would be a
        // number this browser invented.
      };

      const raw = toRaw(trade);
      raw.execution = execution;
      return commit(raw).execution!;
    },

    appendFill(tradeId, rawInput) {
      const input = parseContract("AppendFill", appendFillInput, rawInput);
      const trade = require(tradeId);
      if (!trade.execution) {
        throw new PlatformGatewayError(
          "invalid",
          "a fill needs an execution to belong to",
        );
      }
      const atMs = epochMs(input.filledAtUtc);
      const sequence = trade.fills.filter((f) => f.atUtcMs === atMs).length;

      const fill = {
        id: localId("fill"),
        executionId: trade.execution.id,
        signalEventId: input.signalEventId,
        role: input.role,
        side: input.side,
        price: input.price,
        quantity: input.quantity,
        feeAmount: input.feeAmount,
        feeAsset: input.feeAsset,
        filledAtUtc: input.filledAtUtc,
        sequence,
      };

      const raw = toRaw(trade);
      raw.fills = [...(raw.fills as unknown[]), fill];
      const updated = commit(raw);
      return updated.fills.find((f) => f.id === fill.id)!;
    },

    saveReview(tradeId, rawInput) {
      const input = parseContract("SaveTradeReview", saveTradeReviewInput, rawInput);
      const trade = require(tradeId);
      const review = {
        tradeIdeaId: tradeId,
        writtenAtUtc: input.writtenAtUtc ?? new Date().toISOString(),
        followedPlan: input.followedPlan,
        summary: input.summary,
        lesson: input.lesson,
      };
      const raw = toRaw(trade);
      raw.review = review;
      return commit(raw).review!;
    },
  };
}
