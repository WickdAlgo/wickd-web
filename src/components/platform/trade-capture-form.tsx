"use client";
import React from "react";
import { Button, Checkbox, Input, Select, Tag } from "@/components/ui";
import { ContractError, type CreateTradeIdeaInput } from "@/contracts";
import { platformGateway, PlatformGatewayError } from "@/data/platform";
import { panel } from "@/lib/styles";

/**
 * Quick capture.
 *
 * Records what you enter and computes nothing. R, PnL, and net risk are the
 * domain layer's to derive — see `docs/architecture/001-...`. The one number
 * this form shows back is the risk distance implied by your own entry and stop,
 * clearly labelled as a preview, because a preview that cannot be saved cannot
 * become the source of truth.
 */

export interface TradeCaptureFormProps {
  markets: readonly string[];
  inspectionRunIds: readonly string[];
}

interface LevelRow {
  key: string;
  role: "entry" | "stop" | "target" | "invalidation";
  ordinal: number;
  price: string;
  zoneLow: string;
  zoneHigh: string;
}

function blankLevels(): LevelRow[] {
  return [
    { key: "entry", role: "entry", ordinal: 0, price: "", zoneLow: "", zoneHigh: "" },
    { key: "stop", role: "stop", ordinal: 0, price: "", zoneLow: "", zoneHigh: "" },
    { key: "t1", role: "target", ordinal: 1, price: "", zoneLow: "", zoneHigh: "" },
  ];
}

/** `2026-05-06T15:45` from a datetime-local input -> a UTC instant. */
function toUtcInstant(local: string): string | null {
  if (!local) return null;
  const ms = Date.parse(`${local}:00Z`);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

export function TradeCaptureForm({ markets, inspectionRunIds }: TradeCaptureFormProps) {
  const [market, setMarket] = React.useState(markets[0] ?? "BTC_USDT_PERP");
  const [timeframe, setTimeframe] = React.useState("5m");
  const [source, setSource] = React.useState<"self" | "mentor">("self");
  const [direction, setDirection] = React.useState<"long" | "short">("long");
  const [signalLocal, setSignalLocal] = React.useState("");
  const [setupName, setSetupName] = React.useState("");
  const [thesis, setThesis] = React.useState("");
  const [invalidation, setInvalidation] = React.useState("");
  const [runId, setRunId] = React.useState("");
  const [useZoneEntry, setUseZoneEntry] = React.useState(true);
  const [levels, setLevels] = React.useState<LevelRow[]>(blankLevels);

  const [errors, setErrors] = React.useState<string[]>([]);
  const [captured, setCaptured] = React.useState<
    { id: string; label: string; json: string }[]
  >([]);
  const [busy, setBusy] = React.useState(false);

  const setLevel = (key: string, patch: Partial<LevelRow>) =>
    setLevels((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const addTarget = () =>
    setLevels((rows) => {
      const nth = rows.filter((r) => r.role === "target").length + 1;
      return [
        ...rows,
        { key: `t${nth}-${Date.now()}`, role: "target", ordinal: nth, price: "", zoneLow: "", zoneHigh: "" },
      ];
    });

  /**
   * A preview, not a result. Derived from what is on screen and never sent —
   * the distance between entry and stop, which is the one thing you can check
   * by eye while typing.
   */
  const riskPreview = React.useMemo(() => {
    const entry = levels.find((l) => l.role === "entry");
    const stop = levels.find((l) => l.role === "stop");
    const entryPrice = useZoneEntry
      ? (Number(entry?.zoneLow) + Number(entry?.zoneHigh)) / 2
      : Number(entry?.price);
    const stopPrice = Number(stop?.price);
    if (!Number.isFinite(entryPrice) || !Number.isFinite(stopPrice)) return null;
    const distance = Math.abs(entryPrice - stopPrice);
    if (distance === 0) return null;
    const wrongSide =
      direction === "long" ? stopPrice >= entryPrice : stopPrice <= entryPrice;
    return { distance, wrongSide };
  }, [levels, useZoneEntry, direction]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors([]);

    const signalTimeUtc = toUtcInstant(signalLocal);
    if (!signalTimeUtc) {
      setErrors(["Signal time is required."]);
      return;
    }

    const input: CreateTradeIdeaInput = {
      instrument: { market, timeframe },
      source,
      direction,
      status: "planned",
      signalTimeUtc,
      setupName: setupName || undefined,
      thesis: thesis || undefined,
      invalidationSummary: invalidation || undefined,
      inspectionRunId: runId || undefined,
      levels: levels
        .filter((l) => (l.role === "entry" && useZoneEntry ? l.zoneLow && l.zoneHigh : l.price))
        .map((l) =>
          l.role === "entry" && useZoneEntry
            ? { role: l.role, ordinal: l.ordinal, zoneLow: l.zoneLow, zoneHigh: l.zoneHigh }
            : { role: l.role, ordinal: l.ordinal, price: l.price },
        ),
    };

    setBusy(true);
    try {
      const trade = await platformGateway.createTrade(input);
      setCaptured((rows) => [
        {
          id: trade.idea.id,
          label: `${trade.idea.instrument.market} ${trade.idea.direction} · ${
            trade.idea.setupName ?? "untitled"
          }`,
          // The export is the bridge until the API exists: this JSON validates
          // against TradeDetailV1, so it can be replayed into the API later or
          // committed as a fixture. Capturing today is therefore not wasted.
          json: JSON.stringify(trade, null, 2),
        },
        ...rows,
      ]);
    } catch (error) {
      if (error instanceof ContractError) {
        setErrors(
          error.issues.map((i) => `${i.path.join(".") || "form"}: ${i.message}`),
        );
      } else if (error instanceof PlatformGatewayError) {
        setErrors([error.message]);
      } else {
        setErrors([error instanceof Error ? error.message : "capture failed"]);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <NotPersistedNotice />

      <div className={`${panel} p-5`}>
        <SectionTitle>Idea</SectionTitle>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Select
            label="Market"
            mono
            options={markets.length > 0 ? [...markets] : ["BTC_USDT_PERP"]}
            value={market}
            onChange={(e) => setMarket(e.target.value)}
          />
          <Select
            label="Timeframe"
            mono
            options={["1m", "5m", "15m", "1h", "4h"]}
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          />
          <Select
            label="Source"
            options={[
              { value: "self", label: "My own idea" },
              { value: "mentor", label: "Mentor signal" },
            ]}
            value={source}
            onChange={(e) => setSource(e.target.value as "self" | "mentor")}
          />
          <Select
            label="Direction"
            options={["long", "short"]}
            value={direction}
            onChange={(e) => setDirection(e.target.value as "long" | "short")}
          />
          <Input
            label="Signal time (UTC)"
            type="datetime-local"
            mono
            value={signalLocal}
            onChange={(e) => setSignalLocal(e.target.value)}
            hint="When the idea existed — not when you are typing it."
          />
          <Input
            label="Setup name"
            value={setupName}
            onChange={(e) => setSetupName(e.target.value)}
          />
        </div>

        <div className="mt-3.5 flex flex-col gap-3.5">
          <Field label="Thesis">
            <textarea
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              rows={3}
              className="font-ui w-full box-border rounded-md border border-strong bg-card px-3.5 py-2.5 text-body-sm text-ink outline-none [transition:all_var(--transition-fast)] focus:border-ic focus:shadow-subtle"
            />
          </Field>
          <Field label="What invalidates it">
            <textarea
              value={invalidation}
              onChange={(e) => setInvalidation(e.target.value)}
              rows={2}
              className="font-ui w-full box-border rounded-md border border-strong bg-card px-3.5 py-2.5 text-body-sm text-ink outline-none [transition:all_var(--transition-fast)] focus:border-ic focus:shadow-subtle"
            />
          </Field>
          <Select
            label="Inspection run (optional)"
            mono
            options={["", ...inspectionRunIds]}
            value={runId}
            onChange={(e) => setRunId(e.target.value)}
          />
        </div>
      </div>

      <div className={`${panel} p-5`}>
        <SectionTitle>Plan</SectionTitle>
        <div className="mb-3">
          <Checkbox
            label="Entry is a zone rather than a single price"
            checked={useZoneEntry}
            onChange={(v) => setUseZoneEntry(v)}
          />
        </div>

        <div className="flex flex-col gap-3">
          {levels.map((level) => (
            <div key={level.key} className="grid grid-cols-[110px_1fr] items-end gap-3">
              <div className="font-ui pb-2.5 text-[12px] capitalize text-ink-secondary">
                {level.role}
                {level.role === "target" ? ` ${level.ordinal}` : ""}
              </div>
              {level.role === "entry" && useZoneEntry ? (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Zone low"
                    mono
                    inputMode="decimal"
                    value={level.zoneLow}
                    onChange={(e) => setLevel(level.key, { zoneLow: e.target.value })}
                  />
                  <Input
                    label="Zone high"
                    mono
                    inputMode="decimal"
                    value={level.zoneHigh}
                    onChange={(e) => setLevel(level.key, { zoneHigh: e.target.value })}
                  />
                </div>
              ) : (
                <Input
                  label="Price"
                  mono
                  inputMode="decimal"
                  value={level.price}
                  onChange={(e) => setLevel(level.key, { price: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-3.5">
          <Button type="button" size="sm" variant="secondary" onClick={addTarget}>
            Add target
          </Button>
        </div>

        {riskPreview && (
          <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-cards border border-hairline bg-subtle px-3.5 py-2.5">
            <Tag mono>preview</Tag>
            <span className="font-ui text-[12px] text-ink-secondary">
              Entry to stop is{" "}
              <span className="font-mono text-ink">
                {riskPreview.distance.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
              </span>
              . Not saved — R and risk are computed by the journal backend.
            </span>
            {riskPreview.wrongSide && (
              <Tag tone="short">stop is on the wrong side for a {direction}</Tag>
            )}
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div
          role="alert"
          className={`${panel} border-bearish px-4 py-3`}
        >
          <div className="font-ui mb-1.5 text-[12px] font-medium">
            The capture was rejected
          </div>
          <ul className="m-0 list-disc pl-5">
            {errors.map((e) => (
              <li key={e} className="font-mono text-[11.5px] text-ink-secondary">
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {captured.map((row) => (
        <SavedPanel key={row.id} id={row.id} label={row.label} json={row.json} />
      ))}

      <div className="flex items-center gap-3">
        <Button type="submit" arrow disabled={busy}>
          {busy ? "Capturing…" : "Capture trade"}
        </Button>
        <span className="font-ui text-[11px] tracking-[0.3px] text-ink-secondary">
          Records what you enter. Nothing here derives R, PnL, or risk.
        </span>
      </div>
    </form>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-display mb-4 text-[16px] font-semibold tracking-[0.4px]">
      {children}
    </div>
  );
}

/** Local label wrapper — `Field` from the library wraps a single control. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="font-ui block">
      <div className="mb-1.5 text-caption font-medium">{label}</div>
      {children}
    </label>
  );
}

function NotPersistedNotice() {
  return (
    <div className="flex flex-wrap items-start gap-x-2.5 gap-y-1.5 rounded-cards border border-breaker bg-subtle px-3.5 py-2.5">
      <Tag tone="breaker" mono>
        not stored yet
      </Tag>
      <span className="font-ui max-w-[70ch] text-[12px] leading-[1.55] tracking-[0.3px] text-ink-secondary">
        A captured trade stays on this page, in this tab, until{" "}
        <code className="font-mono">Wickd.Platform.Api</code> owns it. It will
        not appear in the journal list and it will not survive a refresh — the
        journal renders on the server, and a capture made in your browser never
        reaches it. Copy the JSON and keep it; it is a valid trade payload, so
        the API can accept it later unchanged.
      </span>
    </div>
  );
}

function SavedPanel({
  id,
  label,
  json,
}: {
  id: string;
  label: string;
  json: string;
}) {
  const [copied, setCopied] = React.useState(false);

  return (
    <div className={`${panel} overflow-hidden`}>
      <div className="flex flex-wrap items-center gap-2.5 border-b border-hairline px-4 py-3">
        <Tag tone="long">captured</Tag>
        <span className="font-ui text-[12px]">{label}</span>
        <span className="font-mono text-[11px] text-ink-tertiary">{id}</span>
        {/*
          No link to the trade page. It would 404: that route renders on the
          server from prerendered data and cannot see a store that lives in this
          tab. Offering the link would imply a persistence that does not exist.
        */}
        <span className="ml-auto">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(json);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Copied" : "Copy JSON"}
          </Button>
        </span>
      </div>
      <pre className="font-mono m-0 max-h-[260px] overflow-auto bg-inverse px-5 py-4 text-[11px] leading-[1.6] text-ink-inverse-muted">
        {json}
      </pre>
    </div>
  );
}
