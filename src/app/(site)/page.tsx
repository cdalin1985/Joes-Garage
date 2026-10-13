import type { Metadata } from "next";
import { site, faqs } from "@/lib/site-config";
import { FaqSchema } from "@/components/site/JsonLd";
import { FaqList } from "@/components/site/sections";
import { GarageDoor } from "@/components/site/fx/GarageDoor";
import { HeroIgnition } from "@/components/site/fx/HeroIgnition";
import { TapeTicker } from "@/components/site/fx/TapeTicker";
import { ExplodedSteps } from "@/components/site/fx/ExplodedSteps";
import { ScrollReveal } from "@/components/site/fx/ScrollReveal";
import { HeroCopy } from "@/components/site/home/HeroCopy";
import { Services } from "@/components/site/home/Services";
import { Inspection } from "@/components/site/home/Inspection";
import { TipAndHours } from "@/components/site/home/TipAndHours";
import { CallJoe } from "@/components/site/home/CallJoe";
import { SectionEyebrow } from "@/components/site/home/SectionEyebrow";

export const metadata: Metadata = {
  title: `Auto Repair in ${site.address.city}, ${site.address.state}`,
  description: `${site.name} is an independent auto repair shop at ${site.address.street} in ${site.address.city}, Montana. Brakes, diagnostics, oil changes, A/C, engine and transmission work. Call ${site.phone}.`,
  alternates: { canonical: "/" },
};

const TICKER = [
  "Check engine lights",
  "Diagnostics",
  "Brakes",
  "Oil changes",
  "A/C & heating",
  "Batteries & electrical",
  "Suspension & steering",
  "Alignments",
  "Tires",
  "Engine repair",
  "Transmissions",
  "Scheduled maintenance",
  "Pre-purchase inspections",
  "Fleet service",
];

const STEPS = [
  {
    n: "01",
    title: "Tell us what it's doing",
    body: "Call or stop by and describe the noise, the light, the smell — whatever brought you in. No jargon required.",
  },
  {
    n: "02",
    title: "We find the real cause",
    body: "We inspect and test until we know what actually failed, then send you photos and a written estimate. Nothing gets repaired until you say go.",
  },
  {
    n: "03",
    title: "Fixed right, backed up",
    body: "We do the work, road test it, and stand behind it. You leave knowing exactly what was done and what's coming next.",
  },
];

export default function HomePage() {
  return (
    <div className="bg-[#0a0908]">
      <FaqSchema />
      <GarageDoor name={site.name} place={`${site.address.city}, Montana`} />

      <HeroIgnition>
        <HeroCopy />
      </HeroIgnition>

      <TapeTicker items={TICKER} />

      <Services />

      {/* How it works — told by an exploding spark plug */}
      <section className="relative bg-[#12100e] py-28 text-white">
        <ScrollReveal className="mx-auto max-w-7xl px-5">
          <SectionEyebrow>How it works</SectionEyebrow>
          <h2 data-reveal className="mega text-[clamp(2.8rem,6.5vw,5.75rem)]">
            <span className="text-chrome">No surprises</span> <span className="text-fire">on the invoice.</span>
          </h2>
        </ScrollReveal>
        <div className="mx-auto max-w-7xl px-5">
          <ExplodedSteps steps={STEPS} />
        </div>
      </section>

      <Inspection />

      <TipAndHours />

      <section className="bg-[#12100e] py-28 text-white">
        <ScrollReveal className="mx-auto max-w-4xl px-5">
          <SectionEyebrow>Common questions</SectionEyebrow>
          <h2 data-reveal className="mega mb-10 text-[clamp(2.6rem,6vw,5rem)]">
            <span className="text-chrome">Asked every</span> <span className="text-fire">week.</span>
          </h2>
          <FaqList items={faqs} tone="dark" reveal />
        </ScrollReveal>
      </section>

      <CallJoe />
    </div>
  );
}
