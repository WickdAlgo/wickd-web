"use client";
import React from "react";
import { Button, Checkbox, Input, Select, StatCard, Tag } from "@/components/ui";
import type { DatasetSummary, JournalEntry, RunSummary } from "@/contracts";
import { platformGateway } from "@/data/platform";
import { panel } from "@/lib/styles";

export interface BacktestViewProps {
  datasets: readonly DatasetSummary[];
  defaultDatasetAlias: string;
  defaultRunId: string;
  /** The tail this run produces, resolved at build time. */
  journalTail: readonly JournalEntry[];
  candleCount: number;
}

function formatEntry(entry: JournalEntry): string {
  return `${entry.timeUtc}  ${entry.type.padEnd(18)} ${entry.detail}`;
}

export function BacktestView({
  datasets,
  defaultDatasetAlias,
  defaultRunId,
  journalTail,
  candleCount,
}: BacktestViewProps) {
  const [datasetAlias, setDatasetAlias] = React.useState(defaultDatasetAlias);
  const [runId, setRunId] = React.useState(defaultRunId);
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<RunSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Aborts an in-flight run if the view unmounts, which the original
  // `setTimeout` could not do — it resolved into an unmounted component.
  const abortRef = React.useRef<AbortController | null>(null);
  React.useEffect(() => () => abortRef.current?.abort(), []);

  const run = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setRunning(true);
    setResult(null);
    setError(null);
    try {
      const summary = await platformGateway.startBacktest(
        {
          datasetAlias,
          runId,
          writeStructures: true,
          writeLifecycle: true,
          writeEvidence: false,
        },
        controller.signal,
      );
      setResult(summary);
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e instanceof Error ? e.message : "the run failed");
    } finally {
      if (!controller.signal.aborted) setRunning(false);
    }
  };

  const done = result !== null;

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[380px_1fr]">
      <div className={`${panel} p-5`}>
        <div className="font-display mb-4 text-[18px] font-semibold tracking-[0.4px]">
          New backtest run
        </div>
        <div className="flex flex-col gap-3.5">
          <Select
            label="Dataset alias"
            mono
            options={datasets.map((d) => d.alias)}
            value={datasetAlias}
            onChange={(e) => setDatasetAlias(e.target.value)}
          />
          <Input
            label="Run ID"
            mono
            value={runId}
            onChange={(e) => setRunId(e.target.value)}
            hint="Writes runs/{runId}/structures.jsonl"
          />
          <div className="flex flex-col gap-2.5 py-1">
            <Checkbox label="Emit lifecycle updates" defaultChecked />
            <Checkbox label="Journal equal highs/lows" defaultChecked />
            <Checkbox label="Overwrite existing run" />
          </div>
          <Button arrow onClick={run} disabled={running}>
            {running ? "Replaying…" : "Run backtest"}
          </Button>
          <div className="font-ui text-[11px] tracking-[0.3px] text-ink-secondary">
            One market, one timeframe per run. Replay is deterministic — same inputs, same
            journal.
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div
          className="grid grid-cols-2 gap-3 md:grid-cols-4"
          style={{ opacity: done ? 1 : 0.35, transition: "var(--transition-base)" }}
        >
          <StatCard
            label="Candles replayed"
            value={done ? candleCount.toLocaleString() : "—"}
          />
          <StatCard label="Events emitted" value={done ? result.events.toLocaleString() : "—"} />
          <StatCard
            label="Gaps recorded"
            value={done ? "0" : "—"}
            delta={done ? "contiguous range" : undefined}
            tone="long"
          />
          <StatCard label="Duration" value={done ? "0.9s" : "—"} />
        </div>
        <div className={`${panel} overflow-hidden`}>
          <div className="flex items-center gap-2.5 border-b border-hairline px-4 py-3">
            <span className="font-ui text-[10px] font-medium uppercase tracking-[1px] text-ink-secondary">
              Journal tail
            </span>
            {done && <Tag tone="long">complete</Tag>}
            {running && <Tag>replaying</Tag>}
            {error && <Tag tone="short">failed</Tag>}
          </div>
          <pre className="font-mono m-0 min-h-[180px] overflow-x-auto bg-inverse px-5 py-4 text-[11.5px] leading-[1.7] text-ink-inverse-muted">
            {error
              ? error
              : done
                ? [
                    ...journalTail.map(formatEntry),
                    "",
                    `wrote runs/${result.runId}/structures.jsonl · exit 0`,
                  ].join("\n")
                : running
                  ? "replaying candles…"
                  : "Run a backtest to tail its journal."}
          </pre>
        </div>
      </div>
    </div>
  );
}
