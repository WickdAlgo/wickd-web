import React from "react";
import Link from "next/link";
import { cx } from "@/lib/cx";
import { container } from "@/lib/styles";
import { Button } from "./button";
import { AnimatedLogo } from "./animated-logo";

export interface NavLink {
  label: string;
  href: string;
}

export interface NavBarProps {
  links?: NavLink[];
  /** href of the link to highlight (usually the current pathname). */
  activeHref?: string;
  sticky?: boolean;
}

export function NavBar({ links = [], activeHref, sticky = true }: NavBarProps) {
  return (
    <nav className={cx("z-50 border-b border-hairline bg-card py-4", sticky && "sticky top-0")}>
      <div className={cx(container, "flex items-center gap-6")}>
        <Link
          href="/"
          className="wa-brand flex items-center gap-2.5 font-display text-subheading font-semibold text-ink no-underline"
        >
          <AnimatedLogo size={30} />
          WickdAlgo
        </Link>
        <div className="flex flex-1 justify-center gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cx(
                "rounded-buttons px-3 py-2 font-display text-body-sm font-medium text-ink no-underline hover:underline",
                activeHref === l.href && "bg-subtle",
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">
            Login
          </Button>
          <Button size="sm">Sign up</Button>
        </div>
      </div>
    </nav>
  );
}
