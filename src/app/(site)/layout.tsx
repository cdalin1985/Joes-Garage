import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteSchema } from "@/components/site/JsonLd";
import { site } from "@/lib/site-config";

export const metadata: Metadata = {
  title: {
    default: `${site.name} — Auto Repair in ${site.address.city}, ${site.address.state}`,
    template: `%s | ${site.name}`,
  },
  description: site.shortDescription,
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <SiteSchema />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
