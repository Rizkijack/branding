/**
 * ============================================================================
 * TYPOGRAPHY PRIMITIVES
 * ============================================================================
 * SectionHeading  — small uppercase eyebrow + large title + optional lede
 * Eyebrow         — the uppercase label on its own (used in cards, too)
 * GradientText    — text clipped to a two-stop violet ramp, used sparingly
 * Prose / Lede    — body copy defaults so paragraphs stay consistent
 */

import type { ElementType, ReactNode } from "react";
import { createElement } from "react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------
 * Eyebrow
 * -------------------------------------------------------------------------
 * Neutral by default. Under the restrained palette the violet accent is
 * reserved for things you can act on (links, CTAs, focus rings), so a label
 * above a heading stays quiet and lets the heading carry the weight.
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
        "text-fg-subtle",
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
 * Renders children clipped to a two-stop violet ramp.
 *
 * This used to be a four-hue iridescent rainbow and was stamped on the last
 * two words of nearly every heading on the site, which is one of the loudest
 * repeating tells a page can have. It is now a single-hue sheen and is used
 * sparingly - a headline earns it, it isn't born with it.
 *
 * Static by design: there used to be an optional left-to-right sweep, but a
 * shimmering gradient on text is exactly the kind of motion that reads as
 * generated, so the prop is gone.
 */
export function GradientText({
  children,
  className,
  as: Tag = "span",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const Tagged = Tag as ElementType;
  return createElement(
    Tagged,
    {
      className: cn("text-gradient", className),
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

/** Consistent vertical rhythm for a page's main content.

    Generous by design: whitespace is the cheapest way to make a page feel
    considered, so sections breathe rather than stack tightly. */
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
      className: cn("relative py-20 sm:py-28", className),
    },
    children,
  );
}
