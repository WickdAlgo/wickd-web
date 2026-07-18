"use client";
import React from "react";
import { Button } from "./button";

export interface NavBarProps {
  links?: string[];
  active?: string;
  onNav?: (target: string) => void;
  sticky?: boolean;
}

export function NavBar({
  links = ["Platform", "Engine", "Docs", "Pricing"],
  active,
  onNav,
  sticky = true,
}: NavBarProps) {
  return (
    <nav
      style={{
        position: sticky ? "sticky" : "static",
        top: 0,
        zIndex: 50,
        background: "var(--surface-card)",
        borderBottom: "1px solid var(--border-hairline)",
        padding: "16px 0",
      }}
    >
      <div
        style={{
          maxWidth: "var(--page-max-width)",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNav?.("home");
          }}
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "20px",
            letterSpacing: "0.5px",
            textDecoration: "none",
            color: "var(--text-primary)",
          }}
        >
          WickdAlgo
        </a>
        <div style={{ display: "flex", gap: 16, flex: 1, justifyContent: "center" }}>
          {links.map((l) => (
            <a
              key={l}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNav?.(l);
              }}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "14px",
                fontWeight: 500,
                letterSpacing: "0.35px",
                color: "var(--text-primary)",
                textDecoration: "none",
                padding: "8px 12px",
                borderRadius: "var(--radius-buttons)",
                background: active === l ? "var(--surface-subtle)" : "transparent",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              {l}
            </a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Button variant="ghost" size="sm" onClick={() => onNav?.("login")}>
            Login
          </Button>
          <Button size="sm" onClick={() => onNav?.("signup")}>
            Sign up
          </Button>
        </div>
      </div>
    </nav>
  );
}
