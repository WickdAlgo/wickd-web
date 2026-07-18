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

const sbFills: Record<string, string> = {
  bullish: "var(--structure-bullish)",
  bearish: "var(--structure-bearish)",
  ic: "var(--structure-ic)",
  breaker: "var(--structure-breaker)",
  sr: "var(--structure-sr)",
  default: "var(--structure-default)",
};
const sbOutlined: Record<string, string> = {
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
  const edge = sbOutlined[kind];
  const alpha =
    scope === "internal"
      ? "var(--structure-internal-alpha)"
      : "var(--structure-external-alpha)";
  return (
    <div style={{ width, height, position: "relative", borderRadius: 0, ...style }}>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: edge ? "transparent" : sbFills[kind] || sbFills.default,
          border: edge ? `2px solid ${edge}` : "none",
          opacity: alpha as React.CSSProperties["opacity"],
          boxSizing: "border-box",
        }}
      ></div>
      {label && (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: "100%",
            marginTop: 4,
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            letterSpacing: "0.3px",
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
