import { Button, Card, SectionBand, Tag, type TagTone } from "@/components/ui";

const wrap = "mx-auto max-w-(--page-max-width) px-6";

interface Plan {
  tone: TagTone;
  badge: string;
  name: string;
  price: string;
  items: string[];
  cta: string;
  ctaVariant?: "primary" | "secondary" | "ghost";
  float?: boolean;
}

const plans: Plan[] = [
  {
    tone: "neutral",
    badge: "Available now",
    name: "Engine",
    price: "$0",
    items: [
      "Wickd.Core + Wickd.CLI",
      "Historical fetch & caching",
      "Deterministic backtest replay",
      "Structure journaling (JSONL)",
    ],
    cta: "Get the CLI",
    ctaVariant: "secondary",
  },
  {
    tone: "bullish",
    badge: "Next",
    name: "Platform",
    price: "TBA",
    items: [
      "Chart-based structure inspection",
      "Strategy playground",
      "Backtesting & visualization",
      "Algorithm tuning workflows",
    ],
    cta: "Join the waitlist",
    ctaVariant: "primary",
    float: true,
  },
  {
    tone: "sr",
    badge: "Future",
    name: "Agents",
    price: "—",
    items: [
      "Deployed user-owned bots",
      "Subscription access",
      "AI research layer",
      "Explainable strategy audits",
    ],
    cta: "Read the roadmap",
    ctaVariant: "ghost",
  },
];

export default function PricingPage() {
  return (
    <main>
      <section className="pt-16 pb-12">
        <div className={`${wrap} text-center`}>
          <h1
            className="font-display m-0 font-semibold"
            style={{ fontSize: "clamp(56px,7vw,96px)", lineHeight: 1.05, letterSpacing: "1.4px" }}
          >
            Open core.
            <br />
            Paid research loop.
          </h1>
          <p
            className="font-display mx-auto mt-5 max-w-[560px]"
            style={{ fontSize: 20, letterSpacing: "0.5px" }}
          >
            The engine is source-available today. Platform subscriptions arrive with the web
            research loop.
          </p>
        </div>
      </section>
      <SectionBand color="var(--structure-breaker)" />
      <section className="bg-card py-16">
        <div className={`${wrap} grid grid-cols-1 items-stretch gap-6 md:grid-cols-3`}>
          {plans.map((p) => (
            <Card
              key={p.name}
              elevation={p.float ? "float" : "flat"}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <div>
                <Tag tone={p.tone}>{p.badge}</Tag>
              </div>
              <h3 className="font-display mt-4 mb-1 text-[24px] font-semibold tracking-[0.6px]">
                {p.name}
              </h3>
              <div className="font-mono mt-1 mb-4 text-[28px] font-semibold">{p.price}</div>
              <ul className="font-ui m-0 flex-1 pl-4.5 text-[14px] leading-[1.8] tracking-[0.35px] text-ink-secondary">
                {p.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              <div className="mt-5">
                <Button
                  variant={p.ctaVariant}
                  arrow={p.ctaVariant !== "ghost"}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {p.cta}
                </Button>
              </div>
            </Card>
          ))}
        </div>
        <div className={`${wrap} font-ui mt-8 text-center text-[12px] tracking-[0.3px] text-ink-secondary`}>
          Roadmap items are not production claims. Nothing here is financial advice.
        </div>
      </section>
    </main>
  );
}
