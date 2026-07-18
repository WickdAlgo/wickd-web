"use client";
import React from "react";

export interface TabsProps {
  items?: string[];
  active?: string;
  onChange?: (item: string) => void;
  /** For dark Graphite/Carbon contexts. */
  dark?: boolean;
}

export function Tabs({ items = [], active, onChange, dark = false }: TabsProps) {
  const [a, setA] = React.useState(active || items[0]);
  const cur = onChange ? active : a;
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        borderBottom: `1px solid ${dark ? "var(--color-graphite)" : "var(--border-hairline)"}`,
      }}
    >
      {items.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => {
            if (onChange) onChange(t);
            else setA(t);
          }}
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "14px",
            fontWeight: 500,
            letterSpacing: "0.35px",
            padding: "10px 14px",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${
              cur === t ? (dark ? "#fff" : "var(--color-obsidian)") : "transparent"
            }`,
            color:
              cur === t
                ? dark
                  ? "#fff"
                  : "var(--text-primary)"
                : dark
                  ? "var(--text-inverse-muted)"
                  : "var(--text-secondary)",
            cursor: "pointer",
            marginBottom: -1,
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
