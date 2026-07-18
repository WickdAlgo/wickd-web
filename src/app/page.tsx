"use client";
import {
  Button,
  Card,
  CandleChart,
  Checkbox,
  Footer,
  GradientUnderline,
  Highlight,
  Input,
  NavBar,
  SectionBand,
  Select,
  StatCard,
  StructureBlock,
  StructureEventRow,
  Switch,
  Tabs,
  Tag,
} from "@/components/ui";

export default function Home() {
  return (
    <div>
      <NavBar active="Platform" />

      {/* Hero */}
      <section className="mx-auto max-w-(--page-max-width) px-6 py-20">
        <h1 className="font-display text-display font-semibold text-ink m-0">
          Core emits <GradientUnderline color="var(--structure-bullish)">structures</GradientUnderline>.
          <br />
          Strategies make decisions.
        </h1>
        <p className="text-body text-ink-secondary mt-6 max-w-2xl">
          WickdAlgo transforms complex price action into{" "}
          <Highlight>deterministic, measurable, and visually verifiable</Highlight> market
          structures. It does not sell predictions — it makes market structure visible.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Button size="lg" arrow>
            Inspect a structure
          </Button>
          <Button variant="secondary" size="lg">
            Run a backtest
          </Button>
        </div>
      </section>

      <SectionBand color="var(--structure-bullish)" />

      {/* Chart + events */}
      <section className="mx-auto max-w-(--page-max-width) px-6 py-16">
        <h2 className="font-display text-heading font-semibold m-0 mb-6">
          Structure inspection
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CandleChart height={360} />
          </div>
          <Card padding={0}>
            <div className="border-b border-hairline px-4 pt-3">
              <Tabs items={["Events", "Settings"]} active="Events" onChange={() => {}} />
            </div>
            <StructureEventRow
              time="09:15:00Z"
              kind="bullish"
              label="OB"
              detail="Bullish order block confirmed"
              onInspect={() => {}}
            />
            <StructureEventRow
              time="09:20:00Z"
              kind="fvg"
              label="FVG"
              detail="Fair value gap opened"
              onInspect={() => {}}
            />
            <StructureEventRow
              time="09:35:00Z"
              kind="sr"
              label="BoS"
              detail="Break of structure at swing high"
              onInspect={() => {}}
            />
            <StructureEventRow
              time="09:41:00Z"
              kind="default"
              label="sweep"
              detail="Buy-side liquidity swept ($)"
              onInspect={() => {}}
              selected
            />
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Structures emitted" value="1,284" delta="+312 this run" tone="long" />
          <StatCard label="Win rate" value="61.4%" delta="+2.1pp vs baseline" tone="long" />
          <StatCard label="Max drawdown" value="-8.2%" delta="worse by 0.4pp" tone="short" />
          <StatCard label="Run" value="run_7f3a" mono />
        </div>
      </section>

      <SectionBand color="var(--structure-breaker)" height={8} />

      {/* Vocabulary + forms */}
      <section className="mx-auto max-w-(--page-max-width) px-6 py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-heading font-semibold m-0 mb-6">
              The structure vocabulary
            </h2>
            <div className="flex flex-wrap gap-2">
              <Tag tone="bullish">bullish OB</Tag>
              <Tag tone="bearish">bearish OB</Tag>
              <Tag tone="ic">IC</Tag>
              <Tag tone="fvg">FVG</Tag>
              <Tag tone="breaker">breaker</Tag>
              <Tag tone="ote">OTE</Tag>
              <Tag tone="sr">S/R</Tag>
              <Tag tone="long">long</Tag>
              <Tag tone="short">short</Tag>
              <Tag mono tone="dark">
                BTC_USDT_PERP
              </Tag>
            </div>
            <div className="mt-8 flex flex-wrap items-start gap-6 pb-6">
              <StructureBlock kind="bullish" label="bullish OB" />
              <StructureBlock kind="bearish" label="bearish OB" />
              <StructureBlock kind="fvg" label="FVG" />
              <StructureBlock kind="breaker" scope="internal" label="breaker (internal)" />
              <StructureBlock kind="sr" label="S/R" />
            </div>
          </div>
          <Card>
            <h3 className="font-display text-heading-sm font-semibold m-0 mb-5">
              Backtest configuration
            </h3>
            <div className="flex flex-col gap-4">
              <Input label="Market" mono defaultValue="BTC_USDT_PERP" hint="CCXT Binance symbol" />
              <Select label="Timeframe" mono options={["1m", "5m", "15m", "1h", "4h"]} defaultValue="5m" />
              <div className="flex flex-wrap items-center gap-6">
                <Checkbox label="Journal structures" checked onChange={() => {}} />
                <Switch label="Deterministic replay" checked onChange={() => {}} />
              </div>
              <div>
                <Button arrow>Run backtest</Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
