import React from "react";

export type StructureKind =
  | "bullish"
  | "bearish"
  | "ic"
  | "breaker"
  | "sr"
  | "default"
  | "fvg"
  | "ote";
export type StructureScope = "internal" | "external";

export interface StructureBlockProps {
  kind?: StructureKind;
  /** Internal structures render lighter (0.45), external bolder (0.95). */
  scope?: StructureScope;
  width?: number | string;
  height?: number | string;
  /** Mono label below the block. */
  label?: string;
  style?: React.CSSProperties;
}

const fills: Partial<Record<StructureKind, string>> = {
  bullish: "var(--structure-bullish)",
  bearish: "var(--structure-bearish)",
  ic: "var(--structure-ic)",
  breaker: "var(--structure-breaker)",
  sr: "var(--structure-sr)",
  default: "var(--structure-default)",
};
const edges: Partial<Record<StructureKind, string>> = {
  fvg: "var(--structure-fvg)",
  ote: "var(--structure-ote)",
};

/** The chromatic rectangle primitive — always sharp corners. */
export function StructureBlock({
  kind = "bullish",
  scope = "external",
  width = 120,
  height = 48,
  label,
  style,
}: StructureBlockProps) {
  const edge = edges[kind];
  return (
    <div className="relative rounded-none" style={{ width, height, ...style }}>
      <div
        aria-hidden="true"
        className="absolute inset-0 box-border"
        style={{
          background: edge ? "transparent" : fills[kind] ?? fills.default,
          border: edge ? `2px solid ${edge}` : "none",
          opacity: `var(--structure-${scope}-alpha)`,
        }}
      />
      {label && (
        <span className="absolute left-0 top-full mt-1 whitespace-nowrap font-mono text-[9px] tracking-[0.3px] text-ink">
          {label}
        </span>
      )}
    </div>
  );
}
