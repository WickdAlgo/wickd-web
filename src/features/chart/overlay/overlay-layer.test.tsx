import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { InspectionPrimitive } from "@/contracts";
import { linearProjection } from "../projection";
import { OverlayLayer } from "./overlay-layer";

/**
 * These run without a canvas.
 *
 * jsdom returns `null` from `getContext`, so the chart itself can never be
 * mounted here. Rendering the overlay against a hand-built `linearProjection`
 * is exactly what the `Projection` interface exists to allow — the geometry is
 * asserted on the emitted SVG.
 */

const projection = linearProjection({
  timeFromMs: Date.parse("2026-05-06T00:00:00Z"),
  timeToMs: Date.parse("2026-05-06T04:00:00Z"),
  priceLow: 100,
  priceHigh: 200,
  width: 400,
  height: 200,
  barHalfWidth: 4,
});

function stamp(iso: string) {
  return { atUtcMs: Date.parse(iso), untilUtcMs: null, sequence: 0 };
}

const zone = {
  ...stamp("2026-05-06T01:00:00Z"),
  id: "z1",
  type: "zone",
  kind: "bullish",
  scope: "external",
  label: "Order block",
  entityId: "ob-1",
  visibleFromUtc: "2026-05-06T01:00:00Z",
  visibleUntilUtc: null,
  fromUtc: "2026-05-06T01:00:00Z",
  toUtc: "2026-05-06T02:00:00Z",
  priceLow: 120,
  priceHigh: 140,
} as unknown as InspectionPrimitive;

const marker = {
  ...stamp("2026-05-06T02:00:00Z"),
  id: "m1",
  type: "marker",
  kind: "bearish",
  scope: "external",
  label: "Sweep",
  entityId: "sw-1",
  visibleFromUtc: "2026-05-06T02:00:00Z",
  visibleUntilUtc: null,
  atUtc: "2026-05-06T02:00:00Z",
  price: 150,
  placement: "above",
  shape: "triangle-down",
} as unknown as InspectionPrimitive;

const offscreen = {
  ...stamp("2026-05-05T00:00:00Z"),
  id: "off",
  type: "marker",
  kind: "default",
  scope: "external",
  label: "Yesterday",
  visibleFromUtc: "2026-05-05T00:00:00Z",
  visibleUntilUtc: null,
  atUtc: "2026-05-05T00:00:00Z",
  price: 150,
  placement: "at",
  shape: "dot",
} as unknown as InspectionPrimitive;

function renderLayer(
  primitives: InspectionPrimitive[],
  overrides: Partial<React.ComponentProps<typeof OverlayLayer>> = {},
) {
  const onSelect = vi.fn();
  const onHover = vi.fn();
  const result = render(
    <OverlayLayer
      primitives={primitives}
      projection={projection}
      selectedId={null}
      hoveredId={null}
      onSelect={onSelect}
      onHover={onHover}
      reducedMotion={false}
      depth="over"
      {...overrides}
    />,
  );
  return { ...result, onSelect, onHover };
}

describe("OverlayLayer", () => {
  it("places a zone at its projected geometry", () => {
    const { container } = renderLayer([zone]);
    const rect = container.querySelector('rect[data-primitive-id="z1"]')!;

    // 01:00 of a 4h window across 400px -> x=100, one hour wide -> 100px.
    expect(rect.getAttribute("x")).toBe("100");
    expect(rect.getAttribute("width")).toBe("100");
    // price 140 of [100,200] over 200px -> y=120; down to 120 -> height 40.
    expect(rect.getAttribute("y")).toBe("120");
    expect(rect.getAttribute("height")).toBe("40");
  });

  it("paints from tokens, never a resolved color", () => {
    // The design-system validator greps for hex literals; more importantly,
    // emitting var() is what makes the overlay correct on its first frame in
    // any theme with no JavaScript involved.
    const { container } = renderLayer([zone]);
    const rect = container.querySelector('rect[data-primitive-id="z1"]')!;
    expect(rect.getAttribute("fill")).toBe("var(--structure-bullish)");
    expect(rect.getAttribute("fill-opacity")).toBe("var(--chart-zone-alpha-external)");
  });

  it("keeps zone fills translucent so price reads through", () => {
    const { container } = renderLayer([zone]);
    const rect = container.querySelector('rect[data-primitive-id="z1"]')!;
    // Not the structure alpha, which is 0.95 and would hide the candles.
    expect(rect.getAttribute("fill-opacity")).not.toBe(
      "var(--structure-external-alpha)",
    );
  });

  it("omits a primitive whose candle is outside the visible range", () => {
    const { container } = renderLayer([zone, offscreen]);
    expect(container.querySelector('[data-primitive-id="off"]')).toBeNull();
    expect(container.querySelector('[data-primitive-id="z1"]')).not.toBeNull();
  });

  it("exposes each shape as a labelled button", () => {
    // DOM nodes give keyboard reachability for free. A canvas primitive would
    // need a parallel focus model built by hand.
    renderLayer([zone, marker]);
    expect(screen.getByRole("button", { name: "Order block" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sweep" })).toBeInTheDocument();
  });

  it("selects on click and deselects on a second click", async () => {
    const user = userEvent.setup();
    const { onSelect, rerender } = renderLayer([zone]);

    await user.click(screen.getByRole("button", { name: "Order block" }));
    expect(onSelect).toHaveBeenCalledWith("z1");

    rerender(
      <OverlayLayer
        primitives={[zone]}
        projection={projection}
        selectedId="z1"
        hoveredId={null}
        onSelect={onSelect}
        onHover={vi.fn()}
        reducedMotion={false}
      depth="over"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Order block" }));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it("selects from the keyboard", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderLayer([zone]);

    await user.tab();
    expect(screen.getByRole("button", { name: "Order block" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("z1");
  });

  it("marks the selected shape for the chart and the panel to agree on", () => {
    const { container } = renderLayer([zone], { selectedId: "z1" });
    const rect = container.querySelector('rect[data-primitive-id="z1"]')!;
    expect(rect.getAttribute("data-selected")).toBe("true");
    expect(rect.getAttribute("aria-pressed")).toBe("true");
  });

  it("drops the hover transition under reduced motion", () => {
    const { container: motion } = renderLayer([zone]);
    expect(motion.querySelector('[data-primitive-id="z1"]')!.getAttribute("class")).toContain(
      "transition",
    );

    const { container: still } = renderLayer([zone], { reducedMotion: true });
    expect(still.querySelector('[data-primitive-id="z1"]')!.getAttribute("class")).not.toContain(
      "transition",
    );
  });

  it("stacks above the chart canvases", () => {
    // Lightweight Charts gives its canvases `z-index: 1`. An overlay left at
    // `auto` renders perfectly and is painted straight over — which presents as
    // a projection bug and is not one. Both depths must clear it.
    const { container: under } = renderLayer([zone], { depth: "under" });
    const { container: over } = renderLayer([zone], { depth: "over" });

    const zUnder = Number(under.querySelector("svg")!.getAttribute("style")!.match(/z-index:\s*(\d+)/)![1]);
    const zOver = Number(over.querySelector("svg")!.getAttribute("style")!.match(/z-index:\s*(\d+)/)![1]);

    expect(zUnder).toBeGreaterThan(1);
    expect(zOver).toBeGreaterThan(zUnder);
  });

  it("renders nothing but an empty svg for an empty layer", () => {
    const { container } = renderLayer([]);
    expect(container.querySelectorAll("[data-primitive-id]")).toHaveLength(0);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
