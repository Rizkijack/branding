/**
 * ============================================================================
 * 404 — src/app/not-found.tsx
 * ============================================================================
 * Rendered for any unmatched route, and also whenever a page calls `notFound()`
 * (every `/projects/[slug]` and `/blog/[slug]` does this for a bad slug).
 *
 * The root layout still wraps this, so the navbar and footer are present — this
 * file only supplies the main content.
 */

import type { Metadata } from "next";

import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons/InlineIcons";
import { AnimatedDiamond } from "@/components/illustrations/AnimatedDiamond";
import { MeshBackground } from "@/components/motion/MeshBackground";
import { Button } from "@/components/ui/Button";
import { Eyebrow, GradientText } from "@/components/ui/Typography";
import { buildMetadata } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Page not found",
  description:
    "That page doesn't exist. Head back home, or browse projects and writing instead.",
  path: "/404",
});

/** Suggestions shown under the CTA row. Cheap way to keep a 404 useful. */
const SUGGESTIONS = [
  {
    href: "/projects",
    label: "Projects",
    hint: "Case studies for things I've shipped",
  },
  { href: "/blog", label: "Blog", hint: "Notes on agents, Web3 and tooling" },
  { href: "/about", label: "About", hint: "Background, skills and timeline" },
  {
    href: "/contact",
    label: "Contact",
    hint: "Email, socials and a contact form",
  },
] as const;

export default function NotFound() {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-var(--nav-h))] items-center overflow-hidden">
      <MeshBackground intensity="hero" />

      <div className="relative container-page grid w-full items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        {/* ---- Copy ---- */}
        <div className="flex flex-col items-start gap-6">
          <Eyebrow>Error 404</Eyebrow>

          <p
            aria-hidden="true"
            className="font-display text-[clamp(4.5rem,3rem+11vw,9rem)] leading-[0.9] font-bold tracking-tighter"
          >
            <GradientText>404</GradientText>
          </p>

          <h1 className="max-w-xl text-[clamp(1.6rem,1.15rem+2.2vw,2.6rem)] leading-[1.12] font-bold">
            This page went off-chain
          </h1>

          <p className="max-w-lg text-[0.98rem] leading-relaxed text-fg-muted sm:text-[1.05rem]">
            The URL you followed doesn&apos;t resolve to anything here. It may
            have been renamed, or it may never have existed — either way, no
            harm done.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button href="/" size="lg" icon={<ArrowLeftIcon />}>
              Back home
            </Button>
            <Button href="/projects" variant="secondary" size="lg">
              Browse projects
            </Button>
          </div>

          {/* ---- Useful destinations ---- */}
          <div className="w-full pt-4">
            <div aria-hidden="true" className="mb-6 divider-gradient w-full" />
            <p className="mb-4 text-[0.72rem] font-semibold tracking-[0.16em] text-fg-subtle uppercase">
              Or try one of these
            </p>

            <ul className="grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="group flex items-center justify-between gap-3 rounded-xl2 border border-line bg-surface px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-purple/50 hover:shadow-md"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[0.88rem] font-semibold text-fg">
                        {item.label}
                      </span>
                      <span className="truncate text-[0.76rem] text-fg-subtle">
                        {item.hint}
                      </span>
                    </span>
                    <ArrowRightIcon className="shrink-0 text-[1rem] text-brand-purple transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ---- Art ---- */}
        <div className="order-first flex justify-center lg:order-last">
          <AnimatedDiamond
            className="w-full max-w-[16rem] sm:max-w-[19rem]"
            // Slower parallax than the hero: this is a consolation page, not a
            // showcase, so the art should sit still and read as decoration.
            parallaxStrength={0.6}
            title="A faceted diamond, slightly lost"
            description="The site's octahedron mark, floating over the 404 page."
          />
        </div>
      </div>
    </section>
  );
}
