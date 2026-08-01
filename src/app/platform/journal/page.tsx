import type { Metadata } from "next";
import { JournalListView } from "@/components/platform/journal-list-view";
import { platformNavItem } from "@/components/platform/nav-items";
import { PlatformHeader } from "@/components/platform/platform-header";
import { platformGateway } from "@/data/platform";

export const metadata: Metadata = { title: "Journal" };

export default async function JournalPage() {
  const nav = platformNavItem("journal");
  const trades = await platformGateway.listTrades();

  return (
    <>
      <PlatformHeader title={nav.label} blurb={nav.blurb} />
      <JournalListView trades={trades} />
    </>
  );
}
