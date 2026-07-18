import {
  Button,
  Card,
  CandleChart,
  GradientUnderline,
  Highlight,
  SectionBand,
  StructureBlock,
  Tag,
  type TagTone,
} from "@/components/ui";

const wrap = "mx-auto max-w-(--page-max-width) px-6";

function Hero() {
  return (
    <section className="relative overflow-hidden pt-18 pb-22">
      <StructureBlock kind="bullish" width={170} height={54} style={{ position: "absolute", right: "16%", top: 64, zIndex: 0 }} />
      <StructureBlock kind="fvg" width={220} height={30} style={{ position: "absolute", right: "6%", top: 170, zIndex: 0 }} />
      <StructureBlock kind="bearish" width={140} height={10} style={{ position: "absolute", right: "24%", top: 250, zIndex: 0 }} />
      <StructureBlock kind="ic" width={56} height={120} style={{ position: "absolute", right: "11%", top: 290, zIndex: 0 }} />
      <StructureBlock kind="breaker" width={100} height={36} style={{ position: "absolute", right: "30%", top: 120, zIndex: 0 }} />
      <div className={`${wrap} relative z-1`}>
        <h1
          className="font-display font-semibold m-0"
          style={{ fontSize: "clamp(72px, 11vw, 150px)", lineHeight: 1, letterSpacing: "1.5px" }}
        >
          Market structure,
          <br />
          made visible.
        </h1>
        <p className="font-display mt-7 max-w-[620px]" style={{ fontSize: 24, lineHeight: 1.4, letterSpacing: "0.6px" }}>
          WickdAlgo turns complex price action into{" "}
          <Highlight>deterministic, measurable structures</Highlight> — swings, order blocks,
          FVGs, liquidity — that traders and strategy agents consume through stable contracts.
        </p>
        <div className="mt-9 flex items-center gap-4">
          <Button size="lg" arrow>
            Inspect a structure
          </Button>
          <Button variant="ghost" size="lg">
            Read the engine docs
          </Button>
        </div>
        <div className="font-mono mt-11 text-[13px] tracking-[0.3px] text-ink-secondary">
          Core emits structures. Strategies make decisions.
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items: { tone: TagTone; tag: string; title: string; body: string }[] = [
    {
      tone: "bullish",
      tag: "swings",
      title: "Detected once, emitted consistently",
      body: "Structure detection lives in the Core. Bots never reimplement swing, OB, FVG, or liquidity logic — they consume journaled events.",
    },
    {
      tone: "ic",
      tag: "deterministic",
      title: "Reproducible by construction",
      body: "Same candles, same settings, same structures.jsonl — every run replays exactly. Data, settings, and journals are inspectable artifacts.",
    },
    {
      tone: "fvg",
      tag: "explainable",
      title: "Every output traceable",
      body: "A useful trading decision traces back to the market structures, settings, and strategy rules that produced it. No black boxes.",
    },
  ];
  return (
    <section className="bg-card py-18">
      <div className={wrap}>
        <h2 className="font-display text-heading-lg font-semibold m-0 mb-10 max-w-[700px]">
          One reliable language of{" "}
          <GradientUnderline color="var(--structure-bullish)">structure</GradientUnderline>
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((f) => (
            <Card key={f.tag}>
              <Tag tone={f.tone}>{f.tag}</Tag>
              <h3 className="font-display font-semibold text-[20px] tracking-[0.5px] mt-3.5 mb-2">
                {f.title}
              </h3>
              <p className="font-ui text-[14px] leading-normal tracking-[0.35px] text-ink-secondary m-0">
                {f.body}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChartSection() {
  return (
    <section className="py-18">
      <div className={`${wrap} grid grid-cols-1 items-center gap-12 lg:grid-cols-[380px_1fr]`}>
        <div>
          <h2 className="font-display text-heading font-semibold m-0">
            Inspect structures on the chart, not in a log
          </h2>
          <p className="font-ui text-[15px] leading-normal tracking-[0.35px] text-ink-secondary my-4">
            Order blocks, fair value gaps, and liquidity zones render as flat, verifiable
            rectangles over replayed candles. What the engine journals is what you see.
          </p>
          <Button variant="secondary" arrow>
            Run a backtest
          </Button>
        </div>
        <CandleChart height={340} />
      </div>
    </section>
  );
}

function Layers() {
  const rows: { n: string; t: string; d: string; s: string; tone: TagTone }[] = [
    {
      n: "01",
      t: "Engine & tooling",
      d: "Wickd.Core, Wickd.CLI, market data adapters, deterministic replay, SMC structure journaling.",
      s: "Current focus",
      tone: "bullish",
    },
    {
      n: "02",
      t: "Web platform",
      d: "Strategy playground, chart-based structure inspection, algorithm tuning, backtesting workflows.",
      s: "Next layer",
      tone: "ic",
    },
    {
      n: "03",
      t: "Strategy agents",
      d: "Independent bots that consume validated structures and own their execution decisions.",
      s: "Later",
      tone: "breaker",
    },
    {
      n: "04",
      t: "AI research layer",
      d: "LLM-assisted discovery, explanation, evaluation, and optimization over deterministic outputs.",
      s: "Future",
      tone: "sr",
    },
  ];
  return (
    <section className="bg-subtle py-18">
      <div className={wrap}>
        <h2 className="font-display text-heading-lg font-semibold m-0 mb-10">
          A modular operating layer
        </h2>
        <div className="flex flex-col">
          {rows.map((r) => (
            <div
              key={r.n}
              className="flex flex-wrap items-baseline gap-x-8 gap-y-2 border-t border-strong py-5.5"
            >
              <span className="font-mono w-8 flex-none text-[13px] text-ink-secondary">{r.n}</span>
              <span className="font-display w-70 flex-none text-[24px] font-semibold tracking-[0.6px]">
                {r.t}
              </span>
              <span className="font-ui flex-1 basis-60 text-[14px] leading-normal tracking-[0.35px] text-ink-secondary">
                {r.d}
              </span>
              <Tag tone={r.tone}>{r.s}</Tag>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="bg-card py-22">
      <div className={`${wrap} text-center`}>
        <h2 className="font-display text-display font-semibold m-0">
          Build on structures,
          <br />
          not on <Highlight>signals</Highlight>.
        </h2>
        <div className="mt-9 flex justify-center gap-4">
          <Button size="lg" arrow>
            Sign up
          </Button>
          <Button variant="secondary" size="lg">
            Explore the CLI
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main>
      <Hero />
      <SectionBand color="var(--structure-bullish)" />
      <Features />
      <SectionBand color="var(--structure-bearish)" />
      <ChartSection />
      <SectionBand color="var(--structure-breaker)" />
      <Layers />
      <CtaBand />
    </main>
  );
}
