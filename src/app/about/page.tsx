/**
 * ============================================================================
 * ABOUT — /about
 * ============================================================================
 * Server component.
 *
 * Order: intro hero → long bio → timeline → skills → fun facts.
 * The timeline and skills are the page's substance, so they get the widest
 * measure; the bio is capped at a readable 3-column width.
 */

import type { Metadata } from "next";
import Link from "next/link";

import {
  BioSection,
  FunFactsSection,
  SkillsSection,
  TimelineSection,
} from "@/components/about/AboutSections";
import { MeshBackground } from "@/components/motion/MeshBackground";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Eyebrow, GradientText } from "@/components/ui/Typography";
import { profile, skillGroups, timeline } from "@/data/profile";
import { buildMetadata } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description: `${profile.shortBio} Read the long version: background, skills by category, and what I do outside work.`,
  path: "/about",
  keywords: [
    "about",
    profile.name,
    "developer bio",
    "skills",
    "Web3 developer",
    "trader",
    "moderator",
  ],
});

export default function AboutPage() {
  const entryCount = timeline.length;

  return (
    <>
      {/* ---- Intro hero ---- */}
      <section
        aria-labelledby="about-heading"
        className="relative isolate overflow-hidden"
      >
        <MeshBackground intensity="hero" />

        <div className="relative container-page flex flex-col items-start gap-6 py-16 sm:py-20 lg:py-24">
          <Eyebrow>About me</Eyebrow>

          <h1
            id="about-heading"
            className="max-w-3xl text-[clamp(2.1rem,1.4rem+3.4vw,3.75rem)] leading-[1.06] font-bold tracking-tight"
          >
            Builder, trader, <GradientText animate>moderator</GradientText>
          </h1>

          <p className="max-w-2xl text-[1rem] leading-relaxed text-fg-muted sm:text-[1.08rem]">
            {profile.shortBio}
          </p>

          {/* Quick facts strip */}
          <dl className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-2 text-[0.85rem]">
            <div>
              <dt className="text-[0.72rem] font-semibold tracking-[0.14em] text-fg-subtle uppercase">
                Based in
              </dt>
              <dd className="mt-1 font-medium text-fg">
                {profile.location.label}
              </dd>
            </div>
            <div>
              <dt className="text-[0.72rem] font-semibold tracking-[0.14em] text-fg-subtle uppercase">
                Focus areas
              </dt>
              <dd className="mt-1 font-medium text-fg">
                {skillGroups.map((group) => group.title).join(" · ")}
              </dd>
            </div>
            <div>
              <dt className="text-[0.72rem] font-semibold tracking-[0.14em] text-fg-subtle uppercase">
                Timeline
              </dt>
              <dd className="mt-1 font-medium text-fg">{entryCount} entries</dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button href="/projects" size="lg">
              See the work
            </Button>
            <Button href="/contact" variant="secondary" size="lg">
              Say hello
            </Button>
          </div>
        </div>
      </section>

      {/* ---- Sections ---- */}
      <BioSection paragraphs={profile.longBio} />
      <TimelineSection entries={timeline} />
      <SkillsSection />
      <FunFactsSection />

      {/* ---- Closing CTA ---- */}
      <section aria-labelledby="about-cta" className="relative pb-24 sm:pb-32">
        <div className="container-page">
          <Reveal>
            <div className="flex flex-col items-center gap-5 rounded-card border border-line/70 bg-surface/50 px-6 py-12 text-center backdrop-blur-sm sm:px-12">
              <Eyebrow>Next step</Eyebrow>
              <h2
                id="about-cta"
                className="max-w-xl text-[clamp(1.5rem,1.1rem+1.8vw,2.25rem)] leading-tight font-bold"
              >
                Want the short version with{" "}
                <GradientText>proof attached?</GradientText>
              </h2>
              <p className="max-w-lg text-[0.95rem] leading-relaxed text-fg-muted">
                The projects page has the case studies — what was built, what
                broke, and what came out of it.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <Button href="/projects">Browse projects</Button>
                <Link
                  href="/blog"
                  className="inline-flex h-11 items-center rounded-pill border border-line-strong bg-surface/70 px-6 text-[0.9rem] font-semibold text-fg backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-purple/60 hover:shadow-md"
                >
                  Read the blog
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
