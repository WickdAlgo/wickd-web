import { z } from "zod";
import {
  entityId,
  geometryPrice,
  identifier,
  sequence,
  utcInstant,
} from "./scalars";
import { structureKind, structureScope } from "./structure";
import { versioned } from "./version";

/**
 * Renderer-neutral chart primitives.
 *
 * These describe geometry in time and price. They carry no pixels, no colors,
 * and no chart-library types — a primitive is equally renderable as SVG, as
 * canvas, or as a table of numbers. `Wickd.Inspection` is expected to emit
 * this shape directly; until it does, the fixture gateway produces it.
 */

/**
 * Every causally-placed primitive carries these.
 *
 * `visibleFromUtc` is deliberately distinct from the subject time: an order
 * block is *drawn* at the candle that formed it, but only becomes *knowable*
 * at the candle that confirmed it. Replay keys off the latter.
 */
const primitiveBase = z.object({
  id: identifier,
  kind: structureKind,
  scope: structureScope.default("external"),
  label: z.string().optional(),
  /** Links back to the dataset entity, so selecting a shape can show evidence. */
  entityId: entityId.optional(),
  /** When this became knowable. Replay compares against this, not the geometry. */
  visibleFromUtc: utcInstant,
  /** When it stopped being shown, if it ever does. */
  visibleUntilUtc: utcInstant.nullable().default(null),
  /** Run-local tiebreak when two primitives become visible at the same instant. */
  sequence: sequence.default(0),
});

/** A point annotation pinned to one candle. */
export const markerPrimitive = primitiveBase.extend({
  type: z.literal("marker"),
  atUtc: utcInstant,
  price: geometryPrice,
  /** Which side of the price the shape sits on. */
  placement: z.enum(["above", "below", "at"]).default("at"),
  shape: z.enum(["dot", "triangle-up", "triangle-down", "square"]).default("dot"),
});

/** A horizontal price line, optionally bounded in time. */
export const levelPrimitive = primitiveBase.extend({
  type: z.literal("level"),
  price: geometryPrice,
  fromUtc: utcInstant,
  /** `null` extends the level to the right edge of the visible range. */
  toUtc: utcInstant.nullable().default(null),
  style: z.enum(["solid", "dashed", "dotted"]).default("solid"),
});

/** A price band across a time span — order blocks, fair value gaps, OTE zones. */
export const zonePrimitive = primitiveBase
  .extend({
    type: z.literal("zone"),
    fromUtc: utcInstant,
    toUtc: utcInstant.nullable().default(null),
    priceLow: geometryPrice,
    priceHigh: geometryPrice,
  })
  .refine((v) => v.priceHigh >= v.priceLow, {
    message: "priceHigh must be greater than or equal to priceLow",
    path: ["priceHigh"],
  });

/** A line joining two points in time and price — a swing leg, a sweep origin. */
export const connectionPrimitive = primitiveBase.extend({
  type: z.literal("connection"),
  fromUtc: utcInstant,
  fromPrice: geometryPrice,
  toUtc: utcInstant,
  toPrice: geometryPrice,
  style: z.enum(["solid", "dashed", "dotted"]).default("dashed"),
});

/** A full-height time span — a session, a consolidation, a replay window. */
export const rangeHighlightPrimitive = primitiveBase.extend({
  type: z.literal("range-highlight"),
  fromUtc: utcInstant,
  toUtc: utcInstant,
});

export const chartPrimitive = z.discriminatedUnion("type", [
  markerPrimitive,
  levelPrimitive,
  zonePrimitive,
  connectionPrimitive,
  rangeHighlightPrimitive,
]);

export type ChartPrimitive = z.infer<typeof chartPrimitive>;
export type MarkerPrimitive = Extract<ChartPrimitive, { type: "marker" }>;
export type LevelPrimitive = Extract<ChartPrimitive, { type: "level" }>;
export type ZonePrimitive = Extract<ChartPrimitive, { type: "zone" }>;
export type ConnectionPrimitive = Extract<ChartPrimitive, { type: "connection" }>;
export type RangeHighlightPrimitive = Extract<
  ChartPrimitive,
  { type: "range-highlight" }
>;

/** A candle. `openTimeUtc` opens the interval; it closes `intervalMs` later. */
export const chartCandle = z.object({
  openTimeUtc: utcInstant,
  open: geometryPrice,
  high: geometryPrice,
  low: geometryPrice,
  close: geometryPrice,
});
export type ChartCandle = z.infer<typeof chartCandle>;

/**
 * A toggleable group of primitives.
 *
 * `z` decides which side of the candles the group paints on. Zones belong
 * under — a fair value gap that covers the price action it describes is
 * unreadable — while markers and levels belong over.
 */
export const chartLayer = z.object({
  id: identifier,
  label: z.string(),
  defaultVisible: z.boolean().default(true),
  z: z.enum(["under", "over"]).default("under"),
  primitives: z.array(chartPrimitive),
});
export type ChartLayer = z.infer<typeof chartLayer>;

export const instrumentRef = z.object({
  market: z.string().min(1),
  timeframe: z.string().min(1),
});
export type InstrumentRef = z.infer<typeof instrumentRef>;

export const chartSceneV1 = versioned.extend({
  contract: z.literal("chart-scene"),
  instrument: instrumentRef,
  /** The interval one candle covers, in milliseconds. */
  intervalMs: z.number().int().positive(),
  candles: z.array(chartCandle),
  layers: z.array(chartLayer),
});
export type ChartSceneV1 = z.infer<typeof chartSceneV1>;
