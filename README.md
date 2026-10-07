# Personal Branding Site

A multi-page personal branding / biodata site built with **Next.js 16 (App
Router)**, **TypeScript (strict)**, **Tailwind CSS v4**, **Framer Motion** and
**next-themes**.

Visual direction is inspired by [ethereum.org](https://ethereum.org): spacious
editorial layout, large bold headlines, an iridescent purple→blue→pink→orange
gradient palette, generous rounded corners, soft layered shadows, and animated
mesh-gradient blobs behind key sections.

**All artwork is inline SVG or CSS.** There are no remote images and no binary
assets in the repo — the hero's faceted octahedron, the favicon, the Apple touch
icon and the Open Graph card are all generated from code.

---

## Table of contents

1. [Quick start](#quick-start)
2. [Scripts](#scripts)
3. [Project structure](#project-structure)
4. [Editing your content](#editing-your-content)
   - [Personal data (`src/data/profile.ts`)](#1-personal-data--srcdataprofilets)
   - [Projects (`src/data/projects.ts`)](#2-projects--srcdataprojectsts)
   - [Blog posts (`src/content/blog/*.mdx`)](#3-blog-posts--srccontentblogmdx)
5. [Theming & design tokens](#theming--design-tokens)
6. [Contact form & email delivery](#contact-form--email-delivery)
7. [SEO](#seo)
8. [Accessibility & motion](#accessibility--motion)
9. [Deploying to Vercel](#deploying-to-vercel)
10. [Troubleshooting](#troubleshooting)

---

## Quick start

**Requirements:** Node.js 20.9+ (project developed on Node 24) and npm.

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file (optional for local dev)
cp .env.example .env.local        # macOS / Linux
copy .env.example .env.local      # Windows PowerShell / CMD

# 3. Start the dev server
npm run dev
```

Open <http://localhost:3000>.

> **Windows note:** if `npm install` reports `EBUSY` on `node_modules/.next-*`,
> a dev server was running during install. Close it and re-run `npm install`.

---

## Scripts

| Command                | What it does                                           |
| ---------------------- | ------------------------------------------------------ |
| `npm run dev`          | Start the dev server with hot reload (Turbopack).      |
| `npm run build`        | Production build. Fails on any type or lint error.     |
| `npm run start`        | Serve the production build locally. Run `build` first. |
| `npm run lint`         | ESLint across the repo.                                |
| `npm run lint:fix`     | ESLint with `--fix`.                                   |
| `npm run typecheck`    | `tsc --noEmit` — types only, no build.                 |
| `npm run format`       | Prettier write.                                        |
| `npm run format:check` | Prettier check (use this in CI).                       |

---

## Project structure

```
branding/
├─ src/
│  ├─ app/                          # App Router: every route lives here
│  │  ├─ layout.tsx                 # Root shell: fonts, theme, navbar, footer
│  │  ├─ globals.css                # Design tokens + Tailwind theme bridge
│  │  ├─ page.tsx                   # /            Home
│  │  ├─ loading.tsx                # Route-change skeleton (add per route)
│  │  ├─ not-found.tsx              # Custom 404
│  │  ├─ icon.svg                   # Favicon (served at /icon.svg)
│  │  ├─ apple-icon.tsx             # /apple-icon  — generated PNG
│  │  ├─ opengraph-image.tsx        # /opengraph-image — generated OG card
│  │  ├─ manifest.ts                # /manifest.webmanifest
│  │  ├─ robots.ts                  # /robots.txt
│  │  ├─ sitemap.ts                 # /sitemap.xml
│  │  ├─ about/page.tsx             # /about
│  │  ├─ projects/
│  │  │  ├─ page.tsx                # /projects
│  │  │  └─ [slug]/page.tsx         # /projects/<slug>
│  │  ├─ blog/
│  │  │  ├─ page.tsx                # /blog
│  │  │  ├─ PostIndex.tsx           #   client-side tag filter
│  │  │  └─ [slug]/page.tsx         # /blog/<slug>
│  │  ├─ socials/page.tsx           # /socials
│  │  ├─ contact/page.tsx           # /contact
│  │  └─ api/contact/route.ts       # POST /api/contact
│  │
│  ├─ components/
│  │  ├─ layout/                    # Navbar, Footer
│  │  ├─ theme/                     # ThemeProvider, ThemeToggle
│  │  ├─ motion/                    # Reveal, MeshBackground, PageTransition
│  │  ├─ illustrations/             # AnimatedDiamond (hero art)
│  │  ├─ icons/                     # InlineIcons — every glyph, one file
│  │  ├─ ui/                        # Button, Card, Tag, Skeleton, Typography
│  │  ├─ home/                      # Hero + home-page sections
│  │  ├─ about/                     # About-page sections
│  │  ├─ blog/                      # PostCard, MdxContent
│  │  ├─ projects/                  # ProjectCard, ProjectGrid, ProjectFilter
│  │  ├─ socials/                   # SocialTable, CopyHandle
│  │  └─ contact/                   # ContactForm
│  │
│  ├─ content/blog/                 # ← your MDX posts live here
│  ├─ data/                         # ← your content lives here
│  │  ├─ profile.ts                 # identity, bio, skills, timeline, socials
│  │  └─ projects.ts                # project list + helpers
│  ├─ lib/
│  │  ├─ site.ts                    # SITE_URL, navItems, buildMetadata()
│  │  ├─ blog.ts                    # MDX content layer (server-only)
│  │  └─ utils.ts                   # cn(), dates, reading time, accents
│  └─ types/                        # ambient type declarations
├─ next.config.ts
├─ eslint.config.mjs
├─ prettier.config.mjs
├─ postcss.config.mjs
└─ tsconfig.json                    # strict: true
```

---

## Editing your content

Everything you'd want to change lives in **three places**. You should never need
to touch a component to update your own details.

### 1. Personal data → `src/data/profile.ts`

This is the single source of truth for your identity. The navbar, footer, home
hero, `/about`, `/socials` and `sitemap.xml` all read from it.

| Export                       | Controls                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `profile.name` / `shortName` | Name in the navbar, footer, `<title>` and OG card.                             |
| `profile.tagline`            | Array of phrases cycled by the hero typing animation. One entry = no rotation. |
| `profile.shortBio`           | Hero paragraph and the default meta description.                               |
| `profile.longBio`            | String array; each item is a paragraph on `/about`.                            |
| `profile.location`           | Location label + approximate map coordinates.                                  |
| `profile.availability`       | The green "live" pill in the hero and the footer.                              |
| `profile.timeZone`           | Shown in the hero meta row and on `/socials`.                                  |
| `contact.email`              | `mailto:` link and the contact form's recipient.                               |
| `socials`                    | The `/socials` table, the footer icon strip and the hero strip.                |
| `skillGroups`                | The three skill columns on `/about` (`trader`, `builder`, `moderator`).        |
| `timeline`                   | Education / experience / milestones on `/about`.                               |
| `stats`                      | The four number cards on the home page.                                        |
| `funFacts`                   | The fun-facts grid on `/about`. `icon` is a key in `InlineIcons.tsx`.          |

**Socials.** Each entry is:

```ts
{
  id: "github",           // "github" | "x" | "instagram" | "website"
                          // → picks the SVG icon via getSocialIcon(id)
  label: "GitHub",        // display name
  handle: "Rizkijack",    // shown next to the icon; "" hides it
  url: "https://…",       // "" renders the row as "Not configured"
                          // (never a broken link)
  note: "One-line description.",
}
```

To hide a network entirely, delete its entry. To add one that isn't in the
built-in set, add an icon to `src/components/icons/InlineIcons.tsx` and register
it in the `socialIcons` map at the bottom of that file.

**Skill levels** are `0–100` and render as a bar. The number is also exposed to
screen readers via `aria-label`, so the bar is never the only signal.

### 2. Projects → `src/data/projects.ts`

The `projects` array drives `/projects`, `/projects/<slug>`, the home page
featured grid, the tag filter and `sitemap.xml`.

```ts
{
  slug: "my-project",        // → /projects/my-project  (URL-safe, unique)
  title: "My Project",
  summary: "One line for the card — keep it under ~110 characters.",
  description: "The longer pitch, used on the detail page and for SEO.",
  tech: ["Next.js", "TypeScript"],   // filter tags
  link: "https://…",         // "" → no "Visit" button
  repo: "https://…",         // "" → no "Source code" button
  status: "live",            // "live" | "in-progress" | "archived"
  featured: true,            // shows on the home page (max 3 render)
  year: "2025",
  role: "Solo",              // e.g. "Solo", "2-person team"
  accent: "#8a5cf6",         // top-edge glow colour on the card
  highlights: ["…", "…"],    // 3–6 outcome bullets, rendered as a checklist
  body: `## Optional markdown`,   // optional long-form section
}
```

The four shipped entries are **placeholders** so every route renders real content
out of the box. Replace them.

> `npm run build` prerenders every project via `generateStaticParams()`, so a
> typo in a `slug` is a build error rather than a 404 in production.

### 3. Blog posts → `src/content/blog/*.mdx`

Create a new `.mdx` file; the filename becomes the URL. No registration needed —
`/blog`, `/blog/<slug>`, `sitemap.xml` and `generateStaticParams()` all pick it
up automatically.

```mdx
---
title: Your Post Title
description: One or two sentences. Used as the card excerpt and meta description.
date: 2026-03-01 # ISO 8601 — this is the sort key
tags: ["TypeScript", "Web3"]
featured: false # optional — highlighted at the top of /blog
draft: false # optional — true hides it from the index + sitemap
---

Your markdown here. Headings, lists, tables, blockquotes and fenced code
blocks are all supported.
```

**Code blocks** are highlighted at build time by `shiki` via
`rehype-pretty-code`, so **no highlighter ships to the browser**:

````mdx
```ts showLineNumbers
const answer: number = 42;
```
````

Add `showLineNumbers` for line numbers, and `title="src/file.ts"` for a filename
bar. Both themes (`github-light` / `github-dark-dimmed`) are emitted and swapped
by the `.dark` class — no flash, no re-render.

**Reading time** is computed from the post body (`src/lib/utils.ts`), 225 wpm
for prose, so you never maintain it by hand.

---

## Theming & design tokens

All colours, radii, shadows and fonts are CSS custom properties defined in
**`src/app/globals.css`**:

1. `:root { … }` holds the **light** palette. `.dark { … }` overrides it.
2. `@theme inline { … }` maps those variables onto Tailwind utilities — which is
   why `bg-surface`, `text-fg-muted`, `border-line`, `rounded-card` and
   `shadow-glow` all work without a `tailwind.config.ts` (Tailwind v4 is
   CSS-first).

**To restyle the site, edit the variables — not the components.**

| Token            | Light                   | Dark      | Used for                     |
| ---------------- | ----------------------- | --------- | ---------------------------- |
| `--bg`           | `#f8f7ff`               | `#0b0b14` | Page background              |
| `--fg`           | `#1c1c1c`               | `#f5f5f7` | Body text                    |
| `--fg-muted`     | `#565473`               | `#b0adc9` | Secondary text               |
| `--fg-subtle`    | `#6f6c8a`               | `#8f8cae` | Tertiary text                |
| `--brand-purple` | `#8a5cf6`               | `#a78bfa` | Primary accent               |
| `--brand-blue`   | `#627eea`               | `#8b9ff5` | Secondary accent             |
| `--brand-pink`   | `#f472b6`               | `#f9a8d4` | Tertiary accent              |
| `--brand-orange` | `#ff9f5a`               | `#ffb47f` | Warm accent                  |
| `--grad-hero`    | purple→blue→pink→orange | same      | Gradient text, buttons, rims |

Every text token is contrast-checked against its background (the worst pair,
`--fg-subtle` on `--bg`, is 4.6:1 — above the WCAG AA 4.5:1 floor).

**Theme behaviour.** Light is the default; `enableSystem` means a visitor whose
OS prefers dark gets dark. An inline script in `layout.tsx` applies the class
before first paint, so there is no white flash. The toggle writes to
`localStorage["branding-theme"]`.

Custom utilities available in `globals.css`: `text-gradient`, `glass`,
`border-gradient-after`, `divider-gradient`, `skeleton`, `progress-bar`,
`container-page`.

---

## Contact form & email delivery

The form validates on the client, then POSTs to `/api/contact`. The route
handler re-validates server-side (never trust the browser), applies a best-effort
rate limit, and checks a honeypot field.

**It works out of the box with zero configuration.** With no env vars set, the
route runs in **log mode**: submissions are validated and printed to the server
console with `console.info`.

To send real email via [Resend](https://resend.com) (HTTP API — no extra
dependency):

```bash
# .env.local  (and your Vercel project env vars)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CONTACT_TO_EMAIL=you@yourdomain.com
CONTACT_FROM_EMAIL=Website <hello@yourdomain.com>
```

Restart the dev server after adding them. `reply_to` is set to the visitor's
address, so hitting reply in your inbox answers them directly.

> **Serverless caveat:** the in-memory rate limiter resets on every cold start.
> It stops casual abuse, not a determined attacker. For real enforcement, move
> the counter to Redis or a KV store.

---

## SEO

| Feature              | Where                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| Per-page metadata    | `buildMetadata()` in `src/lib/site.ts`, called by every page.                                          |
| Title template       | `%s · Rizkijack` from `layout.tsx`.                                                                    |
| Canonical URLs       | `alternates.canonical` in `buildMetadata()`.                                                           |
| Open Graph / Twitter | `openGraph` + `twitter` in `buildMetadata()`; the image is generated by `src/app/opengraph-image.tsx`. |
| `sitemap.xml`        | `src/app/sitemap.ts` — static routes + every published post.                                           |
| `robots.txt`         | `src/app/robots.ts` — allows all, disallows `/api/`.                                                   |
| Favicon              | `src/app/icon.svg`.                                                                                    |
| Apple touch icon     | `src/app/apple-icon.tsx`.                                                                              |
| PWA manifest         | `src/app/manifest.ts`.                                                                                 |
| Article metadata     | `/blog/<slug>` and `/projects/<slug>` set `openGraph.type = "article"`.                                |

**Before deploying**, set the real domain so canonical URLs and the sitemap are
absolute:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

Everything falls back to `http://localhost:3000` if it is unset, so local builds
still work.

---

## Accessibility & motion

- Semantic landmarks (`header` / `nav` / `main` / `footer`), a skip-to-content
  link, and one `<h1>` per page.
- Visible focus ring on every interactive element, defined once via
  `:focus-visible` in `globals.css`.
- The mobile menu traps nothing but closes on `Escape`, closes on route change,
  returns focus to its trigger, and locks body scroll without layout shift.
- The hero's animated tagline is `aria-hidden`; the real page heading is a
  static, crawlable `<h1>`.
- Skill bars expose their value via `aria-label`; `aria-pressed` is used for
  filter chips; errors use `role="alert"` and are wired up with
  `aria-describedby`.
- **Reduced motion is honoured everywhere.** `framer-motion`'s
  `useReducedMotion()` disables the hero typing, the diamond's float/rotate/orbit
  and pointer parallax, page transitions, scroll reveals and the route progress
  bar. A global `@media (prefers-reduced-motion: reduce)` rule in `globals.css`
  zeroes every remaining animation and transition as a safety net.
- Blur is skipped entirely on the mesh blobs when motion is reduced, which also
  helps low-end mobile devices.

---

## Performance notes

- **Zero remote images.** No `next/image` is needed; all art is inline SVG/CSS.
- **The syntax highlighter never reaches the browser.** `shiki` and
  `rehype-pretty-code` run at build time and are listed in
  `serverExternalPackages`.
- **Fonts are self-hosted** by `next/font` with `display: swap` and generated
  `size-adjust` metrics, so swapping causes no layout shift.
- **Motion runs on the compositor** where possible: the diamond's orbit and the
  mesh blobs use CSS `@keyframes`; scroll parallax uses Framer's rAF loop rather
  than a React state update per scroll event.
- **Blur is the expensive part of the design.** `MeshBackground` skips the blur
  filter under reduced motion and caps the blob count via the `count` prop. On
  very low-end devices, pass `count={2}` or `count={3}` at the call site.

---

## Deploying to Vercel

### Option A — Dashboard (recommended)

1. Push the repo to GitHub.
2. Go to <https://vercel.com/new> and import the repository.
3. Vercel detects Next.js automatically. Leave Build Command and Output
   Directory at their defaults (`npm run build`, `.next`).
4. Add the environment variables under **Settings → Environment Variables**
   (at minimum `NEXT_PUBLIC_SITE_URL`; add the `RESEND_*` vars if you wired up
   email). Apply them to **Production, Preview and Development**.
5. Click **Deploy**.
6. After the first deploy, add your custom domain under **Settings → Domains**,
   then update `NEXT_PUBLIC_SITE_URL` to match and redeploy so canonical URLs and
   `sitemap.xml` are correct.

### Option B — CLI

```bash
npm i -g vercel
vercel login
vercel                 # preview deployment
vercel --prod          # production deployment
```

### Post-deploy checklist

- [ ] `NEXT_PUBLIC_SITE_URL` is set to the real domain (with `https://`, no
      trailing slash).
- [ ] `/sitemap.xml` and `/robots.txt` load and contain absolute URLs.
- [ ] `/opengraph-image` renders — paste a URL into
      [opengraph.xyz](https://www.opengraph.xyz) to preview the card.
- [ ] Submit `/sitemap.xml` in Google Search Console.
- [ ] Submit a test message through `/contact` and confirm it arrives (or that
      the log-mode message appears in the Vercel function logs).

---

## Troubleshooting

**`Module not found: Can't resolve '@/…'`**
The `@/*` alias maps to `./src/*` (see `tsconfig.json`). Confirm the file is
under `src/` and that the import omits `src/`.

**A blog post doesn't appear**
Check the frontmatter: `title`, `description` and `date` are required, and the
filename must be lowercase and URL-safe. `draft: true` intentionally hides a post
from the index and sitemap.

**A post shows the wrong date**
Sorting uses the parsed `date` field, normalised to UTC midnight. Use
`YYYY-MM-DD`.

**Theme flickers on load**
Make sure `suppressHydrationWarning` is still on `<html>` in `layout.tsx` and
that the inline `THEME_BOOTSTRAP` script is still rendered in `<head>`.

**`EBUSY` during `npm install` on Windows**
Stop `npm run dev` first — Turbopack holds handles inside `node_modules`.

**Code blocks are uncoloured**
`rehype-pretty-code` needs a language on the fence (` ```ts `). A bare
` ``` ` falls back to `plaintext` and renders unstyled.

**The contact form returns "not configured"**
That is log mode, not an error — set `RESEND_API_KEY` (and restart) to send real
email.

---

## License

Personal project — all rights reserved unless you add a license file.
