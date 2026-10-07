"use client";

/**
 * ============================================================================
 * PAGE TRANSITION + ROUTE PROGRESS BAR
 * ============================================================================
 * App Router does not unmount the layout between navigations, so we key a
 * motion element on `usePathname()` to get an enter animation per route, and
 * pair it with a thin indeterminate bar so the wait always has a visible cue.
 *
 * Why `AnimatePresence mode="wait"` is safe here: every route is statically
 * rendered, so `children` is already resolved when the navigation commits. There
 * is no streaming data to strand behind an exit animation.
 *
 * Reduced motion: both components render nothing (the bar is purely decorative)
 * and the content appears immediately.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/* -------------------------------------------------------------------------
 * PageTransition
 * ---------------------------------------------------------------------- */

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{
          duration: 0.36,
          // Slight asymmetry: leaving is faster than arriving, which reads as
          // responsive rather than sluggish.
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------
 * RouteProgress
 * ---------------------------------------------------------------------- */

/**
 * A 2px gradient bar pinned under the navbar while a navigation is in flight.
 *
 * Deliberately *indeterminate* (it cannot know real progress) and short — it
 * appears on `pathname` change and fades out on a short timer. Fully
 * decorative, so it is aria-hidden and skipped under reduced motion.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        aria-hidden="true"
        className="fixed inset-x-0 z-60 h-0.5 progress-bar"
        style={{ top: "var(--nav-h)" }}
        initial={{ opacity: 0, scaleX: 0.15, transformOrigin: "left" }}
        animate={{ opacity: 1, scaleX: [0.15, 0.75, 0.95] }}
        exit={{ opacity: 0, scaleX: 1, transition: { duration: 0.28 } }}
        transition={{
          opacity: { duration: 0.18 },
          scaleX: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
        }}
      />
    </AnimatePresence>
  );
}
