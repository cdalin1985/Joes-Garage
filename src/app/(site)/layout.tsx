import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteSchema } from "@/components/site/JsonLd";
import { ScrollFuse } from "@/components/site/fx/ScrollFuse";
import { SparkCursor } from "@/components/site/fx/SparkCursor";
import { site } from "@/lib/site-config";
import "./fx.css";

export const metadata: Metadata = {
  title: {
    default: `${site.name} — Auto Repair in ${site.address.city}, ${site.address.state}`,
    template: `%s | ${site.name}`,
  },
  description: site.shortDescription,
};

/**
 * Runs before the page paints. Turns the animation layer on only when the
 * visitor allows motion; queues the garage-door intro on a first visit to the
 * home page; flags WebGL support so the 3D plug can take over from the 2D one.
 * Safety nets: if the effects never start (script blocked, slow network),
 * everything is un-hidden after 4s, and the 2D plug returns after 6s.
 */
const FX_BOOT = `(function(){try{
var c=document.documentElement.classList;
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
c.add('fx-on');
try{var g=document.createElement('canvas');if(g.getContext('webgl2')||g.getContext('webgl'))c.add('fx-3d')}catch(e){}
var first=true;try{first=!sessionStorage.getItem('joes-door')}catch(e){}
if(first&&location.pathname==='/')c.add('fx-intro');
setTimeout(function(){if(c.contains('fx-intro')){c.remove('fx-intro');window.dispatchEvent(new Event('joes:door-open'))}},4000);
setTimeout(function(){if(!c.contains('fx-ready'))c.remove('fx-on')},4000);
setTimeout(function(){if(!c.contains('fx-3d-ready'))c.remove('fx-3d')},6000);
}catch(e){}})();`;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0908]">
      <script dangerouslySetInnerHTML={{ __html: FX_BOOT }} />
      <SiteSchema />
      <ScrollFuse />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <SparkCursor />
    </div>
  );
}
