import {
  structureEdges,
  structureFills,
  type StructureKind,
  type StructureScope,
} from "@/components/ui/structure-block";
import type { StructureKindValue, StructureScopeValue } from "@/contracts";

/**
 * How a structure is painted on the chart.
 *
 * The `kind -> token` tables are imported from `structure-block.tsx`, not
 * restated. The design system already owns that mapping, and a second copy
 * would drift the first time a kind is added — the chart would keep painting a
 * new structure in the fallback gray while the component library rendered it
 * correctly.
 *
 * Every value is a `var(--structure-*)` reference. Nothing here resolves a
 * color, which is what keeps the overlay correct on its first painted frame in
 * any theme, with no JavaScript involved.
 */

/**
 * Pins the contract's vocabulary to the design system's.
 *
 * `src/contracts/structure.ts` mirrors these unions as a zod enum, because a
 * schema needs a runtime value and the contracts layer must not import a React
 * component. This module sees both sides, so it is where the two are checked.
 * If either list gains a member the other lacks, this stops compiling.
 */
type AssertMutual<A extends B, B> = A;
export type KindsAgree = AssertMutual<StructureKindValue, StructureKind> &
  AssertMutual<StructureKind, StructureKindValue>;
export type ScopesAgree = AssertMutual<StructureScopeValue, StructureScope> &
  AssertMutual<StructureScope, StructureScopeValue>;

export interface PrimitivePaint {
  /** Interior color, or `"none"` for outline-only kinds. */
  fill: string;
  stroke: string;
  /** `var(--structure-internal-alpha)` or its external counterpart. */
  opacity: string;
  /**
   * Alpha for a filled area drawn over candles.
   *
   * Lower than `opacity`, and separately tokenised. Both overlays sit above the
   * chart canvas so that every shape stays clickable — a zone painted at the
   * structure alpha would be opaque enough to hide the price action it
   * describes.
   */
  areaOpacity: string;
  /** True for FVG and OTE, which read as outlines rather than blocks. */
  outlineOnly: boolean;
}

export function primitivePaint(
  kind: StructureKindValue,
  scope: StructureScopeValue,
): PrimitivePaint {
  const edge = structureEdges[kind];
  const fill = structureFills[kind] ?? structureFills.default!;
  return {
    fill: edge ? "none" : fill,
    stroke: edge ?? fill,
    opacity: `var(--structure-${scope}-alpha)`,
    areaOpacity: `var(--chart-zone-alpha-${scope})`,
    outlineOnly: edge !== undefined,
  };
}

/** SVG dash patterns for the line styles the contract allows. */
export const DASH_PATTERNS: Record<"solid" | "dashed" | "dotted", string | undefined> = {
  solid: undefined,
  dashed: "8 6",
  dotted: "2 5",
};
