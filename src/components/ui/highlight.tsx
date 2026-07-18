import React from "react";

export interface HighlightProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Cotton-candy marker emphasis for inline editorial text. */
export function Highlight({ children, style }: HighlightProps) {
  return (
    <span
      style={{
        background: "var(--highlight-marker)",
        padding: "0 4px",
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
