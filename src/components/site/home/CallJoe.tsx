import { site } from "@/lib/site-config";
import { ScrollReveal } from "@/components/site/fx/ScrollReveal";
import { Tachometer } from "@/components/site/fx/Tachometer";
import { Magnetic } from "@/components/site/fx/Magnetic";
import { PhoneIcon } from "./HeroCopy";

/** Closing band: a tach that revs, and the one thing to do next. */
export function CallJoe() {
  return (
    <section className="relative overflow-hidden bg-[#0a0908] py-28 text-white">
      <div className="ign-floor opacity-60" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-[#ff6a1a]/15 blur-3xl" />
      <ScrollReveal className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[0.75fr_1.25fr]">
        <div data-reveal className="mx-auto w-full max-w-[18rem] lg:max-w-none">
          <Tachometer className="w-full drop-shadow-[0_0_40px_rgba(255,106,26,0.35)]" />
        </div>
        <div data-rev className="text-center lg:text-left">
          <h2 data-reveal className="mega text-[clamp(3rem,8vw,7rem)]">
            <span className="block text-chrome">Hear a noise?</span>
            <span className="block text-fire">Call Joe.</span>
          </h2>
          <p data-reveal className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-white/65 lg:mx-0">
            Tell us what it&apos;s doing. We&apos;ll tell you what it needs — and what it costs —
            before we touch it.
          </p>
          <div data-reveal className="mt-9">
            <Magnetic strength={0.25}>
              <a href={`tel:${site.phoneHref}`} className="btn-ignite !rounded-2xl !px-8 !py-5 text-xl sm:text-2xl">
                <PhoneIcon />
                {site.phone}
              </a>
            </Magnetic>
          </div>
          <p data-reveal className="mt-6 text-sm text-white/50">
            {site.address.street}, {site.address.city}, {site.address.state}
          </p>
        </div>
      </ScrollReveal>
    </section>
  );
}
