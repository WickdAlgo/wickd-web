"use client";
import React from "react";
import { cx } from "@/lib/cx";
import { useControllable } from "@/lib/use-controllable";
import { toggleClass } from "./field";

export interface CheckboxProps {
  label?: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export function Checkbox({ label, checked, defaultChecked, onChange, disabled }: CheckboxProps) {
  const [on, setOn] = useControllable(checked, defaultChecked ?? false);
  return (
    <label className={toggleClass}>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={on}
        disabled={disabled}
        onChange={(e) => {
          setOn(e.target.checked);
          onChange?.(e.target.checked);
        }}
      />
      <span
        aria-hidden="true"
        className={cx(
          "inline-flex size-[18px] flex-none items-center justify-center rounded-sm border [transition:all_var(--transition-fast)] peer-focus-visible:[box-shadow:var(--focus-ring)]",
          on ? "border-ink bg-ink" : "border-strong bg-card",
        )}
      >
        {on && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-inverse)" strokeWidth="3.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      {label}
    </label>
  );
}
