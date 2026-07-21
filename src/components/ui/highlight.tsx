import React from "react";
import { cx } from "@/lib/cx";

export type HighlightProps = React.HTMLAttributes<HTMLSpanElement>;

/** Cotton-candy marker emphasis for inline editorial text. */
export function Highlight({ className, ...rest }: HighlightProps) {
  return (
    <span
      className={cx(
        "bg-marker px-1 [-webkit-box-decoration-break:clone] [box-decoration-break:clone]",
        className,
      )}
      {...rest}
    />
  );
}
