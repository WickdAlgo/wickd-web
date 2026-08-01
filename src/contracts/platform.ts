import { z } from "zod";
import { instrumentRef } from "./chart-scene";
import { identifier, utcInstant } from "./scalars";
import { structureFamily } from "./structure";

/**
 * The smaller platform payloads — datasets, runs, and journal output.
 *
 * These replace the module-level arrays the platform views used to hold. They
 * are unversioned because they are listings rather than rendered contracts: a
 * shape change here is caught by the type checker, not by a running build
 * reading a payload it does not understand.
 */

export const datasetSummary = z.object({
  alias: identifier,
  instrument: instrumentRef,
  rangeFromUtc: utcInstant,
  rangeToUtc: utcInstant,
  candles: z.number().int().nonnegative(),
});
export type DatasetSummary = z.infer<typeof datasetSummary>;

export const runSummary = z.object({
  runId: identifier,
  datasetAlias: identifier,
  events: z.number().int().nonnegative(),
  status: z.enum(["complete", "running", "failed"]),
});
export type RunSummary = z.infer<typeof runSummary>;

/** One line of a structure journal, as the engine writes it to JSONL. */
export const journalEntry = z.object({
  timeUtc: utcInstant,
  type: structureFamily.or(z.literal("lifecycle")),
  detail: z.string().min(1),
});
export type JournalEntry = z.infer<typeof journalEntry>;

export const backtestRequest = z.object({
  datasetAlias: identifier,
  runId: identifier,
  writeStructures: z.boolean().default(true),
  writeLifecycle: z.boolean().default(true),
  writeEvidence: z.boolean().default(false),
});
export type BacktestRequest = z.infer<typeof backtestRequest>;

/** A single structure event as the inspect list renders it. */
export const structureEventItem = z.object({
  id: identifier,
  entityId: identifier,
  timeUtc: utcInstant,
  family: structureFamily,
  label: z.string().min(1),
  detail: z.string().min(1),
});
export type StructureEventItem = z.infer<typeof structureEventItem>;
