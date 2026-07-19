"use client";
import React from "react";

/**
 * WickdAlgo candlestick "W" mark — ivory/salmon palette.
 *
 * Two variants:
 * - "full": the seventeen-candle geometry, lifted 1:1 from
 *   .github/profile/assets/brand/animated/
 *   wickdalgo-mark-candlestick-w-replay-hover-ivory-salmon.svg.
 *   For hero/footer/large placements.
 * - "compact": a simplified five-candle W with bolder bodies and wicks,
 *   designed to stay legible at navbar scale (~28px).
 *
 * CSS-only "market replay" on hover: each wick draws in and each body grows
 * out of its open-price level, staggered left to right. The replay triggers
 * when a parent element carrying the `wa-brand` class is hovered (so the
 * whole logo link replays the chart), or when the mark itself is hovered.
 */

// [direction, wickY, wickH, bodyY, bodyH] — x positions derive from index.
type CandleSpec = ["up" | "down", number, number, number, number];

interface MarkVariant {
  candles: CandleSpec[];
  slot: number; // horizontal spacing per candle
  bodyW: number;
  wickW: number;
  border: number; // body border thickness
  vb: { x: number; y: number; w: number; h: number };
  staggerMs: number; // per-candle animation stagger
}

const FULL: MarkVariant = {
  candles: [
    ["down", 232, 180, 280, 96],
    ["down", 340, 240, 376, 132],
    ["up", 400, 144, 448, 60],
    ["down", 424, 288, 448, 192],
    ["up", 484, 192, 532, 108],
    ["down", 472, 132, 532, 36],
    ["up", 364, 228, 424, 144],
    ["up", 268, 192, 328, 96],
    ["down", 280, 180, 328, 84],
    ["up", 316, 120, 364, 48],
    ["down", 328, 240, 364, 156],
    ["down", 484, 276, 520, 168],
    ["up", 544, 180, 592, 96],
    ["up", 400, 228, 460, 132],
    ["down", 424, 132, 460, 48],
    ["up", 340, 204, 376, 132],
    ["up", 244, 168, 316, 60],
  ],
  slot: 48,
  bodyW: 32,
  wickW: 8,
  border: 4,
  vb: { x: 104, y: 224, w: 816, h: 544 },
  staggerMs: 60,
};

// Seven candles tracing the W: two-candle drop into the left valley, rise to
// the middle peak, two-candle drop into the right valley, two-candle recovery
// to the high. Bolder proportions so the mark reads at small sizes.
const COMPACT: MarkVariant = {
  candles: [
    ["down", 12, 77, 24, 53],
    ["down", 67, 87, 77, 62],
    ["up", 82, 67, 91, 48],
    ["down", 84, 50, 91, 34],
    ["down", 115, 58, 125, 33],
    ["up", 91, 77, 101, 57],
    ["up", 14, 96, 29, 72],
  ],
  slot: 48,
  bodyW: 40,
  wickW: 10,
  border: 5,
  vb: { x: -4, y: 2, w: 344, h: 196 },
  staggerMs: 80,
};

const MARK_CSS = `
.wa-mark .wick, .wa-mark .body { transform-box: fill-box; will-change: transform; }
.wa-mark .up > .wick, .wa-mark .up > .body { transform-origin: 50% 100%; }
.wa-mark .down > .wick, .wa-mark .down > .body { transform-origin: 50% 0%; }
@keyframes wa-replay-grow {
  from { transform: scaleY(0); opacity: 0; }
  to   { transform: scaleY(1); opacity: 1; }
}
.wa-brand:hover .wa-mark .wick, .wa-brand:hover .wa-mark .body,
.wa-mark:hover .wick, .wa-mark:hover .body {
  animation: wa-replay-grow 0.38s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}
@media (prefers-reduced-motion: reduce) {
  .wa-brand:hover .wa-mark .wick, .wa-brand:hover .wa-mark .body,
  .wa-mark:hover .wick, .wa-mark:hover .body { animation: none; }
}
`;

export interface AnimatedLogoProps {
  /** Rendered height in px; width follows the mark's aspect ratio. */
  size?: number;
  /** "compact" (default) is a bold five-candle W for small placements; "full" is the seventeen-candle brand mark. */
  variant?: "compact" | "full";
}

export function AnimatedLogo({ size = 28, variant = "compact" }: AnimatedLogoProps) {
  const v = variant === "full" ? FULL : COMPACT;
  const { vb } = v;
  return (
    <svg
      className="wa-mark"
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      height={size}
      width={(size * vb.w) / vb.h}
      role="img"
      aria-label="WickdAlgo candlestick W mark"
      // Not crispEdges: hover transforms rasterize on anti-aliased compositor
      // layers, so pixel-snapped resting candles would visibly change
      // sharpness when the replay starts. geometricPrecision keeps both
      // states identical.
      shapeRendering="geometricPrecision"
      style={{ display: "block" }}
    >
      <style>{MARK_CSS}</style>
      {v.candles.map(([dir, wickY, wickH, bodyY, bodyH], i) => {
        const slotX = vb.x + (vb.w - v.candles.length * v.slot) / 2 + i * v.slot;
        const bodyX = slotX + (v.slot - v.bodyW) / 2;
        const wickX = slotX + (v.slot - v.wickW) / 2;
        // Animation-delay is inline (always present) but only takes effect
        // when the hover CSS above assigns the animation itself.
        const wickDelay = { animationDelay: `${i * v.staggerMs}ms` };
        const bodyDelay = { animationDelay: `${i * v.staggerMs + 100}ms` };
        return (
          <g key={i} className={dir}>
            <rect className="wick" x={wickX} y={wickY} width={v.wickW} height={wickH} fill="#000000" style={wickDelay} />
            <g className="body" style={bodyDelay}>
              <rect x={bodyX} y={bodyY} width={v.bodyW} height={bodyH} fill="#000000" />
              <rect
                x={bodyX + v.border}
                y={bodyY + v.border}
                width={v.bodyW - v.border * 2}
                height={bodyH - v.border * 2}
                fill={dir === "up" ? "#FFFFFF" : "#F77C80"}
              />
            </g>
          </g>
        );
      })}
    </svg>
  );
}
