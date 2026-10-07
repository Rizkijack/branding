/**
 * ============================================================================
 * SOCIAL TABLE — used by /socials (and the quick list logic on /contact)
 * ============================================================================
 * Server component: no state, no hooks, so it stays out of the client bundle.
 * Only <Reveal*> and <MeshBackground> ship JS on this route.
 *
 * Two renderings of the SAME data:
 *
 *   md+   a real <table> so screen readers and keyboard users get proper
 *         column semantics (Platform | Handle | Link)
 *   <md   stacked cards, because a three-column table on a 360px phone is
 *         unusable no matter how it is styled
 *
 * Entries without a `url` (the Instagram row ships that way until a handle is
 * set) still render — as an explicitly disabled "Not configured" pill. A dead
 * `href="#"` would scroll the page and tell the visitor nothing; an honest
 * disabled state does both jobs.
 */

import { SocialIcon } from "@/components/icons/InlineIcons";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ProfileLink } from "@/data/profile";
import { profile } from "@/data/profile";
import { accentFor, cn, isExternal } from "@/lib/utils";

/**
 * Shared with /contact (see `app/contact/page.tsx`). Lives here because both
 * files are server components; putting it in `src/lib` was not available.
 *
 * `contact.email` is a plain string in data/profile.ts and is expected to be
 * an address. Until one is configured there is no valid `mailto:` target, so the
 * link is only produced when the value actually looks like an address —
 * `mailto:foo.bar` with no `@` is dead in every mail client.
 */
export function emailHref(value: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
    ? `mailto:${value.trim()}`
    : null;
}

/** One platform's row content, before it is shaped as a row or a card. */
function Platform({
  social,
  className,
}: {
  social: ProfileLink;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-pill border border-line",
          "bg-surface-2 text-[1.05rem] text-fg-muted",
          "transition-colors duration-300 group-hover:text-fg",
          !social.url && "opacity-55",
        )}
      >
        <SocialIcon id={social.id} />
      </span>

      <span className="font-semibold text-fg">{social.label}</span>
    </span>
  );
}

/** The handle cell: linked when a URL exists, plain text when it does not. */
function Handle({ social }: { social: ProfileLink }) {
  const { handle, url } = social;

  if (!handle) {
    return (
      <span className="text-[0.9rem] text-fg-subtle italic">
        Not configured yet
      </span>
    );
  }

  if (!url) {
    return (
      <span className="font-mono text-[0.88rem] text-fg-muted">{handle}</span>
    );
  }

  return (
    <a
      href={url}
      {...(isExternal(url)
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className="font-mono text-[0.88rem] text-brand-purple underline-offset-4 transition-colors hover:text-brand-pink hover:underline"
    >
      {handle}
      {/* Announced only on hover/focus — the visible label is enough otherwise. */}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** The action cell. A disabled <button> when no URL is configured. */
function VisitAction({ social }: { social: ProfileLink }) {
  if (!social.url) {
    return (
      <Button
        variant="secondary"
        size="sm"
        disabled
        aria-disabled="true"
        title={`${social.label} has no URL configured yet`}
        className="pointer-events-none"
      >
        Not configured
      </Button>
    );
  }

  return (
    <Button href={social.url} variant="secondary" size="sm">
      Visit
    </Button>
  );
}

/* -------------------------------------------------------------------------
 * md+ : the real table
 * ---------------------------------------------------------------------- */

const thClasses =
  "px-6 pb-3 text-left text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-fg-subtle";

function SocialTableView({ socials }: { socials: readonly ProfileLink[] }) {
  return (
    <div className="hidden overflow-hidden rounded-card border border-line/70 md:block">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">
          Social profiles for {profile.name}: platform, handle, and a link to
          visit. Rows without a configured URL are marked as unavailable.
        </caption>

        <thead className="bg-surface-2/60">
          <tr>
            <th scope="col" className={thClasses}>
              Platform
            </th>
            <th scope="col" className={thClasses}>
              Handle
            </th>
            <th scope="col" className={cn(thClasses, "text-right")}>
              Link
            </th>
          </tr>
        </thead>

        <tbody>
          {socials.map((social) => (
            <tr
              key={social.id}
              className={cn(
                "group border-t border-line/70 transition-colors duration-300",
                "hover:bg-surface-2/70",
                // Transforms on <tr> are inconsistently supported across
                // engines, so the lift is applied to the cells instead.
                "duration-300 hover:[&>td]:-translate-y-px hover:[&>th]:-translate-y-px [&>th,&>td]:transition-transform",
              )}
            >
              <th scope="row" className="px-6 py-5 align-top font-normal">
                <Platform social={social} />
              </th>

              <td className="max-w-[34ch] px-6 py-5 align-top">
                <Handle social={social} />
                <p className="mt-1.5 text-[0.8rem] leading-relaxed text-fg-subtle">
                  {social.note}
                </p>
              </td>

              <td className="px-6 py-5 text-right align-top">
                <VisitAction social={social} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * <md : stacked cards
 * ---------------------------------------------------------------------- */

function SocialCardList({ socials }: { socials: readonly ProfileLink[] }) {
  return (
    <div className="flex flex-col gap-4 md:hidden">
      {socials.map((social, index) => (
        <Card
          key={social.id}
          interactive
          padding="sm"
          accent={accentFor(index)}
          className="group"
        >
          <div className="flex items-start justify-between gap-4">
            <Platform social={social} className="min-w-0" />

            <VisitAction social={social} />
          </div>

          <div className="mt-3">
            <Handle social={social} />
            <p className="mt-1.5 text-[0.8rem] leading-relaxed text-fg-subtle">
              {social.note}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Export
 * ---------------------------------------------------------------------- */

export function SocialTable({ socials }: { socials: readonly ProfileLink[] }) {
  return (
    <RevealGroup className="w-full" stagger={0.07}>
      {/* One fade for the whole table; per-row animation on a <tbody> is not
          worth the invalid-DOM risk, so rows animate on hover instead. */}
      <RevealItem className="hidden md:block">
        <SocialTableView socials={socials} />
      </RevealItem>

      <RevealItem className="md:hidden">
        <SocialCardList socials={socials} />
      </RevealItem>
    </RevealGroup>
  );
}
