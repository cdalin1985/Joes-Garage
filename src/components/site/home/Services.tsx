import Link from "next/link";
import { site, services } from "@/lib/site-config";
import { ServiceIcon } from "@/components/site/ServiceIcon";
import { SpotlightGrid } from "@/components/site/fx/SpotlightGrid";
import { ScrollReveal } from "@/components/site/fx/ScrollReveal";
import { SectionEyebrow } from "./SectionEyebrow";

/** "What we fix" — spotlight cards over the shop's service list. */
export function Services() {
  return (
    <section id="services" className="relative bg-[#0a0908] pb-24 pt-28 text-white">
      <ScrollReveal className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 px-5">
        <div>
          <SectionEyebrow>What we fix</SectionEyebrow>
          <h2 data-reveal className="mega text-[clamp(2.8rem,6.5vw,5.75rem)]">
            <span className="text-chrome">Everything your car needs.</span>{" "}
            <span className="text-fire">One shop.</span>
          </h2>
        </div>
        <Link data-reveal href="/services" className="btn-ghost-ign">
          All services →
        </Link>
      </ScrollReveal>

      <SpotlightGrid className="mx-auto mt-14 grid max-w-7xl gap-4 px-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.slice(0, 9).map((s) => (
          <Link
            key={s.slug}
            href={`/services/${s.slug}`}
            className="spot-card svc-card flex flex-col p-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b3f]/70"
          >
            <span className="ico-chip mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff4a4f] to-[#b3060e] text-white shadow-[0_8px_24px_-8px_rgba(227,18,27,0.75)]">
              <ServiceIcon slug={s.slug} name={s.name} />
            </span>
            <h3 className="font-display text-xl font-bold leading-snug text-white">{s.name}</h3>
            <span className="svc-rule mb-3 mt-2.5" />
            <p className="flex-1 text-sm leading-relaxed text-white/55">{s.blurb}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#ff3b3f]">
              Learn more <span className="svc-arrow">→</span>
            </span>
          </Link>
        ))}
      </SpotlightGrid>

      <p className="mx-auto mt-10 max-w-7xl px-5 text-sm leading-relaxed text-white/55">
        Serving drivers in <span className="font-semibold text-white/70">{site.serviceArea.join(", ")}</span>{" "}
        and the surrounding area.
      </p>
    </section>
  );
}
