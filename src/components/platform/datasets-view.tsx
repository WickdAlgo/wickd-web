"use client";
import React from "react";
import { Button, Tag } from "@/components/ui";

const panel = "bg-card border border-hairline rounded-cards";
const th =
  "font-ui border-b border-hairline px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[1px] text-ink-secondary";
const td = "font-mono border-b border-hairline px-4 py-[11px] text-[12.5px] tracking-[0.3px]";

const dsRows = [
  { alias: "may6-session", market: "BTC_USDT_PERP", tf: "5m", range: "2026-05-06 00:00 → 05-07 07:00", candles: 372 },
  { alias: "apr-range", market: "BTC_USDT_PERP", tf: "15m", range: "2026-04-01 00:00 → 04-14 00:00", candles: 1248 },
  { alias: "q1-trend", market: "ETH_USDT_PERP", tf: "1h", range: "2026-01-01 00:00 → 03-31 00:00", candles: 2160 },
];

const runRows = [
  { id: "phase-3-smoke", dataset: "may6-session", events: 1284, status: "complete" },
  { id: "ob-tuning-04", dataset: "apr-range", events: 4907, status: "complete" },
  { id: "sweep-check", dataset: "q1-trend", events: 0, status: "failed" },
];

export function DatasetsView() {
  return (
    <div className="flex flex-col gap-4">
      <div className={panel}>
        <div className="flex items-center px-4 py-3.5">
          <span className="font-display text-[16px] font-semibold tracking-[0.4px]">
            Dataset aliases
          </span>
          <span className="ml-auto">
            <Button size="sm" variant="secondary" arrow>
              Fetch new range
            </Button>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>Alias</th>
                <th className={th}>Market</th>
                <th className={th}>TF</th>
                <th className={th}>Range (UTC)</th>
                <th className={`${th} text-right`}>Candles</th>
              </tr>
            </thead>
            <tbody>
              {dsRows.map((r) => (
                <tr key={r.alias}>
                  <td className={td}>{r.alias}</td>
                  <td className={td}>{r.market}</td>
                  <td className={td}>{r.tf}</td>
                  <td className={`${td} text-ink-secondary`}>{r.range}</td>
                  <td className={`${td} text-right`}>{r.candles.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className={panel}>
        <div className="font-display px-4 py-3.5 text-[16px] font-semibold tracking-[0.4px]">
          Runs
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>Run ID</th>
                <th className={th}>Dataset</th>
                <th className={`${th} text-right`}>Events</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {runRows.map((r) => (
                <tr key={r.id}>
                  <td className={td}>{r.id}</td>
                  <td className={td}>{r.dataset}</td>
                  <td className={`${td} text-right`}>{r.events.toLocaleString()}</td>
                  <td className={td}>
                    <Tag tone={r.status === "complete" ? "long" : "short"}>{r.status}</Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
