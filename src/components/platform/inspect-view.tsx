"use client";
import React from "react";
import {
  CandleChart,
  Select,
  StatCard,
  StructureEventRow,
  Switch,
  Tabs,
  Tag,
  type TagTone,
} from "@/components/ui";

const panel = "bg-card border border-hairline rounded-cards";

const events: { time: string; kind: TagTone; label: string; detail: string }[] = [
  { time: "14:35:00Z", kind: "fvg", label: "FVG · bullish", detail: "gap 64,230 → 64,410 · displacement candle" },
  { time: "14:20:00Z", kind: "bullish", label: "OB · bullish", detail: "last down candle before displacement · 64,050–64,180" },
  { time: "13:55:00Z", kind: "default", label: "EQH", detail: "equal highs at 64,980 · 3 touches" },
  { time: "13:40:00Z", kind: "default", label: "$ sweep", detail: "EQH swept · close back inside range" },
  { time: "13:05:00Z", kind: "bullish", label: "swing high", detail: "HH confirmed at 64,980 · 5m" },
  { time: "12:50:00Z", kind: "ic", label: "IC", detail: "indecision candle · body 18% of range" },
];

export function InspectView() {
  const [ov, setOv] = React.useState({ ob: true, fvg: true, liq: true, swing: true });
  const [sel, setSel] = React.useState(1);
  const [tab, setTab] = React.useState("Structures");
  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-[200px]">
            <Select label="Dataset" mono options={["may6-session", "apr-range", "q1-trend"]} defaultValue="may6-session" />
          </div>
          <div className="w-[120px]">
            <Select label="Timeframe" mono options={["1m", "5m", "15m", "1h"]} defaultValue="5m" />
          </div>
          <div className="ml-auto">
            <Tag mono>run: phase-3-smoke</Tag>
          </div>
        </div>
        <CandleChart height={330} showOB={ov.ob} showFVG={ov.fvg} showLiquidity={ov.liq} showSwing={ov.swing} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Candles replayed" value="372" />
          <StatCard label="Structure events" value="1,284" />
          <StatCard label="Order blocks" value="18" delta="6 mitigated" tone="long" />
          <StatCard label="Liquidity sweeps" value="9" delta="3 failed" tone="short" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className={`${panel} px-4 py-3.5`}>
          <div className="font-ui mb-3 text-[10px] font-medium uppercase tracking-[1px] text-ink-secondary">
            Overlays
          </div>
          <div className="flex flex-col gap-2.5">
            <Switch label="Order blocks" checked={ov.ob} onChange={(v) => setOv({ ...ov, ob: v })} />
            <Switch label="Fair value gaps" checked={ov.fvg} onChange={(v) => setOv({ ...ov, fvg: v })} />
            <Switch label="Liquidity" checked={ov.liq} onChange={(v) => setOv({ ...ov, liq: v })} />
            <Switch label="Swing legs" checked={ov.swing} onChange={(v) => setOv({ ...ov, swing: v })} />
          </div>
        </div>
        <div className={`${panel} overflow-hidden`}>
          <div className="px-4 pt-2.5">
            <Tabs items={["Structures", "Detail"]} active={tab} onChange={setTab} />
          </div>
          {tab === "Structures" ? (
            <div>
              {events.map((e, i) => (
                <StructureEventRow
                  key={i}
                  time={e.time}
                  kind={e.kind}
                  label={e.label}
                  detail={e.detail}
                  selected={sel === i}
                  onInspect={() => {
                    setSel(i);
                    setTab("Detail");
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="p-4">
              <Tag tone={events[sel].kind}>{events[sel].label}</Tag>
              <div className="font-mono mt-3 mb-2 text-[12px] text-ink-secondary">
                2026-05-06T{events[sel].time}
              </div>
              <div className="font-ui text-[13px] leading-[1.6] tracking-[0.3px]">
                {events[sel].detail}
              </div>
              <pre className="font-mono mt-3.5 overflow-x-auto rounded-md bg-inverse p-3 text-[11px] leading-[1.6] text-[#d7e0e2]">
                {JSON.stringify(
                  {
                    t: "2026-05-06T" + events[sel].time,
                    kind: events[sel].kind,
                    detail: events[sel].detail,
                    runId: "phase-3-smoke",
                  },
                  null,
                  1,
                )}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
