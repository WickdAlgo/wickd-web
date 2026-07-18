"use client";
import React from "react";

export type SelectOption = string | { value: string; label: React.ReactNode };

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  options?: SelectOption[];
  mono?: boolean;
}

export function Select({ label, options = [], mono = false, style, ...rest }: SelectProps) {
  const [focus, setFocus] = React.useState(false);
  return (
    <label style={{ display: "block", fontFamily: "var(--font-ui)" }}>
      {label && (
        <div
          style={{
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.3px",
            marginBottom: 6,
          }}
        >
          {label}
        </div>
      )}
      <select
        {...rest}
        onFocus={(e) => {
          setFocus(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          rest.onBlur?.(e);
        }}
        style={{
          width: "100%",
          fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)",
          fontSize: "14px",
          letterSpacing: "0.35px",
          padding: "10px 12px",
          borderRadius: "var(--radius-md)",
          border: `1px solid ${focus ? "var(--color-ic-blue)" : "var(--border-strong)"}`,
          outline: "none",
          background: "var(--surface-card)",
          color: "var(--text-primary)",
          boxShadow: focus ? "var(--shadow-subtle)" : "none",
          cursor: "pointer",
          ...style,
        }}
      >
        {options.map((o) =>
          typeof o === "string" ? (
            <option key={o} value={o}>
              {o}
            </option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ),
        )}
      </select>
    </label>
  );
}
