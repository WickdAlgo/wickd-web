"use client";
import React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "inverse";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Append the typographic → arrow after the label. */
  arrow?: boolean;
}

const variants: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--action-primary)",
    color: "var(--action-primary-text)",
  },
  secondary: {
    background: "var(--surface-card)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-strong)",
  },
  ghost: { background: "transparent", color: "var(--text-primary)" },
  inverse: { background: "var(--surface-card)", color: "var(--text-primary)" },
};

export function Button({
  variant = "primary",
  size = "md",
  arrow = false,
  children,
  style,
  ...rest
}: ButtonProps) {
  const pad = size === "lg" ? "16px 32px" : size === "sm" ? "8px 16px" : "12px 24px";
  const fs = size === "lg" ? "18px" : size === "sm" ? "14px" : "16px";
  const base: React.CSSProperties = {
    fontFamily: "var(--font-display)",
    fontWeight: 500,
    fontSize: fs,
    letterSpacing: "0.4px",
    borderRadius: "var(--radius-buttons)",
    padding: pad,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid transparent",
    transition: "var(--transition-fast)",
    lineHeight: 1.2,
    textDecoration: "none",
  };
  const [hover, setHover] = React.useState(false);
  const hoverFx: React.CSSProperties =
    variant === "ghost" ? { textDecoration: "underline" } : { opacity: 0.88 };
  return (
    <button
      type="button"
      style={{
        ...base,
        ...variants[variant],
        ...(hover ? hoverFx : {}),
        ...(rest.disabled ? { opacity: 0.4, cursor: "default" } : {}),
        ...style,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...rest}
    >
      {children}
      {arrow && <span aria-hidden="true">→</span>}
    </button>
  );
}
