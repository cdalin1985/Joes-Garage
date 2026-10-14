import { site, groupedHours, mapsDirectionsUrl } from "@/lib/site-config";
import { Magnetic } from "@/components/site/fx/Magnetic";
import { Wordmark } from "@/components/site/brand/Wordmark";

/** The hero's text column (server-rendered; HeroIgnition animates it). */
export function HeroCopy() {
  const weekday = groupedHours().find((h) => h.hours !== "Closed");
  return (
    <>
      <p
        data-fx="in"
        data-scramble
        className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#ff3b3f] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#ff3b3f] before:shadow-[0_0_10px_#ff3b3f] before:content-['']"
      >
        ASE Master Certified · {site.address.city}, MT
      </p>

      <h1 data-fx="in" className="max-w-[640px]">
        <span className="sr-only">
          {site.name} — auto repair in {site.address.city}, Montana. Call {site.phone}.
        </span>
        <Wordmark className="h-auto w-full drop-shadow-[0_10px_40px_rgba(227,18,27,0.35)]" />
      </h1>

      <p data-fx="in" data-tagline className="mega mt-6 text-[clamp(1.6rem,3.4vw,2.6rem)] [perspective:600px]">
        <span data-split className="text-chrome">
          Honest wrenches.
        </span>{" "}
        <span data-split className="text-red">
          Serious spark.
        </span>
      </p>

      <p data-fx="in" className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">
        General auto repair on {site.address.street}, {site.address.city}. Bring us the noise, the
        warning light, the no-start — we&apos;ll find the real cause and tell you straight what it needs.
      </p>

      <div data-fx="in" className="mt-9 flex flex-wrap gap-3">
        <Magnetic>
          <a href={`tel:${site.phoneHref}`} className="btn-ignite text-base">
            <PhoneIcon />
            Call {site.phone}
          </a>
        </Magnetic>
        <Magnetic>
          <a href={mapsDirectionsUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost-ign text-base">
            Get directions
          </a>
        </Magnetic>
      </div>

      <dl data-fx="in" className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-6 text-sm">
        {weekday && (
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">Hours</dt>
            <dd className="mt-1 font-semibold text-white/80">
              {weekday.days} · {weekday.hours}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">Shop</dt>
          <dd className="mt-1 font-semibold text-white/80">
            {site.address.street}, {site.address.city}
          </dd>
        </div>
      </dl>
    </>
  );
}

export function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"
      />
    </svg>
  );
}
