"use client";
import React from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/* ---------------------------------------------------------------- geometry
 *
 * A calm, left-to-right rendering of the actual Wickd pipeline:
 *   inputs → Adapters → Core → Strategies → (signals)
 * Strategies fan out long / short / track / pass; Management is drawn as a
 * governing layer enclosing those outputs — it sizes risk across all of them.
 *
 * viewBox 1180 × 450, budgeted left → right:
 *   input pills 30..~174 · fan-in 174..300
 *   three engine nodes 300..864 (124 wide, 96 apart) with a data chip per gap
 *   signals fan-out 864..982 · Management layer 952..1142 (wraps the outputs)
 */

const VB_W = 1180;
const VB_H = 450;
const MID_Y = 230;

/** Four fan-in / fan-out rows, spread symmetrically about the centre line. */
const ROW_Y = [0, 1, 2, 3].map((i) => MID_Y + (i - 1.5) * 78); // [113,191,269,347]

/* ------------------------------------------------------------------- pills */

const LABEL_FONT = 12;
const LABEL_LS = 1;
/** Glyph sits 24px in from the pill's left edge; text starts at 40px. */
const PILL_GLYPH_DX = 24;
const PILL_TEXT_DX = 40;
const PILL_TEXT_PAD = 22;
/** Width fit to the label so box and text lengths track together (monospace ≈ 0.6em). */
const pillWidth = (label: string) =>
  Math.round(PILL_TEXT_DX + label.length * (LABEL_FONT * 0.6 + LABEL_LS) + PILL_TEXT_PAD);

const IN_X = 30; // input pills' left edge

/* ------------------------------------------------------------------- nodes */

type GlyphType = "candles" | "clock" | "range" | "link" | "db" | "swing" | "branch" | "shield";

const INPUTS = [
  { id: "in-0", label: "MARKET", glyph: "candles" as GlyphType, title: "Market", blurb: "The instrument to fetch — e.g. BTC/USDT." },
  { id: "in-1", label: "TIMEFRAME", glyph: "clock" as GlyphType, title: "Timeframe", blurb: "One timeframe per run. No hidden resampling." },
  { id: "in-2", label: "TIME RANGE", glyph: "range" as GlyphType, title: "Time range", blurb: "The start/end window to fetch and replay." },
  { id: "in-3", label: "EXCHANGE", glyph: "link" as GlyphType, title: "Exchange", blurb: "CCXT adapter — fetches and caches candle ranges deterministically." },
] as const;

/** The three deterministic engine stages that run left → right. */
const MODULES = [
  { id: "adapters", label: "ADAPTERS", sub: "data fetch", glyph: "db" as GlyphType, title: "Wickd.Adapters", blurb: "Data-fetch layer. Market, timeframe and range in — OHLC candles out." },
  { id: "core", label: "CORE", sub: "structure", glyph: "swing" as GlyphType, title: "Wickd.Core", blurb: "Market- and time-agnostic. Reads candles, emits SMC structures — order blocks, swings, FVGs." },
  { id: "strategies", label: "STRATEGIES", sub: "decisions", glyph: "branch" as GlyphType, title: "Wickd.Strategies", blurb: "Consume structures, emit decisions: long, short, track, pass." },
] as const;

/** Management wraps the outputs as a governing layer, not an inline stage. */
const MANAGEMENT = {
  id: "management",
  label: "MANAGEMENT",
  title: "Wickd.Management",
  blurb: "Consumes strategy decisions and governs them — sizing risk and the portfolio across every signal.",
} as const;

const OUTPUTS = [
  { id: "out-0", label: "LONG", color: "var(--signal-long)", title: "Long", blurb: "Open or add to a long — sized by Management." },
  { id: "out-1", label: "SHORT", color: "var(--signal-short)", title: "Short", blurb: "Open or add to a short — sized by Management." },
  { id: "out-2", label: "TRACK", color: "var(--structure-breaker)", title: "Track", blurb: "Watch a setup that isn't actionable yet." },
  { id: "out-3", label: "PASS", color: "var(--structure-default)", title: "Pass", blurb: "A first-class outcome — most structures don't warrant a position." },
] as const;

/** The data that travels each engine wire, shown as a static chip. The
 *  fan-out needs no label — the long/short/track/pass pills read as signals. */
const WIRE_CHIPS = ["OHLC candles", "structures"] as const;

/* engine band -------------------------------------------------------------- */

const NODE_W = 124;
const NODE_H = 84;
const NODE_TOP = MID_Y - NODE_H / 2; // 188
const NODE_X = [300, 520, 740]; // left edges — 124 wide, 96 apart
const nodeR = NODE_X.map((x) => x + NODE_W); // [424,644,864]
const nodeCX = NODE_X.map((x) => x + NODE_W / 2); // [362,582,802]
const STRAT_R = nodeR[2]; // 864 — Strategies' right edge, where signals leave
const BAND_CX = (NODE_X[0] + STRAT_R) / 2; // 582

const inPillW = INPUTS.map((n) => pillWidth(n.label));
const outPillW = OUTPUTS.map((n) => pillWidth(n.label));
const inRailStart = inPillW.map((w) => IN_X + w); // rail leaves each pill's right edge

/* Management governing layer (wraps the four output pills) */
const MGMT_X = 952;
const MGMT_W = 190;
const MGMT_Y = 60;
const MGMT_H = 340; // bottom 400 — ~33px pad above/below the pill rows (93..367)
const MGMT_CX = MGMT_X + MGMT_W / 2;
const OUT_X = 982; // output pills' left edge (inside the layer)

/* connector paths ---------------------------------------------------------- */

/** Rows squeezed toward the centre line where wires meet the engine band. */
const NEAR_Y = [0, 1, 2, 3].map((i) => MID_Y + (i - 1.5) * 7);

/** Fan-in: horizontal out of each pill, one smooth bend, horizontal into Adapters. */
const IN_BEND = 220;
const IN_MERGE = 280;
const fanInD = ROW_Y.map((y, i) => {
  const k = 0.5 * (IN_MERGE - IN_BEND);
  return `M ${inRailStart[i]} ${y} L ${IN_BEND} ${y} C ${IN_BEND + k} ${y}, ${IN_MERGE - k} ${NEAR_Y[i]}, ${IN_MERGE} ${NEAR_Y[i]} L ${NODE_X[0]} ${NEAR_Y[i]}`;
});

/** Straight wires between adjacent engine nodes. */
const midD = [0, 1].map((i) => `M ${nodeR[i]} ${MID_Y} L ${NODE_X[i + 1]} ${MID_Y}`);

/** Fan-out: signals leave Strategies and settle onto each pill's row *before*
 *  the Management layer, so they cross its border horizontally and aligned. */
const OUT_SPLIT = 880;
const OUT_MERGE = 940; // curve completes ahead of the layer (MGMT_X = 952)
const fanOutD = ROW_Y.map((y, i) => {
  const k = 0.5 * (OUT_MERGE - OUT_SPLIT);
  return `M ${STRAT_R} ${NEAR_Y[i]} L ${OUT_SPLIT} ${NEAR_Y[i]} C ${OUT_SPLIT + k} ${NEAR_Y[i]}, ${OUT_MERGE - k} ${y}, ${OUT_MERGE} ${y} L ${OUT_X} ${y}`;
});

const CHIP_POS = [
  { x: (nodeR[0] + NODE_X[1]) / 2, y: MID_Y }, // OHLC candles
  { x: (nodeR[1] + NODE_X[2]) / 2, y: MID_Y }, // structures
];

/* -------------------------------------------------------------- hover model */

type NodeId =
  | "in-0" | "in-1" | "in-2" | "in-3"
  | "adapters" | "core" | "strategies" | "management"
  | "out-0" | "out-1" | "out-2" | "out-3";

type Place = "above" | "right" | "left";
type NodeInfo = { title: string; blurb: string; anchor: { x: number; y: number }; place: Place };

/** Tooltip copy + anchor per node, derived from the data tables above. */
const NODE_INFO = Object.fromEntries([
  ...INPUTS.map((n, i) => [n.id, { title: n.title, blurb: n.blurb, anchor: { x: inRailStart[i] + 14, y: ROW_Y[i] }, place: "right" }]),
  ...MODULES.map((m, i) => [m.id, { title: m.title, blurb: m.blurb, anchor: { x: nodeCX[i], y: NODE_TOP - 6 }, place: "above" }]),
  [MANAGEMENT.id, { title: MANAGEMENT.title, blurb: MANAGEMENT.blurb, anchor: { x: MGMT_CX, y: MGMT_Y - 6 }, place: "above" }],
  ...OUTPUTS.map((n, i) => [n.id, { title: n.title, blurb: n.blurb, anchor: { x: OUT_X - 4, y: ROW_Y[i] }, place: "left" }]),
]) as Record<NodeId, NodeInfo>;

const PLACE_TRANSFORM: Record<Place, string> = {
  above: "translate(-50%, calc(-100% - 12px))",
  right: "translate(16px, -50%)",
  left: "translate(calc(-100% - 16px), -50%)",
};

/** Which diagram elements stay lit when a node is hovered — traces the flow. */
const ALL_IN = INPUTS.flatMap((n, i) => [n.id, `p-in-${i}`]);
const ALL_OUT = OUTPUTS.flatMap((n, i) => [`p-out-${i}`, n.id]);
const ROUTES: Record<NodeId, string[]> = {
  ...(Object.fromEntries(
    INPUTS.map((n, i) => [n.id, [n.id, `p-in-${i}`, "adapters"]]),
  ) as Record<(typeof INPUTS)[number]["id"], string[]>),
  adapters: [...ALL_IN, "adapters", "p-mid-0", "chip-0", "core"],
  core: ["adapters", "p-mid-0", "chip-0", "core", "p-mid-1", "chip-1", "strategies"],
  strategies: ["core", "p-mid-1", "chip-1", "strategies", "management", ...ALL_OUT],
  management: ["strategies", "management", ...ALL_OUT],
  ...(Object.fromEntries(
    OUTPUTS.map((n, i) => [n.id, ["strategies", "management", `p-out-${i}`, n.id]]),
  ) as Record<(typeof OUTPUTS)[number]["id"], string[]>),
};
const ROUTE_SETS = Object.fromEntries(
  (Object.keys(ROUTES) as NodeId[]).map((k) => [k, new Set(ROUTES[k])]),
) as Record<NodeId, Set<string>>;

/* ------------------------------------------------------------- sub-pieces */

const mono = { fontFamily: "var(--font-mono)" } as const;

function Glyph({ type }: { type: GlyphType }) {
  const stroke = { stroke: "var(--text-secondary)", fill: "none" } as const;
  switch (type) {
    case "candles":
      return (
        <g>
          <line x1={-3} y1={-6} x2={-3} y2={6} strokeWidth={1} style={stroke} />
          <rect x={-5.5} y={-3} width={5} height={6} rx={0.5} strokeWidth={1} style={{ stroke: "var(--text-secondary)", fill: "var(--structure-bullish)" }} />
          <line x1={3} y1={-6} x2={3} y2={6} strokeWidth={1} style={stroke} />
          <rect x={0.5} y={-4} width={5} height={5} rx={0.5} strokeWidth={1} style={{ stroke: "var(--text-secondary)", fill: "var(--structure-bearish)" }} />
        </g>
      );
    case "clock":
      return (
        <g strokeWidth={1.1} style={stroke}>
          <circle cx={0} cy={0} r={5} />
          <path d="M 0 -2.5 L 0 0.5 L 2.5 0.5" />
        </g>
      );
    case "range":
      return (
        <g strokeWidth={1.1} strokeLinecap="round" style={stroke}>
          <line x1={-6} y1={-4} x2={-6} y2={4} />
          <line x1={6} y1={-4} x2={6} y2={4} />
          <line x1={-6} y1={0} x2={6} y2={0} />
        </g>
      );
    case "link":
      return (
        <g strokeWidth={1.2} style={stroke}>
          <circle cx={-2.5} cy={0} r={3.2} />
          <circle cx={2.5} cy={0} r={3.2} />
        </g>
      );
    case "db":
      return (
        <g strokeWidth={1.1} style={stroke}>
          <rect x={-5} y={-4.5} width={10} height={9} rx={2} />
          <line x1={-5} y1={-1.5} x2={5} y2={-1.5} />
          <line x1={-5} y1={1.5} x2={5} y2={1.5} />
        </g>
      );
    case "swing":
      return (
        <g strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" style={stroke}>
          <path d="M -6 4 L -2 -3 L 2 3 L 6 -4" />
          <circle cx={-2} cy={-3} r={1.1} style={{ stroke: "none", fill: "var(--text-secondary)" }} />
          <circle cx={2} cy={3} r={1.1} style={{ stroke: "none", fill: "var(--text-secondary)" }} />
        </g>
      );
    case "branch":
      return (
        <g strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" style={stroke}>
          <path d="M -6 0 L 0 0" />
          <path d="M 0 0 L 6 -4.5" />
          <path d="M 0 0 L 6 4.5" />
        </g>
      );
    case "shield":
      return (
        <g strokeWidth={1.1} strokeLinejoin="round" style={stroke}>
          <path d="M 0 -6 L 5 -3.5 V 1 C 5 4.5 2.6 6.2 0 7 C -2.6 6.2 -5 4.5 -5 1 V -3.5 Z" />
        </g>
      );
  }
}

/** Static chip labelling the data on a wire. */
function WireChip({ label }: { label: string }) {
  const w = label.length * 5.8 + 16;
  return (
    <g>
      <rect
        x={-w / 2} y={-10} width={w} height={20} rx={10}
        strokeWidth={1}
        style={{ fill: "var(--surface-card)", stroke: "var(--border-strong)" }}
      />
      <text x={0} y={0} dy="0.36em" textAnchor="middle" fontSize={9} letterSpacing="0.3" style={{ ...mono, fill: "var(--text-secondary)" }}>
        {label}
      </text>
    </g>
  );
}

/* ---------------------------------------------------------------- diagram */

export function PipelineDiagram() {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = React.useState<NodeId | null>(null);

  const op = (key: string) => {
    if (!hovered) return 1;
    return ROUTE_SETS[hovered].has(key) ? 1 : 0.18;
  };
  const lit = (key: string) => hovered !== null && ROUTE_SETS[hovered].has(key);
  const pathStroke = (key: string, hi: string) => (lit(key) ? hi : "var(--border-strong)");
  const fade = { transition: "opacity var(--transition-base)" } as const;

  const hoverProps = (id: NodeId) => ({
    onMouseEnter: () => setHovered(id),
    onMouseLeave: () => setHovered((h) => (h === id ? null : h)),
  });

  const tip = hovered ? NODE_INFO[hovered] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        role="img"
        aria-label="WickdAlgo pipeline: market, timeframe, range and exchange feed Wickd.Adapters, which fetches OHLC candles; Wickd.Core turns candles into market-structure; Wickd.Strategies turn structure into decisions — long, short, track or pass — which Wickd.Management governs, sizing risk and the portfolio."
      >
        <defs>
          <radialGradient id="wa-glow-grad">
            <stop offset="0%" style={{ stopColor: "var(--structure-bullish)", stopOpacity: 0.5 }} />
            <stop offset="55%" style={{ stopColor: "var(--structure-bullish)", stopOpacity: 0.2 }} />
            <stop offset="100%" style={{ stopColor: "var(--structure-bullish)", stopOpacity: 0 }} />
          </radialGradient>
        </defs>

        {/* soft green glow behind the deterministic engine (adapters → strategies) */}
        <ellipse
          className={reduced ? undefined : "wa-glow"}
          cx={BAND_CX} cy={MID_Y} rx={340} ry={150}
          style={{ fill: "url(#wa-glow-grad)" }}
        />

        {/* connectors */}
        {fanInD.map((d, i) => (
          <path
            key={`in-${i}`}
            d={d}
            fill="none"
            strokeWidth={1.2}
            style={{ ...fade, opacity: op(`p-in-${i}`), stroke: pathStroke(`p-in-${i}`, "var(--structure-ic)") }}
          />
        ))}
        {midD.map((d, i) => (
          <path
            key={`mid-${i}`}
            d={d}
            fill="none"
            strokeWidth={1.2}
            style={{ ...fade, opacity: op(`p-mid-${i}`), stroke: pathStroke(`p-mid-${i}`, "var(--structure-ic)") }}
          />
        ))}
        {fanOutD.map((d, i) => (
          <path
            key={`out-${i}`}
            d={d}
            fill="none"
            strokeWidth={1.2}
            style={{ ...fade, opacity: op(`p-out-${i}`), stroke: pathStroke(`p-out-${i}`, OUTPUTS[i].color) }}
          />
        ))}

        {/* data chips on the wires */}
        {WIRE_CHIPS.map((label, i) => (
          <g key={label} style={{ ...fade, opacity: op(`chip-${i}`) }} pointerEvents="none" transform={`translate(${CHIP_POS[i].x} ${CHIP_POS[i].y})`}>
            <WireChip label={label} />
          </g>
        ))}

        {/* input pills */}
        {INPUTS.map((n, i) => (
          <g key={n.id} style={{ ...fade, opacity: op(n.id), cursor: "default" }} {...hoverProps(n.id)}>
            <rect
              x={IN_X} y={ROW_Y[i] - 20} width={inPillW[i]} height={40} rx={20}
              strokeWidth={1}
              style={{ fill: "var(--surface-card)", stroke: lit(n.id) ? "var(--structure-ic)" : "var(--border-strong)", transition: "stroke var(--transition-base)" }}
            />
            <g transform={`translate(${IN_X + PILL_GLYPH_DX} ${ROW_Y[i]})`}>
              <Glyph type={n.glyph} />
            </g>
            <text x={IN_X + PILL_TEXT_DX} y={ROW_Y[i]} dy="0.36em" fontSize={LABEL_FONT} letterSpacing={LABEL_LS} style={{ ...mono, fill: "var(--text-primary)" }}>
              {n.label}
            </text>
          </g>
        ))}

        {/* engine nodes */}
        {MODULES.map((m, i) => (
          <g key={m.id} style={{ ...fade, opacity: op(m.id), cursor: "default" }} {...hoverProps(m.id as NodeId)}>
            <rect
              x={NODE_X[i]} y={NODE_TOP} width={NODE_W} height={NODE_H} rx={16}
              strokeWidth={1}
              style={{ fill: "var(--surface-card)", stroke: lit(m.id) ? "var(--structure-ic)" : "var(--border-strong)", transition: "stroke var(--transition-base)" }}
            />
            <g transform={`translate(${nodeCX[i]} 208)`}>
              <Glyph type={m.glyph} />
            </g>
            <text x={nodeCX[i]} y={230} dy="0.36em" textAnchor="middle" fontSize={12.5} letterSpacing={1.2} fontWeight={600} style={{ ...mono, fill: "var(--text-primary)" }}>
              {m.label}
            </text>
            <text x={nodeCX[i]} y={250} dy="0.36em" textAnchor="middle" fontSize={8.5} letterSpacing={0.5} style={{ ...mono, fill: "var(--text-secondary)" }}>
              {m.sub}
            </text>
          </g>
        ))}

        {/* engine caption */}
        <text x={BAND_CX} y={300} textAnchor="middle" fontSize={10} letterSpacing="0.5" style={{ ...mono, fill: "var(--text-secondary)" }}>
          wickd engine · deterministic, market-agnostic replay
        </text>

        {/* Management: a governing layer wrapping the outputs (drawn behind the pills) */}
        <g style={{ ...fade, opacity: op("management"), cursor: "default" }} {...hoverProps("management")}>
          <rect
            x={MGMT_X} y={MGMT_Y} width={MGMT_W} height={MGMT_H} rx={16}
            strokeWidth={1}
            style={{ fill: "var(--structure-bullish)", fillOpacity: 0.06, stroke: lit("management") ? "var(--structure-bullish)" : "var(--border-strong)", transition: "stroke var(--transition-base)" }}
          />
          <g transform={`translate(${MGMT_X + 24} 78)`}>
            <Glyph type="shield" />
          </g>
          <text x={MGMT_X + 40} y={78} dy="0.36em" fontSize={10.5} letterSpacing={1} fontWeight={600} style={{ ...mono, fill: "var(--text-primary)" }}>
            {MANAGEMENT.label}
          </text>
          <text x={MGMT_CX} y={384} textAnchor="middle" fontSize={8.5} letterSpacing={0.5} style={{ ...mono, fill: "var(--text-secondary)" }}>
            risk &amp; portfolio
          </text>
        </g>

        {/* output pills (strategy signals, governed by Management) */}
        {OUTPUTS.map((n, i) => (
          <g key={n.id} style={{ ...fade, opacity: op(n.id), cursor: "default" }} {...hoverProps(n.id as NodeId)}>
            <rect
              x={OUT_X} y={ROW_Y[i] - 20} width={outPillW[i]} height={40} rx={20}
              strokeWidth={1}
              style={{ fill: "var(--surface-card)", stroke: lit(n.id) ? n.color : "var(--border-strong)", transition: "stroke var(--transition-base)" }}
            />
            <circle cx={OUT_X + PILL_GLYPH_DX} cy={ROW_Y[i]} r={4} style={{ fill: n.color }} />
            <text x={OUT_X + PILL_TEXT_DX} y={ROW_Y[i]} dy="0.36em" fontSize={LABEL_FONT} letterSpacing={LABEL_LS} style={{ ...mono, fill: "var(--text-primary)" }}>
              {n.label}
            </text>
          </g>
        ))}
      </svg>

      {/* tooltip */}
      {tip && (
        <div
          className="pointer-events-none absolute z-10 w-[250px] rounded-md border border-hairline bg-card px-3.5 py-2.5"
          style={{
            left: `${(tip.anchor.x / VB_W) * 100}%`,
            top: `${(tip.anchor.y / VB_H) * 100}%`,
            transform: PLACE_TRANSFORM[tip.place],
            boxShadow: "var(--shadow-xl)",
          }}
        >
          <div className="font-display text-[13px] font-semibold tracking-[0.35px]">{tip.title}</div>
          <div className="font-ui mt-0.5 text-[11.5px] leading-snug tracking-[0.3px] text-ink-secondary">
            {tip.blurb}
          </div>
        </div>
      )}
    </div>
  );
}
