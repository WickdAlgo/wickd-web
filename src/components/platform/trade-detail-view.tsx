"use client";
import React from "react";
import { StatCard, Tabs, Tag, type TagTone } from "@/components/ui";
import type { InspectionDatasetV1, TradeDetailV1 } from "@/contracts";
import {
  focusRangeForPrimitives,
  StructureChartLazy,
  tradeLayers,
  type ChartLayerInput,
} from "@/features/chart";
import {
  ReplayControls,
  ReplayModeBadge,
  sliceInspectionAsOf,
  sliceTradeAsOf,
  useReplayUrlState,
} from "@/features/replay";
import { panel } from "@/lib/styles";

export interface TradeDetailViewProps {
  trade: TradeDetailV1;
  dataset: InspectionDatasetV1;
}

const signalTone: Record<string, TagTone> = {
  setup: "ic",
  entry: "long",
  entry_update: "ic",
  stop_update: "short",
  target_update: "ic",
  partial_take_profit: "long",
  move_stop_to_breakeven: "sr",
  close: "default",
  cancel: "short",
  commentary: "neutral",
};

function clock(iso: string): string {
  return `${iso.slice(5, 10)} ${iso.slice(11, 16)}`;
}

export function TradeDetailView({ trade, dataset }: TradeDetailViewProps) {
  const url = useReplayUrlState();
  const [tab, setTab] = React.useState("Overview");

  /**
   * Cursor stops are the trade's own moments — signals and fills — plus the
   * structure detections. Those are the instants where the picture changes.
   */
  const stops = React.useMemo(() => {
    const set = new Set<number>();
    for (const s of trade.signals) set.add(s.atUtcMs);
    for (const f of trade.fills) set.add(f.atUtcMs);
    for (const e of dataset.entities) set.add(e.atUtcMs);
    return [...set].sort((a, b) => a - b);
  }, [trade, dataset]);

  const cursorMs =
    url.mode === "causal" ? stops[Math.min(url.step, stops.length - 1)] : null;

  const tradeSlice = React.useMemo(
    () => sliceTradeAsOf(trade, cursorMs ?? null),
    [trade, cursorMs],
  );
  const inspection = React.useMemo(
    () => sliceInspectionAsOf(dataset, cursorMs ?? null),
    [dataset, cursorMs],
  );

  // Structures first (context), then the plan and the fills over them.
  const layers: ChartLayerInput[] = React.useMemo(
    () => [
      ...inspection.layers.map((l) => ({
        id: l.id,
        label: l.label,
        z: l.z,
        primitives: l.primitives,
      })),
      ...tradeLayers({
        levels: tradeSlice.levels,
        fills: tradeSlice.fills,
        direction: trade.idea.direction,
      }),
    ],
    [inspection.layers, tradeSlice.levels, tradeSlice.fills, trade.idea.direction],
  );

  const visibleLayerIds = layers
    .filter((l) => !url.hiddenLayerIds.includes(l.id))
    .map((l) => l.id);

  const focus = React.useMemo(() => {
    const planned = tradeLayers({
      levels: trade.levels,
      fills: trade.fills,
      direction: trade.idea.direction,
    }).flatMap((l) => l.primitives);
    return focusRangeForPrimitives(planned, dataset.candles, {
      paddingRatio: 0.6,
      minCandles: 60,
    });
  }, [trade, dataset.candles]);

  const selectedId = url.selectedEntityId;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tag tone={trade.idea.direction === "long" ? "long" : "short"}>
          {trade.idea.direction}
        </Tag>
        <Tag mono>{trade.idea.instrument.market}</Tag>
        <Tag mono>{trade.idea.instrument.timeframe}</Tag>
        {trade.idea.setupName && <Tag>{trade.idea.setupName}</Tag>}
        <div className="ml-auto flex items-center gap-2">
          <ReplayModeBadge mode={url.mode} atUtcMs={cursorMs} />
          <Tag mono>run: {trade.inspectionRunId}</Tag>
        </div>
      </div>

      <div className={`${panel} px-4 py-3`}>
        <ReplayControls
          mode={url.mode}
          onModeChange={url.setMode}
          step={url.step}
          onStepChange={url.setStep}
          stops={stops}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          <StructureChartLazy
            candles={inspection.candles}
            layers={layers}
            visibleLayerIds={visibleLayerIds}
            selectedId={selectedId}
            onSelect={url.setSelectedEntityId}
            market={trade.idea.instrument.market}
            timeframe={trade.idea.instrument.timeframe}
            modeLabel={url.mode === "final" ? "final view" : "causal replay"}
            focus={focus}
            height={360}
          />

          {/*
            Reported R and net R are separate cards, never one number. They
            measure different things — what the signal source claimed, and what
            the account actually saw — and the gap between them is the reason to
            keep a journal. Neither is computed here.
          */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              label="Reported R"
              value={tradeSlice.execution?.mentorReportedR ?? "—"}
              delta={trade.idea.source === "mentor" ? "as signalled" : "not reported"}
            />
            <StatCard
              label="Your net R"
              value={tradeSlice.execution?.netR ?? "—"}
              // A captured trade has no result until the domain layer computes
              // one. Saying so beats an em dash that reads like a data bug.
              delta={
                tradeSlice.execution && tradeSlice.execution.netR === undefined
                  ? "pending settlement"
                  : "after fees"
              }
              tone={
                tradeSlice.execution?.netR === undefined
                  ? undefined
                  : Number(tradeSlice.execution.netR) >= 0
                    ? "long"
                    : "short"
              }
            />
            <StatCard
              label="Net PnL"
              value={tradeSlice.execution?.netPnl ?? "—"}
              delta={tradeSlice.execution ? "USDT" : undefined}
            />
            <StatCard
              label="Planned risk"
              value={tradeSlice.execution?.plannedRiskPct ?? "—"}
              delta={tradeSlice.execution ? "% of account" : undefined}
            />
          </div>

          <Timeline slice={tradeSlice} onSelect={url.setSelectedEntityId} selectedId={selectedId} />
        </div>

        <div className="flex flex-col gap-4">
          <div className={`${panel} overflow-hidden`}>
            <div className="px-4 pt-2.5">
              <Tabs
                items={["Overview", "Execution", "Evidence", "Review"]}
                active={tab}
                onChange={setTab}
              />
            </div>
            <div className="p-4">
              {tab === "Overview" && <Overview trade={trade} slice={tradeSlice} />}
              {tab === "Execution" && <Execution slice={tradeSlice} />}
              {tab === "Evidence" && <Evidence trade={trade} dataset={dataset} slice={inspection} />}
              {tab === "Review" && <Review slice={tradeSlice} trade={trade} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="font-ui mb-1.5 text-[10px] font-medium uppercase tracking-[1px] text-ink-secondary">
        {title}
      </div>
      {children}
    </div>
  );
}

function Overview({
  trade,
  slice,
}: {
  trade: TradeDetailV1;
  slice: ReturnType<typeof sliceTradeAsOf>;
}) {
  return (
    <>
      <Section title="Thesis">
        <p className="font-ui m-0 text-[13px] leading-[1.6] tracking-[0.3px]">
          {trade.idea.thesis ?? "No thesis recorded."}
        </p>
      </Section>
      <Section title="Invalidation">
        <p className="font-ui m-0 text-[13px] leading-[1.6] tracking-[0.3px] text-ink-secondary">
          {trade.idea.invalidationSummary ?? "Not stated."}
        </p>
      </Section>
      <Section title="Levels in force">
        {slice.levels.length === 0 ? (
          <p className="font-ui m-0 text-[12px] text-ink-tertiary">
            Nothing was in force yet at this point.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <tbody>
              {slice.levels.map((l) => (
                <tr key={l.id}>
                  <td className="font-ui border-b border-hairline py-1.5 text-[12px] capitalize">
                    {l.role}
                    {l.role === "target" ? ` ${l.ordinal}` : ""}
                  </td>
                  <td className="font-mono border-b border-hairline py-1.5 text-right text-[12px]">
                    {l.price ?? `${l.zoneLow}–${l.zoneHigh}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
      <Section title="Strategy match">
        {trade.strategyMatches.length === 0 ? (
          <p className="font-ui m-0 text-[12px] text-ink-tertiary">Not evaluated.</p>
        ) : (
          trade.strategyMatches.map((m) => (
            <div key={m.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px]">{m.modelName}</span>
                <Tag tone={m.status === "matched" ? "long" : m.status === "partial" ? "breaker" : "neutral"}>
                  {m.status}
                </Tag>
                {m.score !== undefined && (
                  <span className="font-mono text-[11px] text-ink-secondary">
                    {m.score.toFixed(2)}
                  </span>
                )}
              </div>
              {m.note && (
                <span className="font-ui text-[12px] text-ink-secondary">{m.note}</span>
              )}
            </div>
          ))
        )}
      </Section>
    </>
  );
}

function Execution({ slice }: { slice: ReturnType<typeof sliceTradeAsOf> }) {
  if (!slice.execution) {
    return (
      <p className="font-ui m-0 text-[12px] text-ink-tertiary">
        The execution had not opened yet at this point in the replay.
      </p>
    );
  }
  const e = slice.execution;
  return (
    <>
      <Section title="Execution">
        <div className="flex flex-wrap items-center gap-2">
          <Tag>{e.mode.replace(/_/g, " ")}</Tag>
          <Tag tone={e.status === "closed" ? "default" : "long"}>{e.status}</Tag>
        </div>
      </Section>
      <Section title="Fills">
        <table className="w-full border-collapse">
          <tbody>
            {slice.fills.map((f) => (
              <tr key={f.id}>
                <td className="font-ui border-b border-hairline py-1.5 text-[12px] capitalize">
                  {f.role.replace(/_/g, " ")}
                </td>
                <td className="font-mono border-b border-hairline py-1.5 text-right text-[12px]">
                  {f.quantity} @ {f.price}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Section title="Result">
        <table className="w-full border-collapse">
          <tbody>
            <Row label="Reported R" value={e.mentorReportedR ?? "—"} />
            <Row label="Gross R" value={e.grossR ?? "—"} />
            <Row label="Net R" value={e.netR ?? "—"} />
            <Row label="Gross PnL" value={e.grossPnl ?? "—"} />
            <Row label="Net PnL" value={e.netPnl ?? "—"} />
          </tbody>
        </table>
      </Section>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="font-ui border-b border-hairline py-1.5 text-[12px] text-ink-secondary">
        {label}
      </td>
      <td className="font-mono border-b border-hairline py-1.5 text-right text-[12px]">
        {value}
      </td>
    </tr>
  );
}

function Evidence({
  trade,
  dataset,
  slice,
}: {
  trade: TradeDetailV1;
  dataset: InspectionDatasetV1;
  slice: ReturnType<typeof sliceInspectionAsOf>;
}) {
  const known = new Set(slice.entities.map((e) => e.id));
  return (
    <Section title="Structure evidence">
      {trade.evidenceLinks.map((link) => {
        const entity = dataset.entities.find((e) => e.id === link.inspectionEntityId);
        const visible = known.has(link.inspectionEntityId);
        return (
          <div key={link.id} className="border-b border-hairline py-2 last:border-b-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-ui text-[12px] font-medium">
                {entity?.label ?? link.inspectionEntityId}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.5px] text-ink-tertiary">
                {link.role.replace(/_/g, " ")}
              </span>
              {!visible && <Tag>not yet known</Tag>}
            </div>
            {link.note && (
              <div className="font-ui mt-0.5 text-[12px] text-ink-secondary">{link.note}</div>
            )}
          </div>
        );
      })}
    </Section>
  );
}

function Review({
  slice,
  trade,
}: {
  slice: ReturnType<typeof sliceTradeAsOf>;
  trade: TradeDetailV1;
}) {
  if (!slice.review) {
    return (
      <p className="font-ui m-0 text-[12px] text-ink-tertiary">
        The review was written on {trade.review ? clock(trade.review.writtenAtUtc) : "—"}, after
        this point in the replay.
      </p>
    );
  }
  return (
    <>
      <Section title="Followed the plan">
        <Tag tone={slice.review.followedPlan ? "long" : "short"}>
          {slice.review.followedPlan ? "yes" : "no"}
        </Tag>
      </Section>
      <Section title="Summary">
        <p className="font-ui m-0 text-[13px] leading-[1.6] tracking-[0.3px]">
          {slice.review.summary}
        </p>
      </Section>
      {slice.review.lesson && (
        <Section title="Lesson">
          <p className="font-ui m-0 text-[13px] leading-[1.6] tracking-[0.3px] text-ink-secondary">
            {slice.review.lesson}
          </p>
        </Section>
      )}
    </>
  );
}

/** Signals and fills on one time-ordered track, synchronized with the chart. */
function Timeline({
  slice,
  onSelect,
  selectedId,
}: {
  slice: ReturnType<typeof sliceTradeAsOf>;
  onSelect(id: string | null): void;
  selectedId: string | null;
}) {
  const items = React.useMemo(
    () =>
      [
        ...slice.signals.map((s) => ({
          id: s.id,
          at: s.atUtcMs,
          iso: s.messageTimeUtc,
          kind: "signal" as const,
          label: s.type.replace(/_/g, " "),
          detail: s.summary,
          tone: signalTone[s.type] ?? "neutral",
        })),
        ...slice.fills.map((f) => ({
          id: f.id,
          at: f.atUtcMs,
          iso: f.filledAtUtc,
          kind: "fill" as const,
          label: f.role.replace(/_/g, " "),
          detail: `${f.quantity} @ ${f.price}${f.feeAmount ? ` · fee ${f.feeAmount}` : ""}`,
          tone: (f.side === "buy" ? "long" : "short") as TagTone,
        })),
      ].sort((a, b) => a.at - b.at),
    [slice.signals, slice.fills],
  );

  return (
    <div className={`${panel} overflow-hidden`}>
      <div className="font-ui border-b border-hairline px-4 py-2.5 text-[10px] font-medium uppercase tracking-[1px] text-ink-secondary">
        Timeline
      </div>
      {items.length === 0 ? (
        <div className="font-ui p-6 text-center text-[13px] text-ink-secondary">
          Nothing had happened yet at this point in the replay.
        </div>
      ) : (
        <ol className="m-0 list-none p-0">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(selectedId === item.id ? null : item.id)}
                aria-pressed={selectedId === item.id}
                className={`flex w-full cursor-pointer items-baseline gap-3 border-0 border-b border-hairline px-4 py-2.5 text-left [transition:background_var(--transition-fast)] ${
                  selectedId === item.id ? "bg-subtle" : "bg-transparent"
                }`}
              >
                <span className="font-mono w-[86px] flex-none text-[11.5px] text-ink-secondary">
                  {clock(item.iso)}
                </span>
                <Tag tone={item.tone}>{item.label}</Tag>
                <span className="font-ui text-[12px] leading-[1.5] text-ink-secondary">
                  {item.detail}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
