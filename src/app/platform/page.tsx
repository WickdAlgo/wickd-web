"use client";
import React from "react";
import Link from "next/link";
import { Tag } from "@/components/ui";
import { cx } from "@/lib/cx";
import { InspectView } from "@/components/platform/inspect-view";
import { BacktestView } from "@/components/platform/backtest-view";
import { DatasetsView } from "@/components/platform/datasets-view";

const navItems = [
  { id: "inspect", label: "Inspect", blurb: "Validate what the engine journaled, visually." },
  { id: "backtest", label: "Backtest", blurb: "Deterministic replay — same inputs, same journal." },
  { id: "datasets", label: "Datasets", blurb: "Cached ranges and run artifacts." },
  { id: "playground", label: "Playground", blurb: "Strategy rules without backend code." },
] as const;

type ViewId = (typeof navItems)[number]["id"];

export default function PlatformPage() {
  const [view, setView] = React.useState<ViewId>("inspect");
  const current = navItems.find((n) => n.id === view)!;
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-[200px] flex-none flex-col gap-1 border-r border-hairline bg-card px-3 py-5">
        <Link
          href="/"
          className="font-display px-2.5 pb-4 text-[18px] font-semibold tracking-[0.45px] no-underline"
        >
          WickdAlgo
        </Link>
        {navItems.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => setView(n.id)}
            className={cx(
              "font-display cursor-pointer rounded-buttons border-none px-3 py-[9px] text-left text-body-sm font-medium [transition:all_var(--transition-fast)]",
              view === n.id ? "bg-ink text-ink-inverse" : "bg-transparent text-ink",
            )}
          >
            {n.label}
          </button>
        ))}
        <div className="mt-auto px-2.5">
          <Tag mono>v0.1.0-preview</Tag>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-6 py-5">
        <div className="mb-4.5 flex items-baseline gap-3">
          <h1 className="font-display m-0 text-[24px] font-semibold tracking-[0.6px]">
            {current.label}
          </h1>
          <span className="font-ui text-[12px] tracking-[0.3px] text-ink-secondary">
            {current.blurb}
          </span>
        </div>
        {view === "inspect" && <InspectView />}
        {view === "backtest" && <BacktestView />}
        {view === "datasets" && <DatasetsView />}
        {view === "playground" && (
          <div className="font-ui rounded-cards border border-dashed border-strong bg-card p-12 text-center text-[14px] tracking-[0.35px] text-ink-secondary">
            Strategy playground is a Phase II roadmap item — intentionally not designed yet.
          </div>
        )}
      </main>
    </div>
  );
}
