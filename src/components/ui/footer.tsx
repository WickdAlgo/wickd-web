import React from "react";
import Link from "next/link";
import { container } from "@/lib/styles";
import { VersionList, type BuildVersion } from "./version-list";

export interface FooterColumn {
  title: string;
  links: { label: string; href?: string }[];
}

export interface FooterProps {
  columns?: FooterColumn[];
  /** Build markers, rendered opposite the legal line. */
  versions?: BuildVersion[];
}

const defaultColumns: FooterColumn[] = [
  {
    title: "Platform",
    links: [
      { label: "Structure inspection", href: "/platform" },
      { label: "Backtesting", href: "/platform" },
      { label: "Strategy playground", href: "/platform" },
    ],
  },
  {
    title: "Engine",
    links: [
      { label: "Wickd.Core", href: "/engine" },
      { label: "Wickd.CLI", href: "/engine" },
      { label: "Wickd.Adapters.Ccxt", href: "/engine" },
    ],
  },
  {
    title: "Company",
    links: [{ label: "Vision" }, { label: "Roadmap" }, { label: "GitHub" }],
  },
];

export function Footer({
  columns = defaultColumns,
  versions = [],
}: FooterProps) {
  return (
    <footer className="bg-inverse pb-10 pt-12 text-ink-inverse lg:pt-16">
      <div className={container}>
        {/* Grid, not flex-wrap: wrapping put three of the four blocks on one row and
            orphaned the last on a row of its own, paying a full row gutter for a
            single column. Explicit tracks collapse predictably at each width. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-10 md:grid-cols-[minmax(0,1fr)_repeat(3,max-content)] md:gap-x-10 lg:gap-x-16">
          <div className="col-span-2 sm:col-span-3 md:col-span-1">
            <div className="font-display text-heading-sm font-semibold">WickdAlgo</div>
            <div className="font-ui mt-2 max-w-[320px] text-[13px] leading-normal tracking-[0.3px] text-(--text-inverse-muted)">
              Core emits structures. Strategies make decisions.
            </div>
          </div>
          {columns.map((c) => (
            // min-w-0 so a long label wraps inside its track instead of forcing
            // the grid wider than the viewport on narrow phones.
            <div key={c.title} className="min-w-0">
              <div className="font-ui mb-3.5 text-[11px] uppercase tracking-[1px] text-(--text-inverse-muted)">
                {c.title}
              </div>
              <div className="flex flex-col gap-2.5">
                {c.links.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href ?? "#"}
                    // break-words: "Wickd.Adapters.Ccxt" has no space to wrap at and
                    // is wider than a half-width track below ~350px.
                    className="font-display text-body-sm font-normal break-words text-ink-inverse no-underline hover:underline"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-start justify-between gap-x-10 gap-y-4 border-t border-graphite pt-5 text-(--text-inverse-muted)">
          <div className="font-ui text-caption">
            Nothing here is financial advice. Trading involves risk. © 2026 WickdAlgo
          </div>
          {versions.length > 0 && <VersionList versions={versions} />}
        </div>
      </div>
    </footer>
  );
}
