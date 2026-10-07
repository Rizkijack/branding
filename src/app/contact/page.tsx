/**
 * ============================================================================
 * CONTACT — /contact
 * ============================================================================
 * Server component. Owns the layout and the contact details; the form itself is
 * the only client-rendered part (`<ContactForm>`), so nothing else ships in the
 * client bundle.
 *
 * Layout: two columns on `lg` (form + details), stacked on mobile with the form
 * first — someone who landed here came to write a message, so it should not sit
 * below the fold.
 */

import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/contact/ContactForm";
import {
  ArrowUpRightIcon,
  ClockIcon,
  SocialIcon,
  MailIcon,
} from "@/components/icons/InlineIcons";
import { MeshBackground } from "@/components/motion/MeshBackground";
import { Reveal } from "@/components/motion/Reveal";
import { CopyHandle } from "@/components/socials/CopyHandle";
import { Card } from "@/components/ui/Card";
import { Eyebrow, GradientText, Lede } from "@/components/ui/Typography";
import { contact, profile, socials } from "@/data/profile";
import { buildMetadata, contactReplyWindow } from "@/lib/site";
import { isExternal } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: `Get in touch with ${profile.name} — collaborations, contract work, or questions about agentic systems and Web3. ${contactReplyWindow}.`,
  path: "/contact",
  keywords: [
    "contact",
    profile.name,
    "hire",
    "collaboration",
    profile.location.label,
  ],
});

/* -------------------------------------------------------------------------
 * Small local pieces
 * ---------------------------------------------------------------------- */

/** A definition row in the details panel: icon, label, value. */
function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <span
        aria-hidden="true"
        className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-pill border border-line bg-surface-2 text-[1.05rem] text-brand-purple"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.72rem] font-semibold tracking-[0.14em] text-fg-subtle uppercase">
          {label}
        </p>
        <div className="mt-1 text-[0.92rem] leading-relaxed text-fg">
          {children}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Page
 * ---------------------------------------------------------------------- */

export default function ContactPage() {
  // Only list networks that actually resolve somewhere.
  const configured = socials.filter((social) => social.url);
  const isEmailAddress = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.email);

  return (
    <>
      {/* ---- Hero ---- */}
      <header className="relative isolate overflow-hidden">
        <MeshBackground intensity="hero" count={3} />

        <div className="relative container-page flex flex-col items-center gap-5 py-16 text-center sm:py-20">
          <Eyebrow>Get in touch</Eyebrow>

          <h1 className="max-w-3xl text-[clamp(2rem,1.35rem+3.6vw,3.5rem)] leading-[1.06] font-bold">
            Let&apos;s talk about{" "}
            <GradientText animate>what you&apos;re building</GradientText>
          </h1>

          <Lede className="mx-auto max-w-2xl text-center">
            Whether it&apos;s a product that needs shipping, an agent that needs
            a loop it can survive, or a community that needs order — send a
            message and I&apos;ll reply {contactReplyWindow.toLowerCase()}.
          </Lede>
        </div>
      </header>

      {/* ---- Form + details ---- */}
      <section
        aria-labelledby="contact-form-heading"
        className="container-page pb-24 sm:pb-32"
      >
        <div className="grid items-start gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          {/* ---- Form ---- */}
          <Reveal>
            <Card padding="lg" className="h-full">
              <h2
                id="contact-form-heading"
                className="text-[1.35rem] font-bold tracking-tight"
              >
                Send a message
              </h2>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-fg-muted">
                All three fields are required. Your details are used only to
                reply — nothing is stored on this site.
              </p>

              <div className="mt-7">
                <ContactForm replyWindow={contactReplyWindow} />
              </div>
            </Card>
          </Reveal>

          {/* ---- Details ---- */}
          <Reveal delay={0.08} className="lg:sticky lg:top-24">
            <div className="flex flex-col gap-6">
              <Card padding="lg">
                <h2 className="text-[1.1rem] font-bold tracking-tight">
                  Direct
                </h2>

                <div className="mt-6 flex flex-col gap-6">
                  <DetailRow icon={<MailIcon />} label="Email">
                    {isEmailAddress ? (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <a
                          href={`mailto:${contact.email}`}
                          className="font-medium break-all text-brand-purple underline decoration-brand-purple/35 underline-offset-4 transition-colors hover:decoration-brand-purple"
                        >
                          {contact.email}
                        </a>
                        {/* Copy is the common case for an email on a phone. */}
                        <CopyHandle
                          value={contact.email}
                          label="email address"
                          className="text-[0.78rem]"
                        />
                      </div>
                    ) : (
                      // An unconfigured address (no "@") would render a dead
                      // mailto: link, so show it as text instead.
                      <span className="font-mono text-[0.88rem] break-all text-fg-muted">
                        {contact.email || "Not configured yet"}
                      </span>
                    )}
                  </DetailRow>

                  <DetailRow icon={<ClockIcon />} label="Response time">
                    {contactReplyWindow}
                  </DetailRow>

                  <DetailRow icon={<ArrowUpRightIcon />} label="Based in">
                    {profile.location.label}
                    <span className="block text-[0.82rem] text-fg-subtle">
                      {profile.timeZone}
                    </span>
                  </DetailRow>
                </div>
              </Card>

              {/* ---- Socials quick list ---- */}
              <Card padding="lg">
                <h2 className="text-[1.1rem] font-bold tracking-tight">
                  Elsewhere
                </h2>
                <p className="mt-1.5 text-[0.85rem] text-fg-subtle">
                  Faster for a quick question.
                </p>

                <ul className="mt-5 flex flex-col gap-1.5">
                  {configured.map((social) => {
                    return (
                      <li key={social.id}>
                        <a
                          href={social.url}
                          {...(isExternal(social.url)
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                          className="group flex items-center gap-3 rounded-xl2 px-3 py-2.5 transition-colors duration-300 hover:bg-surface-2"
                        >
                          <span
                            aria-hidden="true"
                            className="grid size-8 shrink-0 place-items-center rounded-pill border border-line bg-surface-2 text-[1rem] text-fg-muted transition-colors group-hover:text-brand-purple"
                          >
                            <SocialIcon id={social.id} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[0.88rem] font-semibold text-fg">
                              {social.label}
                            </span>
                            {social.handle ? (
                              <span className="block truncate font-mono text-[0.76rem] text-fg-subtle">
                                {social.handle}
                              </span>
                            ) : null}
                          </span>
                          <ArrowUpRightIcon className="ml-auto shrink-0 text-[0.95rem] text-fg-subtle transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-brand-purple" />
                        </a>
                      </li>
                    );
                  })}
                </ul>

                <Link
                  href="/socials"
                  className="mt-5 inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-brand-purple underline decoration-brand-purple/35 underline-offset-4 transition-colors hover:decoration-brand-purple"
                >
                  See all links
                  <ArrowUpRightIcon className="text-[0.95em]" />
                </Link>
              </Card>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
