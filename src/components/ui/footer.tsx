"use client";
import React from "react";

export interface FooterColumn {
  title: string;
  links: string[];
}

export interface FooterProps {
  columns?: FooterColumn[];
}

const defaultColumns: FooterColumn[] = [
  {
    title: "Platform",
    links: ["Structure inspection", "Backtesting", "Strategy playground"],
  },
  { title: "Engine", links: ["Wickd.Core", "Wickd.CLI", "Wickd.Adapters.Ccxt"] },
  { title: "Company", links: ["Vision", "Roadmap", "GitHub"] },
];

export function Footer({ columns = defaultColumns }: FooterProps) {
  return (
    <footer
      style={{
        background: "var(--surface-inverse)",
        color: "var(--text-inverse)",
        padding: "64px 0 40px",
      }}
    >
      <div
        style={{
          maxWidth: "var(--page-max-width)",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <div style={{ display: "flex", gap: 64, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px" }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "24px",
                letterSpacing: "0.6px",
              }}
            >
              WickdAlgo
            </div>
            <div
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "13px",
                color: "var(--text-inverse-muted)",
                marginTop: 8,
                letterSpacing: "0.3px",
                maxWidth: 320,
                lineHeight: 1.5,
              }}
            >
              Core emits structures. Strategies make decisions.
            </div>
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <div
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "11px",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: "var(--text-inverse-muted)",
                  marginBottom: 14,
                }}
              >
                {c.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {c.links.map((l) => (
                  <a
                    key={l}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "14px",
                      fontWeight: 400,
                      letterSpacing: "0.35px",
                      color: "var(--text-inverse)",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                  >
                    {l}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: "1px solid var(--color-graphite)",
            marginTop: 48,
            paddingTop: 20,
            fontFamily: "var(--font-ui)",
            fontSize: "12px",
            color: "var(--text-inverse-muted)",
            letterSpacing: "0.3px",
          }}
        >
          Nothing here is financial advice. Trading involves risk. © 2026 WickdAlgo
        </div>
      </div>
    </footer>
  );
}
