"use client";
import dynamic from "next/dynamic";
import type { StructureChartProps } from "./structure-chart";

/**
 * `StructureChart`, loaded on demand and never on the server.
 *
 * `ssr: false` is doing two jobs. It keeps `lightweight-charts` out of the
 * OpenNext worker bundle, which matters because the Worker has a hard size
 * limit. And it removes the hydration question entirely: the chart reads design
 * tokens off a mounted element, which cannot happen during prerender, so there
 * is no server HTML to mismatch.
 */
export const StructureChartLazy = dynamic<StructureChartProps>(
  () => import("./structure-chart").then((m) => m.StructureChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
);

/**
 * Holds the chart's exact footprint so nothing below it moves when the real
 * chart arrives.
 */
function ChartSkeleton() {
  return (
    <div
      className="relative overflow-hidden rounded-cards border border-hairline bg-(--chart-canvas)"
      style={{ height: 371 }}
    >
      <div className="flex items-center gap-3 border-b border-hairline bg-card px-3.5 py-2.5">
        <span className="font-ui text-[11px] tracking-[0.3px] text-ink-secondary">
          Loading chart…
        </span>
      </div>
    </div>
  );
}
