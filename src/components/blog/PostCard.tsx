/**
 * ============================================================================
 * POST CARD
 * One post in an index grid, or the featured slot at the top of /blog.
 *
 * Server-safe: no state, no hooks. It renders `Reveal` (a client component) as
 * a wrapper, which is fine — server components may render client components.
 *
 * Link pattern: one stretched link covers the whole card via
 * `after:absolute after:inset-0`, so the card is a single tab stop and a single
 * target. Tags stay decorative (plain spans) so they never steal the click.
 * ============================================================================
 */

import Link from "next/link";

import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  ClockIcon,
} from "@/components/icons/InlineIcons";
import { Reveal } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Eyebrow } from "@/components/ui/Typography";
import type { PostMeta } from "@/lib/blog";
import { accentFor, cn, formatDateShort } from "@/lib/utils";

/**
 * Stable per-post index so a post keeps the same accent colour regardless of
 * where it lands in the grid (newest-first ordering changes).
 */
function accentForSlug(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash + slug.charCodeAt(i)) % 997;
  }
  return accentFor(hash);
}

export interface PostCardProps {
  post: PostMeta;
  /** Larger treatment: bigger title, gradient title, wider padding, spans 2 cols. */
  featured?: boolean;
  /** Seconds of delay before the reveal animation fires. */
  delay?: number;
}

export function PostCard({ post, featured = false, delay = 0 }: PostCardProps) {
  const href = `/blog/${post.slug}`;

  return (
    <Reveal
      as="article"
      delay={delay}
      className={cn("group", featured && "sm:col-span-2 lg:col-span-2")}
    >
      <Card
        interactive
        padding={featured ? "lg" : "md"}
        accent={accentForSlug(post.slug)}
        className="h-full"
        // `static` drops Card's default `relative` on the inner wrapper so the
        // stretched link resolves against the Card root — the full card,
        // padding included, is the hit area. `h-full` keeps equal-height cards.
        innerClassName="static h-full"
      >
        <div className="flex h-full flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow>{formatDateShort(post.date)}</Eyebrow>
            <span className="inline-flex items-center gap-1.5 text-[0.74rem] text-fg-subtle">
              <ClockIcon />
              {post.readingTime} min read
            </span>
          </div>

          <h3
            className={cn(
              "leading-[1.15] font-bold text-balance",
              featured
                ? "text-[clamp(1.6rem,1.2rem+1.6vw,2.4rem)]"
                : "text-[1.32rem]",
            )}
          >
            {/* The stretched pseudo-element makes the whole card clickable; the
                accessible name of the card is this link's text. */}
            <Link
              href={href}
              className={cn(
                "transition-colors after:absolute after:inset-0 after:content-['']",
                featured ? "text-gradient" : "hover:text-gradient",
              )}
            >
              {post.title}
            </Link>
          </h3>

          <p
            className={cn(
              "grow text-[0.95rem] leading-relaxed text-fg-muted",
              featured && "sm:max-w-2xl sm:text-[1.02rem]",
            )}
          >
            {post.description}
          </p>

          <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
            {/* z-1 keeps the chips above the stretched link layer so their
                borders stay crisp on hover. */}
            <ul className="relative z-1 flex flex-wrap gap-2" aria-label="Tags">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <Tag size="sm">{tag}</Tag>
                </li>
              ))}
            </ul>

            <span
              aria-hidden="true"
              className={cn(
                "relative z-1 inline-flex items-center gap-1.5 font-semibold text-brand-purple",
                featured ? "text-[0.9rem]" : "text-[0.82rem]",
              )}
            >
              Read post
              {featured ? (
                <ArrowUpRightIcon className="text-[1.05em]" />
              ) : (
                <ArrowRightIcon className="text-[1.05em] transition-transform duration-300 group-hover:translate-x-1" />
              )}
            </span>
          </div>
        </div>
      </Card>
    </Reveal>
  );
}
