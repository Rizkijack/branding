/**
 * ============================================================================
 * 3D LAYER — shared constants
 * ============================================================================
 * One place for the numbers that govern the WebGL layer: capability detection,
 * particle budgets, palette. Nothing here imports `three`, so it is safe to
 * read from server components (e.g. to decide a fallback class).
 */

/**
 * Capability bucket, resolved once on the client by `detectCapabilities()`.
 * Drives every "how fancy should the 3D be" decision in the layer.
 */
export type Capability = "none" | "low" | "high";

/** localStorage key for the manual 3D on/off override. */
export const THREE_TOGGLE_KEY = "branding-3d-enabled";

/**
 * Palette shared by the diamond shader, the particles and the floating shapes.
 * Hex triples (not THREE.Color yet) so this file stays web-statement clean.
 */
export const PALETTE = {
  purple: "#8a5cf6",
  blue: "#627eea",
  pink: "#f472b6",
  orange: "#ff9f5a",
  teal: "#16a6a1",
} as const;

/**
 * Light-theme variants — the 3D layer reads these instead of the CSS tokens
 * because a WebGL scene can't key off `var(--brand-purple)`. Values are picked
 * for contrast against `--bg` in each theme.
 */
export const PALETTE_THEME = {
  dark: {
    a: "#a78bfa",
    b: "#8b9ff5",
    c: "#f9a8d4",
    /** Background fog colour, matches --bg #0b0b14. */
    bg: "#0b0b14",
  },
  light: {
    a: "#7c4fe0",
    b: "#4f6fe0",
    c: "#d94f9f",
    /** Background fog colour, matches --bg #f8f7ff. */
    bg: "#f8f7ff",
  },
} as const;

export type ThemePalette = (typeof PALETTE_THEME)["dark"];

/** DPR ceiling. `[min, max]` — anything above 1.5 is wasted on a text site. */
export const DPR: [number, number] = [1, 1.5];

/**
 * Particle budget by capability. Instanced either way; the counts just drop.
 * Mobile gets ~40% of desktop because fill-rate is the real cost.
 */
export const PARTICLE_COUNT = {
  low: 260,
  high: 900,
} as const;

/** How many floating background shapes to spawn. */
export const SHAPE_COUNT = {
  low: 3,
  high: 9,
} as const;

/**
 * Scroll smoothing. Lower = heavier damping = smoother but laggier feel.
 * The camera rig runs on `maath/easing` damping toward these targets.
 */
export const DAMPING = 0.06;

/**
 * Camera rest position per route. The rig damps toward the matching entry on
 * navigation, which gives the "fly-between-pages" feel without a timeline.
 */
export const CAMERA_VIEWS: Record<string, [number, number, number]> = {
  "/": [0, 0, 9],
  "/about": [-3.4, 0.6, 8],
  "/projects": [3.4, -0.6, 8],
  "/blog": [-2.6, -1.2, 8.4],
  "/socials": [0, 1.8, 7.6],
  "/contact": [2.6, 1.2, 8.4],
};

/**
 * Section offsets (0..1 of total page scroll) used by the home scroll-story to
 * morph the diamond. Kept here so the store and the scene agree. These are
 * hints, not hard gates — the diamond lerps between them continuously.
 */
export const HOME_SECTION_T = {
  hero: 0,
  capabilities: 0.22,
  featured: 0.46,
  stats: 0.66,
  social: 0.86,
} as const;

/** True when the current build should include the leva tuning GUI. */
export const SHOW_LEVA =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_THREE_LEVA === "1";
