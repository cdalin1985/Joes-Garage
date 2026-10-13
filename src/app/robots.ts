import type { MetadataRoute } from "next";
import { site } from "@/lib/site-config";

/**
 * Served automatically at /robots.txt.
 *
 * Search engines are welcome on the public marketing pages and are kept out
 * of the staff application — customer records, invoices, and accounting must
 * never end up in search results. (They're already behind a login; this is
 * the belt-and-braces layer.)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/login",
          "/setup",
          "/dashboard",
          "/customers",
          "/vehicles",
          "/estimates",
          "/invoices",
          "/work-orders",
          "/parts",
          "/appointments",
          "/follow-ups",
          "/labor-presets",
          "/accounting",
          "/settings",
          "/staff",
          "/inspect/",
        ],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
