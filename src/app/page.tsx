/**
 * ============================================================================
 * HOME — /
 * ============================================================================
 * Server component. Composes the hero and the highlight sections that follow.
 *
 * Section order is deliberate:
 *   1. Hero          — who I am
 *   2. Capabilities  — how I work (three hats)
 *   3. Featured work — proof
 *   4. Stats         — scale
 *   5. Connect       — call to action
 *
 * A latest-posts strip is pulled in only when posts exist, so the page stays
 * clean if the blog is empty.
 */

import type { Metadata } from "next";
import Link from "next/link";

import {
  CapabilitiesTeaser,
  FeaturedProjects,
  QuickStats,
  SocialStrip,
  ArrowSpan,
} from "@/components/home/HomeSections";
import { Hero } from "@/components/home/Hero";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Section, SectionHeading } from "@/components/ui/Typography";
import { getRecentPosts } from "@/lib/blog";
import { profile } from "@/data/profile";
import { buildMetadata } from "@/lib/site";
import { accentFor, formatDateShort } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: `${profile.name} — ${profile.tagline[0]}`,
  description: profile.shortBio,
  path: "/",
  keywords: [
    profile.name,
    "full-stack developer",
    "Web3",
    "agentic AI",
    "trader",
    "community moderator",
    profile.location.label,
  ],
});

export default function HomePage() {
  // Latest posts, newest first. Empty array when the blog has no posts yet.
  const posts = getRecentPosts(3);
  // The newest post earns the feature slot; the rest sit beside it as rows.
  const [featurePost, ...restPosts] = posts;

  return (
    <>
      <Hero />

      <CapabilitiesTeaser />
      <FeaturedProjects />
      <QuickStats />

      {/* ---- Latest writing (only when there is something to show) ---- */}
      {posts.length > 0 ? (
        <Section aria-labelledby="writing-heading">
          <div className="container-page">
            <SectionHeading
              title="Recent writing"
              lede="Notes on agentic systems, on-chain markets, and the engineering between them."
              id="writing-heading"
              align="left"
              className="mb-10"
            >
              <Link
                href="/blog"
                className="mt-2 inline-flex items-center gap-1.5 rounded-pill border border-line px-4 py-2 text-[0.8rem] font-semibold text-fg-muted transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-purple/50 hover:text-fg hover:shadow-md"
              >
                All posts
              </Link>
            </SectionHeading>

            {/*
              Asymmetric split: the newest post earns the feature slot, the
              rest sit beside it as quiet accent-rule rows. Deliberately NOT
              another three-card grid - the featured-work section above already
              owns that family.
            */}
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
              <RevealItem>
                <Card
                  interactive
                  padding="lg"
                  accent={accentFor(0)}
                  className="flex h-full flex-col"
                >
                  <div className="flex items-center gap-3 text-[0.74rem] text-fg-subtle">
                    <time dateTime={featurePost.date}>
                      {formatDateShort(featurePost.date)}
                    </time>
                    <span aria-hidden="true">·</span>
                    <span>{featurePost.readingTime} min read</span>
                  </div>

                  <h3 className="mt-3 text-[1.35rem] leading-snug font-bold">
                    <Link
                      href={`/blog/${featurePost.slug}`}
                      /* Stretched link: the whole card is the hit target. */
                      className="after:absolute after:inset-0 after:content-['']"
                    >
                      {featurePost.title}
                    </Link>
                  </h3>

                  <p className="mt-3 flex-1 text-[0.92rem] leading-relaxed text-fg-muted">
                    {featurePost.description}
                  </p>

                  {featurePost.tags.length > 0 ? (
                    <ul className="mt-5 flex flex-wrap gap-1.5">
                      {featurePost.tags.slice(0, 3).map((tag) => (
                        <li key={tag}>
                          <Tag>{tag}</Tag>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <p className="mt-5 flex items-center gap-1.5 text-[0.78rem] font-semibold text-brand-purple">
                    Read the post
                    <ArrowSpan />
                  </p>
                </Card>
              </RevealItem>

              {restPosts.length > 0 ? (
                <RevealGroup className="flex flex-col">
                  {restPosts.map((post) => (
                    <RevealItem key={post.slug}>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="group flex flex-col gap-1.5 border-l-2 border-line py-4 pl-5 transition-colors duration-300 hover:border-brand-purple"
                      >
                        <div className="flex items-center gap-3 text-[0.74rem] text-fg-subtle">
                          <time dateTime={post.date}>
                            {formatDateShort(post.date)}
                          </time>
                          <span aria-hidden="true">·</span>
                          <span>{post.readingTime} min read</span>
                        </div>
                        <h3 className="text-[1.02rem] leading-snug font-bold transition-colors duration-300 group-hover:text-brand-purple">
                          {post.title}
                        </h3>
                        <p className="line-clamp-2 text-[0.86rem] leading-relaxed text-fg-muted">
                          {post.description}
                        </p>
                      </Link>
                    </RevealItem>
                  ))}
                </RevealGroup>
              ) : null}
            </div>
          </div>
        </Section>
      ) : null}

      <SocialStrip />
    </>
  );
}
