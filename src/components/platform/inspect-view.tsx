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
import type {
  DatasetSummary,
  InspectionDatasetV1,
  InspectionEvidence,
  InspectionRelation,
  StructureEventItem,
} from "@/contracts";
import {
  focusRangeForPrimitives,
  StructureChartLazy,
} from "@/features/chart";
import {
  ReplayControls,
  ReplayModeBadge,
  sliceInspectionAsOf,
  useReplayUrlState,
} from "@/features/replay";
import { panel } from "@/lib/styles";

export interface InspectViewProps {
  datasets: readonly DatasetSummary[];
  events: readonly StructureEventItem[];
  dataset: InspectionDatasetV1;
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

const stateTone: Record<string, TagTone> = {
  active: "long",
  mitigated: "default",
  invalidated: "short",
  expired: "default",
  forming: "neutral",
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

export function InspectView({ datasets, events, dataset }: InspectViewProps) {
  const url = useReplayUrlState();
  const [tab, setTab] = React.useState("Structures");

  /**
   * The cursor stops are the moments something became knowable.
   *
   * Stepping by candle would mean 372 stops where nothing changes for most of
   * them. Stepping by fact means every move of the slider is a move that shows
   * or hides something.
   */
  const stops = React.useMemo(() => {
    const set = new Set<number>();
    for (const e of dataset.entities) set.add(e.atUtcMs);
    for (const l of dataset.lifecycle) set.add(l.atUtcMs);
    return [...set].sort((a, b) => a - b);
  }, [dataset]);

  const cursorMs = url.mode === "causal" ? stops[Math.min(url.step, stops.length - 1)] : null;

  const slice = React.useMemo(
    () => sliceInspectionAsOf(dataset, cursorMs ?? null),
    [dataset, cursorMs],
  );

  const visibleLayerIds = React.useMemo(
    () => slice.layers.filter((l) => !url.hiddenLayerIds.includes(l.id)).map((l) => l.id),
    [slice.layers, url.hiddenLayerIds],
  );

  /**
   * The chart and the list select the same thing. Primitives carry an
   * `entityId`, so clicking a zone highlights its row and clicking a row
   * highlights its zone.
   */
  const selectedPrimitiveId = React.useMemo(() => {
    if (!url.selectedEntityId) return null;
    for (const layer of slice.layers) {
      const hit = layer.primitives.find((p) => p.entityId === url.selectedEntityId);
      if (hit) return hit.id;
    }
    return null;
  }, [slice.layers, url.selectedEntityId]);

  const selectPrimitive = (primitiveId: string | null) => {
    if (primitiveId === null) return url.setSelectedEntityId(null);
    for (const layer of slice.layers) {
      const hit = layer.primitives.find((p) => p.id === primitiveId);
      if (hit?.entityId) {
        url.setSelectedEntityId(hit.entityId);
        setTab("Detail");
        return;
      }
    }
  };

  // Only structures that are knowable at the cursor appear in the list.
  const visibleEvents = React.useMemo(() => {
    const known = new Set(slice.entities.map((e) => e.id));
    return events.filter((e) => known.has(e.entityId));
  }, [events, slice.entities]);

  const selectedEntity = slice.entities.find((e) => e.id === url.selectedEntityId) ?? null;
  const selectedEvent = visibleEvents.find((e) => e.entityId === url.selectedEntityId) ?? null;

  const evidence = React.useMemo(
    () =>
      url.selectedEntityId
        ? dataset.evidence.filter((ev) => ev.entityId === url.selectedEntityId)
        : [],
    [dataset.evidence, url.selectedEntityId],
  );
  const relations = React.useMemo(
    () =>
      url.selectedEntityId
        ? dataset.relations.filter(
            (r) => r.fromEntityId === url.selectedEntityId || r.toEntityId === url.selectedEntityId,
          )
        : [],
    [dataset.relations, url.selectedEntityId],
  );

  const focus = React.useMemo(
    () =>
      focusRangeForPrimitives(
        dataset.layers.flatMap((l) => l.primitives),
        dataset.candles,
      ),
    [dataset],
  );

  const orderBlocks = dataset.entities.filter((e) => e.family === "order_block");
  const sweeps = dataset.entities.filter((e) => e.family === "liquidity_sweep");

  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-[200px]">
            <Select
              label="Dataset"
              mono
              options={datasets.map((d) => d.alias)}
              defaultValue={dataset.run.datasetAlias}
            />
          </div>
          <div className="w-[120px]">
            <Select
              label="Timeframe"
              mono
              options={["1m", "5m", "15m", "1h"]}
              defaultValue={dataset.run.instrument.timeframe}
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ReplayModeBadge mode={url.mode} atUtcMs={cursorMs} />
            <Tag mono>run: {dataset.run.runId}</Tag>
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

        <StructureChartLazy
          candles={slice.candles}
          layers={slice.layers}
          visibleLayerIds={visibleLayerIds}
          selectedId={selectedPrimitiveId}
          onSelect={selectPrimitive}
          market={dataset.run.instrument.market}
          timeframe={dataset.run.instrument.timeframe}
          modeLabel={url.mode === "final" ? "final view" : "causal replay"}
          focus={focus}
          height={330}
        />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Candles replayed" value={slice.candles.length.toLocaleString()} />
          <StatCard
            label="Structures known"
            value={slice.entities.length.toLocaleString()}
            delta={`of ${dataset.entities.length}`}
          />
          <StatCard
            label="Order blocks"
            value={orderBlocks.length.toLocaleString()}
            delta={`${slice.entities.filter((e) => e.family === "order_block" && e.state === "mitigated").length} mitigated`}
            tone="long"
          />
          <StatCard
            label="Liquidity sweeps"
            value={sweeps.length.toLocaleString()}
            delta={`${slice.entities.filter((e) => e.family === "liquidity_sweep" && e.state === "invalidated").length} failed`}
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
            {dataset.layers.map((layer) => (
              <Switch
                key={layer.id}
                label={layer.label}
                checked={!url.hiddenLayerIds.includes(layer.id)}
                onChange={(v) => url.toggleLayer(layer.id, v)}
              />
            ))}
          </div>
        </div>

        <div className={`${panel} overflow-hidden`}>
          <div className="px-4 pt-2.5">
            <Tabs items={["Structures", "Detail"]} active={tab} onChange={setTab} />
          </div>
          {tab === "Structures" ? (
            visibleEvents.length === 0 ? (
              <div className="font-ui p-6 text-center text-[13px] text-ink-secondary">
                Nothing had been detected yet at this point in the replay.
              </div>
            ) : (
              <div>
                {visibleEvents.map((e) => (
                  <StructureEventRow
                    key={e.id}
                    time={clockTime(e.timeUtc)}
                    kind={familyTone[e.family]}
                    label={e.label}
                    detail={e.detail}
                    selected={url.selectedEntityId === e.entityId}
                    onInspect={() => {
                      url.setSelectedEntityId(e.entityId);
                      setTab("Detail");
                    }}
                  />
                ))}
              </div>
            )
          ) : (
            <EntityDetail
              event={selectedEvent}
              state={selectedEntity?.state ?? null}
              detector={selectedEntity?.detector ?? null}
              evidence={evidence}
              relations={relations}
              runId={dataset.run.runId}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Evidence and relations for the selected structure.
 *
 * The point of the inspection surface: a structure is not a shape on a chart,
 * it is a claim with observations behind it and links to the structures it
 * caused or was caused by.
 */
function EntityDetail({
  event,
  state,
  detector,
  evidence,
  relations,
  runId,
}: {
  event: StructureEventItem | null;
  state: string | null;
  detector: string | null;
  evidence: readonly InspectionEvidence[];
  relations: readonly InspectionRelation[];
  runId: string;
}) {
  if (!event) {
    return (
      <div className="font-ui p-6 text-center text-[13px] text-ink-secondary">
        Select a structure on the chart or in the list.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone={familyTone[event.family]}>{event.label}</Tag>
          {state && <Tag tone={stateTone[state] ?? "neutral"}>{state}</Tag>}
        </div>
        <div className="font-mono mt-2.5 text-[12px] text-ink-secondary">
          known at {event.timeUtc}
        </div>
        <div className="font-ui mt-1.5 text-[13px] leading-[1.6] tracking-[0.3px]">
          {event.detail}
        </div>
      </div>

      <DetailSection title="Evidence">
        {evidence.length === 0 ? (
          <Empty>No observations recorded.</Empty>
        ) : (
          evidence.map((ev) => (
            <div key={ev.id} className="border-b border-hairline py-2 last:border-b-0">
              <div className="flex items-baseline gap-2">
                <span className="font-ui text-[12px] font-medium">{ev.label}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.5px] text-ink-tertiary">
                  {ev.role}
                </span>
              </div>
              {ev.detail && (
                <div className="font-ui mt-0.5 text-[12px] text-ink-secondary">{ev.detail}</div>
              )}
            </div>
          ))
        )}
      </DetailSection>

      <DetailSection title="Relations">
        {relations.length === 0 ? (
          <Empty>Not linked to another structure.</Empty>
        ) : (
          relations.map((r) => (
            <div key={r.id} className="font-mono py-1 text-[11.5px] tracking-[0.3px]">
              <span className="text-ink-secondary">
                {r.fromEntityId === event.entityId ? "this" : r.fromEntityId}
              </span>
              <span className="px-1.5 text-ic">{r.type}</span>
              <span className="text-ink-secondary">
                {r.toEntityId === event.entityId ? "this" : r.toEntityId}
              </span>
            </div>
          ))
        )}
      </DetailSection>

      <pre className="font-mono overflow-x-auto rounded-md bg-inverse p-3 text-[11px] leading-[1.6] text-ink-inverse-muted">
        {JSON.stringify(
          {
            entityId: event.entityId,
            knownAt: event.timeUtc,
            family: event.family,
            state,
            detector,
            runId,
          },
          null,
          1,
        )}
      </pre>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-ui mb-1.5 text-[10px] font-medium uppercase tracking-[1px] text-ink-secondary">
        {title}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="font-ui text-[12px] text-ink-tertiary">{children}</div>;
}
