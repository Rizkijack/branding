import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

/**
 * ============================================================================
 * ROBOTS — /robots.txt
 * ============================================================================
 * Points crawlers at the sitemap and keeps them out of the API surface.
 *
 * `SITE_URL` comes from `NEXT_PUBLIC_SITE_URL`, so this is correct in
 * production without editing the file — see `.env.example`.
 */

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The contact endpoint is not content; there is nothing to index.
        disallow: ["/api/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
