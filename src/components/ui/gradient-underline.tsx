import React from "react";
import { cx } from "@/lib/cx";

export interface GradientUnderlineProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** Solid start color of the underline gradient. */
  color?: string;
  height?: number;
}

/** The single sanctioned gradient: solid chromatic → transparent underline. */
export function GradientUnderline({
  color = "var(--structure-breaker)",
  height = 16,
  className,
  children,
  ...rest
}: GradientUnderlineProps) {
  return (
    <span className={cx("relative inline-block", className)} {...rest}>
      <span className="relative z-[1]">{children}</span>
      <span
        aria-hidden="true"
        className="absolute inset-x-0 -bottom-1"
        style={{ height, background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
    </span>
  );
}
