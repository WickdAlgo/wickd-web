import Link from "next/link";
import { Tag } from "@/components/ui";
import type { TradeSummary } from "@/contracts";
import { panel } from "@/lib/styles";

const th =
  "font-ui border-b border-hairline px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[1px] text-ink-secondary";
const td = "font-mono border-b border-hairline px-4 py-[11px] text-[12.5px] tracking-[0.3px]";

export interface JournalListViewProps {
  trades: readonly TradeSummary[];
}

/**
 * The trade list.
 *
 * Reported R and net R get their own columns and never merge. They are
 * different measurements — what the signal source claimed, and what the account
 * actually saw — and the gap between them is the reason to keep a journal at
 * all. Neither is computed here; both arrive as decimal strings.
 */
export function JournalListView({ trades }: JournalListViewProps) {
  if (trades.length === 0) {
    return (
      <div className="font-ui rounded-cards border border-dashed border-strong bg-card p-12 text-center text-[14px] tracking-[0.35px] text-ink-secondary">
        No trades recorded yet.
      </div>
    );
  }

  return (
    <div className={panel}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Signal (UTC)</th>
              <th className={th}>Market</th>
              <th className={th}>Setup</th>
              <th className={th}>Side</th>
              <th className={th}>Source</th>
              <th className={`${th} text-right`}>Reported R</th>
              <th className={`${th} text-right`}>Net R</th>
              <th className={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id}>
                <td className={td}>
                  <Link
                    href={`/platform/journal/${t.id}`}
                    className="text-ink underline underline-offset-2"
                  >
                    {t.signalTimeUtc.slice(0, 16).replace("T", " ")}
                  </Link>
                </td>
                <td className={td}>{t.instrument.market}</td>
                <td className={`${td} font-ui text-ink-secondary`}>{t.setupName ?? "—"}</td>
                <td className={td}>
                  <Tag tone={t.direction === "long" ? "long" : "short"}>{t.direction}</Tag>
                </td>
                <td className={`${td} text-ink-secondary`}>{t.source}</td>
                <td className={`${td} text-right text-ink-secondary`}>
                  {t.mentorReportedR ?? "—"}
                </td>
                <td className={`${td} text-right`}>{t.netR ?? "—"}</td>
                <td className={td}>
                  <Tag>{t.status}</Tag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
