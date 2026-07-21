import React from "react";
import { cx } from "@/lib/cx";

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
  className,
  style,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex cursor-pointer items-center justify-center rounded-icons border-none [transition:all_var(--transition-fast)] hover:opacity-85",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: color,
        color:
          glyphColor ||
          (color === "var(--color-concrete)" ? "var(--text-primary)" : "var(--text-inverse)"),
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
