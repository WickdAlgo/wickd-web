"use client";
import { useThemeEpoch } from "@/lib/use-theme-epoch";

/**
 * Design tokens, resolved into the color strings the chart library wants.
 *
 * Lightweight Charts takes colors as JavaScript strings, not `var()`. That is
 * the only reason this file exists — the SVG overlay emits `var(--structure-*)`
 * directly and needs no resolution at all, which is most of why the overlay
 * renders as SVG.
 *
 * No hex literal appears here or anywhere downstream. Everything is read from
 * `globals.css` at runtime, and the fallback for a missing token is
 * `transparent` rather than a guessed color — a token that fails to resolve
 * should be visibly absent, not quietly wrong.
 */

const TOKENS = {
  canvas: "--chart-canvas",
  upBody: "--chart-up-body",
  downBody: "--chart-down-body",
  stroke: "--chart-stroke",
  grid: "--color-hairline",
  axisText: "--text-secondary",
  crosshair: "--structure-default",
} as const;

export type ChartTheme = Record<keyof typeof TOKENS, string>;

/**
 * Read the tokens as resolved on `el`.
 *
 * Off the container rather than `documentElement`, so a scoped theme — a
 * `data-theme` on some ancestor, a dark panel — is honoured. Computed values of
 * custom properties are already `var()`-substituted, so `--chart-canvas:
 * var(--color-chart-cream)` comes back as a concrete color.
 */
export function readChartTheme(el: HTMLElement): ChartTheme {
  const styles = getComputedStyle(el);
  const read = (token: string) => styles.getPropertyValue(token).trim() || "transparent";

  return {
    canvas: read(TOKENS.canvas),
    upBody: read(TOKENS.upBody),
    downBody: read(TOKENS.downBody),
    stroke: read(TOKENS.stroke),
    grid: read(TOKENS.grid),
    axisText: read(TOKENS.axisText),
    crosshair: read(TOKENS.crosshair),
  };
}

/**
 * Re-exported so the chart can depend on the theme without holding it in state.
 *
 * An earlier version resolved the tokens into a `ChartTheme` in an effect and
 * stored the result. That reads naturally and is wrong: the resolved theme is
 * derived from the DOM, so storing it costs an extra render on every mount and
 * every theme change, for a value the chart's own layout effect can read
 * directly. The epoch is the only thing React needs to track.
 */
export { useThemeEpoch };
