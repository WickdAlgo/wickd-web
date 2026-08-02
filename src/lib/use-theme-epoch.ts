"use client";
import React from "react";

const COLOR_SCHEME = "(prefers-color-scheme: dark)";

/**
 * A counter that changes whenever the resolved design tokens might have.
 *
 * Most of the surface reads tokens through CSS and needs no such signal. The
 * chart is the exception: TradingView Lightweight Charts takes colors as
 * JavaScript strings, so its options have to be recomputed when the tokens
 * behind them change rather than re-resolving on their own.
 *
 * Shaped like `use-reduced-motion.ts` — `useSyncExternalStore` with a server
 * snapshot — so both hooks behave the same way during hydration.
 */
export function useThemeEpoch(): number {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

let epoch = 0;

function subscribe(onChange: () => void): () => void {
  const bump = () => {
    epoch += 1;
    onChange();
  };

  const mq = window.matchMedia(COLOR_SCHEME);
  mq.addEventListener("change", bump);

  // A theme toggle typically stamps an attribute on the root rather than
  // changing the media query, so both signals are needed.
  const observer = new MutationObserver(bump);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme", "style"],
  });

  return () => {
    mq.removeEventListener("change", bump);
    observer.disconnect();
  };
}

function getSnapshot(): number {
  return epoch;
}

function getServerSnapshot(): number {
  return 0;
}
