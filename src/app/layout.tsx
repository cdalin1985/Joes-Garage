import type { Metadata } from "next";
import "./globals.css";
import { site } from "@/lib/site-config";

export const metadata: Metadata = {
  /** Makes every relative link in metadata (canonicals, images) absolute. */
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Auto Repair in ${site.address.city}, ${site.address.state}`,
    template: `%s | ${site.name}`,
  },
  description: site.shortDescription,
  applicationName: site.name,
  keywords: [
    "auto repair",
    "mechanic",
    "car repair",
    `auto repair ${site.address.city}`,
    `mechanic ${site.address.city} ${site.address.state}`,
    "brake repair",
    "oil change",
    "check engine light",
    "car diagnostics",
  ],
  authors: [{ name: site.name }],
  creator: site.name,
  publisher: site.name,
  formatDetection: { telephone: true, address: true },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — Auto Repair in ${site.address.city}, ${site.address.state}`,
    description: site.shortDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Auto Repair in ${site.address.city}, ${site.address.state}`,
    description: site.shortDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  other: {
    /** Helps mobile browsers and map apps recognize the business details. */
    "business:contact_data:street_address": site.address.street,
    "business:contact_data:locality": site.address.city,
    "business:contact_data:region": site.address.state,
    "business:contact_data:postal_code": site.address.zip,
    "business:contact_data:country_name": site.address.country,
    "business:contact_data:phone_number": site.phone,
    "geo.placename": `${site.address.city}, ${site.address.state}`,
    "geo.region": `${site.address.country}-${site.address.state}`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tangerine:wght@400;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=Big+Shoulders+Display:wght@700;800;900&family=Kanit:ital,wght@1,800;1,900&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#14110e" />
      </head>
      <body>{children}</body>
    </html>
  );
}
