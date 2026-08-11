import type { Metadata } from "next";
import Link from "next/link";
import { site, services, faqs, groupedHours } from "@/lib/site-config";
import { FaqSchema } from "@/components/site/JsonLd";
import { Reveal, RevealGroup } from "@/components/site/Reveal";
import { ServiceIcon } from "@/components/site/ServiceIcon";
import {
  CallToAction,
  ClosingCta,
  Eyebrow,
  FaqList,
  HATCH,
  ServiceAreaNote,
} from "@/components/site/sections";

export const metadata: Metadata = {
  title: `Auto Repair in ${site.address.city}, ${site.address.state}`,
  description: `${site.name} is an independent auto repair shop in ${site.address.city}. Brakes, diagnostics, oil changes, A/C, engine and transmission work — with free written estimates and photo inspections. Call ${site.phone}.`,
  alternates: { canonical: "/" },
};

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
  const hours = groupedHours();

  return (
    <>
      <FaqSchema />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0" style={HATCH} />
        <div className="orb-drift pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="orb-drift-slow pointer-events-none absolute -right-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-accent-500/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-28">
          <div>
            <p className="animate-rise font-script text-6xl leading-none text-accent-300 sm:text-7xl">
              {site.name}
            </p>
            <h1
              className="animate-rise mt-3 text-4xl font-extrabold leading-[1.05] text-white sm:text-6xl"
              style={{ animationDelay: "60ms" }}
            >
              Honest auto repair
              <span className="block text-slate-400">done right the first time.</span>
            </h1>
            <p
              className="animate-rise mt-6 max-w-xl text-lg leading-relaxed text-slate-300"
              style={{ animationDelay: "120ms" }}
            >
              An <span className="font-semibold text-white">ASE Master Certified</span> independent
              shop in {site.address.city} — every make and model, every repair explained in plain
              English, and a written estimate before anyone picks up a wrench.
            </p>

            <div className="animate-rise mt-8" style={{ animationDelay: "180ms" }}>
              <CallToAction tone="light" />
            </div>

            <dl
              className="animate-rise mt-10 grid max-w-lg grid-cols-2 gap-x-6 gap-y-4 border-t border-white/10 pt-6"
              style={{ animationDelay: "240ms" }}
            >
              {site.trust.map((t) => (
                <div key={t.label}>
                  <dt className="text-xs font-bold uppercase tracking-wider text-accent-400">
                    {t.label}
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-300">{t.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hours card, styled like a work-order ticket */}
          <div
            className="animate-rise relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-7"
            style={{ animationDelay: "300ms" }}
          >
            <div className="absolute inset-x-6 -top-px h-px bg-gradient-to-r from-transparent via-accent-400/60 to-transparent" />
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-300">
              Shop hours
            </p>
            <table className="mt-4 w-full text-sm">
              <tbody>
                {hours.map((h) => (
                  <tr key={h.days} className="border-b border-white/5 last:border-0">
                    <td className="py-2 font-semibold text-white">{h.days}</td>
                    <td className="py-2 text-right tabular-nums text-slate-300">{h.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-5 border-t border-dashed border-white/15 pt-5">
              <p className="text-sm leading-relaxed text-slate-300">
                <span className="font-semibold text-white">Broken down right now?</span> Call us
                anyway — we hold room in the schedule for no-starts and breakdowns.
              </p>
              <a
                href={`tel:${site.phoneHref}`}
                className="mt-3 inline-block font-display text-2xl font-bold text-accent-300 hover:text-accent-200"
              >
                {site.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Eyebrow>What we fix</Eyebrow>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="max-w-2xl text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
              Everything your car needs, under one roof
            </h2>
            <Link href="/services" className="btn-secondary">
              See all services
            </Link>
          </div>

          <RevealGroup className="svc-grid mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.slice(0, 9).map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="svc-card flex flex-col rounded-2xl border border-slate-200 bg-white p-6 hover:border-brand-300 hover:shadow-lift"
              >
                <span className="ico-chip mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-100 to-accent-200 text-brand-700 ring-1 ring-inset ring-accent-300/60">
                  <ServiceIcon slug={s.slug} name={s.name} />
                </span>
                <h3 className="font-display text-lg font-bold leading-snug text-slate-900">
                  {s.name}
                </h3>
                <span className="svc-rule mb-2.5 mt-2" />
                <p className="flex-1 text-sm leading-relaxed text-slate-600">{s.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                  Learn more
                  <span className="svc-arrow">→</span>
                </span>
              </Link>
            ))}
          </RevealGroup>

          <div className="mt-8">
            <ServiceAreaNote />
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="max-w-2xl text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
            No surprises on the invoice. Ever.
          </h2>

          <RevealGroup className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="step relative">
                <span className="step-num block font-display text-6xl font-extrabold leading-none text-slate-200">
                  {s.n}
                </span>
                <h3 className="mt-3 font-display text-xl font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{s.body}</p>
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── The differentiator: photo inspections ────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950 py-20">
        <div className="absolute inset-0" style={HATCH} />
        <div className="pointer-events-none absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <Eyebrow tone="light">See what we see</Eyebrow>
            <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              We send you photos of the problem — before you approve the fix
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-300">
              You should never have to take a mechanic&apos;s word for it. Our technicians photograph
              your vehicle during inspection and rate every item{" "}
              <span className="font-semibold text-emerald-400">green</span>,{" "}
              <span className="font-semibold text-amber-300">yellow</span>, or{" "}
              <span className="font-semibold text-red-400">red</span>. You get a link on your phone,
              look at the worn part yourself, and decide with real information in front of you.
            </p>
            <p className="mt-4 leading-relaxed text-slate-400">
              It&apos;s also why nothing gets repaired without your say-so. Green means it&apos;s
              fine. Yellow means keep an eye on it. Red means let&apos;s talk.
            </p>
          </Reveal>

          <RevealGroup className="space-y-3">
            {[
              { tone: "bg-red-500", pulse: true, label: "Front brake pads at 2mm", note: "Needs attention now" },
              { tone: "bg-amber-400", pulse: true, label: "Serpentine belt cracking", note: "Plan for it soon" },
              { tone: "bg-emerald-500", pulse: false, label: "Battery tested strong", note: "Looks good" },
              { tone: "bg-emerald-500", pulse: false, label: "Tires 7/32\" even wear", note: "Looks good" },
            ].map((row) => (
              <div
                key={row.label}
                className="lift-row flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 hover:border-white/25 hover:bg-white/[0.07]"
              >
                <span
                  className={`h-3 w-3 shrink-0 rounded-full ${row.tone} ${row.pulse ? "pulse-dot" : ""}`}
                />
                <span className="flex-1 font-medium text-white">{row.label}</span>
                <span className="text-sm text-slate-400">{row.note}</span>
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-5">
          <Eyebrow>Common questions</Eyebrow>
          <h2 className="mb-8 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
            Questions we get asked every week
          </h2>
          <FaqList items={faqs} />
        </div>
      </section>

      <ClosingCta />
    </>
  );
}
