"use client";
import React from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function useReducedMotion() {
  return React.useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
