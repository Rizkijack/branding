/**
 * ============================================================================
 * PROFILE — single source of truth for personal data.
 * ============================================================================
 * Everything on the site that describes *you* lives here. Edit this file only;
 * no component needs to be touched to update your name, links, timeline, etc.
 *
 * Pro tip: keep this file purely declarative (data only, no logic) so it stays
 * safe to import from server components, client components and metadata helpers.
 */

/** A link that points somewhere off-site (or on-site) and renders as a chip/row. */
export interface ProfileLink {
  /** Machine key, e.g. "github". Used for icon lookup + React keys. */
  readonly id: string;
  /** Human label, e.g. "GitHub". */
  readonly label: string;
  /** Handle without the @, e.g. "Rizkijack". Empty when it doesn't apply. */
  readonly handle: string;
  /** Absolute URL. Leave as "" to render the row as "unavailable". */
  readonly url: string;
  /** One-line explanation shown on /socials and in the footer. */
  readonly note: string;
}

/** One capability inside a skill category. */
export interface Skill {
  readonly name: string;
  /** 0–100. Used for the bar width and as an accessible percentage label. */
  readonly level: number;
  /** Optional short proof point, e.g. "2 yrs on-chain". */
  readonly note?: string;
}

/** A category of skills, e.g. "Builder". */
export interface SkillGroup {
  /** Slugified id, used for anchors and React keys. */
  readonly id: string;
  readonly title: string;
  /** One-line description of what this category covers. */
  readonly blurb: string;
  readonly skills: readonly Skill[];
}

/** A point in time on the /about timeline. */
export interface TimelineEntry {
  readonly id: string;
  /** "education" | "experience" | "milestone" — drives the badge + filter. */
  readonly kind: "education" | "experience" | "milestone";
  readonly title: string;
  /** Organisation, school, community… */
  readonly org: string;
  /** Location if meaningful, otherwise omit. */
  readonly location?: string;
  /** Display date, e.g. "2024 — Present" or "Aug 2025". */
  readonly period: string;
  readonly summary: string;
  /** Optional bullet list of what you did there. */
  readonly details?: readonly string[];
}

/** A lighthearted fact for /about. */
export interface FunFact {
  readonly id: string;
  readonly icon: string; // key into components/icons/InlineIcons.tsx
  readonly label: string;
  readonly value: string;
}

/** A single headline number for the home page stats strip. */
export interface Stat {
  readonly id: string;
  readonly value: string;
  readonly label: string;
  /** Small caption under the label. */
  readonly hint: string;
}

/* ========================================================================== */
/*                                 IDENTITY                                    */
/* ========================================================================== */

export const profile = {
  name: "Rizkijack",
  /** Used in <title> templates and the navbar lockup. */
  shortName: "Rizkijack",
  /** Rotated by the hero typing animation. First item renders immediately. */
  tagline: ["Full-Stack Agentic & Web3.0 Enthusiast"] as readonly string[],
  /** `/about` opener + SEO meta description. */
  shortBio:
    "Full-stack developer and agentic-systems builder trading on-chain, shipping products, and moderating communities from Central Java, Indonesia.",
  /** Multi-paragraph `/about` bio. Rendered with a blank line between items. */
  longBio: [
    "I'm Rizkijack — a full-stack developer who sits at the intersection of agentic AI and Web3. Most of my days are split between shipping products end-to-end, reading charts, and keeping a couple of online communities healthy. I like work that has a visible surface: a URL someone can open, a transaction someone can verify.",
    "Technically I'm a TypeScript-first builder. I reach for React and Next.js on the front, Node and Postgres behind it, and I care a lot about the boring parts — type safety, small deployable units, and interfaces that stay fast on a mid-range Android phone. Lately I've been deep into agent workflows: tool-calling loops, evaluation harnesses, and giving models just enough context to be useful instead of just impressive.",
    "On the Web3 side I've shipped smart contracts, handled on-chain data, and learned the hard way that “the contract is correct” and “the product works” are different problems. I'm comfortable across the stack, sceptical of hype, and happiest when I'm turning an idea into something I can hand to a stranger and let them poke at it.",
    "Away from the keyboard I'm usually in Central Java — trading when the setup is clean, reading when it isn't, and maintaining communities of builders who are twelve timezones from each other.",
  ],
  location: {
    city: "Central Java",
    country: "Indonesia",
    /** Rendered as "Central Java, Indonesia". */
    label: "Central Java, Indonesia",
    /** Approximate coordinates for the map dot on /about. */
    coordinates: { lat: -7.275, lng: 110.882 },
  },
  /** Used for <html lang>, OG locale and the "available for" line. */
  availability: "Open to collaborations & interesting problems",
  /** Local time zone label shown in the footer. */
  timeZone: "WIB (UTC+7)",
} as const;

/* ========================================================================== */
/*                                  CONTACT                                    */
/* ========================================================================== */

export const contact = {
  /**
   * Shown on /contact and used as the `mailto:` target.
   * NOTE: this is a plain address string, not a secret. To stop bots, swap it for
   * an obfuscated form or an email service — the /api/contact route handler is
   * already wired for that (see RESEND_* env vars in .env.example).
   */
  email: "rizkijack.pp.ua",
  /** Where the "Book a call" pill points. Leave "" to hide the button. */
  bookingUrl: "",
} as const;

/* ========================================================================== */
/*                                  SOCIALS                                    */
/* ========================================================================== */

/**
 * Rendered as the /socials table (Platform | Handle | Link) and as the icon
 * strip in the footer. Add or remove entries freely — the table and footer
 * both derive from this array.
 */
export const socials: readonly ProfileLink[] = [
  {
    id: "github",
    label: "GitHub",
    handle: "Rizkijack",
    url: "https://github.com/Rizkijack",
    note: "Source for most things I build, plus small utilities nobody asked for.",
  },
  {
    id: "x",
    label: "X",
    handle: "@0xJustshrimp",
    url: "https://x.com/0xJustshrimp",
    note: "Short-form thoughts on markets, agents, and shipping.",
  },
  {
    id: "instagram",
    label: "Instagram",
    handle: "",
    url: "",
    note: "Set a handle and URL above to enable this row.",
  },
  {
    id: "website",
    label: "Website",
    handle: "slopagentbook.vercel.app",
    url: "https://slopagentbook.vercel.app",
    note: "My agent handbook — notes, patterns, and things that broke in production.",
  },
];

/** Convenience map when a single link is needed by id. */
export const socialById = Object.fromEntries(
  socials.map((s) => [s.id, s]),
) as Record<string, ProfileLink>;

/* ========================================================================== */
/*                                  SKILLS                                     */
/* ========================================================================== */

export const skillGroups: readonly SkillGroup[] = [
  {
    id: "trader",
    title: "Trader",
    blurb:
      "On-chain and intraday execution, risk framing, and reading liquidity instead of guessing at it.",
    skills: [
      {
        name: "Technical Analysis",
        level: 85,
        note: "Multi-timeframe structure",
      },
      {
        name: "On-chain Analysis",
        level: 78,
        note: "Flows, wallets, CEX deltas",
      },
      {
        name: "Risk Management",
        level: 82,
        note: "Position sizing & R multiples",
      },
      { name: "Market Making", level: 58, note: "Learning the quoting game" },
      {
        name: "Trading Psychology",
        level: 80,
        note: "The hardest skill on this list",
      },
    ],
  },
  {
    id: "builder",
    title: "Builder",
    blurb:
      "TypeScript-first product engineering, from typed API contracts to the CSS that ships on a 3G connection.",
    skills: [
      { name: "TypeScript", level: 92, note: "My default language" },
      {
        name: "React & Next.js",
        level: 88,
        note: "App Router, Server Components",
      },
      { name: "Node.js", level: 85, note: "Route handlers, queues, cron" },
      { name: "PostgreSQL", level: 78 },
      {
        name: "Agentic Workflows",
        level: 80,
        note: "Tool-calling, evals, guardrails",
      },
      { name: "Solidity", level: 65, note: "Enough to be dangerous" },
      { name: "CSS & Motion", level: 88, note: "Tailwind, Framer Motion, SVG" },
    ],
  },
  {
    id: "moderator",
    title: "Moderator",
    blurb:
      "Keeping developer communities readable and useful — clear rules, fast response, no drama.",
    skills: [
      {
        name: "Community Guidelines",
        level: 86,
        note: "Written, not improvised",
      },
      { name: "Conflict Resolution", level: 80 },
      { name: "Discord & Telegram", level: 84 },
      {
        name: "Onboarding & Docs",
        level: 82,
        note: "Reducing repeat questions",
      },
      { name: "Event Hosting", level: 72 },
    ],
  },
];

/* ========================================================================== */
/*                                 TIMELINE                                    */
/* ========================================================================== */

export const timeline: readonly TimelineEntry[] = [
  {
    id: "edu-cs",
    kind: "education",
    title: "B.S. Computer Science",
    org: "Universitas Diponegoro",
    location: "Semarang, Indonesia",
    period: "2020 — 2024",
    summary:
      "Foundations in algorithms, databases and networks — plus the first time I shipped something strangers could actually use.",
    details: [
      "Built the department's first student-tooling Discord bot",
      "Wrote my thesis-adjacent side project on on-chain data indexing",
    ],
  },
  {
    id: "job-first-web",
    kind: "experience",
    title: "Frontend Developer",
    org: "Product Studio (agency)",
    location: "Remote",
    period: "2023 — 2024",
    summary:
      "Shipped marketing sites and dashboards for clients who needed fast pages more than they needed clever ones.",
    details: [
      "Took 6 client sites from ~3.2s to <1s LCP on mid-range mobile",
      "Introduced a shared component + token system across the studio",
    ],
  },
  {
    id: "milestone-first-dapp",
    kind: "milestone",
    title: "First production dApp shipped",
    org: "Solo",
    period: "2024",
    summary:
      "Deployed an on-chain app end to end — contract, indexer, frontend — and learned what 'it works' actually costs.",
    details: [
      "Handling real users surfaced the bug class unit tests never would",
      "Started writing post-mortems for every incident",
    ],
  },
  {
    id: "job-web3",
    kind: "experience",
    title: "Web3 Full-Stack Engineer",
    org: "Crypto product team",
    location: "Remote",
    period: "2024 — Present",
    summary:
      "Full-stack ownership of a trading-adjacent product: typed contracts, indexing pipelines, and a UI people trust with money.",
    details: [
      "Cut median confirmation-to-display latency for on-chain events by ~70%",
      "Introduced contract-integration tests against a local fork",
      "Wrote the onboarding docs the support team now links from",
    ],
  },
  {
    id: "mod-dev-communities",
    kind: "experience",
    title: "Community Moderator",
    org: "Developer communities",
    period: "2024 — Present",
    summary:
      "Moderating builder spaces: enforcing written rules, answering the questions that gate onboarding, and escalating fast.",
    details: [
      "Rewrote guidelines around concrete examples instead of prohibitions",
      "Built a FAQ that measurably cut repeat questions",
    ],
  },
  {
    id: "milestone-agentic",
    kind: "milestone",
    title: "Pivoted into agentic systems",
    org: "Self-directed",
    period: "2025 — Present",
    summary:
      "Moved from using AI as autocomplete to designing agent workflows with tools, evals and explicit failure modes.",
    details: [
      "Built an agent harness with a typed tool registry and trace logging",
      "Started publishing notes at slopagentbook.vercel.app",
    ],
  },
];

/* ========================================================================== */
/*                                 HOME STATS                                  */
/* ========================================================================== */

export const stats: readonly Stat[] = [
  {
    id: "years",
    value: "3+",
    label: "Years shipping",
    hint: "Full-stack & Web3",
  },
  {
    id: "projects",
    value: "24",
    label: "Projects delivered",
    hint: "Products, tools & bots",
  },
  {
    id: "stack",
    value: "15+",
    label: "Technologies",
    hint: "Daily drivers, not checkboxes",
  },
  {
    id: "community",
    value: "8k+",
    label: "Community members",
    hint: "Across moderated spaces",
  },
];

/* ========================================================================== */
/*                                 FUN FACTS                                   */
/* ========================================================================== */

export const funFacts: readonly FunFact[] = [
  {
    id: "fuel",
    icon: "coffee",
    label: "Runs on",
    value: "Cold brew & long focus blocks",
  },
  {
    id: "timezone",
    icon: "globe",
    label: "Working hours",
    value: "Late nights WIB — overlap with EU mornings",
  },
  {
    id: "editor",
    icon: "code",
    label: "Editor of choice",
    value: "VS Code, with far too many tabs open",
  },
  {
    id: "learn",
    icon: "sparkles",
    label: "Currently learning",
    value: "Agent evaluation harnesses & Solidity",
  },
  {
    id: "chain",
    icon: "chart",
    label: "Chain of choice",
    value: "Ethereum L2s — fast and cheap enough to experiment",
  },
  {
    id: "offline",
    icon: "leaf",
    label: "Offline hours",
    value: "Hiking around Dieng when the charts are quiet",
  },
];

/** All tech tags used across projects — re-exported for convenience. */
export { getAllTechTags as allTechTags } from "./projects";
