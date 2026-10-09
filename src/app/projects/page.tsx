/**
 * ============================================================================
 * /projects — index
 * ============================================================================
 * Server component. Everything that can be derived at build time (stats, tag
 * list) is computed here and handed to <ProjectGrid> as plain serialisable
 * props; the only client JS on the route is the filter bar.
 *
 * Next 16 note: `next build` statically renders this route because the data
 * layer is a plain module — no fetch, no dynamic IO.
 * ============================================================================
 */

import type { Metadata } from "next";
import Link from "next/link";

import { MeshBackground } from "@/components/motion/MeshBackground";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import {
  Eyebrow,
  GradientText,
  Lede,
  Section,
} from "@/components/ui/Typography";
import { getAllTechTags, projects } from "@/data/projects";
import { profile } from "@/data/profile";
import { buildMetadata } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Projects",
  description:
    "Selected work across agentic systems, Web3 tooling and community infrastructure — with the stack, the role and the outcome for each one.",
  path: "/projects",
  keywords: [
    "projects",
    "portfolio",
    "agentic AI",
    "web3",
    "open source",
    "Next.js",
    "TypeScript",
  ],
});

/** Three headline numbers, derived — never hard-coded, so they can't drift. */
const stats = [
  {
    id: "count",
    value: String(projects.length),
    label: "Projects",
    hint: "Shipped, building, or retired",
  },
  {
    id: "tech",
    value: String(getAllTechTags().length),
    label: "Technologies",
    hint: "Across the whole index",
  },
  {
    id: "live",
    value: String(projects.filter((p) => p.status === "live").length),
    label: "Live",
    hint: "Open to anyone with the link",
  },
] as const;

export default function ProjectsPage() {
  return (
    <>
      {/* -------------------------------------------------------------------
          Hero
          MeshBackground is absolutely positioned, so the section owns the
          stacking context (isolate) and clips the drifting blobs (overflow-hidden).
          ------------------------------------------------------------------- */}
      <section className="relative isolate overflow-hidden">
        <MeshBackground intensity="hero" />

        <div className="relative z-10 container-page pt-16 pb-6 sm:pt-24 sm:pb-10">
          <header className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <Eyebrow>Selected work</Eyebrow>

            <h1 className="text-[clamp(2.4rem,1.4rem+4.4vw,4.2rem)] leading-[1.05] font-bold">
              Things I&apos;ve <GradientText>actually shipped</GradientText>
            </h1>

            <Lede className="mx-auto max-w-2xl text-center">
              Every entry here lists the stack, the role and what came out of
              it. Filter by technology if you only care about one part of the
              stack — or read the failure notes on the ones that went sideways.
            </Lede>
          </header>

          {/* Stat strip */}
          <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-card border border-line/70 bg-line/60 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.id}
                className="flex flex-col items-center gap-1 bg-bg px-5 py-6"
              >
                <dt className="order-2 text-center text-[0.74rem] font-semibold tracking-[0.16em] text-fg-subtle uppercase">
                  {stat.label}
                </dt>
                <dd className="order-1 text-[2.1rem] leading-none font-bold text-fg">
                  {stat.value}
                </dd>
                <p className="order-3 text-center text-[0.76rem] text-fg-subtle">
                  {stat.hint}
                </p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* -------------------------------------------------------------------
          Index
          ------------------------------------------------------------------- */}
      <Section
        className="pb-24 sm:pb-32"
        aria-labelledby="projects-index-heading"
      >
        <div className="container-page">
          <header className="flex flex-col gap-3">
            {/* Visible label removed - the filter bar and cards are obviously an
                index. The heading stays in the a11y tree so the landmark is
                still named for assistive tech. */}
            <h2 id="projects-index-heading" className="sr-only">
              Project index
            </h2>
            <p className="max-w-2xl text-[0.95rem] text-fg-muted">
              {projects.length} projects · filtered by whatever you actually
              need.
            </p>
          </header>

          <ProjectGrid projects={projects} tags={getAllTechTags()} />

          <p className="mt-14 text-[0.85rem] text-fg-subtle">
            Looking for something specific?{" "}
            <Link
              href="/contact"
              className="text-brand-purple underline-offset-4 hover:underline"
            >
              Ask me directly
            </Link>{" "}
            — {profile.availability.toLowerCase()}.
          </p>
        </div>
      </Section>
    </>
  );
}
