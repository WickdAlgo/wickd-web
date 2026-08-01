/**
 * The platform's navigation, as data.
 *
 * One source for the sidebar, each route's heading, and its page metadata. The
 * shell this replaced kept the labels in a `const` next to a `useState`, which
 * is why none of them could appear in a `<title>` — the whole surface was one
 * client component.
 *
 * Server-safe by construction: no imports, no JSX, no hooks.
 */
export interface PlatformNavItem {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly blurb: string;
}

export const platformNavItems: readonly PlatformNavItem[] = [
  {
    id: "inspect",
    label: "Inspect",
    href: "/platform/inspect",
    blurb: "Validate what the engine journaled, visually.",
  },
  {
    id: "journal",
    label: "Journal",
    href: "/platform/journal",
    blurb: "Plan, execution, and outcome on one chart.",
  },
  {
    id: "backtest",
    label: "Backtest",
    href: "/platform/backtest",
    blurb: "Deterministic replay — same inputs, same journal.",
  },
  {
    id: "datasets",
    label: "Datasets",
    href: "/platform/datasets",
    blurb: "Cached ranges and run artifacts.",
  },
  {
    id: "playground",
    label: "Playground",
    href: "/platform/playground",
    blurb: "Strategy rules without backend code.",
  },
];

export function platformNavItem(id: string): PlatformNavItem {
  const found = platformNavItems.find((n) => n.id === id);
  if (!found) throw new Error(`unknown platform nav item: ${id}`);
  return found;
}

/**
 * Active when the URL is the item or anything beneath it, so
 * `/platform/journal/trade-btc-001` still highlights Journal.
 */
export function isNavItemActive(item: PlatformNavItem, pathname: string): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
