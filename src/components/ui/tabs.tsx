"use client";
import React from "react";
import { cx } from "@/lib/cx";
import { useControllable } from "@/lib/use-controllable";

export interface TabsProps {
  items?: string[];
  active?: string;
  onChange?: (item: string) => void;
  /** For dark Graphite/Carbon contexts. */
  dark?: boolean;
}

export function Tabs({ items = [], active, onChange, dark = false }: TabsProps) {
  const [current, setCurrent] = useControllable(active, items[0]);
  return (
    <div role="tablist" className={cx("flex gap-1 border-b", dark ? "border-graphite" : "border-hairline")}>
      {items.map((t) => {
        const selected = current === t;
        return (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => {
              setCurrent(t);
              onChange?.(t);
            }}
            className={cx(
              "-mb-px cursor-pointer border-0 border-b-2 border-solid bg-transparent px-3.5 py-2.5 font-display text-body-sm font-medium",
              selected
                ? dark
                  ? "border-white text-white"
                  : "border-ink text-ink"
                : cx(
                    "border-transparent",
                    dark ? "text-(--text-inverse-muted)" : "text-ink-secondary",
                  ),
            )}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}
