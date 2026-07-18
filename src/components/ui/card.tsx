import React from "react";

export type CardElevation = "flat" | "float" | "strong";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** flat = hairline border; float/strong = soft multi-layer shadow. */
  elevation?: CardElevation;
  /** Graphite panel variant (terminal/code contexts). */
  dark?: boolean;
  padding?: React.CSSProperties["padding"];
}

export function Card({
  elevation = "flat",
  dark = false,
  padding = "var(--card-padding)",
  children,
  style,
  ...rest
}: CardProps) {
  const shadow =
    elevation === "float"
      ? "var(--shadow-xl)"
      : elevation === "strong"
        ? "var(--shadow-xl-2)"
        : "none";
  return (
    <div
      style={{
        background: dark ? "var(--surface-panel)" : "var(--surface-card)",
        color: dark ? "var(--text-inverse)" : "var(--text-primary)",
        border:
          elevation === "flat"
            ? "1px solid var(--border-hairline)"
            : "1px solid transparent",
        borderRadius: "var(--radius-cards)",
        padding,
        boxShadow: shadow,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
