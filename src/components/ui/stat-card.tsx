import React from "react";

export interface StatCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  delta?: React.ReactNode;
  /** Colors the delta line: long = deep green, short = alert red. */
  tone?: "long" | "short";
  /** Value in the mono face (default — stats are data). */
  mono?: boolean;
  style?: React.CSSProperties;
}

export function StatCard({ label, value, delta, tone, mono = true, style }: StatCardProps) {
  const deltaColor =
    tone === "long"
      ? "var(--signal-long-deep)"
      : tone === "short"
        ? "var(--signal-short)"
        : "var(--text-secondary)";
  return (
    <div
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-hairline)",
        borderRadius: "var(--radius-cards)",
        padding: "16px 20px",
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "12px",
          letterSpacing: "0.3px",
          color: "var(--text-secondary)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: mono ? "var(--font-mono)" : "var(--font-display)",
          fontSize: "28px",
          fontWeight: 600,
          letterSpacing: "0.5px",
          marginTop: 4,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {delta && (
        <div
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "12px",
            letterSpacing: "0.3px",
            color: deltaColor,
            marginTop: 4,
          }}
        >
          {delta}
        </div>
      )}
    </div>
  );
}
