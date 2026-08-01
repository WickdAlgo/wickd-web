"use client";
import React from "react";
import {
  Select,
  StatCard,
  StructureEventRow,
  Switch,
  Tabs,
  Tag,
  type TagTone,
} from "@/components/ui";
import type { ChartCandle, DatasetSummary, StructureEventItem } from "@/contracts";
import {
  focusRangeForPrimitives,
  StructureChartLazy,
  type ChartLayerInput,
} from "@/features/chart";
import { panel } from "@/lib/styles";

export interface InspectViewProps {
  datasets: readonly DatasetSummary[];
  events: readonly StructureEventItem[];
  candles: readonly ChartCandle[];
  layers: readonly ChartLayerInput[];
  runId: string;
  datasetAlias: string;
  market: string;
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
  candles,
  layers,
  runId,
  datasetAlias,
  market,
  timeframe,
  candleCount,
  structureCount,
  orderBlockCount,
  mitigatedCount,
  sweepCount,
  failedSweepCount,
}: InspectViewProps) {
  const [hidden, setHidden] = React.useState<readonly string[]>([]);
  const [selectedEntityId, setSelectedEntityId] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState("Structures");

  const visibleLayerIds = React.useMemo(
    () => layers.filter((l) => !hidden.includes(l.id)).map((l) => l.id),
    [layers, hidden],
  );

  const toggleLayer = (id: string, on: boolean) =>
    setHidden((h) => (on ? h.filter((x) => x !== id) : [...h, id]));

  /**
   * The chart and the list select the same thing.
   *
   * Primitives carry an `entityId`, so selecting a shape and selecting a row
   * resolve to one identity — clicking a zone highlights its row, and clicking
   * a row highlights its zone.
   */
  const selectedPrimitiveId = React.useMemo(() => {
    if (!selectedEntityId) return null;
    for (const layer of layers) {
      const hit = layer.primitives.find((p) => p.entityId === selectedEntityId);
      if (hit) return hit.id;
    }
    return null;
  }, [layers, selectedEntityId]);

  const selectPrimitive = (primitiveId: string | null) => {
    if (primitiveId === null) return setSelectedEntityId(null);
    for (const layer of layers) {
      const hit = layer.primitives.find((p) => p.id === primitiveId);
      if (hit?.entityId) {
        setSelectedEntityId(hit.entityId);
        setTab("Detail");
        return;
      }
    }
  };

  const selected = events.find((e) => e.entityId === selectedEntityId) ?? events[0];

  // Open on the structures rather than the whole session, so a five-minute
  // order block is large enough to see and to click.
  const focus = React.useMemo(
    () => focusRangeForPrimitives(layers.flatMap((l) => l.primitives), candles),
    [layers, candles],
  );

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
        <StructureChartLazy
          candles={candles}
          layers={layers}
          visibleLayerIds={visibleLayerIds}
          selectedId={selectedPrimitiveId}
          onSelect={selectPrimitive}
          market={market}
          timeframe={timeframe}
          focus={focus}
          height={330}
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
          {/* Driven by the contract's layers, not a hardcoded list — a new
              layer in the dataset gets a toggle without a code change. */}
          <div className="flex flex-col gap-2.5">
            {layers.map((layer) => (
              <Switch
                key={layer.id}
                label={layer.label}
                checked={!hidden.includes(layer.id)}
                onChange={(v) => toggleLayer(layer.id, v)}
              />
            ))}
          </div>
        </div>
        <div className={`${panel} overflow-hidden`}>
          <div className="px-4 pt-2.5">
            <Tabs items={["Structures", "Detail"]} active={tab} onChange={setTab} />
          </div>
          {tab === "Structures" ? (
            <div>
              {events.map((e) => (
                <StructureEventRow
                  key={e.id}
                  time={clockTime(e.timeUtc)}
                  kind={familyTone[e.family]}
                  label={e.label}
                  detail={e.detail}
                  selected={selectedEntityId === e.entityId}
                  onInspect={() => {
                    setSelectedEntityId(e.entityId);
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
