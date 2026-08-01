"use client";
import React from "react";
import type { InspectionPrimitive } from "@/contracts";
import { epochMs } from "@/contracts";
import {
  projectConnection,
  projectLevel,
  projectMarker,
  projectRangeHighlight,
  projectZone,
  type Projection,
} from "../projection";
import { DASH_PATTERNS, primitivePaint } from "./primitive-paint";

/**
 * The structure overlay.
 *
 * Two of these stack **above** the chart canvas. The layer's `z` field orders
 * them relative to each other — zones first, markers and levels on top — not
 * relative to the candles. Putting zones under the canvas was the first design
 * and it made them unclickable, since the chart's own container would have sat
 * between the shapes and the pointer. Zones instead read through via a
 * dedicated fill alpha; see `primitive-paint.ts`.
 *
 * Rendered as SVG rather than as canvas series primitives, for three reasons
 * that all turned out to matter: SVG takes `var()` directly, so tokens need no
 * runtime resolution; DOM nodes are focusable, so keyboard selection is free;
 * and the geometry is assertable in jsdom, which cannot produce a 2D context.
 */

export interface OverlayLayerProps {
  primitives: readonly InspectionPrimitive[];
  projection: Projection;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect(id: string | null): void;
  onHover(id: string | null): void;
  /** Suppresses the hover and selection transitions. */
  reducedMotion: boolean;
  /**
   * Which of the two stacked overlays this is.
   *
   * Both sit above the chart, whose canvases carry `z-index: 1` — without an
   * explicit index of their own the shapes render but are painted over, which
   * looks exactly like a projection bug and is not one.
   */
  depth: "under" | "over";
}

export function OverlayLayer({
  primitives,
  projection,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  reducedMotion,
  depth,
}: OverlayLayerProps) {
  return (
    <svg
      style={{ zIndex: depth === "under" ? 2 : 3 }}
      // The chart owns pointer interaction — crosshair, pan, zoom. Only the
      // shapes themselves opt back in, so the overlay does not swallow it.
      //
      // Sized to the pane rather than stretched to the container: the price
      // scale and time axis occupy the remainder, and covering them would put
      // every structure beside the candle it belongs to.
      className="pointer-events-none absolute left-0 top-0"
      width={projection.width}
      height={projection.height}
      viewBox={`0 0 ${projection.width} ${projection.height}`}
      aria-hidden={primitives.length === 0}
    >
      {primitives.map((p) => (
        <PrimitiveShape
          key={p.id}
          primitive={p}
          projection={projection}
          selected={selectedId === p.id}
          hovered={hoveredId === p.id}
          onSelect={onSelect}
          onHover={onHover}
          reducedMotion={reducedMotion}
        />
      ))}
    </svg>
  );
}

interface ShapeProps {
  primitive: InspectionPrimitive;
  projection: Projection;
  selected: boolean;
  hovered: boolean;
  onSelect(id: string | null): void;
  onHover(id: string | null): void;
  reducedMotion: boolean;
}

const PrimitiveShape = React.memo(function PrimitiveShape({
  primitive,
  projection,
  selected,
  hovered,
  onSelect,
  onHover,
  reducedMotion,
}: ShapeProps) {
  const paint = primitivePaint(primitive.kind, primitive.scope);
  const emphasis = selected ? 1 : hovered ? 0.85 : undefined;

  const interaction = {
    "data-primitive-id": primitive.id,
    "data-selected": selected || undefined,
    role: "button",
    tabIndex: 0,
    "aria-label": primitive.label ?? primitive.kind,
    "aria-pressed": selected,
    className: [
      "pointer-events-auto cursor-pointer outline-none",
      "focus-visible:[filter:drop-shadow(0_0_0_2px_var(--structure-ic))]",
      reducedMotion ? "" : "[transition:opacity_var(--transition-fast)]",
    ]
      .filter(Boolean)
      .join(" "),
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(selected ? null : primitive.id);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      onSelect(selected ? null : primitive.id);
    },
    onPointerEnter: () => onHover(primitive.id),
    onPointerLeave: () => onHover(null),
  };

  switch (primitive.type) {
    case "zone": {
      const r = projectZone(projection, {
        fromMs: epochMs(primitive.fromUtc),
        toMs: primitive.toUtc === null ? null : epochMs(primitive.toUtc),
        priceLow: primitive.priceLow,
        priceHigh: primitive.priceHigh,
      });
      if (!r) return null;
      return (
        <rect
          {...interaction}
          x={r.x}
          y={r.y}
          width={r.width}
          height={r.height}
          fill={paint.fill}
          fillOpacity={paint.outlineOnly ? 0 : (emphasis ?? paint.areaOpacity)}
          stroke={paint.outlineOnly || selected || hovered ? paint.stroke : "none"}
          strokeWidth={selected ? 3 : 2.5}
          strokeOpacity={emphasis ?? paint.opacity}
          // Structures are square by convention — see DESIGN.md.
          rx={0}
          // `all` so the transparent interior of an outline-only zone is
          // still hittable; `fill` alone would only catch its border.
          style={{ pointerEvents: "all" }}
        />
      );
    }

    case "range-highlight": {
      const r = projectRangeHighlight(projection, {
        fromMs: epochMs(primitive.fromUtc),
        toMs: epochMs(primitive.toUtc),
      });
      if (!r) return null;
      return (
        <rect
          {...interaction}
          x={r.x}
          y={r.y}
          width={r.width}
          height={r.height}
          fill={paint.outlineOnly ? paint.stroke : paint.fill}
          fillOpacity={emphasis ?? paint.areaOpacity}
          style={{ pointerEvents: "all" }}
        />
      );
    }

    case "level": {
      const s = projectLevel(projection, {
        price: primitive.price,
        fromMs: epochMs(primitive.fromUtc),
        toMs: primitive.toUtc === null ? null : epochMs(primitive.toUtc),
      });
      if (!s) return null;
      return (
        <g {...interaction}>
          {/* An invisible fat stroke so a 2px line is not a 2px hit target. */}
          <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="transparent" strokeWidth={12} />
          <line
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke={paint.stroke}
            strokeWidth={selected ? 3 : 2}
            strokeDasharray={DASH_PATTERNS[primitive.style]}
            opacity={emphasis ?? paint.opacity}
          />
        </g>
      );
    }

    case "connection": {
      const s = projectConnection(projection, {
        fromMs: epochMs(primitive.fromUtc),
        fromPrice: primitive.fromPrice,
        toMs: epochMs(primitive.toUtc),
        toPrice: primitive.toPrice,
      });
      if (!s) return null;
      return (
        <g {...interaction}>
          <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="transparent" strokeWidth={12} />
          <line
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke={paint.stroke}
            strokeWidth={selected ? 3 : 2.5}
            strokeDasharray={DASH_PATTERNS[primitive.style]}
            opacity={emphasis ?? paint.opacity}
          />
        </g>
      );
    }

    case "marker": {
      const pt = projectMarker(projection, {
        atMs: epochMs(primitive.atUtc),
        price: primitive.price,
      });
      if (!pt) return null;
      const r = selected ? 8 : 6;
      const offset = primitive.placement === "above" ? -r - 4 : primitive.placement === "below" ? r + 4 : 0;
      const cy = pt.y + offset;
      return (
        <g {...interaction}>
          <circle cx={pt.x} cy={cy} r={14} fill="transparent" />
          {primitive.shape === "triangle-down" || primitive.shape === "triangle-up" ? (
            <polygon
              points={trianglePoints(pt.x, cy, r, primitive.shape === "triangle-up")}
              fill={paint.outlineOnly ? "none" : paint.stroke}
              stroke="var(--chart-stroke)"
              strokeWidth={1.5}
              opacity={emphasis ?? paint.opacity}
            />
          ) : primitive.shape === "square" ? (
            <rect
              x={pt.x - r}
              y={cy - r}
              width={r * 2}
              height={r * 2}
              fill={paint.outlineOnly ? "none" : paint.stroke}
              stroke="var(--chart-stroke)"
              strokeWidth={1.5}
              opacity={emphasis ?? paint.opacity}
            />
          ) : (
            <circle
              cx={pt.x}
              cy={cy}
              r={r}
              fill={paint.outlineOnly ? "none" : paint.stroke}
              stroke="var(--chart-stroke)"
              strokeWidth={1.5}
              opacity={emphasis ?? paint.opacity}
            />
          )}
        </g>
      );
    }
  }
});

function trianglePoints(x: number, y: number, r: number, up: boolean): string {
  return up
    ? `${x},${y - r} ${x - r},${y + r} ${x + r},${y + r}`
    : `${x},${y + r} ${x - r},${y - r} ${x + r},${y - r}`;
}
