/**
 * ============================================================================
 * /blog — the post index.
 *
 * Server component. Reads the content layer on disk, then hands plain data to
 * <PostIndex> (client) for the interactive tag filter. No searchParams, no
 * Suspense boundary needed.
 * ============================================================================
 */

import { PostIndex } from "@/app/blog/PostIndex";
import { MeshBackground } from "@/components/motion/MeshBackground";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow, Lede } from "@/components/ui/Typography";
import { getAllPosts, getAllTags } from "@/lib/blog";
import { buildMetadata } from "@/lib/site";
import { profile } from "@/data/profile";

export const metadata = buildMetadata({
  title: "Blog",
  description:
    "Notes on agentic systems, TypeScript and market structure — the things that broke, and the fixes that survived.",
  path: "/blog",
  keywords: [
    "blog",
    "writing",
    "AI agents",
    "TypeScript",
    "trading",
    profile.tagline[0],
  ],
});

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const tags = getAllTags();

  return (
    <>
      {/* ----------------------------------------------------------------
          Hero — MeshBackground is absolutely positioned, so the wrapper needs
          `relative isolate overflow-hidden` to contain it.
          ---------------------------------------------------------------- */}
      <header className="relative isolate overflow-hidden">
        <MeshBackground intensity="hero" count={3} />

        <div className="relative container-page flex flex-col items-center gap-5 py-20 text-center sm:py-28">
          <Eyebrow>Writing</Eyebrow>

          <h1 className="max-w-3xl text-[clamp(2.25rem,1.4rem+4.2vw,4rem)] leading-[1.04] font-bold">
            Notes from <span className="text-gradient">the work</span>
          </h1>

          <Lede className="mx-auto max-w-2xl text-center sm:text-[1.08rem]">
            Long-form posts on agentic systems, TypeScript tooling and reading
            market structure. Written down because the version in my head was
            already wrong.
          </Lede>
        </div>
      </header>

      {/* ----------------------------------------------------------------
          Index
          ---------------------------------------------------------------- */}
      <section
        aria-labelledby="blog-index-heading"
        className="container-page pb-24 sm:pb-32"
      >
        <Reveal>
          <h2 id="blog-index-heading" className="sr-only">
            All posts
          </h2>
        </Reveal>

        {posts.length === 0 ? (
          <p className="py-20 text-center text-fg-muted">
            No posts published yet — check back soon.
          </p>
        ) : (
          <PostIndex posts={posts} tags={tags} />
        )}
      </section>
    </>
  );
}
