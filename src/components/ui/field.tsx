import React from "react";

export interface FieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
}

/** Label + control + hint column shared by Input and Select. */
export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="font-ui block">
      {label && <div className="mb-1.5 text-caption font-medium">{label}</div>}
      {children}
      {hint && (
        <div className="mt-[5px] text-[11px] tracking-[0.3px] text-ink-secondary">{hint}</div>
      )}
    </label>
  );
}

/** Shared text-control shell — focus ring lives in CSS, not JS state. */
export const controlClass =
  "w-full box-border rounded-md border border-strong bg-card px-3.5 py-2.5 text-body-sm text-ink outline-none [transition:all_var(--transition-fast)] focus:border-ic focus:shadow-subtle";

/** Label row shared by Checkbox and Switch. */
export const toggleClass =
  "font-ui inline-flex items-center gap-2.5 text-body-sm has-disabled:cursor-default has-disabled:opacity-40 cursor-pointer";
