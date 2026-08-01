"use client";
import React from "react";
import {
  CandleChart,
  Select,
  StatCard,
  StructureEventRow,
  Switch,
  Tabs,
  Tag,
  type TagTone,
} from "@/components/ui";
import type { DatasetSummary, StructureEventItem } from "@/contracts";
import { panel } from "@/lib/styles";

export interface InspectViewProps {
  datasets: readonly DatasetSummary[];
  events: readonly StructureEventItem[];
  runId: string;
  datasetAlias: string;
  timeframe: string;
  candleCount: number;
  structureCount: number;
  orderBlockCount: number;
  mitigatedCount: number;
  sweepCount: number;
  failedSweepCount: number;
}

/**
 * Maps a structure family onto the design system's `Tag` vocabulary.
 *
 * The chart color convention is the engine's, not this component's — blue for
 * IC and FVG, sage for bullish, rose for bearish, gray for the rest.
 */
const familyTone: Record<StructureEventItem["family"], TagTone> = {
  indecision_candle: "ic",
  fvg: "fvg",
  order_block: "bullish",
  swing: "bullish",
  liquidity_pool: "default",
  liquidity_sweep: "default",
  market_structure_break: "default",
  breaker: "breaker",
  ote: "ote",
};

/**
 * `2026-05-06T14:20:00.000Z` -> `05-06 14:20`.
 *
 * The date matters: a session spans 31 hours, so a bare clock time is ambiguous
 * and made an ascending list look unsorted.
 */
function clockTime(iso: string): string {
  return `${iso.slice(5, 10)} ${iso.slice(11, 16)}`;
}

export function InspectView({
  datasets,
  events,
  runId,
  datasetAlias,
  timeframe,
  candleCount,
  structureCount,
  orderBlockCount,
  mitigatedCount,
  sweepCount,
  failedSweepCount,
}: InspectViewProps) {
  const [ov, setOv] = React.useState({ ob: true, fvg: true, liq: true, swing: true });
  const [sel, setSel] = React.useState(0);
  const [tab, setTab] = React.useState("Structures");

  const selected = events[sel];

  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-[200px]">
            <Select
              label="Dataset"
              mono
              options={datasets.map((d) => d.alias)}
              defaultValue={datasetAlias}
            />
          </div>
          <div className="w-[120px]">
            <Select
              label="Timeframe"
              mono
              options={["1m", "5m", "15m", "1h"]}
              defaultValue={timeframe}
            />
          </div>
          <div className="ml-auto">
            <Tag mono>run: {runId}</Tag>
          </div>
        </div>
        <CandleChart
          height={330}
          showOB={ov.ob}
          showFVG={ov.fvg}
          showLiquidity={ov.liq}
          showSwing={ov.swing}
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Candles replayed" value={candleCount.toLocaleString()} />
          <StatCard label="Structure events" value={structureCount.toLocaleString()} />
          <StatCard
            label="Order blocks"
            value={orderBlockCount.toLocaleString()}
            delta={`${mitigatedCount} mitigated`}
            tone="long"
          />
          <StatCard
            label="Liquidity sweeps"
            value={sweepCount.toLocaleString()}
            delta={`${failedSweepCount} failed`}
            tone="short"
          />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className={`${panel} px-4 py-3.5`}>
          <div className="font-ui mb-3 text-[10px] font-medium uppercase tracking-[1px] text-ink-secondary">
            Overlays
          </div>
          <div className="flex flex-col gap-2.5">
            <Switch label="Order blocks" checked={ov.ob} onChange={(v) => setOv({ ...ov, ob: v })} />
            <Switch label="Fair value gaps" checked={ov.fvg} onChange={(v) => setOv({ ...ov, fvg: v })} />
            <Switch label="Liquidity" checked={ov.liq} onChange={(v) => setOv({ ...ov, liq: v })} />
            <Switch label="Swing legs" checked={ov.swing} onChange={(v) => setOv({ ...ov, swing: v })} />
          </div>
        </div>
        <div className={`${panel} overflow-hidden`}>
          <div className="px-4 pt-2.5">
            <Tabs items={["Structures", "Detail"]} active={tab} onChange={setTab} />
          </div>
          {tab === "Structures" ? (
            <div>
              {events.map((e, i) => (
                <StructureEventRow
                  key={e.id}
                  time={clockTime(e.timeUtc)}
                  kind={familyTone[e.family]}
                  label={e.label}
                  detail={e.detail}
                  selected={sel === i}
                  onInspect={() => {
                    setSel(i);
                    setTab("Detail");
                  }}
                />
              ))}
            </div>
          ) : (
            selected && (
              <div className="p-4">
                <Tag tone={familyTone[selected.family]}>{selected.label}</Tag>
                <div className="font-mono mt-3 mb-2 text-[12px] text-ink-secondary">
                  {selected.timeUtc}
                </div>
                <div className="font-ui text-[13px] leading-[1.6] tracking-[0.3px]">
                  {selected.detail}
                </div>
                <pre className="font-mono mt-3.5 overflow-x-auto rounded-md bg-inverse p-3 text-[11px] leading-[1.6] text-ink-inverse-muted">
                  {JSON.stringify(
                    {
                      knownAt: selected.timeUtc,
                      entityId: selected.entityId,
                      family: selected.family,
                      detail: selected.detail,
                      runId,
                    },
                    null,
                    1,
                  )}
                </pre>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
