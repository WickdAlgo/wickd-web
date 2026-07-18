"use client";
import React from "react";
import { Button, Checkbox, Input, Select, StatCard, Tag } from "@/components/ui";

const panel = "bg-card border border-hairline rounded-cards";

const doneJournal = `{"t":"2026-05-06T14:20:00Z","kind":"orderblock","side":"bullish","lo":64050,"hi":64180}
{"t":"2026-05-06T14:35:00Z","kind":"fvg","side":"bullish","lo":64230,"hi":64410}
{"t":"2026-05-06T14:55:00Z","kind":"lifecycle","ref":"orderblock#18","state":"mitigated"}
{"t":"2026-05-06T15:10:00Z","kind":"sweep","target":"EQH@64980","result":"reject"}

wrote runs/phase-3-smoke/structures.jsonl · exit 0`;

export function BacktestView() {
  const [running, setRunning] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const run = () => {
    setRunning(true);
    setDone(false);
    setTimeout(() => {
      setRunning(false);
      setDone(true);
    }, 900);
  };
  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[380px_1fr]">
      <div className={`${panel} p-5`}>
        <div className="font-display mb-4 text-[18px] font-semibold tracking-[0.4px]">
          New backtest run
        </div>
        <div className="flex flex-col gap-3.5">
          <Select label="Dataset alias" mono options={["may6-session", "apr-range", "q1-trend"]} defaultValue="may6-session" />
          <Input label="Run ID" mono defaultValue="phase-3-smoke" hint="Writes runs/{runId}/structures.jsonl" />
          <div className="flex flex-col gap-2.5 py-1">
            <Checkbox label="Emit lifecycle updates" checked onChange={() => {}} />
            <Checkbox label="Journal equal highs/lows" checked onChange={() => {}} />
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
          <StatCard label="Candles replayed" value={done ? "372" : "—"} />
          <StatCard label="Events emitted" value={done ? "1,284" : "—"} />
          <StatCard label="Gaps recorded" value={done ? "0" : "—"} delta={done ? "contiguous range" : undefined} tone="long" />
          <StatCard label="Duration" value={done ? "1.9s" : "—"} />
        </div>
        <div className={`${panel} overflow-hidden`}>
          <div className="flex items-center gap-2.5 border-b border-hairline px-4 py-3">
            <span className="font-ui text-[10px] font-medium uppercase tracking-[1px] text-ink-secondary">
              Journal tail
            </span>
            {done && <Tag tone="long">complete</Tag>}
            {running && <Tag>replaying</Tag>}
          </div>
          <pre className="font-mono m-0 min-h-[180px] overflow-x-auto bg-inverse px-5 py-4 text-[11.5px] leading-[1.7] text-[#d7e0e2]">
            {done ? doneJournal : running ? "replaying candles…" : "Run a backtest to tail its journal."}
          </pre>
        </div>
      </div>
    </div>
  );
}
