"use client";
import React from "react";

export interface CheckboxProps {
  label?: React.ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export function Checkbox({ label, checked, onChange, disabled }: CheckboxProps) {
  const [c, setC] = React.useState(!!checked);
  const isC = onChange ? checked : c;
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        fontFamily: "var(--font-ui)",
        fontSize: "14px",
        letterSpacing: "0.35px",
      }}
    >
      <span
        onClick={() => {
          if (disabled) return;
          if (onChange) onChange(!checked);
          else setC(!c);
        }}
        style={{
          width: 18,
          height: 18,
          borderRadius: "var(--radius-sm)",
          border: `1px solid ${isC ? "var(--color-obsidian)" : "var(--border-strong)"}`,
          background: isC ? "var(--color-obsidian)" : "var(--surface-card)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "var(--transition-fast)",
          flex: "none",
        }}
      >
        {isC && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-inverse)" strokeWidth="3.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
      </span>
      {label}
    </label>
  );
}
