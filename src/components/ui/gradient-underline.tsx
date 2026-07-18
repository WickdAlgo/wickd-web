import React from "react";

export interface GradientUnderlineProps {
  /** Solid start color of the underline gradient. */
  color?: string;
  height?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** The single sanctioned gradient: solid chromatic → transparent underline. */
export function GradientUnderline({
  color = "var(--structure-breaker)",
  height = 16,
  children,
  style,
}: GradientUnderlineProps) {
  return (
    <span style={{ position: "relative", display: "inline-block", ...style }}>
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -4,
          height,
          background: `linear-gradient(90deg, ${color}, transparent)`,
        }}
      ></span>
    </span>
  );
}
