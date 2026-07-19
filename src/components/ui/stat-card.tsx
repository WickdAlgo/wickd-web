import React from "react";
import { cx } from "@/lib/cx";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  delta?: React.ReactNode;
  /** Colors the delta line: long = deep green, short = alert red. */
  tone?: "long" | "short";
  /** Value in the mono face (default — stats are data). */
  mono?: boolean;
}

export function StatCard({ label, value, delta, tone, mono = true, className, ...rest }: StatCardProps) {
  return (
    <div
      className={cx("rounded-cards border border-hairline bg-card px-5 py-4", className)}
      {...rest}
    >
      <div className="font-ui text-caption text-ink-secondary">{label}</div>
      <div
        className={cx(
          "mt-1 text-[28px] font-semibold leading-[1.1] tracking-[0.5px]",
          mono ? "font-mono" : "font-display",
        )}
      >
        {value}
      </div>
      {delta && (
        <div
          className={cx(
            "font-ui mt-1 text-caption",
            tone === "long"
              ? "text-long-deep"
              : tone === "short"
                ? "text-short"
                : "text-ink-secondary",
          )}
        >
          {delta}
        </div>
      )}
    </div>
  );
}
