"use client";

/**
 * ============================================================================
 * REVEAL — scroll-triggered entrance animations.
 * ============================================================================
 * Three export levels, all sharing one implementation:
 *
 *   <Reveal>            single element fades + rises in on scroll
 *   <RevealGroup>       wrapper that staggers its <RevealItem> children
 *   <RevealItem>        child of a group (inherits the group delay rhythm)
 *
 * Accessibility: when the visitor prefers reduced motion we skip the transform
 * entirely and render the final state, so content is never hidden behind an
 * animation that will not run.
 *
 * Performance: uses `whileInView` with a one-shot trigger, so the observer is
 * released after the first reveal instead of scrolling the viewport forever.
 */

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Shared easing — matches the "soft settle" feel used site-wide. */
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The HTML tags this component may render.
 *
 * A closed union rather than `keyof JSX.IntrinsicElements`: `motion` is a
 * callable proxy in Framer Motion v14, so arbitrary string indexing is not
 * typed. This list covers every tag used across the site.
 */
export type MotionTag =
  | "div"
  | "section"
  | "article"
  | "header"
  | "footer"
  | "aside"
  | "ul"
  | "ol"
  | "li"
  | "span"
  | "p";

/**
 * Module-level registry of motion components.
 *
 * Built once at import time (never during render), so each tag maps to a stable
 * component identity. That matters two ways:
 *   • `react-hooks/static-components` stays satisfied — nothing is constructed
 *     inside a component body.
 *   • React sees the same component type across renders, so children keep their
 *     state and Framer does not restart layout animations.
 */
const MOTION_TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  header: motion.header,
  footer: motion.footer,
  aside: motion.aside,
  ul: motion.ul,
  ol: motion.ol,
  li: motion.li,
  span: motion.span,
  p: motion.p,
} as const;

export interface RevealProps {
  children: ReactNode;
  /** Seconds to wait before animating. Staggering is done by <RevealGroup>. */
  delay?: number;
  /** Travel distance in px. Lower values read as subtler. */
  distance?: number;
  /** Seconds. */
  duration?: number;
  /** HTML element to render. Defaults to a <div>. */
  as?: MotionTag;
  className?: string;
  /** Tailwind viewport trigger for `whileInView`. */
  viewportMargin?: string;
  once?: boolean;
}

/**
 * Builds the parent/child variant pair for a stagger group.
 * Exported so <RevealGroup> and <RevealItem> cannot drift apart.
 */
function makeStaggerVariants(
  delay: number,
  distance: number,
  duration: number,
  stagger: number,
  disabled: boolean,
): Variants {
  if (disabled) {
    return {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0, transition: { duration: 0 } },
    };
  }

  return {
    hidden: { opacity: 0, y: distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration, delay, ease: EASE, staggerChildren: stagger },
    },
  };
}

export function Reveal({
  children,
  delay = 0,
  distance = 22,
  duration = 0.62,
  as = "div",
  className,
  viewportMargin = "-80px",
  once = true,
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const MotionTag = MOTION_TAGS[as];

  return (
    <MotionTag
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: viewportMargin }}
      transition={
        reduceMotion ? { duration: 0 } : { duration, delay, ease: EASE }
      }
    >
      {children}
    </MotionTag>
  );
}

/** Container that establishes a stagger rhythm for its children. */
export function RevealGroup({
  children,
  className,
  as = "div",
  stagger = 0.09,
  delay = 0,
  distance = 26,
  duration = 0.62,
  viewportMargin = "-70px",
  once = true,
}: Omit<RevealProps, "delay" | "distance" | "duration"> & {
  stagger?: number;
  delay?: number;
  distance?: number;
  duration?: number;
}) {
  const reduceMotion = useReducedMotion();
  const MotionTag = MOTION_TAGS[as];

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: viewportMargin }}
      variants={makeStaggerVariants(
        delay,
        distance,
        duration,
        stagger,
        Boolean(reduceMotion),
      )}
    >
      {children}
    </MotionTag>
  );
}

/** Child of <RevealGroup>. Uses the inherited `visible`/`hidden` variants. */
export function RevealItem({
  children,
  className,
  id,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  /** Anchor target, e.g. `#builder` on /about. */
  id?: string;
  as?: MotionTag;
}) {
  const reduceMotion = useReducedMotion();
  const MotionTag = MOTION_TAGS[as];

  return (
    <MotionTag
      id={id}
      className={cn(className)}
      variants={{
        hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: EASE },
        },
      }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Parallax wrapper for decorative art. `speed` is a multiplier on scroll delta;
 * negative values move against the scroll direction.
 *
 * Uses `useScroll` + `useTransform` (driven by Framer's rAF loop, not a React
 * state update per scroll event) so scrolling never triggers a re-render.
 */
export function Parallax({
  children,
  speed = 0.25,
  className,
  /** Extra Y rotation across the page for a subtle 3D tilt. */
  rotate = 0,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
  rotate?: number;
}) {
  const reduceMotion = useReducedMotion();

  // Reduced motion: render a plain wrapper, no transforms, no observers.
  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <ParallaxInner speed={speed} rotate={rotate} className={className}>
      {children}
    </ParallaxInner>
  );
}

/** Split out so the hook order stays stable across the early return above. */
function ParallaxInner({
  children,
  speed,
  rotate,
  className,
}: {
  children: ReactNode;
  speed: number;
  rotate: number;
  className?: string;
}) {
  const MotionTag = MOTION_TAGS.div;
  const { scrollYProgress } = useScroll();

  const y = useTransform(scrollYProgress, [0, 1], [speed * 120, speed * -120]);
  const rotateY = useTransform(scrollYProgress, [0, 1], [-rotate, rotate]);

  return (
    <MotionTag
      className={className}
      style={rotate ? { y, rotateY, transformPerspective: 1200 } : { y }}
    >
      {children}
    </MotionTag>
  );
}
