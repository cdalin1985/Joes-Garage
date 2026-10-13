import { site } from "@/lib/site-config";
import { ScrollReveal } from "@/components/site/fx/ScrollReveal";
import { BayPhoto } from "@/components/site/fx/BayPhoto";
import { SectionEyebrow } from "./SectionEyebrow";

/** The shop's own photo (from its Facebook page) beside the trust points. */
export function FromTheBay() {
  return (
    <section className="relative overflow-hidden bg-[#0a0908] py-28 text-white">
      <div className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-[#e3121b]/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-[0.9fr_1.1fr]">
        <BayPhoto alt={`A brake rotor and wheel hub on the lift at ${site.name}, with red jack stands in the background`} />

        <ScrollReveal>
          <SectionEyebrow>From the bay</SectionEyebrow>
          <h2 data-reveal className="mega text-[clamp(2.8rem,6vw,5.25rem)]">
            <span className="block text-chrome">Real shop.</span>
            <span className="block text-fire">Real work.</span>
          </h2>
          <p data-reveal className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">
            No stock photos — that&apos;s a car up on the lift at {site.address.street}, straight from the
            shop&apos;s own Facebook page. Every job starts the same way: eyes on the actual part, then a written
            estimate before any work.
          </p>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {site.trust.map((t, i) => (
              <li
                key={t.label}
                data-reveal
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <span className="absolute right-4 top-3 font-mono text-xs text-white/20" aria-hidden="true">
                  0{i + 1}
                </span>
                <p className="mega text-2xl text-white">{t.label}</p>
                <p className="mt-1 text-sm text-white/55">{t.value}</p>
              </li>
            ))}
          </ul>
        </ScrollReveal>
      </div>
    </section>
  );
}
