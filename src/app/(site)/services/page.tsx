import type { Metadata } from "next";
import Link from "next/link";
import { site, services } from "@/lib/site-config";
import { BreadcrumbSchema } from "@/components/site/JsonLd";
import { RevealGroup } from "@/components/site/Reveal";
import { ServiceIcon } from "@/components/site/ServiceIcon";
import { ClosingCta, PageHero, ServiceAreaNote } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Auto Repair Services",
  description: `Complete auto repair and maintenance in ${site.address.city}, ${site.address.state} — brakes, diagnostics, oil changes, A/C, electrical, suspension, tires, engine and transmission work.`,
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <BreadcrumbSchema
        trail={[
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
        ]}
      />

      <PageHero
        eyebrow="Services"
        title="Complete car care, start to finish"
        lede={`From an oil change to an engine job, we handle it in-house for nearly every make and model on the road in ${site.address.city}.`}
      />

      <section className="bg-[#0a0908] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <RevealGroup className="svc-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="svc-card flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6 hover:border-[#ff3b3f]/50 hover:shadow-lift"
              >
                <span className="ico-chip mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff4a4f] to-[#b3060e] text-white shadow-[0_8px_24px_-8px_rgba(227,18,27,0.75)]">
                  <ServiceIcon slug={s.slug} name={s.name} />
                </span>
                <h2 className="font-display text-lg font-bold leading-snug text-white">
                  {s.name}
                </h2>
                <span className="svc-rule mb-2.5 mt-2" />
                <p className="flex-1 text-sm leading-relaxed text-white/60">{s.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#ff3b3f]">
                  Learn more
                  <span className="svc-arrow">→</span>
                </span>
              </Link>
            ))}
          </RevealGroup>

          <div className="mt-10 rounded-2xl border border-white/10 bg-[#12100e] p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold text-white">
              Don&apos;t see what you need?
            </h2>
            <p className="mt-2 max-w-2xl leading-relaxed text-white/60">
              This list covers what comes through the bay most often, but it isn&apos;t everything we
              do. Call us and describe the problem — if it&apos;s something we shouldn&apos;t take
              on, we&apos;ll tell you that too, and point you somewhere that can.
            </p>
            <a href={`tel:${site.phoneHref}`} className="btn-ignite mt-5">
              Call {site.phone}
            </a>
          </div>

          <div className="mt-8">
            <ServiceAreaNote />
          </div>
        </div>
      </section>

      <ClosingCta />
    </>
  );
}
