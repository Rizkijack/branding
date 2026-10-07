/**
 * ============================================================================
 * SITE CONFIG — URLs, navigation and SEO defaults.
 * ============================================================================
 * After deploying, set NEXT_PUBLIC_SITE_URL in your Vercel env vars to your real
 * domain so sitemap.xml, canonical URLs and OG tags are absolute.
 */

import type { Metadata } from "next";

import { contact, profile } from "@/data/profile";

/**
 * Absolute base URL, no trailing slash.
 * Falls back to a localhost origin during local dev / static analysis.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/** Builds an absolute URL for a path ("/about" → "https://site/about"). */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** One entry per navbar link. `href` doubles as the active-match key. */
export interface NavItem {
  readonly label: string;
  readonly href: string;
}

export const navItems: readonly NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Blog", href: "/blog" },
  { label: "Socials", href: "/socials" },
  { label: "Contact", href: "/contact" },
];

/** Footer link groups. Reuses navItems so the two can never drift apart. */
export const footerNav: readonly {
  heading: string;
  links: readonly NavItem[];
}[] = [
  {
    heading: "Explore",
    links: navItems.filter((i) => i.href !== "/"),
  },
  {
    heading: "Start here",
    links: [
      { label: "Home", href: "/" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

/**
 * Metadata factory — every page calls this so titles, canonicals and social
 * cards stay consistent. Spread the result into `export const metadata`.
 *
 * @param title    Page title WITHOUT the site suffix.
 * @param description Meta description; auto-truncated by `toMetaDescription`.
 */
export function buildMetadata({
  title,
  description = profile.shortBio,
  path = "/",
  keywords = [],
}: {
  title: string;
  description?: string;
  path?: string;
  keywords?: readonly string[];
}): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: [...keywords],
    openGraph: {
      type: "website",
      url,
      siteName: `${profile.name} — ${profile.tagline[0]}`,
      title: `${title} · ${profile.name}`,
      description,
      locale: "en_US",
      // No remote images are used anywhere on this site (all art is inline SVG),
      // so OG falls back to the local /opengraph-image asset.
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${profile.name}`,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

/** Friendly hint shown under the contact form. */
export const contactReplyWindow = "Usually within 48 hours";
export { contact };
