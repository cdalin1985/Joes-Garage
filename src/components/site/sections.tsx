import Link from "next/link";
import { site, mapsDirectionsUrl } from "@/lib/site-config";

/** Shared building blocks for the public site. */

/** Faint diagonal shop-floor hatching used behind dark sections. */
export const HATCH: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(135deg, rgba(255,255,255,0.045) 0px, rgba(255,255,255,0.045) 1px, transparent 1px, transparent 11px)",
};

export function Eyebrow({ children, tone = "dark" }: { children: React.ReactNode; tone?: "dark" | "light" }) {
  return (
    <p
      className={`mb-3 flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.18em] ${
        tone === "dark" ? "text-accent-600" : "text-accent-300"
      }`}
    >
      <span className={`h-px w-7 ${tone === "dark" ? "bg-accent-400" : "bg-accent-400/60"}`} />
      {children}
    </p>
  );
}

/** The two actions that matter on a shop site: call, or get directions. */
export function CallToAction({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <a href={`tel:${site.phoneHref}`} className="btn-accent !px-6 !py-3 text-base">
        Call {site.phone}
      </a>
      <a
        href={mapsDirectionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={
          tone === "light"
            ? "btn !px-6 !py-3 text-base border border-white/25 bg-white/5 text-white hover:bg-white/10"
            : "btn-secondary !px-6 !py-3 text-base"
        }
      >
        Get directions
      </a>
    </div>
  );
}

/** Page banner used on every page except the home page. */
export function PageHero({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-slate-950 py-16 sm:py-20">
      <div className="absolute inset-0" style={HATCH} />
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-5">
        <Eyebrow tone="light">{eyebrow}</Eyebrow>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">{lede}</p>
      </div>
    </section>
  );
}

/** Closing band — the last thing on every page. */
export function ClosingCta({
  heading = "Something not right with your car?",
  body = "Tell us what it's doing. We'll tell you what it needs — and what it costs — before we touch it.",
}: {
  heading?: string;
  body?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-16 sm:py-20">
      <div className="absolute inset-0" style={HATCH} />
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-accent-500/15 blur-3xl" />
      <div className="relative mx-auto max-w-3xl px-5 text-center">
        <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">{heading}</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-300">{body}</p>
        <div className="mt-8 flex justify-center">
          <CallToAction tone="light" />
        </div>
        <p className="mt-6 text-sm text-slate-500">
          {site.address.street}, {site.address.city} · Free written estimates
        </p>
      </div>
    </section>
  );
}

/** Frequently asked questions — expandable, no JavaScript required. */
export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-slate-200 border-y border-slate-200">
      {items.map((f) => (
        <details key={f.q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-900 group-open:text-brand-700">{f.q}</h3>
            <span className="mt-1 shrink-0 text-2xl leading-none text-accent-500 transition-transform duration-200 group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 max-w-3xl leading-relaxed text-slate-600">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

/** Towns served — real words on the page for nearby searches. */
export function ServiceAreaNote() {
  return (
    <p className="text-sm leading-relaxed text-slate-500">
      Proudly serving drivers in{" "}
      <span className="font-semibold text-slate-700">{site.serviceArea.join(", ")}</span> and the
      surrounding area.{" "}
      <Link href="/contact" className="font-semibold text-brand-600 hover:underline">
        Find us →
      </Link>
    </p>
  );
}
