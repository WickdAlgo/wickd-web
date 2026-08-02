import type { Metadata } from "next";
import { DatasetsView } from "@/components/platform/datasets-view";
import { platformNavItem } from "@/components/platform/nav-items";
import { PlatformHeader } from "@/components/platform/platform-header";
import { platformGateway } from "@/data/platform";

export const metadata: Metadata = { title: "Datasets" };

export default async function DatasetsPage() {
  const nav = platformNavItem("datasets");
  const [datasets, runs] = await Promise.all([
    platformGateway.listDatasets(),
    platformGateway.listRuns(),
  ]);

  return (
    <>
      <PlatformHeader title={nav.label} blurb={nav.blurb} />
      <DatasetsView datasets={datasets} runs={runs} />
    </>
  );
}
