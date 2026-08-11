import type { Metadata } from "next";
import {
  site,
  faqs,
  groupedHours,
  fullAddress,
  mapsDirectionsUrl,
} from "@/lib/site-config";
import { BreadcrumbSchema, FaqSchema } from "@/components/site/JsonLd";
import { ClosingCta, Eyebrow, FaqList, PageHero } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Contact, Hours & Directions",
  description: `Find ${site.name} at ${fullAddress}. Call ${site.phone} for an appointment, an estimate, or a second opinion. Hours, directions, and answers to common questions.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const hours = groupedHours();
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    `${site.name}, ${fullAddress}`,
  )}&output=embed`;

  return (
    <>
      <BreadcrumbSchema
        trail={[
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ]}
      />
      <FaqSchema />

      <PageHero
        eyebrow="Contact"
        title="Come see us, or just call"
        lede="The fastest way to get an answer is the phone. Tell us what the car is doing and we'll tell you what it likely needs and when we can look at it."
      />

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Contact details */}
          <div>
            <Eyebrow>Get in touch</Eyebrow>

            <a
              href={`tel:${site.phoneHref}`}
              className="block rounded-2xl border-2 border-accent-400 bg-accent-50 p-6 transition hover:bg-accent-100"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-700">
                Call the shop
              </p>
              <p className="mt-1 font-display text-3xl font-extrabold text-slate-900">
                {site.phone}
              </p>
              <p className="mt-1 text-sm text-slate-600">Tap to call from your phone</p>
            </a>

            <div className="mt-5 space-y-5 rounded-2xl border border-slate-200 p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Address</p>
                <address className="mt-1 not-italic leading-relaxed text-slate-800">
                  {site.address.street}
                  <br />
                  {site.address.city}, {site.address.state} {site.address.zip}
                </address>
                <a
                  href={mapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-semibold text-brand-600 hover:underline"
                >
                  Get directions →
                </a>
              </div>

              {site.email && (
                <div className="border-t border-slate-100 pt-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Email</p>
                  <a
                    href={`mailto:${site.email}`}
                    className="mt-1 block font-medium text-brand-600 hover:underline"
                  >
                    {site.email}
                  </a>
                  <p className="mt-1 text-sm text-slate-500">
                    Best for estimates, records, and fleet accounts. For anything urgent, please
                    call.
                  </p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  We accept
                </p>
                <p className="mt-1 text-slate-700">{site.payments.join(" · ")}</p>
              </div>
            </div>
          </div>

          {/* Hours + map */}
          <div>
            <Eyebrow>Hours &amp; location</Eyebrow>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <tbody>
                  {site.hours.map((h) => (
                    <tr key={h.day} className="border-b border-slate-100 last:border-0">
                      <td className="px-5 py-3 font-semibold text-slate-800">{h.day}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                        {h.closed ? (
                          <span className="text-slate-400">Closed</span>
                        ) : (
                          `${h.open} – ${h.close}`
                            .replace(/(\d{2}):(\d{2})/g, (_, hh, mm) => {
                              const H = Number(hh);
                              const ampm = H >= 12 ? "PM" : "AM";
                              const hr = H % 12 === 0 ? 12 : H % 12;
                              return `${hr}:${mm} ${ampm}`;
                            })
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-relaxed text-slate-600">
                Closed on major holidays. Broken down outside of hours? Leave a message — we check
                them first thing.
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <iframe
                src={mapSrc}
                title={`Map to ${site.name}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[320px] w-full border-0"
                allowFullScreen
              />
            </div>

            <p className="mt-3 text-sm text-slate-500">
              Serving {site.serviceArea.join(", ")} and nearby communities.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-4xl px-5">
          <Eyebrow>Good to know</Eyebrow>
          <h2 className="mb-8 text-3xl font-extrabold leading-tight text-slate-900">
            Before your visit
          </h2>
          <FaqList items={faqs} />
        </div>
      </section>

      <ClosingCta />
    </>
  );
}
