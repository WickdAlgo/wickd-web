"use client";
import React from "react";
import { cx } from "@/lib/cx";
import { Tag, type TagTone } from "./tag";

export interface StructureEventRowProps {
  /** Mono timestamp column (e.g. "2026-07-18T09:15:00Z"). */
  time?: React.ReactNode;
  kind?: TagTone;
  label?: React.ReactNode;
  detail?: React.ReactNode;
  onInspect?: () => void;
  selected?: boolean;
}

/** One structures.jsonl event as a research-dashboard row. */
export function StructureEventRow({
  time,
  kind = "default",
  label,
  detail,
  onInspect,
  selected = false,
}: StructureEventRowProps) {
  return (
    <div
      role={onInspect ? "button" : undefined}
      tabIndex={onInspect ? 0 : undefined}
      onClick={onInspect}
      onKeyDown={onInspect ? (e) => e.key === "Enter" && onInspect() : undefined}
      className={cx(
        "group flex items-center gap-3.5 border-b border-hairline px-4 py-2.5 [transition:all_var(--transition-fast)]",
        selected ? "bg-subtle" : "hover:bg-subtle",
        onInspect && "cursor-pointer",
      )}
    >
      <span className="w-[150px] flex-none font-mono text-caption text-ink-secondary">{time}</span>
      <Tag tone={kind}>{label || kind}</Tag>
      <span className="font-ui flex-1 truncate text-[13px] tracking-[0.3px] text-ink">
        {detail}
      </span>
      {onInspect && (
        <span aria-hidden="true" className="font-display text-body-sm opacity-30 group-hover:opacity-100">
          →
        </span>
      )}
    </div>
  );
}
