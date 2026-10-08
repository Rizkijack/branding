"use client";

/**
 * ============================================================================
 * PROJECT GRID
 * ============================================================================
 * Client component because the filter bar needs state. Everything it renders —
 * <ProjectFilter> and <ProjectCard> — is client-safe, so the only reason this
 * file exists is the `activeTag` state and the filter animation.
 *
 * Animation approach
 * ------------------
 * `layout` on the cards lets Framer interpolate the survivors to their new
 * grid positions instead of snapping, and `AnimatePresence` fades + scales the
 * cards that leave. The initial mount staggers via `staggerChildren`, and every
 * variant collapses to the resting state when `prefers-reduced-motion` is set,
 * so no card is ever left invisible behind an animation that won't run.
 * ============================================================================
 */

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { useMemo, useState } from "react";

import { ProjectTiltCard } from "@/components/projects/ProjectTiltCard";
import {
  ProjectFilter,
  filterLabel,
} from "@/components/projects/ProjectFilter";
import { Button } from "@/components/ui/Button";
import type { Project } from "@/data/projects";

const EASE = [0.22, 1, 0.36, 1] as const;

export interface ProjectGridProps {
  projects: readonly Project[];
  /** Tag names from `getAllTechTags()`; the component counts them itself. */
  tags: readonly string[];
}

export function ProjectGrid({ projects, tags }: ProjectGridProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  // Counts drive the "(3)" on each chip, so the bar never offers a dead end.
  const tagsWithCounts = useMemo(
    () =>
      tags.map((name) => ({
        name,
        count: projects.filter((p) => p.tech.includes(name)).length,
      })),
    [projects, tags],
  );

  const visible = useMemo(
    () =>
      activeTag === null
        ? projects
        : projects.filter((p) => p.tech.includes(activeTag)),
    [projects, activeTag],
  );

  const gridVariants: Variants = reduceMotion
    ? {
        hidden: { opacity: 1 },
        visible: { opacity: 1, transition: { duration: 0 } },
      }
    : {
        hidden: {},
        visible: { transition: { staggerChildren: 0.07 } },
      };

  const cardVariants: Variants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 22, scale: 0.98 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.5, ease: EASE },
        },
        exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
      };

  return (
    <div>
      <ProjectFilter
        tags={tagsWithCounts}
        activeTag={activeTag}
        onChange={setActiveTag}
      />

      {/* Announced on filter change; the grid itself is not a live region
          because re-announcing every card would be noise. */}
      <p aria-live="polite" className="sr-only">
        {filterLabel(activeTag, visible.length, projects.length)}
      </p>

      {visible.length > 0 ? (
        <motion.ul
          layout
          variants={gridVariants}
          initial="hidden"
          animate="visible"
          className="mt-10 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((project) => (
              // `motion.li` + `layout` gives the reflow animation; the card
              // inside stays a plain server-safe component.
              //
              // NOTE: no `initial`/`animate` here on purpose — declaring them
              // would stop Framer propagating the parent's `hidden`→`visible`
              // state, and with it the `staggerChildren` rhythm. `exit` is the
              // one prop we must set ourselves.
              <motion.li
                key={project.slug}
                layout
                variants={cardVariants}
                exit="exit"
                className="flex"
              >
                {/* `ProjectTiltCard` adds a pointer-tracked perspective tilt. It
                  is pure DOM (no WebGL), reports nothing to the 3D store, and
                  detaches its listeners under reduced motion — so it stays a
                  cheap, optional layer over the plain server-safe card. */}
                <ProjectTiltCard project={project} className="h-full w-full" />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      ) : (
        <div className="mt-10 flex flex-col items-start gap-4 rounded-card border border-dashed border-line-strong bg-surface/50 p-8 sm:p-10">
          <p className="text-[1.05rem] font-semibold text-fg">
            No projects tagged {activeTag}
          </p>
          <p className="text-[0.9rem] text-fg-muted">
            That stack shows up in the wider toolkit but not on any project here
            yet.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTag(null)}
          >
            Clear filter
          </Button>
        </div>
      )}
    </div>
  );
}
