import { z } from "zod";

/**
 * The structure vocabulary, mirrored from the design system's
 * `StructureKind` / `StructureScope` in `src/components/ui/structure-block.tsx`.
 *
 * Mirrored rather than imported: this directory must not depend on a React
 * component, and a schema needs a runtime value a TypeScript union cannot
 * provide. The two are pinned together by a compile-time assertion in
 * `src/features/chart/overlay/primitive-paint.ts`, which is the one module
 * that legitimately sees both sides.
 */

export const structureKind = z.enum([
  "bullish",
  "bearish",
  "ic",
  "breaker",
  "sr",
  "default",
  "fvg",
  "ote",
]);
export type StructureKindValue = z.infer<typeof structureKind>;

export const structureScope = z.enum(["internal", "external"]);
export type StructureScopeValue = z.infer<typeof structureScope>;

/**
 * The families `Wickd.Core` journals. Used for filtering and for the label a
 * reader sees; the visual `kind` above is a separate axis, because a swing and
 * an order block can both be bullish.
 */
export const structureFamily = z.enum([
  "swing",
  "market_structure_break",
  "order_block",
  "fvg",
  "liquidity_pool",
  "liquidity_sweep",
  "breaker",
  "ote",
  "indecision_candle",
]);
export type StructureFamily = z.infer<typeof structureFamily>;

export const structureDirection = z.enum(["bullish", "bearish", "neutral"]);

/**
 * Derived state, never stored on an entity.
 *
 * This enum exists for display only. The state a reader sees is folded from
 * lifecycle events at or before the replay cursor — see `src/features/replay`.
 * Storing it on the entity would put final-state information inside a causal
 * payload, which is the exact leak the replay design exists to prevent.
 */
export const structureState = z.enum([
  "forming",
  "active",
  "mitigated",
  "invalidated",
  "expired",
]);
export type StructureState = z.infer<typeof structureState>;

export const lifecycleEventType = z.enum([
  "created",
  "confirmed",
  "touched",
  "mitigated",
  "invalidated",
  "expired",
]);
export type LifecycleEventType = z.infer<typeof lifecycleEventType>;
