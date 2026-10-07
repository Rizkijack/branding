/**
 * ============================================================================
 * PROJECT CARD
 * ============================================================================
 * The card used by /projects and by the "related work" block on each detail
 * page.
 *
 * Intentionally NOT a client component. It only renders shared UI primitives
 * (Card / Tag / StatusBadge / Button), `next/link` and `Reveal` — every one of
 * those is safe to pull into a client bundle, which is what lets the client
 * `<ProjectGrid>` import it while the detail page keeps it server-rendered.
 *
 * Whole-card click target
 * -----------------------
 * The card is clickable via the "stretched link" pattern: the title's
 * <Link> paints an `::after` over the whole card, so there is exactly ONE link
 * in the accessibility tree for "open this project" while the clickable area
 * is the full surface.
 *
 * Tradeoff we are knowingly accepting: because the link's accessible name comes
 * from the title text alone, assistive tech announces "Slop Agent Book, link"
 * and not "Slop Agent Book, card, 4 technologies". That is the correct
 * trade — the alternative (a nested interactive wrapper or an <a> around the
 * whole card) either nests <a> inside <a> (invalid HTML) or produces a
 * multi-line, verbose link name. The technology chips stay visible to sighted
 * users but are intentionally not part of the link name.
 *
 * The "Visit" pill is a SIBLING of the stretched link (never nested inside it)
 * and is lifted above it with z-20, so it remains independently clickable and
 * independently focusable.
 * ============================================================================
 */

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tag } from "@/components/ui/Tag";
import type { Project } from "@/data/projects";
import { cn } from "@/lib/utils";

export interface ProjectCardProps {
  project: Project;
  /** Tighter type + padding, for the related-work row on the detail page. */
  compact?: boolean;
}

export function ProjectCard({ project, compact = false }: ProjectCardProps) {
  const { slug, title, summary, tech, status, year, role, link } = project;

  return (
    <Card
      interactive
      accent={project.accent}
      padding={compact ? "sm" : "md"}
      // `w-full` matters because the card is dropped into a `flex` <li>: as a
      // flex item it would otherwise shrink to fit its content instead of
      // filling the grid cell.
      className="group flex h-full w-full flex-col"
    >
      {/* Top row: status on the left, year on the right. */}
      <div className="flex items-center justify-between gap-3">
        <StatusBadge status={status} />
        <span className="font-mono text-[0.72rem] tracking-wide text-fg-subtle">
          {year}
        </span>
      </div>

      {/* The stretched link. `after:` extends its hit area across the card. */}
      <h3
        className={cn(
          "mt-4 leading-snug font-bold text-fg",
          compact
            ? "text-[1.12rem]"
            : "text-[clamp(1.15rem,0.95rem+0.7vw,1.4rem)]",
        )}
      >
        <Link
          href={`/projects/${slug}`}
          className={cn(
            "rounded-sm transition-colors duration-300",
            "after:absolute after:inset-0 after:z-10 after:content-['']",
            "hover:text-brand-purple",
            // Card already sets `focus-within` on its border; this adds the ring.
            "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-purple",
          )}
        >
          {title}
        </Link>
      </h3>

      <p
        className={cn(
          "mt-2.5 text-[0.9rem] leading-relaxed text-fg-muted",
          compact ? "line-clamp-3" : "line-clamp-4",
        )}
      >
        {summary}
      </p>

      {/* Tech tags. Decorative metadata — not part of the link's name. */}
      <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">
        {tech.map((t) => (
          <li key={t}>
            <Tag size="sm">{t}</Tag>
          </li>
        ))}
      </ul>

      {/* Footer. `mt-auto` keeps the role row aligned across a grid row. */}
      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <span className="text-[0.76rem] text-fg-subtle">{role}</span>

        {link ? (
          <Button
            href={link}
            variant="secondary"
            size="sm"
            // z-20 sits above the stretched link's ::after (z-10) so this stays
            // its own hit target.
            className="relative z-20"
          >
            Visit
          </Button>
        ) : (
          <span
            aria-hidden="true"
            className="text-[0.7rem] font-medium tracking-[0.14em] text-fg-subtle uppercase"
          >
            Private
          </span>
        )}
      </div>
    </Card>
  );
}
