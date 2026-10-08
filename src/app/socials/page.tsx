/**
 * ============================================================================
 * /socials — where to find me
 * ============================================================================
 * Server component. The whole page is derived from `socials` and `profile` in
 * data/profile.ts, so adding a platform there is the only edit needed.
 *
 * The only JS on this route is <MeshBackground>, the <Reveal*> wrappers, and
 * the client-side <SocialOrbit> canvas (which renders null when the 3D layer
 * is off).
 */

import type { Metadata } from "next";

import {
  ClockIcon,
  GlobeIcon,
  MailIcon,
  SparklesIcon,
} from "@/components/icons/InlineIcons";
import { MeshBackground } from "@/components/motion/MeshBackground";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { CopyHandle } from "@/components/socials/CopyHandle";
import { emailHref, SocialTable } from "@/components/socials/SocialTable";
import { SocialOrbit } from "@/components/three/SocialOrbit";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import {
  Eyebrow,
  GradientDivider,
  GradientText,
  Lede,
  Section,
} from "@/components/ui/Typography";
import { contact, profile, socials } from "@/data/profile";
import { buildMetadata, contactReplyWindow } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Socials",
  description:
    "Every account, site and channel I actually keep active — plus the fastest way to reach me directly.",
  path: "/socials",
  keywords: [
    "social links",
    "github",
    profile.name,
    "contact",
    profile.availability.toLowerCase(),
  ],
});

/** "Elsewhere" cards. Kept local so the page reads top-to-bottom. */
const elsewhere = [
  {
    id: "location",
    label: "Based in",
    value: profile.location.label,
    icon: GlobeIcon,
  },
  {
    id: "availability",
    label: "Status",
    value: profile.availability,
    icon: SparklesIcon,
  },
  {
    id: "timezone",
    label: "Time zone",
    value: profile.timeZone,
    icon: ClockIcon,
  },
] as const;

export default function SocialsPage() {
  const mailto = emailHref(contact.email);
  const liveSocials = socials.filter((social) => social.url);
  const live = liveSocials.length;

  return (
    <>
      {/* -------------------------------------------------------------------
          Hero. The section owns the stacking context and clips the drifting
          blobs, so MeshBackground can stay absolutely positioned.
          ------------------------------------------------------------------- */}
      <section className="relative isolate overflow-hidden">
        <MeshBackground intensity="hero" />

        <div className="relative z-10 container-page pt-16 pb-6 sm:pt-24 sm:pb-10">
          <header className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <Eyebrow>Find me here</Eyebrow>

            <h1 className="text-[clamp(2.4rem,1.4rem+4.4vw,4.2rem)] leading-[1.05] font-bold">
              Every place I <GradientText animate>actually post</GradientText>
            </h1>

            <Lede className="mx-auto max-w-2xl text-center">
              {live} live {live === 1 ? "channel" : "channels"} — the ones I
              read replies on, not a graveyard of accounts I opened once. If
              something here is stale, tell me and I&apos;ll fix it.
            </Lede>
          </header>
        </div>
      </section>

      {/* -------------------------------------------------------------------
          The table
          ------------------------------------------------------------------- */}
      <Section className="pb-20 sm:pb-28">
        <div className="container-page">
          <GradientDivider />

          <header className="mt-14 flex flex-col gap-3">
            <Eyebrow as="h2">The links</Eyebrow>
            <p className="max-w-2xl text-[0.95rem] text-fg-muted">
              Platform, handle, and a way straight there. Anything marked
              &ldquo;not configured&rdquo; is a slot waiting for a handle.
            </p>
          </header>

          {/*
            3D orbit — one faceted node per live channel around a central core.
            Decorative and aria-hidden: the table below is the real content, so
            keyboard and screen-reader users lose nothing. Renders null when the
            3D layer is off, so the table stands alone. The host needs an
            explicit height — R3F's <Canvas> fills its parent.
          */}
          <SocialOrbit socials={liveSocials} className="mt-8 h-56 sm:h-72" />

          <div className="mt-10">
            <SocialTable socials={socials} />
          </div>
        </div>
      </Section>

      {/* -------------------------------------------------------------------
          Elsewhere — the facts that are not links
          ------------------------------------------------------------------- */}
      <Section className="pb-20 sm:pb-28">
        <div className="container-page">
          <header className="flex flex-col gap-3">
            <Eyebrow as="h2">Elsewhere</Eyebrow>
            <h2 className="text-[clamp(1.75rem,1.15rem+2.6vw,3rem)] leading-[1.1] font-bold">
              Or skip the platforms entirely
            </h2>
          </header>

          <RevealGroup
            className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            stagger={0.08}
          >
            {/* Email first — it is the one that actually reaches a human. */}
            <RevealItem className="sm:col-span-2">
              <Card interactive padding="md" accent="#8a5cf6">
                <div className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className="grid size-10 shrink-0 place-items-center rounded-pill border border-line bg-surface-2 text-[1.15rem] text-brand-purple"
                  >
                    <MailIcon />
                  </span>

                  <div className="min-w-0">
                    <Eyebrow as="p" className="text-fg-subtle">
                      Email
                    </Eyebrow>

                    {mailto ? (
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <a
                          href={mailto}
                          className="font-mono text-[0.95rem] text-fg underline decoration-brand-purple/40 underline-offset-4 transition-colors hover:text-brand-purple"
                        >
                          {contact.email}
                        </a>
                        <CopyHandle
                          value={contact.email}
                          label="email address"
                        />
                      </div>
                    ) : (
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span className="font-mono text-[0.95rem] text-fg-subtle italic">
                          {contact.email}
                        </span>
                        <Tag variant="neutral" size="md">
                          Not an address yet
                        </Tag>
                      </div>
                    )}

                    <p className="mt-2 text-[0.85rem] text-fg-muted">
                      {mailto
                        ? `No bot, no newsletter — just a mailbox. ${contactReplyWindow}.`
                        : "Set contact.email in src/data/profile.ts and this becomes a mailto link."}
                    </p>
                  </div>
                </div>
              </Card>
            </RevealItem>

            {elsewhere.map(({ id, label, value, icon: Icon }) => (
              <RevealItem key={id}>
                <Card interactive padding="md" className="h-full">
                  <div className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center rounded-pill border border-line bg-surface-2 text-[1.15rem] text-fg-muted"
                    >
                      <Icon />
                    </span>

                    <div className="min-w-0">
                      <Eyebrow as="p" className="text-fg-subtle">
                        {label}
                      </Eyebrow>
                      <p className="mt-2 text-[0.95rem] font-medium text-fg">
                        {value}
                      </p>
                    </div>
                  </div>
                </Card>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </Section>

      {/* -------------------------------------------------------------------
          Closing CTA
          ------------------------------------------------------------------- */}
      <Section className="pb-24 sm:pb-32">
        <div className="container-page">
          <Card padding="lg" className="text-center">
            <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4">
              <Eyebrow>One more thing</Eyebrow>

              <h2 className="text-[clamp(1.6rem,1.1rem+2vw,2.5rem)] leading-[1.12] font-bold">
                Got a question that doesn&apos;t fit a handle?
              </h2>

              <Lede className="text-center">
                Use the form and it lands straight in my inbox with your reply
                address attached. Bug reports, half-formed ideas and &ldquo;is
                this even possible?&rdquo; are all welcome.
              </Lede>

              <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row">
                <Button href="/contact" size="lg">
                  Start a conversation
                </Button>
                <Button href="/projects" variant="secondary" size="lg">
                  See what I&apos;ve shipped
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Section>
    </>
  );
}
