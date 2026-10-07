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
} from "@/components/home/HomeSections";
import { Hero } from "@/components/home/Hero";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import {
  GradientText,
  Section,
  SectionHeading,
} from "@/components/ui/Typography";
import { getRecentPosts } from "@/lib/blog";
import { profile } from "@/data/profile";
import { buildMetadata } from "@/lib/site";
import { formatDateShort } from "@/lib/utils";

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
              eyebrow="From the blog"
              title="Recent writing"
              titleNode={
                <>
                  Recent <GradientText>writing</GradientText>
                </>
              }
              lede="Notes on agentic systems, on-chain markets, and the engineering between them."
              id="writing-heading"
              className="mb-12"
            >
              <Link
                href="/blog"
                className="mt-2 inline-flex items-center gap-1.5 rounded-pill border border-line px-4 py-2 text-[0.8rem] font-semibold text-fg-muted transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-purple/50 hover:text-fg hover:shadow-md"
              >
                All posts
              </Link>
            </SectionHeading>

            <RevealGroup className="grid gap-5 md:grid-cols-3">
              {posts.map((post) => (
                <RevealItem key={post.slug}>
                  <Card
                    interactive
                    padding="lg"
                    className="flex h-full flex-col"
                  >
                    <div className="flex items-center gap-3 text-[0.74rem] text-fg-subtle">
                      <time dateTime={post.date}>
                        {formatDateShort(post.date)}
                      </time>
                      <span aria-hidden="true">·</span>
                      <span>{post.readingTime} min read</span>
                    </div>

                    <h3 className="mt-3 text-[1.08rem] leading-snug font-bold">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="after:absolute after:inset-0 after:content-['']"
                      >
                        {post.title}
                      </Link>
                    </h3>

                    <p className="mt-2.5 flex-1 text-[0.88rem] leading-relaxed text-fg-muted">
                      {post.description}
                    </p>

                    {post.tags.length > 0 ? (
                      <ul className="mt-5 flex flex-wrap gap-1.5">
                        {post.tags.slice(0, 3).map((tag) => (
                          <li key={tag}>
                            <Tag>{tag}</Tag>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </Card>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Section>
      ) : null}

      <SocialStrip />
    </>
  );
}
