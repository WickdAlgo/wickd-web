import { z } from "zod";
import { chartCandle, chartLayer, instrumentRef } from "./chart-scene";
import { entityId, epochMs, geometryPrice, identifier, sequence, utcInstant } from "./scalars";
import { compareStamp, type Stamped } from "./stamp";
import {
  lifecycleEventType,
  structureDirection,
  structureFamily,
  structureKind,
  structureScope,
} from "./structure";
import { versioned } from "./version";

/**
 * The inspection dataset — a run of `Wickd.Core` as something a chart can read.
 *
 * Provisional. `Wickd.Inspection` will own this shape; the adapter boundary
 * that lets it be swapped is `src/data/platform/`.
 */

export const inspectionRunSummary = z.object({
  runId: identifier,
  datasetAlias: identifier,
  instrument: instrumentRef,
  intervalMs: z.number().int().positive(),
  /** Which detector build produced this. Provenance, not decoration. */
  detectorVersion: z.string().min(1),
  inputDatasetVersion: z.string().min(1),
  generatedAtUtc: utcInstant,
});
export type InspectionRunSummary = z.infer<typeof inspectionRunSummary>;

/**
 * A structure entity.
 *
 * Note what is absent: there is no `state`, no `mitigatedAt`, no
 * `invalidatedAt`. An entity records what it is and when it became knowable,
 * and nothing about how its life ended. Terminal state is folded from
 * lifecycle events at or before the replay cursor.
 *
 * This is deliberate and load-bearing. Filtering a final-state field out of a
 * causal view is a rule someone can forget; not having the field means the leak
 * cannot be written.
 */
export const structureEntity = z.object({
  id: entityId,
  family: structureFamily,
  kind: structureKind,
  scope: structureScope.default("external"),
  direction: structureDirection.default("neutral"),
  label: z.string().min(1),
  /** The candle this describes — geometry, not knowability. */
  subjectTimeUtc: utcInstant,
  subjectPriceLow: geometryPrice.optional(),
  subjectPriceHigh: geometryPrice.optional(),
  /** The observation that made it knowable, and when. */
  triggerTimeUtc: utcInstant,
  knownAtUtc: utcInstant,
  sequence: sequence.default(0),
  detector: z.string().min(1),
});

export const lifecycleEvent = z.object({
  id: identifier,
  entityId,
  type: lifecycleEventType,
  knownAtUtc: utcInstant,
  sequence: sequence.default(0),
  note: z.string().optional(),
});

export const inspectionEvidence = z.object({
  id: identifier,
  entityId,
  /** What this observation contributes to the entity's case. */
  role: z.enum([
    "trigger",
    "supporting",
    "contradicting",
    "measurement",
    "provenance",
  ]),
  label: z.string().min(1),
  observedAtUtc: utcInstant,
  detail: z.string().optional(),
});

export const inspectionRelation = z.object({
  id: identifier,
  fromEntityId: entityId,
  toEntityId: entityId,
  type: z.enum([
    "caused_by",
    "mitigated_by",
    "swept",
    "confirms",
    "invalidates",
    "contains",
  ]),
});

export const inspectionFilters = z.object({
  families: z.array(structureFamily),
  kinds: z.array(structureKind),
  scopes: z.array(structureScope),
});

const inspectionDatasetShape = versioned.extend({
  contract: z.literal("inspection-dataset"),
  run: inspectionRunSummary,
  candles: z.array(chartCandle),
  entities: z.array(structureEntity),
  lifecycle: z.array(lifecycleEvent),
  evidence: z.array(inspectionEvidence),
  relations: z.array(inspectionRelation),
  /** Presentation geometry, grouped into toggleable layers. */
  layers: z.array(chartLayer),
  filters: inspectionFilters,
});

/**
 * Parsing attaches `atUtcMs` and sorts every causally-ordered array.
 *
 * Both happen here, once, rather than at each read. Downstream code may then
 * assume sortedness as a type-level guarantee of the gateway boundary — which
 * is what makes the replay filters a binary search rather than a scan, and
 * what makes "is this list sorted?" a question with one answer instead of one
 * per call site.
 */
export const inspectionDatasetV1 = inspectionDatasetShape.transform((d) => ({
  ...d,
  candles: d.candles
    .map((c) => ({ ...c, atUtcMs: epochMs(c.openTimeUtc), sequence: 0 }))
    .sort(compareStamp),
  entities: d.entities
    .map((e) => ({ ...e, atUtcMs: epochMs(e.knownAtUtc) }))
    .sort(compareStamp),
  lifecycle: d.lifecycle
    .map((l) => ({ ...l, atUtcMs: epochMs(l.knownAtUtc) }))
    .sort(compareStamp),
  layers: d.layers.map((layer) => ({
    ...layer,
    primitives: layer.primitives
      .map((p) => ({
        ...p,
        atUtcMs: epochMs(p.visibleFromUtc),
        untilUtcMs:
          p.visibleUntilUtc === null ? null : epochMs(p.visibleUntilUtc),
      }))
      .sort(compareStamp),
  })),
}));

export type InspectionDatasetV1 = z.infer<typeof inspectionDatasetV1>;
export type InspectionCandle = InspectionDatasetV1["candles"][number];
export type InspectionEntity = InspectionDatasetV1["entities"][number];
export type InspectionLifecycleEvent = InspectionDatasetV1["lifecycle"][number];
export type InspectionLayer = InspectionDatasetV1["layers"][number];
export type InspectionPrimitive = InspectionLayer["primitives"][number];
export type InspectionEvidence = z.infer<typeof inspectionEvidence>;
export type InspectionRelation = z.infer<typeof inspectionRelation>;

/**
 * Compile-time proof that the normalized arrays satisfy the ordering contract.
 * If a transform above stops attaching `atUtcMs`, this fails to compile rather
 * than silently producing an unsortable list.
 */
type AssertStamped<T extends Stamped> = T;
export type StampedEntity = AssertStamped<InspectionEntity>;
export type StampedLifecycleEvent = AssertStamped<InspectionLifecycleEvent>;
export type StampedCandle = AssertStamped<InspectionCandle>;
export type StampedPrimitive = AssertStamped<InspectionPrimitive>;
