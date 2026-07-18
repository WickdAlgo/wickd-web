import React from "react";

export type TagTone =
  | "neutral"
  | "bullish"
  | "bearish"
  | "ic"
  | "fvg"
  | "ote"
  | "breaker"
  | "sr"
  | "default"
  | "long"
  | "short"
  | "dark";

export interface TagProps {
  tone?: TagTone;
  /** Render label in the mono face (tickers, run IDs). */
  mono?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

const tagColors: Record<TagTone, { bg: string; fg: string; bd?: string }> = {
  neutral: {
    bg: "var(--surface-subtle)",
    fg: "var(--text-primary)",
    bd: "var(--border-hairline)",
  },
  bullish: { bg: "var(--structure-bullish)", fg: "var(--text-primary)" },
  bearish: { bg: "var(--structure-bearish)", fg: "var(--text-primary)" },
  ic: { bg: "var(--structure-ic)", fg: "#fff" },
  fvg: {
    bg: "transparent",
    fg: "var(--structure-fvg)",
    bd: "var(--structure-fvg)",
  },
  ote: {
    bg: "transparent",
    fg: "var(--text-primary)",
    bd: "var(--structure-ote)",
  },
  breaker: { bg: "var(--structure-breaker)", fg: "var(--text-primary)" },
  sr: { bg: "var(--structure-sr)", fg: "var(--text-primary)" },
  default: {
    bg: "var(--surface-subtle)",
    fg: "var(--text-secondary)",
    bd: "var(--border-strong)",
  },
  long: { bg: "var(--signal-long)", fg: "#fff" },
  short: { bg: "var(--signal-short)", fg: "#fff" },
  dark: { bg: "var(--surface-inverse)", fg: "#fff" },
};

export function Tag({ tone = "neutral", mono = false, children, style }: TagProps) {
  const c = tagColors[tone] || tagColors.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: c.bg,
        color: c.fg,
        border: c.bd ? `1px solid ${c.bd}` : "1px solid transparent",
        borderRadius: "var(--radius-buttons)",
        padding: "3px 12px",
        fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)",
        fontSize: "12px",
        fontWeight: 500,
        letterSpacing: "0.3px",
        lineHeight: 1.5,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
