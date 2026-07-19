import React from "react";
import { cx } from "@/lib/cx";
import { Field, controlClass } from "./field";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  /** Mono face for terminal-like values (tickers, run IDs). */
  mono?: boolean;
}

export function Input({ label, hint, mono = false, className, ...rest }: InputProps) {
  return (
    <Field label={label} hint={hint}>
      <input
        className={cx(controlClass, mono ? "font-mono" : "font-ui", className)}
        {...rest}
      />
    </Field>
  );
}
