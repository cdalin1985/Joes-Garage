import type { Metadata } from "next";
import { Big_Shoulders_Display, Kanit, Plus_Jakarta_Sans, Space_Grotesk, Tangerine } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site-config";

/**
 * Fonts are downloaded at build time and served from this site (next/font):
 * no render-blocking request to Google Fonts, and size-matched fallbacks keep
 * text from jumping when they arrive. Each exposes a CSS variable that
 * globals.css maps onto --font-sans / --font-display / --font-script /
 * --font-mega. Kanit is only drawn on the 3D plug's canvas label, so it isn't
 * preloaded (see fx/kanit.ts).
 */
const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--nf-sans", display: "swap" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--nf-display", display: "swap" });
const mega = Big_Shoulders_Display({ subsets: ["latin"], variable: "--nf-mega", display: "swap" });
const script = Tangerine({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--nf-script",
  display: "swap",
  preload: false,
});
const kanit = Kanit({
  subsets: ["latin"],
  weight: ["800", "900"],
  style: ["italic"],
  variable: "--nf-kanit",
  display: "swap",
  preload: false,
});
const fontVars = [sans, display, mega, script, kanit].map((f) => f.variable).join(" ");

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
  // No site-wide canonical: each public page sets its own. Inherited here, it
  // told Google that any page without one (e.g. /requests) was the home page.
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
  /**
   * Ownership tags for Google Search Console and Bing Webmaster Tools. Each
   * tool gives a token when the site is added; put it in the Vercel env var
   * and redeploy. Unset vars add nothing.
   */
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.BING_SITE_VERIFICATION
      ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } }
      : {}),
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
    <html lang="en" className={fontVars} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#14110e" />
      </head>
      <body>{children}</body>
    </html>
  );
}
