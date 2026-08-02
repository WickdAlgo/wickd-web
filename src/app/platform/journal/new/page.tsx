import type { Metadata } from "next";
import { PlatformHeader } from "@/components/platform/platform-header";
import { TradeCaptureForm } from "@/components/platform/trade-capture-form";
import { platformGateway } from "@/data/platform";

export const metadata: Metadata = { title: "Capture a trade" };

export default async function CaptureTradePage() {
  const [datasets, runs] = await Promise.all([
    platformGateway.listDatasets(),
    platformGateway.listRuns(),
  ]);

  // Distinct markets from the known datasets, so the form offers what the
  // platform can actually chart rather than a hardcoded list.
  const markets = [...new Set(datasets.map((d) => d.instrument.market))];

  return (
    <>
      <PlatformHeader
        title="Capture a trade"
        blurb="Record the idea and the plan. The outcome is filled in later."
      />
      <TradeCaptureForm
        markets={markets}
        inspectionRunIds={runs.filter((r) => r.status === "complete").map((r) => r.runId)}
      />
    </>
  );
}
