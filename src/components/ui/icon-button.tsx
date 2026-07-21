"use client";
import React from "react";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible label (also used as tooltip). */
  label: string;
  /** Container fill — a structure color or Concrete. */
  color?: string;
  /** Glyph color override; defaults to text on Concrete, white otherwise. */
  glyphColor?: string;
  size?: number;
}

export function IconButton({
  label,
  color = "var(--color-concrete)",
  glyphColor,
  size = 36,
  children,
  style,
  ...rest
}: IconButtonProps) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-icons)",
        background: color,
        color:
          glyphColor ||
          (color === "var(--color-concrete)" ? "var(--text-primary)" : "var(--text-inverse)"),
        border: "none",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "var(--transition-fast)",
        opacity: hover ? 0.85 : 1,
        ...style,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...rest}
    >
      {children}
    </button>
  );
}
