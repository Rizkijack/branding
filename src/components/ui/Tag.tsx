/**
 * ============================================================================
 * TAG / CHIP
 * ============================================================================
 * Three variants:
 *   • neutral — static metadata chip (tech, reading time, status)
 *   • accent  — brand-tinted chip used for the active filter
 *   • dot     — chip with a leading status dot (live / in-progress / archived)
 *
 * As with Button, this picks its own tag so a chip used as a filter control is
 * a real <button> and a chip used as a link is a real <a>.
 */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type TagVariant = "neutral" | "accent" | "outline";

export interface TagProps {
  children: ReactNode;
  variant?: TagVariant;
  /** Coloured dot on the left. Omit for a plain chip. */
  dotColor?: string;
  /** Slightly larger, more padding. */
  size?: "sm" | "md";
  className?: string;
  title?: string;
}

const base =
  "inline-flex items-center gap-1.5 rounded-pill font-medium " +
  "whitespace-nowrap transition-colors duration-250";

const sizes = {
  sm: "px-2.5 py-0.5 text-[0.7rem]",
  md: "px-3 py-1 text-[0.76rem]",
} as const;

const variants: Record<TagVariant, string> = {
  neutral:
    "border border-line bg-surface-2 text-fg-muted hover:border-brand-purple/40 hover:text-fg",
  accent: "border border-brand-purple/45 bg-brand-purple/12 text-brand-purple",
  outline: "border border-line-strong text-fg-muted",
};

export function Tag({
  children,
  variant = "neutral",
  dotColor,
  size = "sm",
  className,
  title,
}: TagProps) {
  return (
    <span
      className={cn(base, sizes[size], variants[variant], className)}
      title={title}
    >
      {dotColor ? (
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full"
          style={{ background: dotColor }}
        />
      ) : null}
      {children}
    </span>
  );
}

/**
 * A chip that is also a control (used by the /projects filter bar).
 *
 * Renders <button type="button"> with `aria-pressed` so assistive tech reports
 * the toggle state instead of a generic button.
 */
export function FilterChip({
  children,
  active,
  count,
  onClick,
  className,
}: {
  children: ReactNode;
  active: boolean;
  /** Optional "(3)" counter. */
  count?: number;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        base,
        "cursor-pointer px-3.5 py-1.5 text-[0.78rem]",
        "focus-visible:ring-2 focus-visible:ring-brand-purple",
        active
          ? "text-white shadow-[0_8px_22px_-8px_rgb(138_92_246/0.6)]"
          : "border border-line bg-surface-2 text-fg-muted hover:border-brand-purple/45 hover:text-fg",
        className,
      )}
      style={active ? { backgroundImage: "var(--grad-hero)" } : undefined}
    >
      {children}
      {typeof count === "number" ? (
        <span
          className={cn(
            "text-[0.68rem]",
            active ? "text-white/75" : "text-fg-subtle",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
