import { Button, Tag } from "@/components/ui";
import type { DatasetSummary, RunSummary } from "@/contracts";
import { panel } from "@/lib/styles";

const th =
  "font-ui border-b border-hairline px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[1px] text-ink-secondary";
const td = "font-mono border-b border-hairline px-4 py-[11px] text-[12.5px] tracking-[0.3px]";

export interface DatasetsViewProps {
  datasets: readonly DatasetSummary[];
  runs: readonly RunSummary[];
}

/** `2026-05-06T00:00:00Z` + `2026-05-07T07:00:00Z` -> `2026-05-06 00:00 → 05-07 07:00`. */
function formatRange(fromUtc: string, toUtc: string): string {
  const from = `${fromUtc.slice(0, 10)} ${fromUtc.slice(11, 16)}`;
  const to = `${toUtc.slice(5, 10)} ${toUtc.slice(11, 16)}`;
  return `${from} → ${to}`;
}

/**
 * A server component — it renders two tables and has no interaction.
 *
 * It was marked `"use client"` only because the whole platform used to be one
 * client tree. Nested routes make the boundary a real choice again, and this
 * view now ships no JavaScript at all.
 */
export function DatasetsView({ datasets, runs }: DatasetsViewProps) {
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
              {datasets.map((d) => (
                <tr key={d.alias}>
                  <td className={td}>{d.alias}</td>
                  <td className={td}>{d.instrument.market}</td>
                  <td className={td}>{d.instrument.timeframe}</td>
                  <td className={`${td} text-ink-secondary`}>
                    {formatRange(d.rangeFromUtc, d.rangeToUtc)}
                  </td>
                  <td className={`${td} text-right`}>{d.candles.toLocaleString()}</td>
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
              {runs.map((r) => (
                <tr key={r.runId}>
                  <td className={td}>{r.runId}</td>
                  <td className={td}>{r.datasetAlias}</td>
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
