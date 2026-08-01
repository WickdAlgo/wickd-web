"use client";
import React from "react";
import type { ChartCandle, InspectionPrimitive } from "@/contracts";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useThemeEpoch } from "@/lib/use-theme-epoch";
import { OverlayLayer } from "./overlay/overlay-layer";
import { useLightweightChart } from "./use-lightweight-chart";

/**
 * The platform's inspection chart.
 *
 * Deliberately **not** exported from `@/components/ui`. That barrel is imported
 * by every marketing page, and a barrel export would pull a canvas library into
 * the home page's bundle. `CandleChart` remains the design system's chart and
 * still serves the marketing routes unchanged; this is a separate,
 * platform-only component.
 *
 * Import it through `next/dynamic` with `ssr: false` — see `index.ts`.
 */

export interface ChartLayerInput {
  id: string;
  label: string;
  z: "under" | "over";
  primitives: readonly InspectionPrimitive[];
}

export interface StructureChartProps {
  candles: readonly ChartCandle[];
  layers: readonly ChartLayerInput[];
  /** Layer ids currently shown. Omit to show everything. */
  visibleLayerIds?: readonly string[];
  selectedId?: string | null;
  onSelect?(id: string | null): void;
  market: string;
  timeframe: string;
  /** Replaces the "deterministic replay" caption — the Final/Causal label. */
  modeLabel?: string;
  height?: number;
  /** Opening view. Defaults to the whole dataset. */
  focus?: { fromUtc: string; toUtc: string } | null;
}

export function StructureChart({
  candles,
  layers,
  visibleLayerIds,
  selectedId = null,
  onSelect,
  market,
  timeframe,
  modeLabel = "deterministic replay",
  height = 330,
  focus = null,
}: StructureChartProps) {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const themeEpoch = useThemeEpoch();

  const { containerRef, projection } = useLightweightChart({
    candles,
    themeEpoch,
    reducedMotion,
    height,
    focus,
  });

  const shown = React.useMemo(
    () =>
      visibleLayerIds === undefined
        ? layers
        : layers.filter((l) => visibleLayerIds.includes(l.id)),
    [layers, visibleLayerIds],
  );

  const under = React.useMemo(
    () => shown.filter((l) => l.z === "under").flatMap((l) => l.primitives),
    [shown],
  );
  const over = React.useMemo(
    () => shown.filter((l) => l.z === "over").flatMap((l) => l.primitives),
    [shown],
  );

  const handleSelect = React.useCallback(
    (id: string | null) => onSelect?.(id),
    [onSelect],
  );

  return (
    <div
      className="relative overflow-hidden rounded-cards border border-hairline bg-(--chart-canvas)"
      style={{ height: height + HEADER_HEIGHT }}
    >
      <div className="flex items-center gap-3 border-b border-hairline bg-card px-3.5 py-2.5">
        <span className="font-mono text-caption text-ink">{market}</span>
        <span className="font-mono text-caption text-ink-secondary">{timeframe}</span>
        <span className="font-ui ml-auto text-[11px] tracking-[0.3px] text-ink-secondary">
          {modeLabel}
        </span>
      </div>

      <div className="relative" style={{ height }}>
        {/* Clicking empty chart clears the selection, matching the panel. */}
        <div
          ref={containerRef}
          className="absolute inset-0"
          onClick={() => handleSelect(null)}
        />

        {projection && (
          <>
            <OverlayLayer
              depth="under"
              primitives={under}
              projection={projection}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={handleSelect}
              onHover={setHoveredId}
              reducedMotion={reducedMotion}
            />
            <OverlayLayer
              depth="over"
              primitives={over}
              projection={projection}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={handleSelect}
              onHover={setHoveredId}
              reducedMotion={reducedMotion}
            />
          </>
        )}
      </div>
    </div>
  );
}

const HEADER_HEIGHT = 41;

export default StructureChart;
