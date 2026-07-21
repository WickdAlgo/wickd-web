"use client";
import { usePathname } from "next/navigation";
import { NavBar, type NavLink } from "@/components/ui";

const links: NavLink[] = [
  { label: "Platform", href: "/platform" },
  { label: "Engine", href: "/engine" },
  { label: "Pricing", href: "/pricing" },
  { label: "Design", href: "/design" },
];

export function SiteNav() {
  return <NavBar links={links} activeHref={usePathname()} />;
}
