import Link from "next/link";
import { site, services, groupedHours, fullAddress, mapsDirectionsUrl } from "@/lib/site-config";
import { BrandMark } from "./BrandMark";

export function SiteFooter() {
  const hours = groupedHours();
  const profiles = Object.entries(site.profiles).filter(([, url]) => url);

  return (
    <footer className="border-t border-white/[0.07] bg-[#070605] text-slate-400">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-4">
        {/* Name, address, phone — the exact block Google cross-checks. */}
        <div className="md:col-span-2">
          <BrandMark size="lg" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">{site.tagline}.</p>

          <address className="mt-5 space-y-1 text-sm not-italic">
            <p className="text-slate-300">{site.address.street}</p>
            <p className="text-slate-300">
              {site.address.city}, {site.address.state} {site.address.zip}
            </p>
            <p>
              <a href={`tel:${site.phoneHref}`} className="font-semibold text-accent-300 hover:text-accent-200">
                {site.phone}
              </a>
            </p>
            {site.email && (
              <p>
                <a href={`mailto:${site.email}`} className="hover:text-slate-200">
                  {site.email}
                </a>
              </p>
            )}
          </address>

          <a
            href={mapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-accent-300"
          >
            Get directions →
          </a>

          {profiles.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              {profiles.map(([name, url]) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="capitalize text-slate-400 underline-offset-4 hover:text-white hover:underline"
                >
                  {name}
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Services</p>
          <ul className="space-y-1.5 text-sm">
            {services.slice(0, 7).map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="hover:text-white">
                  {s.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/services" className="font-semibold text-accent-300 hover:text-accent-200">
                All services →
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Hours</p>
          <table className="w-full text-sm">
            <tbody>
              {hours.map((h) => (
                <tr key={h.days}>
                  <td className="py-0.5 pr-3 text-slate-300">{h.days}</td>
                  <td className="py-0.5 text-right tabular-nums">{h.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs leading-relaxed">
            Serving {site.serviceArea.slice(0, 4).join(", ")} and the surrounding area.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.legalName} · {fullAddress}
          </p>
          <Link href="/login" className="text-slate-400 hover:text-slate-300">
            Staff sign-in
          </Link>
        </div>
      </div>
    </footer>
  );
}
