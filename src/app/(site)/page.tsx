import {
  AnimatedLogo,
  Button,
  Card,
  CandleChart,
  GradientUnderline,
  Highlight,
  SectionBand,
  Tag,
  type TagTone,
} from "@/components/ui";
import { container } from "@/lib/styles";
import { cx } from "@/lib/cx";
import { PipelineSection } from "@/components/home/pipeline-section";
import { HeroBackground } from "@/components/home/hero-background";

function Hero() {
  return (
    <section className="relative flex min-h-[600px] flex-col justify-center overflow-hidden pt-18 pb-22">
      <HeroBackground />
      <div className={cx(container, "relative z-10 w-full")}>
        <h1 className="font-display m-0 text-display-hero font-semibold">
          Market structure,
          <br />
          made visible.
        </h1>
        <p className="font-display mt-7 max-w-[620px] text-heading-sm font-normal leading-[1.4]">
          WickdAlgo turns complex price action into{" "}
          <Highlight>deterministic, measurable structures</Highlight> — swings, order blocks,
          FVGs, liquidity — that traders and strategy agents consume through stable contracts.
        </p>
        <div className="mt-9 flex items-center gap-4">
          <Button size="lg" arrow>
            Inspect a structure
          </Button>
          <Button variant="ghost" size="lg" href="/engine">
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
      <div className={container}>
        <h2 className="font-display m-0 mb-10 max-w-[700px] text-heading-lg font-semibold">
          One reliable language of{" "}
          <GradientUnderline color="var(--structure-bullish)">structure</GradientUnderline>
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((f) => (
            <Card key={f.tag}>
              <Tag tone={f.tone}>{f.tag}</Tag>
              <h3 className="font-display mt-3.5 mb-2 text-subheading font-semibold">
                {f.title}
              </h3>
              <p className="font-ui m-0 text-body-sm leading-normal text-ink-secondary">
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
      <div className={cx(container, "grid grid-cols-1 items-center gap-12 lg:grid-cols-[380px_1fr]")}>
        <div>
          <h2 className="font-display m-0 text-heading font-semibold">
            Inspect structures on the chart, not in a log
          </h2>
          <p className="font-ui my-4 text-[15px] leading-normal tracking-[0.35px] text-ink-secondary">
            Order blocks, fair value gaps, and liquidity zones render as flat, verifiable
            rectangles over replayed candles. What the engine journals is what you see.
          </p>
          <Button variant="secondary" arrow href="/platform">
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
      <div className={container}>
        <h2 className="font-display m-0 mb-10 text-heading-lg font-semibold">
          A modular operating layer
        </h2>
        <div className="flex flex-col">
          {rows.map((r) => (
            <div
              key={r.n}
              className="flex flex-wrap items-baseline gap-x-8 gap-y-2 border-t border-strong py-5.5"
            >
              <span className="font-mono w-8 flex-none text-[13px] text-ink-secondary">{r.n}</span>
              <span className="font-display w-70 flex-none text-heading-sm font-semibold">
                {r.t}
              </span>
              <span className="font-ui flex-1 basis-60 text-body-sm leading-normal text-ink-secondary">
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
      <div className={cx(container, "text-center")}>
        <div className="mb-9 flex justify-center">
          <span className="wa-brand inline-flex" title="Replay the chart">
            <AnimatedLogo variant="full" size={180} />
          </span>
        </div>
        <h2 className="font-display m-0 text-display font-semibold">
          Build on structures,
          <br />
          not on <Highlight>signals</Highlight>.
        </h2>
        <div className="mt-9 flex justify-center gap-4">
          <Button size="lg" arrow>
            Sign up
          </Button>
          <Button variant="secondary" size="lg" href="/engine">
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
      <PipelineSection />
      <SectionBand color="var(--structure-breaker)" />
      <Features />
      <SectionBand color="var(--structure-bullish)" />
      <ChartSection />
      <SectionBand color="var(--structure-fvg)" />
      <Layers />
      <CtaBand />
    </main>
  );
}
