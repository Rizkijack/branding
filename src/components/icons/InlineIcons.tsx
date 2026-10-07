/**
 * ============================================================================
 * INLINE ICONS
 * ============================================================================
 * Every graphic on this site is inline SVG or CSS — there are zero remote or
 * bitmap assets, which keeps the whole thing crisp at any DPR and avoids
 * layout shift.
 *
 * All icons share one contract:
 *   • 24x24 viewBox
 *   • `currentColor` strokes/fills, so `text-*` classes control colour
 *   • decorative by default (aria-hidden); pass a `title` to expose one
 */

import type { ReactNode, SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /**
   * Accessible name. When omitted the icon is treated as decorative
   * (aria-hidden) — which is correct when adjacent text already labels it.
   */
  title?: string;
  /** Path/circle/rect content supplied by each concrete icon. */
  children?: ReactNode;
}

/** Shared wrapper: normalises sizing and the a11y attributes. */
function Icon({ title, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      // Decorative unless a title is supplied.
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * Social
 * ------------------------------------------------------------------------ */

export function GitHubIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        stroke="none"
        d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.1c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.12 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.2.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z"
      />
    </Icon>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        stroke="none"
        d="M17.53 3h3.05l-6.66 7.61L21.75 21h-5.98l-4.7-6.14L5.7 21H2.64l7.12-8.14L2.25 3h6.13l4.25 5.61L17.53 3Zm-1.07 16.16h1.69L7.62 4.74H5.81l10.65 14.42Z"
      />
    </Icon>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
    </Icon>
  );
}

/* ---------------------------------------------------------------------------
 * UI glyphs
 * ------------------------------------------------------------------------ */

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 17 17 7M8 7h9v9" />
    </Icon>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Icon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.2 8.2 0 1 0 10.2 10.2Z" />
    </Icon>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="3" />
      <path d="m3.5 8 8.5 5.5L20.5 8" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m4.5 12.5 5 5 10-11" />
    </Icon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.4v.2" />
    </Icon>
  );
}

export function SpinnerIcon({ className, ...props }: IconProps) {
  return (
    <Icon
      className={["animate-spin", className].filter(Boolean).join(" ")}
      {...props}
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </Icon>
  );
}

/* ---------------------------------------------------------------------------
 * Fun-fact glyphs (referenced from data/profile.ts by `icon` key)
 * ------------------------------------------------------------------------ */

export function CoffeeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
      <path d="M16 10.5h1.8a2.2 2.2 0 0 1 0 4.4H16M4 22h13" />
    </Icon>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 13.7 8.3 18.5 10 13.7 11.7 12 16.5 10.3 11.7 5.5 10 10.3 8.3 12 3.5Z" />
      <path d="M18.5 15.5 19.4 17.6 21.5 18.5 19.4 19.4 18.5 21.5 17.6 19.4 15.5 18.5 17.6 17.6 18.5 15.5Z" />
    </Icon>
  );
}

export function CodeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m8.5 8.5-4 3.5 4 3.5M15.5 8.5l4 3.5-4 3.5M13.5 5l-3 14" />
    </Icon>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 19h16M4 19V5" />
      <path d="m7 15 3.5-4 3 2.5L20 7" />
    </Icon>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 4c0 8-5 12-11 12H5c0-8 5-12 11-12h4Z" />
      <path d="M4 20c2-4 5-6.5 9-8" />
    </Icon>
  );
}

export function GraduationIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 4 9 4.5L12 13 3 8.5 12 4Z" />
      <path d="M7 10.8v4.4c0 1.4 2.2 2.8 5 2.8s5-1.4 5-2.8v-4.4M20.5 9.5V15" />
    </Icon>
  );
}

export function BriefcaseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="7.5" width="18" height="12" rx="3" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3 12.5h18" />
    </Icon>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 21V4M6 5h10.5l-1.8 3.2L16.5 12H6" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.3l3.2 2" />
    </Icon>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 11.3V4.5a1 1 0 0 1 1-1h6.8a1 1 0 0 1 .7.3l8 8a1 1 0 0 1 0 1.4l-6.8 6.8a1 1 0 0 1-1.4 0l-8-8a1 1 0 0 1-.3-.7Z" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z" />
      <path d="m3.5 12.2 8.5 4.5 8.5-4.5M3.5 16.7l8.5 4.5 8.5-4.5" />
    </Icon>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M15.5 6.5V6A2 2 0 0 0 13.5 4H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h.5" />
    </Icon>
  );
}

/* ---------------------------------------------------------------------------
 * Logo mark — a faceted Ethereum-style diamond, same language as the hero art
 * ------------------------------------------------------------------------ */

export function LogoMark({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <defs>
        <linearGradient id="logo-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#627eea" />
        </linearGradient>
        <linearGradient id="logo-bottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b9ff5" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <path d="M16 2 5 16l11 6.5L27 16 16 2Z" fill="url(#logo-top)" />
      <path
        d="M16 24.5 5 16l11 14 11-14-11 6.5Z"
        fill="url(#logo-bottom)"
        opacity="0.9"
      />
      <path d="M16 2 5 16h22L16 2Z" fill="url(#logo-top)" />
      <path d="m5 16 11 14V24.5L5 16Z" fill="#5b4ce0" opacity="0.85" />
      <path d="m27 16-11 14V24.5L27 16Z" fill="#f472b6" opacity="0.55" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * Icon lookup
 * ------------------------------------------------------------------------ */

/** Maps a profile/social id to its glyph. Unknown ids fall back to a globe. */
const SOCIAL_ICONS: Record<string, (props: IconProps) => React.JSX.Element> = {
  github: GitHubIcon,
  x: XIcon,
  twitter: XIcon,
  instagram: InstagramIcon,
  website: GlobeIcon,
  globe: GlobeIcon,
};

/**
 * Renders the icon for a social/profile id.
 *
 * This is a *component* rather than a function that returns a component. That
 * distinction matters: resolving `Icon` during render and then rendering
 * `<Icon />` produces a new component type on every pass, which remounts the
 * subtree and trips `react-hooks/static-components`. A stable component that
 * switches internally keeps React's reconciliation intact.
 */
export function SocialIcon({
  id,
  ...props
}: IconProps & {
  /** Social id, e.g. "github". Case-insensitive. */
  id: string;
}) {
  const Glyph = SOCIAL_ICONS[id.toLowerCase()] ?? GlobeIcon;
  return <Glyph {...props} />;
}
