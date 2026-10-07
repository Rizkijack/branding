"use client";

/**
 * ============================================================================
 * POST INDEX — the filterable post list on /blog.
 *
 * Client component on purpose. The tag filter is pure UI state: no route
 * change, no server round-trip, no `useSearchParams` (which would force a
 * <Suspense> boundary on the whole page for no benefit). Data arrives as
 * props from the server page, so nothing server-only is imported here.
 *
 * Animation: `layout` on each row + `AnimatePresence mode="popLayout"` so cards
 * glide to their new grid positions instead of snapping. Both collapse to
 * instant under `prefers-reduced-motion` via framer-motion's built-in
 * handling of the `MotionConfig`/`useReducedMotion` path below.
 * ============================================================================
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";

import { PostCard } from "@/components/blog/PostCard";
import { FilterChip, Tag } from "@/components/ui/Tag";
import type { PostMeta } from "@/lib/blog";
import { cn } from "@/lib/utils";

export interface PostIndexProps {
  posts: PostMeta[];
  /** Distinct tags with counts, straight from `getAllTags()`. */
  tags: ReadonlyArray<{ name: string; count: number }>;
}

export function PostIndex({ posts, tags }: PostIndexProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  const visible = useMemo(
    () =>
      activeTag ? posts.filter((post) => post.tags.includes(activeTag)) : posts,
    [activeTag, posts],
  );

  // With no filter, the newest post gets the featured treatment. Filtering
  // flattens the layout so the grid stays predictable.
  const featuredSlug = activeTag ? null : (visible[0]?.slug ?? null);

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <div
          role="group"
          aria-label="Filter posts by tag"
          className="flex flex-wrap items-center gap-2"
        >
          <FilterChip
            active={activeTag === null}
            onClick={() => setActiveTag(null)}
          >
            All
          </FilterChip>
          {tags.map((tag) => (
            <FilterChip
              key={tag.name}
              active={activeTag === tag.name}
              count={tag.count}
              onClick={() =>
                // Tapping the active chip clears the filter.
                setActiveTag((current) =>
                  current === tag.name ? null : tag.name,
                )
              }
            >
              {tag.name}
            </FilterChip>
          ))}
        </div>

        {/* Result count, announced politely so the filter is not silent. */}
        <p aria-live="polite" className="text-[0.82rem] text-fg-subtle">
          {visible.length} {visible.length === 1 ? "post" : "posts"}
          {activeTag ? (
            <>
              {" "}
              tagged <span className="text-fg-muted">{activeTag}</span>
            </>
          ) : (
            " — newest first"
          )}
        </p>
      </div>

      {visible.length === 0 ? (
        <div
          className={cn(
            "flex flex-col items-center gap-4 rounded-card border border-line/70",
            "bg-surface-2/40 px-6 py-16 text-center",
          )}
        >
          <Tag variant="accent" size="md">
            {activeTag ?? "No posts"}
          </Tag>
          <p className="max-w-md text-[0.95rem] text-fg-muted">
            Nothing published under this tag yet. Try another one, or{" "}
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className="font-semibold text-brand-purple underline decoration-brand-purple/40 underline-offset-4 hover:decoration-brand-purple"
            >
              clear the filter
            </button>
            .
          </p>
        </div>
      ) : (
        <motion.div
          layout={!reduceMotion}
          transition={transition}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((post, index) => (
              <motion.div
                key={post.slug}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.97 }}
                transition={transition}
              >
                <PostCard
                  post={post}
                  featured={post.slug === featuredSlug}
                  delay={Math.min(index, 5) * 0.06}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
