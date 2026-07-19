import React from "react";
import { cx } from "@/lib/cx";

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
  className,
  style,
  ...rest
}: CardProps) {
  return (
    <div
      className={cx(
        "rounded-cards border",
        dark ? "bg-panel text-ink-inverse" : "bg-card text-ink",
        elevation === "flat" ? "border-hairline" : "border-transparent",
        elevation === "float" && "shadow-xl",
        elevation === "strong" && "shadow-xl-2",
        className,
      )}
      style={{ padding, ...style }}
      {...rest}
    />
  );
}
