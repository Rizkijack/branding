/**
 * ============================================================================
 * CARD
 * ============================================================================
 * The shared surface for every content block on the site.
 *
 * Visual stack (bottom → top):
 *   1. `glass` gradient fill (translucent, so the mesh blobs read through)
 *   2. solid 1px border, fading to transparent on the bottom-right
 *   3. optional iridescent rim via ::after (see `border-gradient-after` utility)
 *   4. hover lift + intensified glow
 *
 * Two interactive flavours:
 *   `interactive` — lift + glow on hover/focus. Use when the whole card is a link.
 *   plain         — static. Use when only a nested control is clickable.
 */

import type { ElementType, ReactNode } from "react";
import { createElement } from "react";

import { cn } from "@/lib/utils";

export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: CardPadding;
  /** Add the hover lift + glow treatment. */
  interactive?: boolean;
  /** Draw the 1px iridescent rim. */
  gradientBorder?: boolean;
  /** Coloured glow along the top edge, e.g. a project's accent colour. */
  accent?: string;
  as?: ElementType;
  /** Standard inner padding for non-div elements (table rows, list items). */
  innerClassName?: string;
}

const paddings: Record<CardPadding, string> = {
  none: "",
  sm: "p-4 sm:p-5",
  md: "p-5 sm:p-7",
  lg: "p-6 sm:p-9",
};

export function Card({
  children,
  className,
  padding = "md",
  interactive = false,
  gradientBorder = true,
  accent,
  as = "div",
  innerClassName,
}: CardProps) {
  const CardTag = as as ElementType;

  return createElement(
    CardTag,
    {
      className: cn(
        "relative isolate overflow-hidden rounded-card",
        "border border-line/70",
        "glass shadow-sm",
        "transition-[transform,box-shadow,border-color] duration-400 ease-out",
        paddings[padding],
        interactive && [
          "hover:-translate-y-1",
          "hover:border-brand-purple/40",
          "hover:shadow-glow",
          "focus-within:border-brand-purple/50",
        ],
        className,
      ),
    },
    <>
      {/* Accent hairline along the top edge. Decorative. */}
      {accent ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            opacity: 0.85,
          }}
        />
      ) : null}

      {gradientBorder ? (
        <span aria-hidden="true" className="border-gradient-after" />
      ) : null}

      <div className={cn("relative", innerClassName)}>{children}</div>
    </>,
  );
}
