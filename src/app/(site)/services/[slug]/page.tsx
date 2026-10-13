import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site, services, faqs } from "@/lib/site-config";
import { BreadcrumbSchema, FaqSchema, ServiceSchema } from "@/components/site/JsonLd";
import { RevealGroup } from "@/components/site/Reveal";
import { ClosingCta, Eyebrow, FaqList, HATCH } from "@/components/site/sections";

/** Pre-build a page for every service so they load instantly and index cleanly. */
export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const service = services.find((s) => s.slug === params.slug);
  if (!service) return {};
  return {
    // Local intent: the town is what turns a search into a phone call.
    title: `${service.metaTitle} in ${site.address.city}, ${site.address.state}`,
    description: service.metaDescription,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = services.find((s) => s.slug === params.slug);
  if (!service) notFound();

  const others = services.filter((s) => s.slug !== service.slug).slice(0, 6);
  const pageFaqs = faqs.slice(0, 4);

  return (
    <>
      <ServiceSchema
        name={service.name}
        description={service.metaDescription}
        slug={service.slug}
      />
      <FaqSchema items={pageFaqs} />
      <BreadcrumbSchema
        trail={[
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: service.name, path: `/services/${service.slug}` },
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10 bg-slate-950 py-16 sm:py-20">
        <div className="absolute inset-0" style={HATCH} />
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5">
          <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-400">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="px-2 text-white/60">/</span>
            <Link href="/services" className="hover:text-white">
              Services
            </Link>
            <span className="px-2 text-white/60">/</span>
            <span className="text-slate-300">{service.name}</span>
          </nav>

          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl">
            {service.name} in {site.address.city}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">{service.intro}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={`tel:${site.phoneHref}`} className="btn-ignite !px-6 !py-3 text-base">
              Call {site.phone}
            </a>
            <Link
              href="/contact"
              className="btn !px-6 !py-3 text-base border border-white/25 bg-white/5 text-white hover:bg-white/10"
            >
              Hours &amp; location
            </Link>
          </div>
        </div>
      </section>

      {/* Symptoms + what's included */}
      <section className="bg-[#0a0908] py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-2">
          <div>
            <Eyebrow tone="light">You might need this if</Eyebrow>
            <h2 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
              Sound familiar?
            </h2>
            <RevealGroup className="mt-6 space-y-3">
              {service.symptoms.map((s) => (
                <div key={s} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <span className="leading-relaxed text-white/75">{s}</span>
                </div>
              ))}
            </RevealGroup>
            <p className="mt-6 leading-relaxed text-white/60">
              Any one of these is worth a phone call. Describing it to us costs nothing, and
              catching it early is almost always the cheaper repair.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#12100e] p-7">
            <Eyebrow tone="light">What&apos;s included</Eyebrow>
            <h2 className="text-2xl font-extrabold leading-tight text-white">
              How we handle it
            </h2>
            <RevealGroup className="mt-6 space-y-3">
              {service.includes.map((s) => (
                <div key={s} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-300">
                    ✓
                  </span>
                  <span className="leading-relaxed text-white/75">{s}</span>
                </div>
              ))}
            </RevealGroup>
            <div className="mt-6 border-t border-dashed border-white/20 pt-5">
              <p className="text-sm leading-relaxed text-white/60">
                Every job starts with a free written estimate and ends with a road test. You approve
                the work before it happens — no exceptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#12100e] py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-5">
          <Eyebrow tone="light">Before you come in</Eyebrow>
          <h2 className="mb-8 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
            Questions we hear a lot
          </h2>
          <FaqList items={pageFaqs} tone="dark" />
        </div>
      </section>

      {/* Other services */}
      <section className="bg-[#0a0908] py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-xl font-bold text-white">While you&apos;re here</h2>
          <p className="mt-1 text-white/60">Other things we take care of in the same visit.</p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {others.map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="rounded-full border border-white/20 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/75 transition hover:border-[#ffb02e]/60 hover:bg-white/[0.08] hover:text-[#ffd27a]"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ClosingCta
        heading={`Need ${service.name.toLowerCase()}?`}
        body={`We're right here in ${site.address.city}. Call and describe what's going on — you'll get a straight answer and a written estimate before any work begins.`}
      />
    </>
  );
}
