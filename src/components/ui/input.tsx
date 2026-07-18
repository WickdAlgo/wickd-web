"use client";
import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  /** Mono face for terminal-like values (tickers, run IDs). */
  mono?: boolean;
}

export function Input({ label, hint, mono = false, style, ...rest }: InputProps) {
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
      <input
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
          boxSizing: "border-box",
          fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)",
          fontSize: "14px",
          letterSpacing: "0.35px",
          padding: "10px 14px",
          borderRadius: "var(--radius-md)",
          border: `1px solid ${focus ? "var(--color-ic-blue)" : "var(--border-strong)"}`,
          outline: "none",
          background: "var(--surface-card)",
          color: "var(--text-primary)",
          boxShadow: focus ? "var(--shadow-subtle)" : "none",
          transition: "var(--transition-fast)",
          ...style,
        }}
      />
      {hint && (
        <div
          style={{
            fontSize: "11px",
            color: "var(--text-secondary)",
            marginTop: 5,
            letterSpacing: "0.3px",
          }}
        >
          {hint}
        </div>
      )}
    </label>
  );
}
