import { site, groupedHours, mapsDirectionsUrl } from "@/lib/site-config";
import { ScrollReveal } from "@/components/site/fx/ScrollReveal";
import { NeonSign } from "@/components/site/fx/NeonSign";
import { WheelBearing } from "@/components/site/fx/WheelBearing";
import { Magnetic } from "@/components/site/fx/Magnetic";
import { SectionEyebrow } from "./SectionEyebrow";
import { PhoneIcon } from "./HeroCopy";

/** Joe's own shop tip beside a live neon OPEN sign and the shop's details. */
export function TipAndHours() {
  const hours = groupedHours();
  return (
    <section className="relative overflow-hidden bg-[#0a0908] py-28 text-white">
      <ScrollReveal className="mx-auto grid max-w-7xl gap-6 px-5 lg:grid-cols-2">
        {/* Shop tip, quoted from the shop's Facebook page */}
        <figure
          data-reveal
          className="relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-8 sm:p-10"
        >
          <WheelBearing className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 opacity-80 sm:h-64 sm:w-64" />
          <SectionEyebrow>Straight from Joe</SectionEyebrow>
          <p className="mega max-w-[12ch] text-5xl text-white sm:text-6xl">{site.shopTip.title}</p>
          <blockquote className="relative mt-8 flex-1 border-l-2 border-[#ffb02e] pl-5 text-lg leading-relaxed text-white/75 sm:text-xl">
            &ldquo;{site.shopTip.quote}&rdquo;
          </blockquote>
          <figcaption className="mt-8 text-sm text-white/55">
            — {site.name}
            {site.profiles.facebook && (
              <>
                {" on "}
                <a
                  href={site.profiles.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#7fdcff] underline-offset-4 hover:underline"
                >
                  Facebook
                </a>
              </>
            )}
          </figcaption>
        </figure>

        {/* Live sign + where/when */}
        <div
          data-reveal
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#12100e] p-8 sm:p-10"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(500px_300px_at_20%_10%,rgba(255,59,47,0.12),transparent_70%)]" />
          <div className="relative">
            <NeonSign hours={[...site.hours]} timeZone={site.timeZone} />

            <table className="mt-8 w-full text-sm">
              <tbody>
                {hours.map((h) => (
                  <tr key={h.days} className="border-b border-white/[0.07] last:border-0">
                    <td className="py-2.5 font-semibold text-white">{h.days}</td>
                    <td className="py-2.5 text-right tabular-nums text-white/60">{h.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <address className="mt-8 not-italic">
              <p className="mega text-4xl text-white">{site.address.street}</p>
              <p className="mt-1 text-white/55">
                {site.address.city}, {site.address.state} {site.address.zip}
              </p>
              {site.email && (
                <a href={`mailto:${site.email}`} className="mt-3 inline-block text-sm text-[#7fdcff] hover:underline">
                  {site.email}
                </a>
              )}
            </address>

            <div className="mt-8 flex flex-wrap gap-3">
              <Magnetic>
                <a href={mapsDirectionsUrl} target="_blank" rel="noopener noreferrer" className="btn-ignite">
                  Get directions
                </a>
              </Magnetic>
              <Magnetic>
                <a href={`tel:${site.phoneHref}`} className="btn-ghost-ign">
                  <PhoneIcon /> {site.phone}
                </a>
              </Magnetic>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
