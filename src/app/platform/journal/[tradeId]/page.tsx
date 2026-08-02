import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PlatformHeader } from "@/components/platform/platform-header";
import { TradeDetailView } from "@/components/platform/trade-detail-view";
import { platformGateway, PlatformGatewayError } from "@/data/platform";

interface Params {
  params: Promise<{ tradeId: string }>;
}

/** Prerenders every trade the gateway knows about. */
export async function generateStaticParams() {
  const trades = await platformGateway.listTrades();
  return trades.map((t) => ({ tradeId: t.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { tradeId } = await params;
  return { title: `Trade ${tradeId}` };
}

export default async function TradeDetailPage({ params }: Params) {
  const { tradeId } = await params;

  // The gateway throws rather than returning undefined, so this handles the
  // failure path an HTTP gateway will produce too.
  let trade;
  try {
    trade = await platformGateway.getTrade(tradeId);
  } catch (error) {
    if (error instanceof PlatformGatewayError && error.code === "not_found") notFound();
    throw error;
  }

  const dataset = await platformGateway.getInspectionRun(trade.inspectionRunId);

  return (
    <>
      <PlatformHeader
        title={trade.idea.setupName ?? "Trade"}
        blurb={`${trade.idea.instrument.market} · signalled ${trade.idea.signalTimeUtc.slice(0, 16).replace("T", " ")} UTC`}
      />
      <Suspense fallback={null}>
        <TradeDetailView trade={trade} dataset={dataset} />
      </Suspense>
    </>
  );
}
