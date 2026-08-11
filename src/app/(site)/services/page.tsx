import type { Metadata } from "next";
import Link from "next/link";
import { site, services } from "@/lib/site-config";
import { BreadcrumbSchema } from "@/components/site/JsonLd";
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

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lift"
              >
                <span className="absolute right-0 top-0 h-12 w-12 bg-gradient-to-bl from-accent-200/50 to-transparent transition-colors group-hover:from-accent-300/70" />
                <h2 className="pr-6 font-display text-lg font-bold leading-snug text-slate-900 group-hover:text-brand-700">
                  {s.name}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{s.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                  Learn more
                  <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold text-slate-900">
              Don&apos;t see what you need?
            </h2>
            <p className="mt-2 max-w-2xl leading-relaxed text-slate-600">
              This list covers what comes through the bay most often, but it isn&apos;t everything we
              do. Call us and describe the problem — if it&apos;s something we shouldn&apos;t take
              on, we&apos;ll tell you that too, and point you somewhere that can.
            </p>
            <a href={`tel:${site.phoneHref}`} className="btn-primary mt-5">
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
