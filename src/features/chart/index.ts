/**
 * The platform chart.
 *
 * Import `StructureChart` from here, never from `@/components/ui`. That barrel
 * is imported by every marketing page, so a re-export would drag
 * `lightweight-charts` into the home page's chunk. Use the lazy wrapper below
 * unless you have a reason not to: `ssr: false` also keeps the library out of
 * the OpenNext worker bundle.
 */
export { StructureChartLazy } from "./structure-chart-lazy";
export type { StructureChartProps, ChartLayerInput } from "./structure-chart";
export {
  linearProjection,
  projectConnection,
  projectLevel,
  projectMarker,
  projectRangeHighlight,
  projectZone,
  type Projection,
  type Rect,
  type Segment,
  type Point,
} from "./projection";
export { readChartTheme, type ChartTheme } from "./chart-theme";
export { focusRangeForPrimitives } from "./focus-range";
export { tradeLayers, type TradeLayersInput } from "./trade-layers";
