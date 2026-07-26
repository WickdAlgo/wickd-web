import { Footer, type BuildVersion } from "@/components/ui";
import { SiteNav } from "@/components/site-nav";
import { CORE_VERSION, WEB_VERSION } from "@/lib/version";

const versions: BuildVersion[] = [
  { label: "web", version: WEB_VERSION },
  { label: "core", version: CORE_VERSION },
];

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteNav />
      {children}
      <Footer versions={versions} />
    </>
  );
}
