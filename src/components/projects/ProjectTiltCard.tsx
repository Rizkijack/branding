/**
 * ============================================================================
 * PROJECT TILT CARD — 3D perspective tilt on hover
 * ============================================================================
 * Wraps <ProjectCard> in a pointer-tracking perspective transform. Pure DOM
 * (transform + transition) — no WebGL, no canvas — so it costs nothing on the
 * client and works on any device that supports hover.
 *
 * Why not use the global canvas for this
 * --------------------------------------
 * The card tilt must track the *card's* position in the document and stop at
 * its edges, which a fixed viewport canvas cannot do. A CSS transform on the
 * element itself is the correct tool and is GPU-composited.
 *
 * Accessibility / reduced motion
 * ------------------------------
 * The tilt is pointer-driven only. Under `prefers-reduced-motion` the listeners
 * are never attached, so the card is flat and the pointer has no effect — no
 * motion is introduced at all.
 */

"use client";

import { useReducedMotion } from "framer-motion";
import { useCallback, useRef } from "react";

import { ProjectCard } from "@/components/projects/ProjectCard";
import type { Project } from "@/data/projects";
import { useThreeStore } from "@/components/three/store";
import { cn } from "@/lib/utils";

/** Maximum tilt, in degrees. Small: this is an affordance, not a ride. */
const MAX_TILT = 7;

/**
 * Lift applied on hover, in `px`. Combined with the tilt it is what makes the
 * card read as a physical object catching light.
 */
const LIFT = 6;

export interface ProjectTiltCardProps {
  project: Project;
  /** Report hover to the store so an optional 3D preview can react. */
  reportFocus?: boolean;
  className?: string;
}

export function ProjectTiltCard({
  project,
  reportFocus = false,
  className,
}: ProjectTiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const setFocusedProject = useThreeStore((s) => s.setFocusedProject);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();

      // Pointer position within the card, -1..1 on both axes.
      const px = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const py = ((event.clientY - rect.top) / rect.height) * 2 - 1;

      // Rotate around X (pitch) from the vertical offset, around Y (yaw) from
      // the horizontal. Inverted so the card tilts *toward* the pointer.
      el.style.transform = `perspective(900px) rotateX(${-py * MAX_TILT}deg) rotateY(${px * MAX_TILT}deg) translateZ(${LIFT}px)`;

      if (reportFocus) setFocusedProject(project.slug);
    },
    [project.slug, reportFocus, setFocusedProject],
  );

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    // Back to flat. The transition on the wrapper animates this.
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)";

    if (reportFocus) setFocusedProject(null);
  }, [reportFocus, setFocusedProject]);

  return (
    <div
      ref={ref}
      onPointerMove={reduceMotion ? undefined : onPointerMove}
      onPointerLeave={reduceMotion ? undefined : onPointerLeave}
      style={{
        // A transform-style of `preserve-3d` is not needed since the tilt is a
        // single-element transform; `flat` (the default) is cheaper.
        transformStyle: "flat",
        // `will-change` is only set on hover to avoid permanently reserving a
        // compositor layer for every card in the grid.
        willChange: "transform",
      }}
      className={cn(
        // The transition is what turns a jump into a tilt. `transform` only —
        // animating `box-shadow` here too would re-composite on every frame.
        "transition-transform duration-200 ease-out",
        className,
      )}
    >
      <ProjectCard project={project} />
    </div>
  );
}

export default ProjectTiltCard;
