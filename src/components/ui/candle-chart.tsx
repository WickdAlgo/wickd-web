import React from "react";

export interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
}

// Deterministic pseudo-random walk — same output every render (brand rule: reproducible).
export function genCandles(n = 60, seed = 7): Candle[] {
  let s = seed;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  let px = 64230;
  const out: Candle[] = [];
  for (let i = 0; i < n; i++) {
    const drift = Math.sin(i / 9) * 140 + (r() - 0.48) * 420;
    const o = px,
      c = px + drift,
      h = Math.max(o, c) + r() * 180,
      l = Math.min(o, c) - r() * 180;
    out.push({ o, h, l, c });
    px = c;
  }
  return out;
}

export interface CandleChartProps {
  candles?: Candle[];
  width?: number | string;
  height?: number | string;
  showOB?: boolean;
  showFVG?: boolean;
  showLiquidity?: boolean;
  showSwing?: boolean;
  market?: string;
  timeframe?: string;
  style?: React.CSSProperties;
}

/** Deterministic OHLC chart with structure overlays — the product's core artifact. */
export function CandleChart({
  candles,
  width = "100%",
  height = 320,
  showOB = true,
  showFVG = true,
  showLiquidity = true,
  showSwing = true,
  market = "BTC_USDT_PERP",
  timeframe = "5m",
  style,
}: CandleChartProps) {
  const data = candles || genCandles();
  const W = 1000,
    H = 560,
    pad = 16;
  let hi = -Infinity,
    lo = Infinity;
  data.forEach((d) => {
    hi = Math.max(hi, d.h);
    lo = Math.min(lo, d.l);
  });
  const X = (i: number) => pad + i * ((W - pad * 2) / data.length);
  const bw = (W - pad * 2) / data.length;
  const Y = (v: number) => pad + ((hi - v) / (hi - lo)) * (H - pad * 2);
  const swLo = data.reduce((m, d, i) => (d.l < data[m].l ? i : m), 0);
  const swHi = data.reduce((m, d, i) => (d.h > data[m].h ? i : m), 0);
  const obI = Math.floor(data.length * 0.28),
    fvgI = Math.floor(data.length * 0.55),
    liqI = swHi;
  return (
    <div
      className="relative overflow-hidden rounded-cards border border-hairline bg-(--chart-canvas)"
      style={style}
    >
      <div className="flex items-center gap-3 border-b border-hairline bg-card px-3.5 py-2.5">
        <span className="font-mono text-caption text-ink">{market}</span>
        <span className="font-mono text-caption text-ink-secondary">{timeframe}</span>
        <span className="font-ui ml-auto text-[11px] tracking-[0.3px] text-ink-secondary">
          deterministic replay
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block" style={{ width, height }} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={pad}
            x2={W - pad}
            y1={pad + t * (H - pad * 2)}
            y2={pad + t * (H - pad * 2)}
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="1"
          />
        ))}
        {showOB && (
          <rect
            x={X(obI) - 2}
            y={Y(Math.max(data[obI].o, data[obI].c))}
            width={bw * 10}
            height={Math.abs(Y(data[obI].o) - Y(data[obI].c)) + 14}
            fill="var(--structure-bullish)"
            opacity="0.55"
          />
        )}
        {showFVG && (
          <rect
            x={X(fvgI) - 2}
            y={Y(data[fvgI].h)}
            width={bw * 14}
            height={Math.max(16, Math.abs(Y(data[fvgI].h) - Y(data[fvgI].l)) * 0.5)}
            fill="none"
            stroke="var(--structure-fvg)"
            strokeWidth="2.5"
          />
        )}
        {showLiquidity && (
          <rect
            x={X(Math.max(0, liqI - 6))}
            y={Y(data[liqI].h) - 4}
            width={bw * 16}
            height={8}
            fill="var(--structure-bullish)"
            opacity="0.95"
          />
        )}
        {showLiquidity && (
          <text
            x={Math.min(958, X(Math.max(0, liqI - 6)) + bw * 16 + 8)}
            y={Y(data[liqI].h) + 10}
            fontFamily="var(--font-mono)"
            fontSize="28"
            fill="var(--chart-stroke)"
          >
            $
          </text>
        )}
        {showSwing && (
          <polyline
            points={`${X(swLo) + bw / 2},${Y(data[swLo].l)} ${X(swHi) + bw / 2},${Y(data[swHi].h)}`}
            stroke="var(--structure-default)"
            strokeWidth="2.5"
            strokeDasharray="8 6"
            fill="none"
          />
        )}
        {showSwing && (
          <circle
            cx={X(swLo) + bw / 2}
            cy={Y(data[swLo].l)}
            r="8"
            fill="var(--structure-bearish)"
            stroke="var(--chart-stroke)"
            strokeWidth="1.5"
          />
        )}
        {showSwing && (
          <circle
            cx={X(swHi) + bw / 2}
            cy={Y(data[swHi].h)}
            r="8"
            fill="var(--structure-bullish)"
            stroke="var(--chart-stroke)"
            strokeWidth="1.5"
          />
        )}
        {data.map((d, i) => {
          const up = d.c >= d.o;
          return (
            <g key={i}>
              <line
                x1={X(i) + bw / 2}
                x2={X(i) + bw / 2}
                y1={Y(d.h)}
                y2={Y(d.l)}
                stroke="var(--chart-stroke)"
                strokeWidth="1.5"
              />
              <rect
                x={X(i) + bw * 0.18}
                y={Y(Math.max(d.o, d.c))}
                width={bw * 0.64}
                height={Math.max(2, Math.abs(Y(d.o) - Y(d.c)))}
                fill={up ? "var(--chart-up-body)" : "var(--chart-down-body)"}
                stroke="var(--chart-stroke)"
                strokeWidth="1"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
