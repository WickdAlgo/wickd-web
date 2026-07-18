"use client";
import { usePathname, useRouter } from "next/navigation";
import { NavBar } from "@/components/ui";

const routes: Record<string, string> = {
  home: "/",
  Platform: "/platform",
  Engine: "/engine",
  Pricing: "/pricing",
  Design: "/design",
};

const activeByPath: Record<string, string> = {
  "/platform": "Platform",
  "/engine": "Engine",
  "/pricing": "Pricing",
  "/design": "Design",
};

export function SiteNav() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <NavBar
      links={["Platform", "Engine", "Pricing", "Design"]}
      active={activeByPath[pathname]}
      onNav={(target) => {
        const href = routes[target];
        if (href) router.push(href);
      }}
    />
  );
}
