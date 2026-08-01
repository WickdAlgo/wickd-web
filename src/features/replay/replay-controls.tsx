"use client";
import React from "react";
import { Tag } from "@/components/ui";
import { cx } from "@/lib/cx";

/**
 * Final / Causal switching and the as-of cursor.
 *
 * The mode label is not decoration. A causal view showing data as of 16:35 is
 * indistinguishable from a final view of a shorter dataset unless it says so,
 * and mistaking one for the other is exactly the error the replay exists to
 * prevent. So the label states the mode and the timestamp, always.
 */

export interface ReplayControlsProps {
  mode: "final" | "causal";
  onModeChange(mode: "final" | "causal"): void;
  /** Index into the cursor stops. */
  step: number;
  onStepChange(step: number): void;
  /** The instants the cursor can occupy, ascending. */
  stops: readonly number[];
  disabled?: boolean;
}

export function formatCursor(atUtcMs: number): string {
  const iso = new Date(atUtcMs).toISOString();
  return `${iso.slice(5, 10)} ${iso.slice(11, 16)} UTC`;
}

export function ReplayControls({
  mode,
  onModeChange,
  step,
  onStepChange,
  stops,
  disabled = false,
}: ReplayControlsProps) {
  const causal = mode === "causal";
  const maxStep = Math.max(stops.length - 1, 0);
  const current = stops[Math.min(step, maxStep)];

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
      <div
        className="flex items-center gap-0.5 rounded-buttons bg-subtle p-0.5"
        role="group"
        aria-label="Replay mode"
      >
        {(["final", "causal"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => onModeChange(m)}
            className={cx(
              "font-display cursor-pointer rounded-buttons border-none px-3 py-1.5 text-[12px] font-medium capitalize",
              "[transition:all_var(--transition-fast)]",
              mode === m ? "bg-ink text-ink-inverse" : "bg-transparent text-ink-secondary",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {causal ? (
        <div className="flex min-w-[240px] flex-1 items-center gap-3">
          <input
            type="range"
            min={0}
            max={maxStep}
            value={Math.min(step, maxStep)}
            disabled={disabled || maxStep === 0}
            onChange={(e) => onStepChange(Number(e.target.value))}
            aria-label="Replay cursor"
            aria-valuetext={current === undefined ? undefined : formatCursor(current)}
            className="h-1 flex-1 cursor-pointer accent-ic"
          />
          <span className="font-mono whitespace-nowrap text-[12px] text-ink">
            {current === undefined ? "—" : formatCursor(current)}
          </span>
        </div>
      ) : (
        <span className="font-ui text-[12px] tracking-[0.3px] text-ink-secondary">
          Everything the run ever knew.
        </span>
      )}
    </div>
  );
}

/** The banner that names what is on screen. */
export function ReplayModeBadge({
  mode,
  atUtcMs,
}: {
  mode: "final" | "causal";
  atUtcMs: number | null;
}) {
  if (mode === "final") {
    return <Tag mono>Final view</Tag>;
  }
  return (
    <Tag mono tone="ic">
      Causal view as of {atUtcMs === null ? "—" : formatCursor(atUtcMs)}
    </Tag>
  );
}
