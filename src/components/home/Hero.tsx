"use client";

/**
 * ============================================================================
 * HOME — HERO
 * ============================================================================
 * Layout: a two-column split on `lg`, stacked on mobile with the illustration
 * first so the page still has a focal point before any text is read.
 *
 * The typing tagline is the centrepiece. Implementation notes:
 *  • The *static* full tagline is rendered once in a `sr-only` <h1> so the
 *    actual page heading is always crawlable and readable by screen readers.
 *  • The animated version is `aria-hidden` — otherwise assistive tech would
 *    announce a string that mutates several times a second.
 *  • Under `prefers-reduced-motion` the first tagline renders as plain static
 *    text, with no cursor and no timers.
 */

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ArrowRightIcon, SocialIcon } from "@/components/icons/InlineIcons";
import { HeroDiamondStage } from "@/components/three/HeroDiamondStage";
import { MeshBackground } from "@/components/motion/MeshBackground";
import { Button } from "@/components/ui/Button";
import { GradientText } from "@/components/ui/Typography";
import { profile, socials } from "@/data/profile";
import { cn } from "@/lib/utils";

/* Typing timings in ms. Delete speed is faster than type speed, as is normal. */
const TYPE_MS = 62;
const DELETE_MS = 32;
const HOLD_MS = 1700;
/** Gap before typing the next phrase. */
const SWITCH_MS = 320;

export function Hero() {
  const phrases = profile.tagline;
  const reduceMotion = useReducedMotion();

  /**
   * The machine is the single source of truth: `{ text, typing, phraseIndex }`.
   * Deriving `text` during render instead of storing it avoids the classic
   * two-state sync problem and makes each tick a single setState.
   */
  const [machine, setMachine] = useState(() => ({
    text: "",
    /** true = typing, false = deleting */
    typing: true,
    phraseIndex: 0,
  }));

  const { text, typing, phraseIndex } = machine;
  const current = phrases[phraseIndex] ?? "";

  // Under reduced motion we always show the full first phrase.
  const visibleText = reduceMotion ? phrases[0] : text;

  useEffect(() => {
    // Nothing to drive when motion is reduced — the static text is already shown.
    if (reduceMotion) return;

    // Typing complete → hold, then start deleting.
    if (typing && text === current) {
      const timer = setTimeout(
        () => setMachine((prev) => ({ ...prev, typing: false })),
        HOLD_MS,
      );
      return () => clearTimeout(timer);
    }

    // Deleting complete → advance to the next phrase and start typing.
    if (!typing && text === "") {
      const timer = setTimeout(
        () =>
          setMachine((prev) => ({
            text: "",
            typing: true,
            phraseIndex: (prev.phraseIndex + 1) % phrases.length,
          })),
        SWITCH_MS,
      );
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(
      () =>
        setMachine((prev) => ({
          ...prev,
          text: typing
            ? current.slice(0, prev.text.length + 1)
            : current.slice(0, prev.text.length - 1),
        })),
      typing ? TYPE_MS : DELETE_MS,
    );

    return () => clearTimeout(timer);
  }, [text, typing, phraseIndex, phrases, reduceMotion, current]);

  const configured = socials.filter((social) => social.url);

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden"
    >
      <MeshBackground intensity="hero" />

      <div className="relative container-page grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:py-28">
        {/* ---- Text column ---- */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-start gap-6 text-left"
        >
          {/* Availability pill */}
          <p className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface/70 px-3.5 py-1.5 text-[0.76rem] font-medium text-fg-muted backdrop-blur-sm">
            <span aria-hidden="true" className="relative flex size-2">
              {/* Pulsing halo behind a solid dot: cheap "live" signal. */}
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-teal opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-brand-teal" />
            </span>
            {profile.availability}
          </p>

          {/* Real, static heading for SEO + assistive tech. */}
          <h1 id="hero-heading" className="sr-only">
            {profile.name} — {phrases.join(" · ")}
          </h1>

          {/* Visible display name */}
          <p className="font-display text-[clamp(2.5rem,1.6rem+4.2vw,4.25rem)] leading-[1.03] font-bold tracking-tight">
            Hi, I&apos;m{" "}
            <GradientText animate className="text-gradient">
              {profile.name}
            </GradientText>
          </p>

          {/* Animated tagline (decorative duplicate of the h1) */}
          <p
            aria-hidden="true"
            className="flex min-h-[2.4em] max-w-[26ch] items-start font-display text-[clamp(1.15rem,0.85rem+1.4vw,1.75rem)] leading-snug font-medium text-fg-muted"
          >
            {/* `min-h` reserves two lines so the layout never jumps. */}
            <span>
              {visibleText}
              {!reduceMotion ? (
                <span
                  className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[0.18em] animate-[blink_1.1s_steps(2)_infinite] bg-brand-purple"
                  aria-hidden="true"
                />
              ) : null}
            </span>
          </p>

          <p className="max-w-lg text-[0.98rem] leading-relaxed text-fg-muted sm:text-[1.05rem]">
            {profile.shortBio}
          </p>

          {/* Meta: location + timezone */}
          <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.82rem] text-fg-subtle">
            <div className="flex items-center gap-2">
              <dt className="sr-only">Based in</dt>
              <dd className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-brand-purple"
                />
                {profile.location.label}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="sr-only">Time zone</dt>
              <dd>{profile.timeZone}</dd>
            </div>
          </dl>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button href="/projects" size="lg">
              View my work
            </Button>
            <Button href="/contact" variant="secondary" size="lg">
              Get in touch
            </Button>
          </div>

          {/* Social strip */}
          <ul className="flex flex-wrap items-center gap-2 pt-1">
            {configured.map((social) => {
              return (
                <li key={social.id}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${profile.name} on ${social.label}`}
                    className="group flex items-center gap-2 rounded-pill border border-line bg-surface/60 px-3 py-1.5 text-[0.78rem] font-medium text-fg-muted backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-purple/50 hover:text-fg hover:shadow-md"
                  >
                    <SocialIcon
                      id={social.id}
                      className="text-[0.95rem] transition-transform duration-300 group-hover:scale-110"
                    />
                    <span className="hidden sm:inline">{social.label}</span>
                  </a>
                </li>
              );
            })}
            <li className="ml-1 text-[0.76rem] text-fg-subtle">
              <span className="inline-flex items-center gap-1.5">
                <ArrowRightIcon className="size-3.5" />
                <Link
                  href="/socials"
                  className="underline decoration-brand-purple/40 underline-offset-4 transition-colors hover:text-brand-purple"
                >
                  All links
                </Link>
              </span>
            </li>
          </ul>
        </motion.div>

        {/* ---- Illustration column ---- */}
        <div
          className={cn(
            "relative order-first flex justify-center lg:order-last",
            // Keep the art from stealing vertical space on small phones.
            "scale-90 sm:scale-100",
          )}
        >
          {/*
            The 3D octahedron. <HeroDiamondStage> owns the decision: it renders
            the original SVG until the client probe resolves, and again whenever
            3D is off, unsupported, or reduced-motion is requested — so this
            slot is never empty and never shifts layout.
          */}
          <HeroDiamondStage
            className="w-full max-w-[18rem] sm:max-w-[21rem]"
            scrollDriven
          />
        </div>
      </div>
    </section>
  );
}
