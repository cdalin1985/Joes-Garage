import type { Metadata } from "next";
import { site, faqs, services } from "@/lib/site-config";
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
import { NoiseDecoder } from "@/components/site/home/NoiseDecoder";
import { FromTheBay } from "@/components/site/home/FromTheBay";
import { TextJoe } from "@/components/site/home/TextJoe";

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

const SERVICE_NAMES = Object.fromEntries(services.map((s) => [s.slug, s.name]));

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

      {/* What's that noise? — hear it, decode it, book it */}
      <section id="noise" className="relative scroll-mt-20 overflow-hidden bg-[#0a0908] py-28 text-white">
        <div className="pointer-events-none absolute right-0 top-0 h-[28rem] w-[40rem] bg-[radial-gradient(closest-side,rgba(127,220,255,0.08),transparent)]" aria-hidden="true" />
        <ScrollReveal className="relative mx-auto max-w-7xl px-5">
          <SectionEyebrow>What&apos;s that noise?</SectionEyebrow>
          <h2 data-reveal className="mega max-w-4xl text-[clamp(2.8rem,6.5vw,5.75rem)]">
            <span className="text-chrome">Describe it.</span> <span className="text-fire">Decode it.</span>
          </h2>
          <p data-reveal className="mt-6 max-w-2xl text-lg leading-relaxed text-white/65">
            Pick what your vehicle is doing. Hear an example, see what usually causes it, and drop it straight
            into a text to the shop.
          </p>
        </ScrollReveal>
        <div className="relative mx-auto mt-12 max-w-7xl px-5">
          <NoiseDecoder serviceNames={SERVICE_NAMES} />
          <p className="mt-6 max-w-3xl text-xs leading-relaxed text-white/45">
            A general guide, not a diagnosis. Example sounds are synthesized, and every vehicle is different —
            the real answer comes from an inspection.
          </p>
        </div>
      </section>

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

      <FromTheBay />

      <Inspection />

      <TipAndHours />

      {/* Build a text to the shop */}
      <section id="text-joe" className="relative scroll-mt-20 overflow-hidden bg-[#12100e] py-28 text-white">
        <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#e3121b]/15 blur-3xl" aria-hidden="true" />
        <ScrollReveal className="relative mx-auto max-w-7xl px-5">
          <SectionEyebrow>Skip the phone tag</SectionEyebrow>
          <h2 data-reveal className="mega max-w-4xl text-[clamp(2.8rem,6.5vw,5.75rem)]">
            <span className="block text-chrome">Build your text.</span>
            <span className="block text-fire">Send it in seconds.</span>
          </h2>
          <p data-reveal className="mt-6 max-w-2xl text-lg leading-relaxed text-white/65">
            Fill in what you know. We&apos;ll write it up so it lands with everything the shop needs to get back
            to you.
          </p>
        </ScrollReveal>
        <div className="relative mx-auto mt-12 max-w-7xl px-5">
          <TextJoe shopName={site.name} phone={site.phone} phoneHref={site.phoneHref} email={site.email} />
        </div>
      </section>

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
