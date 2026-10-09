/**
 * ============================================================================
 * ABOUT — bio, timeline, skills grid, fun facts
 * ============================================================================
 * Server components. Each is independent so `src/app/about/page.tsx` stays a
 * thin composition and the sections can be reordered freely.
 */

import {
  BriefcaseIcon,
  CheckIcon,
  CoffeeIcon,
  CodeIcon,
  FlagIcon,
  GlobeIcon,
  ChartIcon,
  LeafIcon,
  SparklesIcon,
  type IconProps,
} from "@/components/icons/InlineIcons";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { Section, SectionHeading } from "@/components/ui/Typography";
import { Timeline3D } from "@/components/three/Timeline3D";
import type { TimelineEntry } from "@/data/profile";
import { funFacts, skillGroups, timeline } from "@/data/profile";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------
 * Shared: icon lookup for fun facts
 * ---------------------------------------------------------------------- */

type IconComponent = (props: IconProps) => React.JSX.Element;

const factIcons: Record<string, IconComponent> = {
  coffee: CoffeeIcon,
  globe: GlobeIcon,
  code: CodeIcon,
  sparkles: SparklesIcon,
  chart: ChartIcon,
  leaf: LeafIcon,
};

/**
 * Renders a fun-fact icon by key.
 *
 * A component rather than `const Icon = factIcons[fact.icon]` inline: resolving
 * a component during render creates a new element type each pass, which remounts
 * the subtree (`react-hooks/static-components`).
 */
function FactIcon({ name, ...props }: IconProps & { name: string }) {
  const Glyph = factIcons[name] ?? SparklesIcon;
  return <Glyph {...props} />;
}

const kindMeta = {
  education: {
    label: "Education",
    icon: FlagIcon,
    accent: "var(--brand-blue)",
  },
  experience: {
    label: "Experience",
    icon: BriefcaseIcon,
    accent: "var(--brand-purple)",
  },
  milestone: {
    label: "Milestone",
    icon: SparklesIcon,
    accent: "var(--brand-pink)",
  },
} as const satisfies Record<
  TimelineEntry["kind"],
  { label: string; icon: IconComponent; accent: string }
>;

/* -------------------------------------------------------------------------
 * Long bio
 * ---------------------------------------------------------------------- */

export function BioSection({ paragraphs }: { paragraphs: readonly string[] }) {
  return (
    <Section aria-labelledby="bio-heading">
      <div className="container-page">
        <SectionHeading
          title="Long version"
          align="left"
          id="bio-heading"
          className="mb-10"
        />

        <RevealGroup className="flex max-w-3xl flex-col gap-5">
          {paragraphs.map((paragraph, index) => (
            <RevealItem key={index}>
              <p
                className={cn(
                  "leading-[1.8] text-fg-muted",
                  index === 0
                    ? "text-[1.08rem] text-fg sm:text-[1.16rem]"
                    : "text-[0.98rem] sm:text-[1.02rem]",
                )}
              >
                {paragraph}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------
 * Timeline
 * ---------------------------------------------------------------------- */

/**
 * Alternating on desktop, single-column with a left rail on mobile.
 *
 * Uses `<ol>` because the entries are genuinely chronological — the semantics
 * matter more than the styling here.
 */
export function TimelineSection({
  entries,
}: {
  entries: readonly TimelineEntry[];
}) {
  if (entries.length === 0) return null;

  return (
    <Section aria-labelledby="timeline-heading" className="relative">
      <div className="container-page">
        <SectionHeading
          title="How I got here"
          lede="Education, roles, and the handful of moments that actually changed direction."
          id="timeline-heading"
          className="mb-14"
        />

        {/*
          3D timeline — faceted nodes on a curved path, hover to lift.
          Decorative and aria-hidden: the <ol> below is the real content, so a
          keyboard or screen-reader user loses nothing. Renders null when the 3D
          layer is off, so the DOM timeline stands alone.
          The host needs an explicit height — R3F's <Canvas> fills its parent.
        */}
        <Timeline3D entries={entries} className="mb-12 h-56 sm:h-72" />

        <ol className="relative flex flex-col gap-8 lg:gap-0">
          {entries.map((entry, index) => {
            const meta = kindMeta[entry.kind];
            const Icon = meta.icon;
            const isLast = index === entries.length - 1;

            return (
              <RevealItem
                key={entry.id}
                className={cn(
                  "relative lg:grid lg:grid-cols-[9rem_1fr] lg:gap-10",
                  // Alternate sides so the rail reads as a zigzag on desktop.
                  "lg:[&:nth-child(even)>div:first-child]:col-start-2",
                )}
              >
                {/* ---- Marker + rail ---- */}
                <div className="flex items-start gap-4 lg:flex-col lg:items-end lg:gap-2">
                  <span
                    aria-hidden="true"
                    className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-[1.15rem] shadow-sm"
                    style={{ color: meta.accent }}
                  >
                    <Icon />
                  </span>

                  {/* Connector line. Hidden on the final entry. */}
                  {!isLast ? (
                    <span
                      aria-hidden="true"
                      className="absolute top-11 left-[1.375rem] h-[calc(100%+2rem)] w-px bg-line lg:top-0 lg:left-1/2 lg:h-full lg:-translate-x-1/2"
                    />
                  ) : null}
                </div>

                {/* ---- Content ---- */}
                <div className="min-w-0 flex-1 pb-2">
                  <Card padding="lg" className="h-full">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-[0.68rem] font-semibold tracking-[0.12em] uppercase"
                        style={{
                          color: meta.accent,
                          backgroundColor: `color-mix(in oklab, ${meta.accent} 12%, transparent)`,
                        }}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[0.78rem] font-medium text-fg-subtle">
                        {entry.period}
                      </span>
                    </div>

                    <h3 className="mt-3 text-[1.15rem] leading-snug font-bold">
                      {entry.title}
                    </h3>

                    <p className="mt-1 text-[0.86rem] font-medium text-brand-purple">
                      {entry.org}
                      {entry.location ? (
                        <span className="font-normal text-fg-subtle">
                          {" "}
                          · {entry.location}
                        </span>
                      ) : null}
                    </p>

                    <p className="mt-3 text-[0.9rem] leading-relaxed text-fg-muted">
                      {entry.summary}
                    </p>

                    {entry.details && entry.details.length > 0 ? (
                      <ul className="mt-4 flex flex-col gap-2">
                        {entry.details.map((detail) => (
                          <li
                            key={detail}
                            className="flex items-start gap-2.5 text-[0.86rem] leading-relaxed text-fg-muted"
                          >
                            <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand-purple" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </Card>
                </div>
              </RevealItem>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------
 * Skills
 * ---------------------------------------------------------------------- */

/**
 * Skills grouped by category. Each skill renders a bar whose width is set via
 * a CSS custom property — animating `width` directly would not be GPU-friendly,
 * and a transform scale would distort the border radius.
 *
 * The numeric level is also exposed to assistive tech via aria-label, so the
 * bar is never the only way to read the value.
 */
export function SkillsSection() {
  return (
    <Section aria-labelledby="skills-heading">
      <div className="container-page">
        <SectionHeading
          title="Skills by category"
          lede="Self-assessed, and deliberately split by role — the three contexts I actually work in."
          id="skills-heading"
          className="mb-12"
        />

        <RevealGroup className="grid gap-6 lg:grid-cols-3">
          {skillGroups.map((group) => (
            <RevealItem key={group.id} id={group.id}>
              <Card padding="lg" className="flex h-full scroll-mt-28 flex-col">
                <h3 className="text-[1.2rem] font-bold">{group.title}</h3>
                <p className="mt-2 text-[0.87rem] leading-relaxed text-fg-muted">
                  {group.blurb}
                </p>

                <ul className="mt-6 flex flex-col gap-4">
                  {group.skills.map((skill) => (
                    <li key={skill.name}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[0.88rem] font-medium text-fg">
                          {skill.name}
                        </span>
                        <span
                          className="shrink-0 text-[0.76rem] text-fg-subtle tabular-nums"
                          // Announced value; the bar itself is decorative.
                          aria-label={`${skill.level} out of 100`}
                        >
                          {skill.level}
                        </span>
                      </div>

                      <div
                        role="presentation"
                        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
                      >
                        {/* Solid fill, not a gradient ramp: the number next to
                            it already states the value, the bar only has to be
                            readable at a glance. */}
                        <div
                          className="h-full rounded-full bg-brand-purple"
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>

                      {skill.note ? (
                        <p className="mt-1.5 text-[0.74rem] text-fg-subtle">
                          {skill.note}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------
 * Fun facts
 * ---------------------------------------------------------------------- */

export function FunFactsSection() {
  return (
    <Section aria-labelledby="facts-heading">
      <div className="container-page">
        <SectionHeading
          title="Fun facts"
          lede="The details that never make it into a résumé."
          id="facts-heading"
          className="mb-12"
        />

        {/*
          A hairline grid, not six cards. The `gap-px` on a `bg-line` container
          is what draws the rules between cells, so the data sits in one framed
          field instead of six floating boxes.
        */}
        <RevealGroup className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {funFacts.map((fact) => (
            <RevealItem key={fact.id} className="bg-surface p-5 sm:p-6">
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-purple/12 text-[1.15rem] text-brand-purple"
              >
                <FactIcon name={fact.icon} />
              </span>
              <div className="min-w-0">
                <p className="mt-4 text-[0.72rem] font-semibold tracking-[0.14em] text-fg-subtle uppercase">
                  {fact.label}
                </p>
                <p className="mt-1 text-[0.92rem] leading-snug font-medium text-fg">
                  {fact.value}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </Section>
  );
}

/** Default export bundling the data for a single-import page composition. */
export const aboutSections = {
  bio: BioSection,
  timeline: TimelineSection,
  skills: SkillsSection,
  facts: FunFactsSection,
} as const;

export { timeline, skillGroups, funFacts };
