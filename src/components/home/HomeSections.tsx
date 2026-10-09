/**
 * ============================================================================
 * HOME — the three "short highlights" sections below the hero.
 * ============================================================================
 * Server components. All data comes from /data; all motion comes from the
 * shared `Reveal` wrappers. Kept in one file because they share imports and are
 * only used together by `src/app/page.tsx`.
 *
 *  1. FeaturedProjects — the three `featured: true` projects
 *  2. QuickStats       — animated counters from `stats`
 *  3. SocialStrip      — the socials, framed as a call to connect
 */

import Link from "next/link";

import { SocialIcon } from "@/components/icons/InlineIcons";
import { MeshBackground } from "@/components/motion/MeshBackground";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tag } from "@/components/ui/Tag";
import { Section, SectionHeading } from "@/components/ui/Typography";
import { getFeaturedProjects } from "@/data/projects";
import { socials, stats } from "@/data/profile";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------
 * 1. Featured projects
 * ---------------------------------------------------------------------- */

export function FeaturedProjects() {
  const featured = getFeaturedProjects(3);
  if (featured.length === 0) return null;

  return (
    <Section className="relative" aria-labelledby="featured-heading">
      <div className="container-page">
        <SectionHeading
          title="Things I've built and shipped"
          lede="A few recent projects — each one shipped end to end, with the unglamorous parts included."
          id="featured-heading"
          className="mb-12"
        >
          <Link
            href="/projects"
            className="mt-2 inline-flex items-center gap-1.5 rounded-pill border border-line px-4 py-2 text-[0.8rem] font-semibold text-fg-muted transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-purple/50 hover:text-fg hover:shadow-md"
          >
            All projects
            <ArrowSpan />
          </Link>
        </SectionHeading>

        <RevealGroup className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((project) => (
            <RevealItem key={project.slug}>
              <Card
                interactive
                accent={project.accent}
                padding="lg"
                className="flex h-full flex-col"
              >
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge status={project.status} />
                  <span className="text-[0.74rem] font-medium text-fg-subtle">
                    {project.year}
                  </span>
                </div>

                <h3 className="mt-4 text-[1.15rem] leading-snug font-bold">
                  <Link
                    href={`/projects/${project.slug}`}
                    /* Stretched link: the whole card is the hit target. */
                    className="after:absolute after:inset-0 after:content-['']"
                  >
                    {project.title}
                  </Link>
                </h3>

                <p className="mt-2.5 flex-1 text-[0.9rem] leading-relaxed text-fg-muted">
                  {project.summary}
                </p>

                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {project.tech.slice(0, 4).map((tech) => (
                    <li key={tech}>
                      <Tag>{tech}</Tag>
                    </li>
                  ))}
                </ul>

                <p className="mt-5 flex items-center gap-1.5 text-[0.78rem] font-semibold text-brand-purple">
                  Read the case study
                  <ArrowSpan />
                </p>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </Section>
  );
}

/** Small arrow glyph reused by the "see more" affordances. Exported so the
 *  home page composition can reach it without re-inlining the path. */
export function ArrowSpan({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn(
        "transition-transform duration-300 group-hover:translate-x-0.5",
        className,
      )}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/* -------------------------------------------------------------------------
 * 2. Quick stats
 * ---------------------------------------------------------------------- */

export function QuickStats() {
  return (
    <Section aria-labelledby="stats-heading">
      <div className="container-page">
        <SectionHeading
          title="Quick stats"
          lede="Rough counts, not vanity metrics — just enough to show the shape of the work."
          id="stats-heading"
          className="mb-11"
        />

        {/*
          A ruled band, not four cards. The numbers are the content, so they
          sit in plain layout separated by hairlines — identical boxes would
          make four equal things compete for an importance none of them has.
        */}
        <RevealGroup className="grid grid-cols-2 gap-y-9 border-t border-line pt-9 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-line sm:pt-0">
          {stats.map((stat) => (
            <RevealItem
              key={stat.id}
              className="sm:px-6 sm:first:pl-0 sm:last:pr-0"
            >
              <p className="font-display text-[clamp(1.9rem,1.3rem+1.9vw,2.9rem)] leading-none font-bold tracking-tight text-fg">
                {stat.value}
              </p>
              <p className="mt-3 text-[0.88rem] font-semibold text-fg">
                {stat.label}
              </p>
              <p className="mt-1 text-[0.76rem] text-fg-subtle">{stat.hint}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------
 * 3. Social strip / CTA
 * ---------------------------------------------------------------------- */

export function SocialStrip() {
  const configured = socials.filter((social) => social.url);

  return (
    <Section className="relative" aria-labelledby="connect-heading">
      <MeshBackground intensity="soft" count={3} />

      <div className="relative container-page">
        <Card padding="lg" className="overflow-hidden text-center">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
            <SectionHeading
              title="Working on something interesting?"
              lede="Open to collaborations, contract work, and conversations about agentic systems or Web3 infrastructure."
              id="connect-heading"
            />

            <ul className="flex flex-wrap items-center justify-center gap-2.5">
              {configured.map((social) => {
                return (
                  <li key={social.id}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 rounded-pill border border-line bg-surface-2 px-4 py-2 text-[0.82rem] font-medium text-fg-muted transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-purple/50 hover:text-fg hover:shadow-md"
                    >
                      <SocialIcon
                        id={social.id}
                        className="text-[1rem] transition-transform duration-300 group-hover:scale-110"
                      />
                      {social.label}
                      {social.handle ? (
                        <span className="text-fg-subtle">
                          {social.handle.startsWith("@")
                            ? social.handle
                            : `@${social.handle}`}
                        </span>
                      ) : null}
                    </a>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <Link
                href="/contact"
                className="group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-pill px-6 text-[0.9rem] font-semibold text-white shadow-[0_10px_30px_-8px_rgb(138_92_246/0.35)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{ backgroundImage: "var(--grad-hero)" }}
                />
                <span className="relative">Start a conversation</span>
                <ArrowSpan className="relative" />
              </Link>
              <Link
                href="/about"
                className="inline-flex h-11 items-center justify-center rounded-pill border border-line-strong bg-surface px-6 text-[0.9rem] font-semibold text-fg transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-purple/60 hover:shadow-md"
              >
                More about me
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------
 * Capabilities teaser — links /about to the three skill groups
 * ---------------------------------------------------------------------- */

export function CapabilitiesTeaser() {
  return (
    <Section aria-labelledby="roles-heading">
      <div className="container-page">
        <SectionHeading
          title="Three hats, one workflow"
          lede="I build the product, trade the market it lives in, and keep the community that uses it healthy."
          id="roles-heading"
          align="left"
          className="mb-10"
        />

        {/*
          A ruled list, not three cards. The three roles are peers, and peers
          read better as rows than as three identical boxes fighting over the
          same importance. The rules do the separating; no container needed.
        */}
        <RevealGroup as="ul" className="border-t border-line">
          {[
            {
              title: "Builder",
              to: "/about#builder",
              blurb:
                "TypeScript-first full-stack product engineering, from typed contracts to the CSS that ships on a 3G connection.",
            },
            {
              title: "Trader",
              to: "/about#trader",
              blurb:
                "On-chain and intraday execution with risk framed first. The chart informs the build; the build informs the chart.",
            },
            {
              title: "Moderator",
              to: "/about#moderator",
              blurb:
                "Written guidelines, fast response, and docs that cut the repeat questions before they arrive.",
            },
          ].map((item, index) => (
            <RevealItem key={item.title} as="li">
              <Link
                href={item.to}
                className="group grid grid-cols-[auto_1fr] items-baseline gap-x-5 border-b border-line py-6 transition-colors duration-300 hover:bg-surface-2/60 sm:grid-cols-[auto_1fr_auto] sm:gap-x-8 sm:py-7"
              >
                <span className="font-mono text-[0.78rem] font-medium text-fg-subtle tabular-nums">
                  0{index + 1}
                </span>

                <div className="min-w-0">
                  <h3 className="text-[1.15rem] font-bold sm:text-[1.3rem]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 max-w-[58ch] text-[0.9rem] leading-relaxed text-fg-muted">
                    {item.blurb}
                  </p>
                </div>

                <span className="col-start-2 hidden items-center gap-1.5 self-center text-[0.8rem] font-semibold text-fg-subtle transition-colors duration-300 group-hover:text-brand-purple sm:col-start-3 sm:flex">
                  See skills
                  <ArrowSpan />
                </span>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </Section>
  );
}
