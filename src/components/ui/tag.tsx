import React from "react";
import { cx } from "@/lib/cx";

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

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: TagTone;
  /** Render label in the mono face (tickers, run IDs). */
  mono?: boolean;
}

const tones: Record<TagTone, string> = {
  neutral: "border-hairline bg-subtle text-ink",
  bullish: "border-transparent bg-bullish text-ink",
  bearish: "border-transparent bg-bearish text-ink",
  ic: "border-transparent bg-ic text-white",
  fvg: "border-fvg bg-transparent text-fvg",
  ote: "border-ote bg-transparent text-ink",
  breaker: "border-transparent bg-breaker text-ink",
  sr: "border-transparent bg-sr text-ink",
  default: "border-strong bg-subtle text-ink-secondary",
  long: "border-transparent bg-long text-white",
  short: "border-transparent bg-short text-white",
  dark: "border-transparent bg-inverse text-white",
};

export function Tag({ tone = "neutral", mono = false, className, ...rest }: TagProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-buttons border px-3 py-[3px] text-caption font-medium",
        tones[tone],
        mono ? "font-mono" : "font-ui",
        className,
      )}
      {...rest}
    />
  );
}
