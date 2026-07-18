"use client";
import React from "react";

export interface SwitchProps {
  label?: React.ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({ label, checked, onChange, disabled }: SwitchProps) {
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
          width: 36,
          height: 20,
          borderRadius: "var(--radius-buttons)",
          background: isC ? "var(--color-obsidian)" : "var(--color-pebble)",
          position: "relative",
          transition: "var(--transition-base)",
          flex: "none",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: isC ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "var(--surface-card)",
            transition: "var(--transition-base)",
          }}
        ></span>
      </span>
      {label}
    </label>
  );
}
