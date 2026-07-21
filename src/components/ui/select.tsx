import React from "react";
import { cx } from "@/lib/cx";
import { Field, controlClass } from "./field";

export type SelectOption = string | { value: string; label: React.ReactNode };

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  options?: SelectOption[];
  mono?: boolean;
}

export function Select({ label, options = [], mono = false, className, ...rest }: SelectProps) {
  return (
    <Field label={label}>
      <select
        className={cx(controlClass, "cursor-pointer", mono ? "font-mono" : "font-ui", className)}
        {...rest}
      >
        {options.map((o) => {
          const opt = typeof o === "string" ? { value: o, label: o } : o;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </Field>
  );
}
