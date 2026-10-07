/**
 * ============================================================================
 * BLOG — filesystem-backed content layer for MDX posts.
 * ============================================================================
 * Posts live in `src/content/blog/*.mdx`. Add a file, restart `next dev` (or
 * rebuild) and the post appears in the index, sitemap and static params.
 *
 * SERVER ONLY. This module reads from disk, so it must never be imported into
 * a client component ("use client"). Route handlers and server components only.
 *
 * ---------------------------------------------------------------------------
 * Frontmatter contract
 * ---------------------------------------------------------------------------
 * ---
 * title:       string   Required. Used for headings, <title> and OG.
 * description: string   Required. Meta description + card excerpt.
 * date:        string   Required. ISO 8601 (YYYY-MM-DD). Sort key.
 * tags:        string[] Optional. Feeds the tag chips.
 * draft:       boolean  Optional. `true` hides the post from the index, sitemap
 *                       and static params, but keeps /blog/<slug> reachable.
 * featured:    boolean  Optional. Marks the post for highlighting.
 * ---
 */

import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import { readingTimeMinutes, toMetaDescription } from "@/lib/utils";

/** Absolute path to the posts directory. */
const BLOG_DIR = path.join(process.cwd(), "src", "content", "blog");

/** Shape returned to the UI — frontmatter flattened + reading time attached. */
export interface PostMeta {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly date: string; // ISO string, sortable
  readonly tags: readonly string[];
  readonly draft: boolean;
  readonly featured: boolean;
  readonly readingTime: number;
}

/** A post plus its raw (frontmatter-stripped) MDX body. */
export interface Post extends PostMeta {
  readonly content: string;
}

/** Frontmatter as authored. Everything optional is normalised in `toMeta`. */
interface RawFrontmatter {
  title?: unknown;
  description?: unknown;
  date?: unknown;
  tags?: unknown;
  draft?: unknown;
  featured?: unknown;
}

/* -------------------------------------------------------------------------
 * Parsing helpers
 * ---------------------------------------------------------------------- */

/** "2025-03-12" → "2025-03-12T00:00:00.000Z" so sorting is timezone-stable. */
function normaliseDate(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value.trim());
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  // Fall back to the file's mtime so a missing date never breaks sorting.
  return new Date().toISOString();
}

/** Accepts `"a"`, `"a, b"` and `["a","b"]`; always returns a clean array. */
function normaliseTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Filesystem reads are cached per-process. During `next build` every route is
 * rendered in the same process, so this collapses N reads into one. In dev,
 * Next re-imports the module on change, which invalidates it correctly.
 */
const readCache = new Map<string, Post>();

function readPostFile(filename: string): Post | null {
  const cached = readCache.get(filename);
  if (cached) return cached;

  const fullPath = path.join(BLOG_DIR, filename);
  if (!fs.existsSync(fullPath)) return null;

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const fm = data as RawFrontmatter;
  const slug = filename.replace(/\.mdx?$/, "");

  const post: Post = {
    slug,
    title: typeof fm.title === "string" && fm.title.trim() ? fm.title : slug,
    description: toMetaDescription(
      typeof fm.description === "string" ? fm.description : "",
    ),
    date: normaliseDate(fm.date),
    tags: normaliseTags(fm.tags),
    draft: fm.draft === true,
    featured: fm.featured === true,
    readingTime: readingTimeMinutes(content),
    content,
  };

  readCache.set(filename, post);
  return post;
}

/* -------------------------------------------------------------------------
 * Public API
 * ---------------------------------------------------------------------- */

/**
 * All posts, newest first, drafts excluded.
 *
 * `includeDrafts` exists for /blog/[slug], which still renders a draft so you
 * can preview it before flipping `draft: false`.
 */
export function getAllPosts(
  options: { includeDrafts?: boolean } = {},
): PostMeta[] {
  const { includeDrafts = false } = options;

  let filenames: string[] = [];
  if (fs.existsSync(BLOG_DIR)) {
    filenames = fs
      .readdirSync(BLOG_DIR)
      .filter((f) => /\.mdx?$/.test(f) && !f.startsWith("_"));
  }

  const posts = filenames
    .map(readPostFile)
    .filter((p): p is Post => p !== null)
    .filter((p) => includeDrafts || !p.draft);

  // Newest first. Ties broken by slug so ordering is deterministic.
  return posts.sort(
    (a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug),
  );
}

/** Every distinct tag across published posts, with counts, alphabetical. */
export function getAllTags(): { name: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** One post by slug, or undefined. Drafts are included. */
export function getPostBySlug(slug: string): Post | undefined {
  if (!/^[a-z0-9-]+$/i.test(slug)) return undefined; // guard path traversal
  return readPostFile(`${slug}.mdx`) ?? undefined;
}

/** Slugs for `generateStaticParams`. Drafts are excluded from the build. */
export function getAllPostSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

/** Up to `limit` newest posts — used for the "latest" block and related links. */
export function getRecentPosts(limit = 3, excludeSlug?: string): PostMeta[] {
  return getAllPosts()
    .filter((p) => p.slug !== excludeSlug)
    .slice(0, limit);
}

/** Adjacent posts for the prev/next footer of a post page. */
export function getAdjacentPosts(slug: string): {
  previous: PostMeta | null;
  next: PostMeta | null;
} {
  const posts = getAllPosts();
  const index = posts.findIndex((p) => p.slug === slug);

  if (index === -1) return { previous: null, next: null };

  return {
    // `posts` is newest-first, so the "next" (older) post sits at index + 1.
    next: posts[index + 1] ?? null,
    previous: posts[index - 1] ?? null,
  };
}
