import React from "react";
import { cx } from "@/lib/cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "inverse";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Append the typographic → arrow after the label. */
  arrow?: boolean;
  /** Render as an anchor while keeping button styling. */
  href?: string;
}

const base =
  "inline-flex cursor-pointer items-center gap-2 rounded-buttons border border-solid font-display font-medium leading-[1.2] tracking-[0.4px] no-underline [transition:all_var(--transition-fast)] disabled:cursor-default disabled:opacity-40";

const variants: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-ink text-ink-inverse hover:opacity-[0.88]",
  secondary: "border-strong bg-card text-ink hover:opacity-[0.88]",
  ghost: "border-transparent bg-transparent text-ink hover:underline",
  inverse: "border-transparent bg-card text-ink hover:opacity-[0.88]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-[14px]",
  md: "px-6 py-3 text-[16px]",
  lg: "px-8 py-4 text-[18px]",
};

export function Button({
  variant = "primary",
  size = "md",
  arrow = false,
  href,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cx(base, variants[variant], sizes[size], className);
  const content = (
    <>
      {children}
      {arrow && <span aria-hidden="true">→</span>}
    </>
  );
  if (href) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {content}
    </button>
  );
}
