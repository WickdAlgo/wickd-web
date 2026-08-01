import type { Metadata } from "next";
import { InspectView } from "@/components/platform/inspect-view";
import { platformNavItem } from "@/components/platform/nav-items";
import { PlatformHeader } from "@/components/platform/platform-header";
import { platformGateway } from "@/data/platform";

export const metadata: Metadata = { title: "Inspect" };

const RUN_ID = "phase-3-smoke";

/**
 * A server shell around a client view.
 *
 * Data is resolved here, at build time, because the site is static and the
 * gateway is fixture-backed. Two consequences worth stating: there is no
 * loading state to design, and zod never reaches a client bundle.
 */
export default async function InspectPage() {
  const nav = platformNavItem("inspect");
  const [datasets, dataset, events] = await Promise.all([
    platformGateway.listDatasets(),
    platformGateway.getInspectionRun(RUN_ID),
    platformGateway.listStructureEvents(RUN_ID),
  ]);

  const orderBlocks = dataset.entities.filter((e) => e.family === "order_block");
  const sweeps = dataset.entities.filter((e) => e.family === "liquidity_sweep");
  const mitigated = dataset.lifecycle.filter((l) => l.type === "mitigated");
  const invalidated = dataset.lifecycle.filter((l) => l.type === "invalidated");

  return (
    <>
      <PlatformHeader title={nav.label} blurb={nav.blurb} />
      <InspectView
        datasets={datasets}
        events={events}
        runId={dataset.run.runId}
        datasetAlias={dataset.run.datasetAlias}
        timeframe={dataset.run.instrument.timeframe}
        candleCount={dataset.candles.length}
        structureCount={dataset.entities.length + dataset.lifecycle.length}
        orderBlockCount={orderBlocks.length}
        mitigatedCount={mitigated.length}
        sweepCount={sweeps.length}
        failedSweepCount={invalidated.filter((l) => l.entityId.startsWith("sweep")).length}
      />
    </>
  );
}
