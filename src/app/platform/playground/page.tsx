import type { Metadata } from "next";
import { platformNavItem } from "@/components/platform/nav-items";
import { PlatformHeader } from "@/components/platform/platform-header";

export const metadata: Metadata = { title: "Playground" };

/** Ships no JavaScript — it is a paragraph. */
export default function PlaygroundPage() {
  const nav = platformNavItem("playground");
  return (
    <>
      <PlatformHeader title={nav.label} blurb={nav.blurb} />
      <div className="font-ui rounded-cards border border-dashed border-strong bg-card p-12 text-center text-[14px] tracking-[0.35px] text-ink-secondary">
        Strategy playground is a Phase II roadmap item — intentionally not designed yet.
      </div>
    </>
  );
}
