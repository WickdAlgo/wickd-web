import type { Metadata } from "next";
import { BacktestView } from "@/components/platform/backtest-view";
import { platformNavItem } from "@/components/platform/nav-items";
import { PlatformHeader } from "@/components/platform/platform-header";
import { platformGateway } from "@/data/platform";

export const metadata: Metadata = { title: "Backtest" };

const RUN_ID = "phase-3-smoke";

export default async function BacktestPage() {
  const nav = platformNavItem("backtest");
  const [datasets, dataset, journalTail] = await Promise.all([
    platformGateway.listDatasets(),
    platformGateway.getInspectionRun(RUN_ID),
    platformGateway.getJournalTail(RUN_ID),
  ]);

  return (
    <>
      <PlatformHeader title={nav.label} blurb={nav.blurb} />
      <BacktestView
        datasets={datasets}
        defaultDatasetAlias={dataset.run.datasetAlias}
        defaultRunId={RUN_ID}
        journalTail={journalTail}
        candleCount={dataset.candles.length}
      />
    </>
  );
}
