import { site, services, faqs, fullAddress } from "@/lib/site-config";

/**
 * Structured data (schema.org JSON-LD).
 *
 * This is the machine-readable version of the page — it's how Google learns
 * the shop's address, phone, hours, and services well enough to show them
 * directly in search results and on Maps. It is invisible to visitors.
 */

function Script({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Content is built from our own config, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const DAY_URL: Record<string, string> = {
  Monday: "https://schema.org/Monday",
  Tuesday: "https://schema.org/Tuesday",
  Wednesday: "https://schema.org/Wednesday",
  Thursday: "https://schema.org/Thursday",
  Friday: "https://schema.org/Friday",
  Saturday: "https://schema.org/Saturday",
  Sunday: "https://schema.org/Sunday",
};

/** Stable identifier so every page's data refers to the same one business. */
export const BUSINESS_ID = `${site.url}/#business`;

export function localBusinessSchema() {
  const sameAs = Object.values(site.profiles).filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    "@id": BUSINESS_ID,
    name: site.name,
    legalName: site.legalName,
    description: site.shortDescription,
    url: site.url,
    telephone: site.phone,
    email: site.email,
    image: `${site.url}/opengraph-image`,
    logo: `${site.url}/icon`,
    priceRange: "$$",
    currenciesAccepted: "USD",
    paymentAccepted: site.payments.join(", "),
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.state,
      // Omitted rather than sent empty until the real ZIP is confirmed.
      ...(site.address.zip ? { postalCode: site.address.zip } : {}),
      addressCountry: site.address.country,
    },
    ...(site.geo.lat != null && site.geo.lng != null
      ? { geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng } }
      : {}),
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${site.name}, ${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip}`,
    )}`,
    areaServed: site.serviceArea.map((city) => ({
      "@type": "City",
      name: city,
    })),
    openingHoursSpecification: site.hours
      .filter((h) => !h.closed)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: DAY_URL[h.day],
        opens: h.open,
        closes: h.close,
      })),
    ...(sameAs.length ? { sameAs } : {}),
    /** Technician certifications — a real trust signal, and a term people search. */
    ...(site.certifications.length
      ? {
          hasCredential: site.certifications.map((c) => ({
            "@type": "EducationalOccupationalCredential",
            credentialCategory: "certification",
            name: c,
          })),
          knowsAbout: [...site.certifications, ...services.map((s) => s.name)],
        }
      : {}),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Auto repair services",
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: s.name,
          description: s.blurb,
          url: `${site.url}/services/${s.slug}`,
        },
      })),
    },
  };
}

/** Site-wide business + website data. Rendered once, in the site layout. */
export function SiteSchema() {
  return (
    <>
      <Script data={localBusinessSchema()} />
      <Script
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": `${site.url}/#website`,
          url: site.url,
          name: site.name,
          publisher: { "@id": BUSINESS_ID },
        }}
      />
    </>
  );
}

/** Questions and answers — these can appear as expandable results in Google. */
export function FaqSchema({ items = faqs }: { items?: { q: string; a: string }[] }) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }}
    />
  );
}

/** One service, offered by this business, in this town. */
export function ServiceSchema({
  name,
  description,
  slug,
}: {
  name: string;
  description: string;
  slug: string;
}) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "Service",
        name,
        description,
        serviceType: name,
        url: `${site.url}/services/${slug}`,
        provider: { "@id": BUSINESS_ID },
        areaServed: site.serviceArea.map((city) => ({ "@type": "City", name: city })),
        availableChannel: {
          "@type": "ServiceChannel",
          servicePhone: site.phone,
          serviceLocation: {
            "@type": "AutoRepair",
            name: site.name,
            address: fullAddress,
          },
        },
      }}
    />
  );
}

/** The "Home › Services › Brake Repair" trail Google shows under a result. */
export function BreadcrumbSchema({ trail }: { trail: { name: string; path: string }[] }) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: trail.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.name,
          item: `${site.url}${t.path}`,
        })),
      }}
    />
  );
}
