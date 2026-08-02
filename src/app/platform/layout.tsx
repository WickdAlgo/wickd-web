import type { Metadata } from "next";
import { DemonstrationNotice } from "@/components/platform/platform-header";
import { PlatformSidebar } from "@/components/platform/platform-sidebar";

export const metadata: Metadata = {
  title: {
    // Each route sets its own title now that the shell is not one client
    // component. That was impossible before: `"use client"` at the top of the
    // page meant no route could export metadata at all.
    template: "%s · WickdAlgo Platform",
    default: "Platform · WickdAlgo",
  },
};

/**
 * The platform shell.
 *
 * A server component. Only the rail is client, because only the rail reads the
 * pathname — the same split `(site)/layout.tsx` already uses.
 */
export default function PlatformLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <PlatformSidebar />
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6">
        <DemonstrationNotice />
        {children}
      </main>
    </div>
  );
}
