/**
 * ============================================================================
 * PROJECTS — drives /projects, /projects/[slug] and the home page highlights.
 * ============================================================================
 * These are PLACEHOLDER entries written so every route renders real content out
 * of the box. Swap the copy for your own work — nothing else needs changing.
 *
 * Field notes
 * -----------
 * slug      URL-safe unique id. Becomes /projects/<slug>. Changing it breaks
 *           inbound links, so keep old slugs as redirects once they're public.
 * featured  Shows on the home page (max 3 are picked automatically).
 * status    live | in-progress | archived — drives the status chip colour.
 * accent    Any CSS colour; used for the card's top edge glow.
 * link      Primary CTA. Use "" to render a "private" pill instead.
 * repo      Optional source link, shown as a second pill on the detail page.
 * body      Optional long-form markdown. Rendered on the detail page. Leave ""
 *           and the page falls back to `highlights`.
 */

import type { ReactNode } from "react";

export type ProjectStatus = "live" | "in-progress" | "archived";

export interface Project {
  readonly slug: string;
  readonly title: string;
  /** One line for the card. Keep under ~110 characters. */
  readonly summary: string;
  /** Longer pitch used on the detail page and for SEO. */
  readonly description: string;
  /** Filter tags, e.g. ["Next.js", "Solidity"]. Also feed the tag filter. */
  readonly tech: readonly string[];
  /** Live URL, or "" if private/unpublished. */
  readonly link: string;
  /** Source repo URL, or "". */
  readonly repo: string;
  readonly status: ProjectStatus;
  readonly featured: boolean;
  /** e.g. "2025". Shown on the card + used to sort newest-first. */
  readonly year: string;
  /** Short role label, e.g. "Solo" or "2-person team". */
  readonly role: string;
  /** Top-edge glow colour on the card. */
  readonly accent: string;
  /** 3–6 outcome bullets on the detail page. */
  readonly highlights: readonly string[];
  /** Optional markdown body. */
  readonly body?: string;
  /** Optional problem/solution split, rendered as two columns. */
  readonly challenge?: ReactNode;
}

export const projects: readonly Project[] = [
  {
    slug: "slopagentbook",
    title: "Slop Agent Book",
    summary:
      "A field handbook for building agentic systems: patterns, failure modes, and the parts the demos leave out.",
    description:
      "Slop Agent Book is a living document of things I wish someone had told me before wiring my first tool-calling loop. Every entry is a pattern I have actually shipped: prompt caching that mattered, guardrails that fired in production, evaluation harnesses that caught regressions before users did. It exists because most agent content online is either a toy demo or a vendor whitepaper, and neither is useful on a Tuesday afternoon.",
    tech: ["Next.js", "TypeScript", "MDX", "AI Agents"],
    link: "https://slopagentbook.vercel.app",
    repo: "",
    status: "live",
    featured: true,
    year: "2025",
    role: "Solo",
    accent: "#8a5cf6",
    highlights: [
      "20+ patterns written from shipped code, not from theory",
      "MDX-based pipeline with syntax highlighting and a searchable index",
      "Fully static — deploys in seconds, costs nothing to host",
      "Open roadmap: readers vote on which failure mode gets written next",
    ],
    body: `## Why it exists

Agent frameworks change every few months, but the *shapes* of failure do not. A tool call goes wrong in the same handful of ways whether the runtime is a 50-line loop or a framework with a 50-page docs site.

So the book is organised around **failure modes**, not around features:

- **Context rot** — the model stops seeing the instruction that mattered.
- **Tool sprawl** — too many similar tools, so it picks the wrong one.
- **Silent degradation** — the loop keeps "succeeding" while quality drops.
- **Unbounded autonomy** — no budget, no stop condition, no audit trail.

## How it's built

The whole thing is one static Next.js app. Posts are MDX files read at build time, so there is no database and no runtime to keep alive. Reading time is computed from the raw source, and every code fence goes through a build-time highlighter — no highlighter is shipped to the browser.

The unglamorous decision that mattered most: **the site is a static export**. It deploys in about ten seconds and has never been down.`,
  },
  {
    slug: "onchain-signal-desk",
    title: "On-chain Signal Desk",
    summary:
      "A dashboard that turns raw wallet flows into a short, explainable list of things worth looking at.",
    description:
      "Most on-chain dashboards show you everything and let you decide what's important, which is a work problem disguised as a design problem. Signal Desk inverts it: it normalises transfer flows across several chains, scores them against a small set of explainable heuristics, and shows only the handful that cleared the bar — each with the reasoning attached. The goal is a tool that makes you think, not one that tells you what to buy.",
    tech: ["TypeScript", "Node.js", "PostgreSQL", "Next.js", "Web3"],
    link: "",
    repo: "",
    status: "in-progress",
    featured: true,
    year: "2025",
    role: "2-person team",
    accent: "#627eea",
    highlights: [
      "Multi-chain ingestion with automatic reorg handling and backfills",
      "Every signal carries its own explanation — no black-box scores",
      "Median event-to-display latency cut by ~70% with batched writes",
      "Read-only until the very end: analysis mode by default",
    ],
    challenge: undefined,
  },
  {
    slug: "mod-cli",
    title: "Mod CLI",
    summary:
      "A small command-line toolkit for community moderators: audit logs, bulk actions, and templated responses.",
    description:
      "Moderators do the same four operations a thousand times a month: mute, warn, purge, and explain. Mod CLI wraps those into reviewable commands with dry-run previews and a CSV-shaped audit trail, so an action taken at 3am can be reconstructed the next morning. It grew out of a private script I wrote to stop mis-clicking in a 4,000-member Discord.",
    tech: ["Node.js", "TypeScript", "Discord.js", "CLI"],
    link: "",
    repo: "https://github.com/Rizkijack",
    status: "live",
    featured: true,
    year: "2024",
    role: "Solo",
    accent: "#f472b6",
    highlights: [
      "Dry-run by default — destructive actions require an explicit --confirm",
      "Append-only JSONL audit log with replay support",
      "Templated responses with variables for member and channel context",
      "Zero runtime dependencies beyond the Discord client",
    ],
  },
  {
    slug: "shrimp-terminal",
    title: "Shrimp Terminal",
    summary:
      "A keyboard-first, terminal-flavoured watchlist and journal that keeps trading notes next to the chart.",
    description:
      "Keeping a trading journal is easy; keeping one you will actually read is not. Shrimp Terminal puts a fast, keyboard-driven journal in front of a price chart, so logging a decision takes two keystrokes instead of opening a spreadsheet. Screenshots, feelings, and rules live in the same row, which is the only reason the notes stay honest.",
    tech: ["React", "TypeScript", "Vite", "Tailwind CSS", "Web3"],
    link: "",
    repo: "",
    status: "archived",
    featured: false,
    year: "2024",
    role: "Solo",
    accent: "#ff9f5a",
    highlights: [
      "Two-keystroke journal entry while the chart is still open",
      "Rule check on save: warns when an entry violates your own written plan",
      "Exported 3 years of entries and they were actually readable",
      "Retired once charting moved fully on-chain",
    ],
  },
];

/** Fast lookup used by the detail page's generateStaticParams + metadata. */
export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** Up to three featured projects, in declaration order. */
export function getFeaturedProjects(limit = 3): Project[] {
  return projects.filter((p) => p.featured).slice(0, limit);
}

/**
 * Projects that share at least one tag with `slug` — powers the
 * "related work" block at the bottom of each detail page.
 */
export function getRelatedProjects(slug: string, limit = 2): Project[] {
  const current = getProject(slug);
  if (!current) return [];

  return projects
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      project: p,
      // Score by tag overlap so the closest match ranks first.
      score: p.tech.filter((t) => current.tech.includes(t)).length,
    }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.project.title.localeCompare(b.project.title),
    )
    .slice(0, limit)
    .map((entry) => entry.project);
}

/** Every distinct tech tag across all projects, sorted — feeds the filter bar. */
export function getAllTechTags(): string[] {
  return [...new Set(projects.flatMap((p) => p.tech))].sort((a, b) =>
    a.localeCompare(b),
  );
}
