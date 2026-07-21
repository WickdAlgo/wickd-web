import React from "react";
import Link from "next/link";
import { container } from "@/lib/styles";

export interface FooterColumn {
  title: string;
  links: { label: string; href?: string }[];
}

export interface FooterProps {
  columns?: FooterColumn[];
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

export function Footer({ columns = defaultColumns }: FooterProps) {
  return (
    <footer className="bg-inverse pb-10 pt-16 text-ink-inverse">
      <div className={container}>
        <div className="flex flex-wrap gap-16">
          <div className="flex-[1_1_260px]">
            <div className="font-display text-heading-sm font-semibold">WickdAlgo</div>
            <div className="font-ui mt-2 max-w-[320px] text-[13px] leading-normal tracking-[0.3px] text-(--text-inverse-muted)">
              Core emits structures. Strategies make decisions.
            </div>
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <div className="font-ui mb-3.5 text-[11px] uppercase tracking-[1px] text-(--text-inverse-muted)">
                {c.title}
              </div>
              <div className="flex flex-col gap-2.5">
                {c.links.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href ?? "#"}
                    className="font-display text-body-sm font-normal text-ink-inverse no-underline hover:underline"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="font-ui mt-12 border-t border-graphite pt-5 text-caption text-(--text-inverse-muted)">
          Nothing here is financial advice. Trading involves risk. © 2026 WickdAlgo
        </div>
      </div>
    </footer>
  );
}
