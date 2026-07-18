"use client";
import React from "react";
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
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onInspect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 16px",
        borderBottom: "1px solid var(--border-hairline)",
        background: selected
          ? "var(--surface-subtle)"
          : hover
            ? "var(--surface-subtle)"
            : "transparent",
        cursor: onInspect ? "pointer" : "default",
        transition: "var(--transition-fast)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--text-secondary)",
          width: 150,
          flex: "none",
          letterSpacing: "0.3px",
        }}
      >
        {time}
      </span>
      <Tag tone={kind}>{label || kind}</Tag>
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "13px",
          letterSpacing: "0.3px",
          color: "var(--text-primary)",
          flex: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {detail}
      </span>
      {onInspect && (
        <span
          aria-hidden="true"
          style={{ fontFamily: "var(--font-display)", fontSize: "14px", opacity: hover ? 1 : 0.3 }}
        >
          →
        </span>
      )}
    </div>
  );
}
