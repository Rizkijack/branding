/**
 * ============================================================================
 * TYPOGRAPHY PRIMITIVES
 * ============================================================================
 * SectionHeading  — small uppercase eyebrow + large title + optional lede
 * Eyebrow         — the uppercase label on its own (used in cards, too)
 * GradientText    — iridescent clipped text, with an optional sweep animation
 * Prose / Lede    — body copy defaults so paragraphs stay consistent
 */

import type { ElementType, ReactNode } from "react";
import { createElement } from "react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------
 * Eyebrow
 * ---------------------------------------------------------------------- */

export function Eyebrow({
  children,
  className,
  as: Tag = "p",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const Tagged = Tag as ElementType;
  return createElement(
    Tagged,
    {
      className: cn(
        "text-[0.7rem] font-semibold tracking-[0.18em] uppercase",
        "text-brand-purple",
        className,
      ),
    },
    children,
  );
}

/* -------------------------------------------------------------------------
 * SectionHeading
 * ---------------------------------------------------------------------- */

/**
 * `align="center"` is the default for narrow sections; `align="left"` suits
 * pages that open with a hero.
 *
 * `id` becomes the anchor target used by in-page jump links and `aria-labelledby`.
 */
export function SectionHeading({
  eyebrow,
  title,
  titleNode,
  lede,
  align = "center",
  id,
  className,
  titleClassName,
  children,
}: {
  eyebrow?: string;
  /** Plain string is safest for SEO. */
  title: ReactNode;
  /**
   * Alternative to `title` when part of the heading needs gradient styling.
   * Supplying both would duplicate content, so prefer one or the other.
   */
  titleNode?: ReactNode;
  lede?: ReactNode;
  align?: "center" | "left";
  id?: string;
  className?: string;
  titleClassName?: string;
  /** Extra content under the lede — usually a set of pills. */
  children?: ReactNode;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4",
        align === "center"
          ? "items-center text-center"
          : "items-start text-left",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}

      <h2
        id={id}
        className={cn(
          "text-[clamp(1.75rem,1.15rem+2.6vw,3rem)] leading-[1.1] font-bold",
          titleClassName,
        )}
      >
        {titleNode ?? title}
      </h2>

      {lede ? (
        <p
          className={cn(
            "max-w-2xl text-[0.98rem] leading-relaxed text-fg-muted sm:text-[1.05rem]",
            align === "center" && "mx-auto",
          )}
        >
          {lede}
        </p>
      ) : null}

      {children}
    </header>
  );
}

/* -------------------------------------------------------------------------
 * GradientText
 * ---------------------------------------------------------------------- */

/**
 * Renders children clipped to an iridescent gradient.
 *
 * `animate` sweeps the gradient left→right. The animation is disabled by the
 * global `prefers-reduced-motion` rule in globals.css, so no prop needed.
 */
export function GradientText({
  children,
  className,
  animate = false,
  as: Tag = "span",
}: {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  as?: ElementType;
}) {
  const Tagged = Tag as ElementType;
  return createElement(
    Tagged,
    {
      className: cn(
        "text-gradient",
        animate && "animate-[shimmer_9s_linear_infinite]",
        className,
      ),
    },
    children,
  );
}

/* -------------------------------------------------------------------------
 * Body copy
 * ---------------------------------------------------------------------- */

/** Standard paragraph inside a section. */
export function Lede({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[0.98rem] leading-[1.75] text-fg-muted sm:text-[1.05rem]",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Thin gradient rule used to separate major bands of a page. */
export function GradientDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("divider-gradient w-full", className)}
    />
  );
}

/** Consistent vertical rhythm for a page's main content. */
export function Section({
  children,
  className,
  id,
  as: Tag = "section",
  "aria-labelledby": ariaLabelledby,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  as?: ElementType;
  "aria-labelledby"?: string;
}) {
  const Tagged = Tag as ElementType;
  return createElement(
    Tagged,
    {
      id,
      "aria-labelledby": ariaLabelledby,
      className: cn("relative py-16 sm:py-24", className),
    },
    children,
  );
}
