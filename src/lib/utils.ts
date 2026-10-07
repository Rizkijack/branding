import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names, resolving conflicts so the *last* utility wins.
 *
 * `clsx` handles conditionals/arrays/objects; `tailwind-merge` understands that
 * `px-4` and `px-8` are the same property and should not both survive.
 *
 * @example cn("px-2 py-1", isLarge && "px-8")
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Turn "some-slug" or "some slug" into "Some Slug" for headings and titles.
 */
export function titleCase(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Stable, readable accent gradient per index — used by cards that have no
 * explicit `accent` colour so a grid never looks monochrome.
 */
const ACCENTS = [
  "#8a5cf6",
  "#627eea",
  "#f472b6",
  "#ff9f5a",
  "#16a6a1",
  "#c084fc",
] as const;

export function accentFor(index: number): string {
  return ACCENTS[index % ACCENTS.length];
}

/**
 * Estimate reading time for a post.
 *
 * Deliberately naive: 225 wpm for prose, but CJK runs count as characters so
 * mixed-language posts don't report "1 min". Falls back to 1 so nothing ever
 * renders "0 min read".
 */
export function readingTimeMinutes(source: string): number {
  // Strip fenced code blocks, MDX imports/exports and JSX-ish tags first —
  // they inflate the count and aren't read as prose.
  const cleaned = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^import\s.+?$/gm, " ")
    .replace(/^export\s+.+?$/gm, " ")
    .replace(/<\/?[A-Za-z][^>]*>/g, " ");

  const words = cleaned.match(/[A-Za-z0-9][A-Za-z0-9'-]*/g)?.length ?? 0;
  const cjk =
    cleaned.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/g)?.length ?? 0;

  const minutes = words / 225 + cjk / 400;
  return Math.max(1, Math.round(minutes));
}

/**
 * Extract the first sentence-ish chunk, used for meta descriptions.
 * Collapses newlines so the string is safe inside <meta content="…">.
 */
export function toMetaDescription(text: string, max = 158): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;

  // Prefer cutting at a sentence boundary before falling back to a word cut.
  const slice = flat.slice(0, max);
  const boundary = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "));
  if (boundary > max * 0.55) return slice.slice(0, boundary + 1);

  const lastSpace = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > 0 ? lastSpace : max).trimEnd()}…`;
}

/** Format an ISO date string as e.g. "12 March 2025". Server-safe (fixed locale). */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Short form for dense UI: "12 Mar 2025". */
export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Only external links get target=_blank + noopener. Same-origin links don't. */
export function isExternal(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
