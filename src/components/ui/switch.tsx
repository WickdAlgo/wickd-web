"use client";
import React from "react";
import { cx } from "@/lib/cx";
import { useControllable } from "@/lib/use-controllable";
import { toggleClass } from "./field";

export interface SwitchProps {
  label?: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({ label, checked, defaultChecked, onChange, disabled }: SwitchProps) {
  const [on, setOn] = useControllable(checked, defaultChecked ?? false);
  return (
    <label className={toggleClass}>
      <input
        type="checkbox"
        role="switch"
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
          "relative inline-block h-5 w-9 flex-none rounded-buttons [transition:all_var(--transition-base)] peer-focus-visible:[box-shadow:var(--focus-ring)]",
          on ? "bg-ink" : "bg-pebble",
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 size-4 rounded-full bg-card [transition:all_var(--transition-base)]",
            on ? "left-[18px]" : "left-0.5",
          )}
        />
      </span>
      {label}
    </label>
  );
}
