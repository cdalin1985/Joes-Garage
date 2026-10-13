import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site-config";
import { BreadcrumbSchema } from "@/components/site/JsonLd";
import { ClosingCta, Eyebrow, PageHero, ServiceAreaNote } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "About Our Shop",
  description: `${site.name} is a locally owned, independent auto repair shop in ${site.address.city}, ${site.address.state}. Meet the people working on your car and see how we do business.`,
  alternates: { canonical: "/about" },
};

/**
 * ⚠️ «PERSONALIZE ME» — the words below are a solid starting point, but this
 * page sells the shop best when it's in Joe's own voice. Swap in the real
 * story: why the shop opened, who works here, what you're known for.
 */
const VALUES = [
  {
    title: "You approve everything",
    body: "No repair happens without a written estimate and your go-ahead. If we open something up and find more, we stop and call — we don't decide for you.",
  },
  {
    title: "We show you the problem",
    body: "Photos of the worn part, on your phone, with a plain-English explanation. You shouldn't have to take anyone's word for what's under your hood.",
  },
  {
    title: "We'll tell you when to wait",
    body: "Not everything needs fixing today. If a part has life left in it, we'll say so and note it for next time instead of selling you a repair you don't need yet.",
  },
  {
    title: "Independent, and staying that way",
    body: "No corporate quotas, no upsell scripts. Just a local shop that has to look its customers in the eye at the grocery store.",
  },
];

export default function AboutPage() {
  // Only claim a history if we've been told one.
  const years = site.foundedYear ? new Date().getFullYear() - site.foundedYear : null;
  const lede = site.foundedYear
    ? `Locally owned and independent since ${site.foundedYear} — that's ${years} years of fixing cars for the people who live around here.`
    : `Locally owned, independent, and ASE Master Certified — fixing cars for the people who live and work around ${site.address.city}.`;

  return (
    <>
      <BreadcrumbSchema
        trail={[
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ]}
      />

      <PageHero
        eyebrow="About us"
        title={`A neighborhood shop in ${site.address.city}`}
        lede={lede}
      />

      <section className="bg-[#0a0908] py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Eyebrow tone="light">Our story</Eyebrow>
            <h2 className="text-3xl font-extrabold leading-tight text-white">
              Built on repeat customers, not one-time tickets
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-white/60">
              <p>
                Most people don&apos;t enjoy taking their car in. They&apos;ve been talked down to,
                handed a bill they didn&apos;t understand, or sold something they didn&apos;t need.
                We built this shop to be the opposite of that experience.
              </p>
              <p>
                That means explaining what failed and why, in words that make sense. It means
                photographing the problem so you can see it yourself. It means a written estimate
                before the work — and a phone call, not a surprise, if we find something else.
              </p>
              <p>
                We work on nearly everything on the road: domestic and import, cars, trucks, SUVs,
                and the work vans that keep local businesses running. Some customers have been
                coming here since the beginning, and now bring their kids&apos; cars in too. That
                is the whole business model.
              </p>
              <p>
                We&apos;re <span className="font-semibold text-white">ASE Master Certified</span>{" "}
                — the highest level of certification the National Institute for Automotive Service
                Excellence awards, earned by passing every major test area and re-earned every five
                years. It doesn&apos;t make us infallible. It does mean the person diagnosing your
                car has proven they know the systems inside it.
              </p>
            </div>

            <div className="mt-8">
              <ServiceAreaNote />
            </div>
          </div>

          <div className="space-y-4">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl border border-white/10 bg-[#12100e] p-6">
                <h3 className="font-display text-lg font-bold text-white">{v.title}</h3>
                <p className="mt-2 leading-relaxed text-white/60">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#12100e] py-16">
        <div className="mx-auto max-w-6xl px-5">
          <Eyebrow tone="light">What you can count on</Eyebrow>
          <h2 className="text-3xl font-extrabold leading-tight text-white">
            The promises we actually keep
          </h2>
          <dl className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {site.trust.map((t) => (
              <div key={t.label} className="border-t-2 border-accent-400 pt-4">
                <dt className="font-display text-sm font-bold uppercase tracking-wide text-white/55">
                  {t.label}
                </dt>
                <dd className="mt-1 text-lg font-semibold text-white">{t.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 max-w-2xl leading-relaxed text-white/60">
            Have a question about a repair, a second opinion, or whether a car is worth
            fixing?{" "}
            <Link href="/contact" className="font-semibold text-[#ffb02e] hover:underline">
              Get in touch
            </Link>{" "}
            — we&apos;re happy to talk it through before you commit to anything.
          </p>
        </div>
      </section>

      <ClosingCta
        heading="Come meet us"
        body={`We're on ${site.address.street} in ${site.address.city}. Stop in, call, or book ahead — whatever's easiest.`}
      />
    </>
  );
}
