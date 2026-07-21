import { Button, Card, Highlight, SectionBand, Tag } from "@/components/ui";
import { container } from "@/lib/styles";
import { cx } from "@/lib/cx";

function Terminal({ lines }: { lines: string[] }) {
  return (
    <div className="overflow-x-auto rounded-cards bg-inverse px-6 py-5 font-mono text-[13px] leading-[1.8] tracking-[0.3px]">
      {lines.map((l, i) => (
        <div
          key={i}
          className={cx("whitespace-pre", l.startsWith("$") ? "text-white" : "text-(--text-inverse-muted)")}
        >
          {l}
        </div>
      ))}
    </div>
  );
}

function StatusCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <h3 className="font-display m-0 mb-2.5 text-[18px] font-semibold tracking-[0.4px]">{title}</h3>
      <ul className="font-ui m-0 pl-4.5 text-body-sm leading-[1.7] text-ink-secondary">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </Card>
  );
}

export default function EnginePage() {
  return (
    <main>
      <section className="py-16">
        <div className={container}>
          <Tag mono>wickd-dotnet · .NET 10</Tag>
          <h1 className="font-display mt-5 mb-0 max-w-[900px] text-display-page font-semibold">
            The engine journals what the market did.
          </h1>
          <p className="font-display mt-6 max-w-[640px] text-subheading leading-[1.4]">
            Fetch and cache historical candles, replay them deterministically, and write{" "}
            <Highlight>structure events</Highlight> to a journal your strategies can trust.
          </p>
        </div>
      </section>
      <SectionBand color="var(--structure-ic)" />
      <section className="bg-card py-16">
        <div className={cx(container, "grid grid-cols-1 items-start gap-12 lg:grid-cols-2")}>
          <div>
            <h2 className="font-display m-0 mb-4 text-heading font-semibold">
              From candles to structures in two commands
            </h2>
            <p className="font-ui m-0 text-body-sm leading-normal text-ink-secondary">
              The A1 → B path: HistoricalDataSource feeds the StructureEngine, which journals
              deterministic events for swings, equal highs/lows, liquidity breaches, sweeps,
              order blocks, and FVG events.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Tag tone="bullish">swings</Tag>
              <Tag tone="default">EQH/EQL</Tag>
              <Tag tone="default">$ sweeps</Tag>
              <Tag tone="bearish">order blocks</Tag>
              <Tag tone="fvg">FVG</Tag>
            </div>
            <div className="mt-7">
              <Button arrow>Install the CLI</Button>
            </div>
          </div>
          <Terminal
            lines={[
              "$ wickd fetch --market BTC_USDT_PERP --timeframe 5m \\",
              "    --from 2026-05-06T00:00:00Z --to 2026-05-07T07:00:00Z \\",
              "    --alias may6-session",
              "cached 372 candles → data/cache/.../candles.jsonl",
              "saved alias may6-session",
              "$ wickd backtest --dataset may6-session --run-id phase-3-smoke",
              "replayed 372 candles · emitted 1,284 structure events",
              "wrote runs/phase-3-smoke/structures.jsonl",
            ]}
          />
        </div>
      </section>
      <SectionBand color="var(--structure-bullish)" />
      <section className="py-16">
        <div className={container}>
          <h2 className="font-display m-0 mb-8 text-heading font-semibold">Honest about status</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <StatusCard
              title="Implemented"
              items={[
                "fetch, backtest, manage commands",
                "Dataset aliases",
                "Structure journaling",
                "Binance USD-M via CCXT",
              ]}
            />
            <StatusCard
              title="Placeholder"
              items={["analyze — parses --run-id, returns not-implemented"]}
            />
            <StatusCard
              title="Not yet"
              items={["Setup & trade engines", "Live execution", "AI analyst agent", "Dashboards"]}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
