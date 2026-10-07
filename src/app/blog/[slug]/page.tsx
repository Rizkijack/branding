/**
 * ============================================================================
 * /blog/[slug] — a single post.
 *
 * Next 16: `params` is a Promise and must be awaited. Static params come from
 * the content layer, so every post is prerendered at build time.
 *
 * Drafts are rendered here (via `includeDrafts`) so an unpublished post can be
 * previewed at its own URL; they are excluded from the index, sitemap and
 * `generateStaticParams` by `getAllPostSlugs`.
 * ============================================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PostCard } from "@/components/blog/PostCard";
import { MdxContent } from "@/components/blog/MdxContent";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  ClockIcon,
} from "@/components/icons/InlineIcons";
import { MeshBackground } from "@/components/motion/MeshBackground";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import {
  Eyebrow,
  GradientText,
  Lede,
  SectionHeading,
} from "@/components/ui/Typography";
import { profile } from "@/data/profile";
import {
  getAdjacentPosts,
  getAllPostSlugs,
  getPostBySlug,
  getRecentPosts,
  type PostMeta,
} from "@/lib/blog";
import { buildMetadata } from "@/lib/site";
import { cn, formatDate } from "@/lib/utils";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return buildMetadata({ title: "Post not found", path: `/blog/${slug}` });
  }

  const base = buildMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    keywords: post.tags,
  });

  return {
    ...base,
    // A post is an article, not a page — this changes how link unfurls read.
    openGraph: { ...base.openGraph, type: "article" },
  };
}

/* -------------------------------------------------------------------------
 * Header — shared by the page and its loading skeleton shape.
 * ---------------------------------------------------------------------- */

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const { previous, next } = getAdjacentPosts(slug);
  const morePosts = getRecentPosts(3, slug);
  const primaryTag = post.tags[0];

  return (
    <article>
      {/* ----------------------------------------------------------------
          Header
          ---------------------------------------------------------------- */}
      <header className="relative isolate overflow-hidden border-b border-line/70">
        <MeshBackground intensity="soft" count={3} />

        <div className="relative container-page flex flex-col gap-7 py-14 sm:py-20">
          <Link
            href="/blog"
            className="group inline-flex w-fit items-center gap-2 text-[0.85rem] font-medium text-fg-muted transition-colors hover:text-brand-purple"
          >
            <ArrowLeftIcon className="text-[1.1em] transition-transform duration-300 group-hover:-translate-x-1" />
            All posts
          </Link>

          <Reveal>
            <div className="flex flex-col gap-5">
              {primaryTag ? <Eyebrow>{primaryTag}</Eyebrow> : null}

              <h1 className="max-w-4xl text-[clamp(2rem,1.35rem+3.4vw,3.5rem)] leading-[1.06] font-bold">
                <GradientText>{post.title}</GradientText>
              </h1>

              <Lede className="max-w-2xl sm:text-[1.08rem]">
                {post.description}
              </Lede>
            </div>
          </Reveal>

          {/* Meta row: date, reading time, author. */}
          <Reveal delay={0.08}>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line/70 pt-6 text-[0.82rem] text-fg-subtle">
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon />
                {post.readingTime} min read
              </span>

              <time dateTime={post.date}>{formatDate(post.date)}</time>

              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-6 rounded-full"
                  style={{ backgroundImage: "var(--grad-hero)" }}
                />
                <span className="text-fg-muted">
                  {profile.name}
                  <span className="sr-only"> (author)</span>
                </span>
              </span>

              {post.tags.length > 0 ? (
                <ul className="flex flex-wrap gap-2" aria-label="Tags">
                  {post.tags.map((tag) => (
                    <li key={tag}>
                      <Tag size="sm" variant="outline">
                        {tag}
                      </Tag>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </Reveal>
        </div>
      </header>

      {/* ----------------------------------------------------------------
          Body
          ---------------------------------------------------------------- */}
      <div className="container-page py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <MdxContent source={post.content} />

          <div className="mt-16 flex flex-col items-center gap-3 border-t border-line/70 pt-10">
            <p className="text-[0.9rem] text-fg-muted">Thanks for reading.</p>
            <a
              href="#main"
              className="inline-flex items-center gap-2 text-[0.85rem] font-semibold text-brand-purple underline decoration-brand-purple/40 underline-offset-4 transition-colors hover:decoration-brand-purple"
            >
              Back to top
              <ArrowUpRightIcon className="-rotate-45 text-[1.05em]" />
            </a>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------
          Prev / next
          ---------------------------------------------------------------- */}
      {previous || next ? (
        <nav aria-label="Post navigation" className="container-page pb-16">
          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
            {previous ? (
              <AdjacentCard post={previous} direction="previous" />
            ) : (
              <div aria-hidden="true" />
            )}
            {next ? <AdjacentCard post={next} direction="next" /> : null}
          </div>
        </nav>
      ) : null}

      {/* ----------------------------------------------------------------
          More posts
          ---------------------------------------------------------------- */}
      {morePosts.length > 0 ? (
        <section
          aria-labelledby="more-posts-heading"
          className="container-page pb-24 sm:pb-32"
        >
          <div className="mb-10 flex flex-col items-center gap-3">
            <SectionHeading
              eyebrow="Keep reading"
              title="More posts"
              titleNode={
                <>
                  More <span className="text-gradient">posts</span>
                </>
              }
              id="more-posts-heading"
            />
            <p className="max-w-xl text-center text-[0.95rem] text-fg-muted">
              Roughly {morePosts.reduce((total, p) => total + p.readingTime, 0)}{" "}
              minutes of reading, if you have them.
            </p>
          </div>

          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {morePosts.map((related) => (
              <RevealItem key={related.slug}>
                <PostCard post={related} />
              </RevealItem>
            ))}
          </RevealGroup>
        </section>
      ) : null}
    </article>
  );
}

/* -------------------------------------------------------------------------
 * Prev / next card
 * ---------------------------------------------------------------------- */

/**
 * One side of the prev/next footer. Rendered inside a stretched-link Card so
 * the whole tile is one target; `direction` flips the icon and text alignment.
 */
function AdjacentCard({
  post,
  direction,
}: {
  post: PostMeta;
  direction: "previous" | "next";
}) {
  const isPrevious = direction === "previous";

  return (
    <Card
      interactive
      padding="md"
      className={cn(
        "group h-full",
        !isPrevious && "sm:justify-self-end sm:text-right",
      )}
    >
      <div
        className={cn(
          "flex h-full flex-col gap-2",
          !isPrevious && "sm:items-end",
        )}
      >
        <Eyebrow as="span" className="inline-flex items-center gap-1.5">
          {isPrevious ? (
            <>
              <ArrowLeftIcon className="text-[1em] transition-transform duration-300 group-hover:-translate-x-1" />
              Previous
            </>
          ) : (
            <>
              Next
              <ArrowRightIcon className="text-[1em] transition-transform duration-300 group-hover:translate-x-1" />
            </>
          )}
        </Eyebrow>

        <Link
          href={`/blog/${post.slug}`}
          className={cn(
            "text-[1.05rem] leading-snug font-semibold text-balance text-fg transition-colors",
            "after:absolute after:inset-0 after:content-['']",
            "hover:text-brand-purple",
          )}
        >
          {post.title}
        </Link>

        <span className="mt-auto pt-1 text-[0.76rem] text-fg-subtle">
          {formatDate(post.date)}
        </span>
      </div>
    </Card>
  );
}
