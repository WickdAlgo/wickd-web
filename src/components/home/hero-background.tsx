import React from "react";

// Deterministic, non-overlapping grid layout.
// Grid size: 20 columns, 12 rows.
const blocks = [
  // Top section (Rows 1-4)
  { c: 1, r: 1, w: 2, h: 2, color: "#ff8ff4", a: "wa-clip-left 8s" },
  { c: 3, r: 1, w: 5, h: 4, color: "#22c55e", a: "wa-clip-left 12s", p: true }, // dotted green
  { c: 9, r: 2, w: 4, h: 2, color: "#3b82f6", a: "wa-clip-right 10s" },
  { c: 15, r: 1, w: 4, h: 4, color: "#eab308", a: "wa-clip-right 14s" },
  
  // Middle section (Rows 5-7)
  { c: 1, r: 5, w: 10, h: 2, color: "#ff8ff4", a: "wa-clip-left 16s" }, // long pink
  { c: 12, r: 5, w: 4, h: 3, color: "#2563eb", a: "wa-clip-right 13s" }, // blue square
  { c: 17, r: 6, w: 4, h: 2, color: "#22c55e", a: "wa-clip-right 11s" },
  
  // Lower middle section (Rows 8-10)
  { c: 2, r: 8, w: 3, h: 2, color: "#eab308", a: "wa-clip-left 9s", p: true },
  { c: 6, r: 8, w: 5, h: 2, color: "#3b82f6", a: "wa-clip-left 15s" },
  { c: 12, r: 9, w: 3, h: 2, color: "#22c55e", a: "wa-clip-right 12s" },
  { c: 16, r: 8, w: 4, h: 3, color: "#ff8ff4", a: "wa-clip-right 14s" },

  // Bottom section (Rows 11-12)
  { c: 1, r: 11, w: 8, h: 2, color: "#2563eb", a: "wa-clip-left 17s" },
  { c: 10, r: 11, w: 4, h: 2, color: "#eab308", a: "wa-clip-right 11s" },
  { c: 15, r: 12, w: 5, h: 1, color: "#22c55e", a: "wa-clip-left 10s" },
];

export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden flex justify-center">
      <div 
        className="w-full h-full max-w-[1600px] relative"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(20, 1fr)",
          gridTemplateRows: "repeat(12, 1fr)",
          // NO mixBlendMode here so colors remain pure and blocks are opaque
        }}
      >
        {/* Draw the fixed grid background over the entire area */}
        <div
          className="col-span-full row-span-full opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
            backgroundSize: "calc(100% / 20) calc(100% / 12)",
          }}
        />

        {/* Render each block perfectly snapped to grid tracks without overlap */}
        {blocks.map((block, i) => (
          <div
            key={i}
            style={{
              gridColumn: `${block.c} / span ${block.w}`,
              gridRow: `${block.r} / span ${block.h}`,
            }}
          >
            {/* The animating element — .wa-clip lets reduced-motion CSS silence it */}
            <div
              className={`wa-clip w-full h-full ${block.p ? "wa-pattern-dots" : ""}`}
              style={{
                backgroundColor: block.color,
                animation: `${block.a} infinite ease-in-out`,
                // Adding a negative animationDelay based on index so they are out of sync immediately
                animationDelay: `-${i * 1.5}s`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
