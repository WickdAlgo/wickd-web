import type { InspectionPrimitive } from "@/contracts";
import type { TradeSlice } from "@/features/replay/causal";
import type { ChartLayerInput } from "./structure-chart";

/**
 * Turns a trade plan and its execution into chart primitives.
 *
 * The adapter boundary the architecture record calls for: the renderer knows
 * about zones, levels, and markers, and nothing about entries, stops, or fills.
 * When a real `ChartScene` arrives from the platform API, this function is what
 * gets replaced — not the chart.
 *
 * Note what is *not* here: no arithmetic on prices beyond parsing them for
 * geometry. R, PnL, and risk are read from the execution record, never derived.
 */

export interface TradeLayersInput {
  levels: TradeSlice["levels"];
  fills: TradeSlice["fills"];
  direction: "long" | "short";
}

/** Roles that render as a horizontal level rather than a band. */
const LEVEL_TONE = {
  stop: "bearish",
  target: "bullish",
  breakeven: "sr",
  invalidation: "bearish",
} as const;

export function tradeLayers(input: TradeLayersInput): ChartLayerInput[] {
  const { levels, fills } = input;

  const planPrimitives: InspectionPrimitive[] = [];

  for (const level of levels) {
    const from = level.validFromUtc;
    const to = level.validUntilUtc;

    if (level.role === "entry" && level.zoneLow && level.zoneHigh) {
      planPrimitives.push({
        id: `plan-${level.id}`,
        type: "zone",
        kind: "ic",
        scope: "external",
        label: "Entry zone",
        entityId: level.id,
        fromUtc: from,
        toUtc: to,
        priceLow: Number(level.zoneLow),
        priceHigh: Number(level.zoneHigh),
        visibleFromUtc: from,
        visibleUntilUtc: to,
        atUtcMs: level.validFromMs,
        untilUtcMs: level.validUntilMs,
        sequence: level.ordinal,
      } as InspectionPrimitive);
      continue;
    }

    if (!level.price) continue;

    planPrimitives.push({
      id: `plan-${level.id}`,
      type: "level",
      kind: LEVEL_TONE[level.role as keyof typeof LEVEL_TONE] ?? "default",
      scope: "external",
      label: labelFor(level.role, level.ordinal),
      entityId: level.id,
      price: Number(level.price),
      fromUtc: from,
      toUtc: to,
      // A closed level is history: dashed, so a superseded stop cannot be
      // mistaken for the one currently in force.
      style: to === null ? "solid" : "dashed",
      visibleFromUtc: from,
      visibleUntilUtc: to,
      atUtcMs: level.validFromMs,
      untilUtcMs: level.validUntilMs,
      sequence: level.ordinal,
    } as InspectionPrimitive);
  }

  const fillPrimitives: InspectionPrimitive[] = fills.map((fill) => ({
    id: `fill-${fill.id}`,
    type: "marker",
    kind: fill.side === "buy" ? "bullish" : "bearish",
    scope: "external",
    label: `${fill.role.replace(/_/g, " ")} · ${fill.quantity}`,
    entityId: fill.id,
    atUtc: fill.filledAtUtc,
    price: Number(fill.price),
    placement: fill.side === "buy" ? "below" : "above",
    shape: fill.side === "buy" ? "triangle-up" : "triangle-down",
    visibleFromUtc: fill.filledAtUtc,
    visibleUntilUtc: null,
    atUtcMs: fill.atUtcMs,
    untilUtcMs: null,
    sequence: fill.sequence,
  })) as InspectionPrimitive[];

  const layers: ChartLayerInput[] = [];
  if (planPrimitives.length > 0) {
    layers.push({ id: "trade-plan", label: "Trade plan", z: "under", primitives: planPrimitives });
  }
  if (fillPrimitives.length > 0) {
    layers.push({ id: "fills", label: "Your fills", z: "over", primitives: fillPrimitives });
  }
  return layers;
}

function labelFor(role: string, ordinal: number): string {
  if (role === "target") return `Target ${ordinal}`;
  if (role === "stop") return ordinal === 0 ? "Stop" : "Stop (moved)";
  return role.charAt(0).toUpperCase() + role.slice(1);
}
