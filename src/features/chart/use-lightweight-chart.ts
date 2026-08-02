"use client";
import React from "react";
import {
  CandlestickSeries,
  createChart,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { ChartCandle } from "@/contracts";
import { readChartTheme } from "./chart-theme";
import { linearProjection, type Projection } from "./projection";

/**
 * Owns the chart instance and reports where things are.
 *
 * The library draws candles, axes, and the crosshair, and handles pan and zoom.
 * Everything else is drawn by the SVG overlay against the `Projection` this
 * returns. The library is read twice per frame — the visible time range and the
 * visible price range — and the overlay does arithmetic from there.
 */

export interface UseLightweightChartArgs {
  candles: readonly ChartCandle[];
  /** Changes when the resolved design tokens might have. */
  themeEpoch: number;
  reducedMotion: boolean;
  height: number;
  /**
   * Where to open the view. Defaults to the whole dataset.
   *
   * Worth setting whenever structures are being inspected: a 31-hour session of
   * five-minute candles is 372 bars, so a single-candle order block is about
   * two pixels wide and one tall. Correct, and not something anyone can look
   * at.
   */
  focus?: { fromUtc: string; toUtc: string } | null;
}

export interface LightweightChartHandles {
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** `null` until the chart has laid out. New identity per geometry change. */
  projection: Projection | null;
  ready: boolean;
}

export function useLightweightChart({
  candles,
  themeEpoch,
  reducedMotion,
  height,
  focus = null,
}: UseLightweightChartArgs): LightweightChartHandles {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const seriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [projection, setProjection] = React.useState<Projection | null>(null);
  // Bumped when a chart instance is created, so the data effect knows to
  // re-apply its series against the new instance.
  const [instanceEpoch, setInstanceEpoch] = React.useState(0);
  const epochRef = React.useRef(0);

  // Recomputing the projection is the hot path — it runs on every pan and zoom
  // frame — so it is a ref-stable callback rather than a dependency of effects.
  const recompute = React.useCallback(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    // The *pane*, not the container. The container also holds the price scale
    // on the right and the time axis along the bottom; measuring it stretched
    // every overlay about 11% wide and 9% tall, which put structures beside the
    // candles they describe rather than on them.
    const pane = chart.paneSize();
    if (pane.width === 0 || pane.height === 0) return;

    const timeScale = chart.timeScale();
    const range = timeScale.getVisibleRange();
    if (!range) return;

    // Anchor the time axis on real coordinates rather than assuming the visible
    // range spans exactly [0, width]. It does not: the scale keeps a margin,
    // and bars are positioned at their centres.
    const fromMs = (range.from as number) * 1000;
    const toMs = (range.to as number) * 1000;
    const xFrom = timeScale.timeToCoordinate(range.from);
    const xTo = timeScale.timeToCoordinate(range.to);
    if (xFrom === null || xTo === null || xTo === xFrom) return;

    // Extrapolate the domain out to the pane edges, so the linear map the
    // overlay uses is correct across the whole pane and not just between the
    // two anchors.
    const msPerPx = (toMs - fromMs) / ((xTo as number) - (xFrom as number));
    const timeAtLeft = fromMs - (xFrom as number) * msPerPx;
    const timeAtRight = timeAtLeft + pane.width * msPerPx;

    const priceHigh = series.coordinateToPrice(0);
    const priceLow = series.coordinateToPrice(pane.height);
    if (priceHigh === null || priceLow === null) return;

    const barSpacing = timeScale.options().barSpacing;
    epochRef.current += 1;

    setProjection(
      linearProjection({
        timeFromMs: timeAtLeft,
        timeToMs: timeAtRight,
        priceLow: priceLow as number,
        priceHigh: priceHigh as number,
        width: pane.width,
        height: pane.height,
        barHalfWidth: Math.max(barSpacing / 2, 1),
        epoch: epochRef.current,
      }),
    );
  }, []);

  React.useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Read straight off the mounted container. Custom-property computed values
    // are already var()-substituted, so a token defined in terms of another
    // token arrives as a concrete color — and reading off the container rather
    // than the root honours a scoped theme.
    const theme = readChartTheme(el);

    const chart = createChart(el, {
      width: el.clientWidth,
      height,
      layout: {
        background: { color: theme.canvas },
        textColor: theme.axisText,
        // Suppressed deliberately. Apache-2.0 permits it; attribution is
        // carried in README.md instead, so the mark does not sit on the
        // product's core artifact.
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: theme.grid },
        horzLines: { color: theme.grid },
      },
      crosshair: {
        vertLine: { color: theme.crosshair, style: LineStyle.Dashed, labelBackgroundColor: theme.stroke },
        horzLine: { color: theme.crosshair, style: LineStyle.Dashed, labelBackgroundColor: theme.stroke },
      },
      rightPriceScale: { borderColor: theme.grid },
      timeScale: {
        borderColor: theme.grid,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 0,
        // Pinned so the view is reproducible: the brand claim is deterministic
        // replay, and a chart that drifts on resize makes screenshot
        // comparison meaningless.
        fixLeftEdge: true,
        fixRightEdge: true,
        lockVisibleTimeRangeOnResize: true,
      },
      handleScale: { axisPressedMouseMove: true },
      kineticScroll: { touch: !reducedMotion, mouse: false },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: theme.upBody,
      downColor: theme.downBody,
      // Black-bordered bodies with a white up-candle are the house convention,
      // shared with the engine's own output.
      borderVisible: true,
      borderUpColor: theme.stroke,
      borderDownColor: theme.stroke,
      wickUpColor: theme.stroke,
      wickDownColor: theme.stroke,
    });

    chartRef.current = chart;
    seriesRef.current = series;
    setInstanceEpoch((e) => e + 1);

    const unsubscribeTime = () => chart.timeScale().unsubscribeVisibleTimeRangeChange(recompute);
    chart.timeScale().subscribeVisibleTimeRangeChange(recompute);

    const observer = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth });
      recompute();
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      unsubscribeTime();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      setProjection(null);
    };
  }, [themeEpoch, height, reducedMotion, recompute]);

  // Data is applied separately from creation so a candle change does not tear
  // down and rebuild the chart, which would lose the user's pan and zoom.
  React.useLayoutEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart) return;

    series.setData(
      candles.map((c) => ({
        time: (Date.parse(c.openTimeUtc) / 1000) as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
    if (focus) {
      chart.timeScale().setVisibleRange({
        from: (Date.parse(focus.fromUtc) / 1000) as UTCTimestamp,
        to: (Date.parse(focus.toUtc) / 1000) as UTCTimestamp,
      });
    } else {
      chart.timeScale().fitContent();
    }
    recompute();
  }, [candles, recompute, instanceEpoch, focus]);

  return { containerRef, projection, ready: projection !== null };
}
