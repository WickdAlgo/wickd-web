/**
 * Provisional platform contracts.
 *
 * These describe payloads the platform renders. They are versioned and
 * validated at runtime because the producer will eventually be
 * `Wickd.Inspection` and a platform API in `wickd-dotnet`, not this
 * repository — and a shape mismatch across that boundary must fail loudly
 * rather than render as something subtly wrong.
 *
 * Nothing outside this directory defines a structure or journal shape.
 * See `docs/architecture/001-platform-and-journal-boundaries.md`.
 */

// Versioning
export {
  SCHEMA_VERSION,
  versioned,
  parseContract,
  ContractError,
  type ContractIssue,
} from "./version";

// Ordering
export { compareStamp, type Stamped } from "./stamp";

// Scalars
export {
  utcInstant,
  epochMs,
  sequence,
  decimal,
  geometryPrice,
  entityId,
  identifier,
} from "./scalars";

// Structure vocabulary
export {
  structureKind,
  structureScope,
  structureFamily,
  structureDirection,
  structureState,
  lifecycleEventType,
  type StructureKindValue,
  type StructureScopeValue,
  type StructureFamily,
  type StructureState,
  type LifecycleEventType,
} from "./structure";

// Chart scene
export {
  chartPrimitive,
  markerPrimitive,
  levelPrimitive,
  zonePrimitive,
  connectionPrimitive,
  rangeHighlightPrimitive,
  chartCandle,
  chartLayer,
  instrumentRef,
  chartSceneV1,
  type ChartPrimitive,
  type MarkerPrimitive,
  type LevelPrimitive,
  type ZonePrimitive,
  type ConnectionPrimitive,
  type RangeHighlightPrimitive,
  type ChartCandle,
  type ChartLayer,
  type InstrumentRef,
  type ChartSceneV1,
} from "./chart-scene";

// Inspection dataset
export {
  inspectionDatasetV1,
  inspectionRunSummary,
  structureEntity,
  lifecycleEvent,
  inspectionEvidence,
  inspectionRelation,
  inspectionFilters,
  type InspectionDatasetV1,
  type InspectionRunSummary,
  type InspectionCandle,
  type InspectionEntity,
  type InspectionLifecycleEvent,
  type InspectionLayer,
  type InspectionPrimitive,
  type InspectionEvidence,
  type InspectionRelation,
} from "./inspection-dataset";

// Journal
export {
  tradeDetailV1,
  tradeIdea,
  tradeLevel,
  signalEvent,
  execution,
  fill,
  tradeEvidenceLink,
  strategyMatch,
  tradeReview,
  tradeSummary,
  type TradeDetailV1,
  type TradeIdea,
  type TradeLevel,
  type SignalEvent,
  type Execution,
  type Fill,
  type TradeEvidenceLink,
  type StrategyMatch,
  type TradeReview,
  type TradeSummary,
  type NormalizedTradeLevel,
  type NormalizedSignalEvent,
  type NormalizedFill,
} from "./journal";

// Platform listings
export {
  datasetSummary,
  runSummary,
  journalEntry,
  backtestRequest,
  structureEventRow,
  type DatasetSummary,
  type RunSummary,
  type JournalEntry,
  type BacktestRequest,
  type StructureEventRow,
} from "./platform";
