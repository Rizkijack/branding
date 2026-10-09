/**
 * ============================================================================
 * BUTTON / PILL BUTTON
 * ============================================================================
 * Two rendering modes so we never nest interactive elements:
 *
 *   <Button href="/about">      → renders an <a>, so keyboard + middle-click
 *                                 and "open in new tab" behave natively.
 *   <Button onClick={…}>        → renders a <button>.
 *
 * Never put an <a> inside a <button> or vice versa. The component picks the tag
 * for you based on which prop you pass.
 */

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

import {
  ArrowRightIcon,
  ArrowUpRightIcon,
} from "@/components/icons/InlineIcons";
import { cn, isExternal } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface CommonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Trailing arrow. Auto-detected for external links unless `trailingIcon={false}`. */
  trailingIcon?: boolean;
  /** Leading icon component. */
  icon?: ReactNode;
  className?: string;
  /** Expand to the full container width (mobile forms, CTAs). */
  block?: boolean;
}

type LinkProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
    href: string;
    onClick?: never;
  };

type ActionProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    href?: never;
    /** Disables the button and dims it. */
    disabled?: boolean;
  };

export type ButtonProps = LinkProps | ActionProps;

/* -------------------------------------------------------------------------
 * Styles
 * ---------------------------------------------------------------------- */

const base =
  "group relative inline-flex select-none items-center justify-center gap-2 " +
  "rounded-pill font-semibold whitespace-nowrap " +
  "transition-[transform,box-shadow,background-color,border-color,color] duration-300 ease-out " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-55";

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[0.8rem]",
  md: "h-11 px-6 text-[0.9rem]",
  lg: "h-13 px-8 text-[0.98rem]",
};

const variants: Record<ButtonVariant, string> = {
  /**
   * Violet. The gradient sits on a ::before-style child div so the hover shine
   * can slide across without fighting the text colour. A tinted shadow here is
   * deliberate (§ shadow hue should follow the surface), but kept soft.
   */
  primary:
    "text-white shadow-[0_10px_30px_-8px_rgb(138_92_246/0.35)] " +
    "hover:shadow-[0_16px_40px_-8px_rgb(138_92_246/0.45)] hover:-translate-y-0.5",
  secondary:
    "border border-line-strong bg-surface text-fg " +
    "hover:border-brand-purple/60 hover:bg-surface-2 hover:-translate-y-0.5 " +
    "hover:shadow-md",
  ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg",
};

export function Button(props: ButtonProps) {
  const {
    children,
    variant = "primary",
    size = "md",
    trailingIcon,
    icon,
    className,
    block = false,
  } = props;

  const isLink = "href" in props && typeof props.href === "string";
  const href = isLink ? props.href : "";

  // External links get the "opens in a new tab" affordance automatically.
  const external = isLink && isExternal(href);
  const showTrailing = trailingIcon ?? (external && variant !== "ghost");
  const isDisabled = !isLink && Boolean(props.disabled);

  const classes = cn(
    base,
    sizes[size],
    variants[variant],
    block && "w-full",
    className,
  );

  const content = (
    <>
      {variant === "primary" ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-pill opacity-95 transition-opacity duration-300 group-hover:opacity-100"
          style={{ backgroundImage: "var(--grad-hero)" }}
        />
      ) : null}

      {icon ? (
        <span className="relative z-1 text-[1.1em] leading-none">{icon}</span>
      ) : null}

      <span className="relative z-1">{children}</span>

      {showTrailing ? (
        <span
          aria-hidden="true"
          className={cn(
            "relative z-1 text-[1.05em] leading-none transition-transform duration-300",
            "group-hover:translate-x-0.5",
          )}
        >
          {external ? <ArrowUpRightIcon /> : <ArrowRightIcon />}
        </span>
      ) : null}
    </>
  );

  if (isLink) {
    const {
      href: _href,
      trailingIcon: _t,
      icon: _i,
      block: _b,
      ...rest
    } = props as LinkProps;

    return (
      <a
        href={href}
        className={classes}
        // Security + correctness for tabs opened from this site.
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...rest}
      >
        {content}
      </a>
    );
  }

  const {
    variant: _v,
    size: _s,
    trailingIcon: _t2,
    href: _h,
    icon: _i2,
    block: _b2,
    children: _c,
    className: _cls,
    ...rest
  } = props as ActionProps;

  return (
    <button type="button" disabled={isDisabled} className={classes} {...rest}>
      {content}
    </button>
  );
}
