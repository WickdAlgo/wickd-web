"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tag } from "@/components/ui";
import { cx } from "@/lib/cx";
import { WEB_VERSION } from "@/lib/version";
import { isNavItemActive, platformNavItems } from "./nav-items";

/**
 * The platform rail.
 *
 * Client only because it reads the pathname — the same reason
 * `src/components/site-nav.tsx` is, and it follows that component's pattern
 * rather than introducing a second way to express "which link is active".
 *
 * These are `Link`s, not buttons calling `setState`. That is the whole point of
 * the route refactor: every view is now addressable, linkable, and openable in
 * a new tab.
 *
 * Below `sm` the rail becomes a horizontally scrolling strip above the content.
 * The previous shell had no mobile handling at all — a fixed 200px rail simply
 * ate half a phone screen.
 */
export function PlatformSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cx(
        "flex flex-none border-hairline bg-card",
        "flex-row items-center gap-1 overflow-x-auto border-b px-3 py-2",
        "sm:w-[200px] sm:flex-col sm:items-stretch sm:overflow-visible",
        "sm:gap-1 sm:border-b-0 sm:border-r sm:px-3 sm:py-5",
      )}
    >
      <Link
        href="/"
        className="font-display flex-none px-2.5 text-[18px] font-semibold tracking-[0.45px] no-underline sm:pb-4"
      >
        WickdAlgo
      </Link>

      <nav className="flex flex-none flex-row gap-1 sm:flex-col" aria-label="Platform">
        {platformNavItems.map((item) => {
          const active = isNavItemActive(item, pathname);
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "font-display whitespace-nowrap rounded-buttons px-3 py-[9px] text-left text-body-sm font-medium no-underline",
                "[transition:all_var(--transition-fast)]",
                active ? "bg-ink text-ink-inverse" : "bg-transparent text-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/*
        The web version marker. `docs/releases/README.md` sends operators here
        to verify a version bump, so this element is part of the release
        runbook — moving it means updating that document in the same change.
      */}
      <div className="ml-auto flex-none px-2.5 sm:ml-0 sm:mt-auto">
        <Tag mono>{WEB_VERSION}</Tag>
      </div>
    </aside>
  );
}
