import { Footer } from "@/components/ui";
import { SiteNav } from "@/components/site-nav";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div>
      <SiteNav />
      {children}
      <Footer />
    </div>
  );
}
