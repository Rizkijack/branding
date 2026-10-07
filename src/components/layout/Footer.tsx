/**
 * Footer. A server component — it has no state and no interactivity beyond
 * plain links, so it stays out of the client bundle.
 *
 * Content is derived from `socials` and `navItems` in /data and /lib/site, so
 * adding a link in one place updates the navbar, footer and /socials page
 * together.
 */

import Link from "next/link";

import {
  ArrowUpRightIcon,
  SocialIcon,
  LogoMark,
} from "@/components/icons/InlineIcons";
import { GradientDivider } from "@/components/ui/Typography";
import { contact, profile, socials } from "@/data/profile";
import { footerNav, navItems } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();

  // Only show rows that actually have a URL configured.
  const configured = socials.filter((social) => social.url);

  return (
    <footer className="relative mt-auto border-t border-line/70">
      <div className="container-page py-14 sm:py-16">
        {/* ---- Top: brand + nav columns + social icons ---- */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand block */}
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="group inline-flex w-fit items-center gap-2.5"
              aria-label={`${profile.name} — home`}
            >
              <LogoMark className="size-8 transition-transform duration-500 group-hover:rotate-180" />
              <span className="font-display text-lg font-bold tracking-tight">
                {profile.name}
              </span>
            </Link>

            <p className="max-w-xs text-[0.9rem] leading-relaxed text-fg-muted">
              {profile.tagline[0]} — based in {profile.location.label}.
            </p>

            <p className="flex items-center gap-2 text-[0.82rem] text-fg-subtle">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-brand-teal"
              />
              {profile.availability}
            </p>
          </div>

          {/* Nav columns */}
          {footerNav.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <h2 className="mb-3.5 text-[0.7rem] font-semibold tracking-[0.18em] text-fg-subtle uppercase">
                {group.heading}
              </h2>
              <ul className="flex flex-col gap-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-[0.9rem] text-fg-muted transition-colors hover:text-fg"
                    >
                      <span
                        className="bg-gradient-to-r from-brand-purple to-brand-pink bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]"
                        aria-hidden="true"
                      />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <GradientDivider className="my-10" />

        {/* ---- Bottom: socials, copyright, "Built with AI" ---- */}
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Social icon strip */}
          <ul className="flex items-center gap-2">
            {configured.map((social) => {
              return (
                <li key={social.id}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${profile.name} on ${social.label}${
                      social.handle ? ` (${social.handle})` : ""
                    }`}
                    className="group grid size-10 place-items-center rounded-full border border-line bg-surface-2 text-fg-muted transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-purple/50 hover:text-fg hover:shadow-md"
                  >
                    <SocialIcon id={social.id} className="text-[1.1rem]" />
                  </a>
                </li>
              );
            })}
          </ul>

          <p className="order-last text-center text-[0.78rem] text-fg-subtle sm:order-none sm:text-left">
            © {year} {profile.name}. All rights reserved.
          </p>
        </div>

        {/* ---- Legal strip: email + AI note ---- */}
        <div className="mt-6 flex flex-col items-center gap-2 text-[0.74rem] text-fg-subtle sm:flex-row sm:justify-between">
          <p>
            Reach me directly at{" "}
            <a
              href={`mailto:${contact.email}`}
              className="text-fg-muted underline decoration-brand-purple/40 underline-offset-4 transition-colors hover:text-brand-purple"
            >
              {contact.email}
            </a>
          </p>

          <p className="flex items-center gap-1.5">
            <span aria-hidden="true">✦</span>
            Built with AI — Next.js, Tailwind CSS &amp; Framer Motion
          </p>
        </div>

        {/* Quiet full-nav strip. Hidden on mobile, where the hamburger covers it. */}
        <ul className="mt-8 hidden flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[0.76rem] text-fg-subtle md:flex">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex items-center gap-1 transition-colors hover:text-fg"
              >
                {item.label}
                <ArrowUpRightIcon className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
