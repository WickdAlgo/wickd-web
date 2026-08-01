import type { Metadata } from "next";
import { Suspense } from "react";
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
 *
 * The `Suspense` boundary is required, not decorative — `InspectView` reads the
 * replay cursor from `useSearchParams`, and a statically prerendered route
 * cannot know the query string until it reaches the browser.
 */
export default async function InspectPage() {
  const nav = platformNavItem("inspect");
  const [datasets, dataset, events] = await Promise.all([
    platformGateway.listDatasets(),
    platformGateway.getInspectionRun(RUN_ID),
    platformGateway.listStructureEvents(RUN_ID),
  ]);

  return (
    <>
      <PlatformHeader title={nav.label} blurb={nav.blurb} />
      <Suspense fallback={null}>
        <InspectView datasets={datasets} events={events} dataset={dataset} />
      </Suspense>
    </>
  );
}
