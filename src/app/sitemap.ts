import type { MetadataRoute } from "next";
import { site, services } from "@/lib/site-config";

/**
 * The sitemap is the list of pages you're asking Google to index.
 * It's served automatically at /sitemap.xml — submit that address once in
 * Google Search Console and new service pages get picked up on their own.
 *
 * No lastmod: stamping every page with the build time on each deploy claims
 * everything changed, and Google ignores lastmod values that aren't accurate.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: `${site.url}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/services`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site.url}/contact`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${site.url}/about`, changeFrequency: "yearly", priority: 0.6 },
  ];

  for (const s of services) {
    pages.push({
      url: `${site.url}/services/${s.slug}`,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return pages;
}
