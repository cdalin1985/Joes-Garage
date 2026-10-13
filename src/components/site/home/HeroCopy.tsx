import { site, groupedHours, mapsDirectionsUrl } from "@/lib/site-config";
import { Magnetic } from "@/components/site/fx/Magnetic";

/** The hero's text column (server-rendered; HeroIgnition animates it). */
export function HeroCopy() {
  const weekday = groupedHours().find((h) => h.hours !== "Closed");
  return (
    <>
      <p
        data-fx="in"
        data-scramble
        className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.28em] text-[#ffb02e] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#ffb02e] before:shadow-[0_0_10px_#ffb02e] before:content-['']"
      >
        {site.name} · {site.address.city}, {site.address.state}
      </p>

      <h1 data-fx="in" className="mega text-[clamp(3.2rem,7.2vw,6.6rem)] [perspective:600px]">
        <span data-split className="block text-chrome">
          Honest
        </span>
        <span data-split className="block text-chrome">
          wrenches.
        </span>
        <span data-split className="block text-fire">
          Serious
        </span>
        <span data-split className="block text-fire">
          spark.
        </span>
        <span className="mt-5 block font-sans text-base font-semibold normal-case tracking-normal text-white/55 sm:text-lg">
          Auto repair in {site.address.city}, Montana
        </span>
      </h1>

      <p data-fx="in" className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
        General auto repair on {site.address.street}. Bring us the noise, the warning light, the
        no-start — we&apos;ll find the real cause and tell you straight what it needs.
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
