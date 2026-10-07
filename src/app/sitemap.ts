import type { MetadataRoute } from "next";

import { getAllPosts } from "@/lib/blog";
import { absoluteUrl, navItems } from "@/lib/site";

/**
 * ============================================================================
 * SITEMAP — /sitemap.xml
 * ============================================================================
 * Built at build time from the same sources the navigation uses, so adding a
 * route means editing `navItems` (and, for blog posts, dropping a file in
 * `src/content/blog`) rather than remembering to update a list here.
 *
 * IMPORTANT: every <loc> must be an ABSOLUTE url. Next does not resolve
 * relative paths for you — passing "/about" emits `<loc>/about</loc>`, which
 * crawlers reject. Hence `absoluteUrl()` on every entry.
 *
 * Blog entries carry `lastModified` from their frontmatter date. Drafts never
 * appear — `getAllPosts()` excludes them.
 */

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages. `navItems` already lists every top-level route.
  const staticRoutes: MetadataRoute.Sitemap = navItems.map((item) => ({
    url: absoluteUrl(item.href),
    // The home page should not compete with the rest for crawl priority.
    changeFrequency: item.href === "/" ? "weekly" : "monthly",
    priority: item.href === "/" ? 1 : 0.8,
    lastModified: now,
  }));

  // Blog index is already covered by navItems; add each post detail page.
  const postRoutes: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.date),
    changeFrequency: "yearly",
    // Individual posts rank below the section pages.
    priority: 0.6,
  }));

  return [...staticRoutes, ...postRoutes];
}
