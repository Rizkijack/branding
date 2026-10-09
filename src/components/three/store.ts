"use client";

/**
 * ============================================================================
 * 3D STORE — shared state for the WebGL layer
 * ============================================================================
 * A single zustand store is the only channel between the DOM layer (navbar,
 * page transitions, contact form) and the R3F layer (canvas, camera, meshes).
 *
 * Why a store and not React context:
 *   R3F renders into its own reconciler root *outside* the DOM tree that
 *   `layout.tsx` renders into. React context does NOT cross that boundary by
 *   default, so a context provider wrapping `<main>` would be invisible to
 *   anything inside `<Canvas>`. zustand is a plain external store, so both
 *   roots can read and write it.
 *
 * Why transient updates matter here:
 *   Scroll progress and pointer position change every frame. Subscribing to them
 *   with `useStore(s => s.scroll)` would re-render a React component 60x/second.
 *   Anything per-frame therefore uses `store.getState()` inside `useFrame`, or
 *   the imperative `subscribe` escape hatch — never a reactive selector.
 *
 * The store is deliberately *not* persisted except for the 3D on/off flag, which
 * lives in localStorage via a small manual read/write (see `use-effects-prefs`).
 */

import { create } from "zustand";

/* -------------------------------------------------------------------------
 * Types
 * ---------------------------------------------------------------------- */

/** Quality tier, chosen once on mount by `detectQuality()`. */
export type QualityTier = "high" | "medium" | "low";

/** Resolved theme, mirrored from next-themes so materials can re-tint. */
export type ThreeTheme = "light" | "dark";

/** Real colour values read from CSS custom properties, for use in WebGL. */
export interface ThreePalette {
  purple: string;
  blue: string;
  indigo: string;
  pink: string;
  orange: string;
  amber: string;
  teal: string;
  /** Page background, so particles/shapes can fade into it correctly. */
  background: string;
  /** Dominant text colour — used for node-network lines on light backgrounds. */
  foreground: string;
  /** Device pixel ratio the renderer should clamp to. */
  dpr: number;
}

export interface ThreeState {
  /* ---- Capability / preference flags ---- */
  /** User preference from the navbar toggle. Persisted in localStorage. */
  effectsEnabled: boolean;
  /** False when WebGL is unavailable, the device is too weak, or SSR. */
  supported: boolean;
  /** True once the capability probe has run on the client. */
  ready: boolean;
  /** Detect-GPU tier; drives particle counts and post-processing. */
  quality: QualityTier;
  /** Viewport < 768px. On mobile the global background is a static gradient. */
  isMobile: boolean;
  /** Resolved theme, mirrored from next-themes. */
  theme: ThreeTheme;
  /** Live colour values read from CSS custom properties. */
  palette: ThreePalette;
  /** OS-level prefers-reduced-motion. Freezes all continuous animation. */
  reducedMotion: boolean;

  /* ---- Per-frame signals (transient — prefer getState()) ---- */
  /** 0..1 progress through the *current page*. */
  scroll: number;
  /** Normalised pointer, -1..1 on both axes. 0,0 = center. */
  pointerX: number;
  pointerY: number;

  /* ---- Navigation ---- */
  /** Current pathname, mirrored so the camera can react without a router hook. */
  route: string;
  /** Bumped on every route change so effects can retrigger. */
  routeKey: number;

  /* ---- One-shot triggers ---- */
  /** Incremented by the contact form to fire the success burst. */
  burstKey: number;
  /** Which project is hovered, for the optional per-project 3D preview. */
  focusedProject: string | null;

  /* ---- Actions ---- */
  setEffectsEnabled: (enabled: boolean) => void;
  setSupported: (supported: boolean) => void;
  setQuality: (quality: QualityTier) => void;
  setIsMobile: (isMobile: boolean) => void;
  setTheme: (theme: ThreeTheme, palette: ThreePalette) => void;
  setReducedMotion: (reduced: boolean) => void;
  setScroll: (scroll: number) => void;
  setPointer: (x: number, y: number) => void;
  setRoute: (route: string) => void;
  triggerBurst: () => void;
  setFocusedProject: (slug: string | null) => void;
}

/* -------------------------------------------------------------------------
 * Defaults
 * ---------------------------------------------------------------------- */

/**
 * Neutral palette used before the CSS probe runs (and during SSR).
 * Values mirror the light theme in `globals.css` so the first frame - if it is
 * ever visible - is not a jarring mismatch.
 *
 * Kept in lockstep with `globals.css`: an analogous violet family plus a warm
 * gold highlight, never a saturated rainbow.
 */
export const DEFAULT_PALETTE: ThreePalette = {
  purple: "#8a5cf6",
  blue: "#6366d9",
  indigo: "#5b4ce0",
  pink: "#b98fd6",
  orange: "#e0a24a",
  amber: "#e8b455",
  teal: "#16a6a1",
  background: "#f7f7f9",
  foreground: "#1c1c1c",
  dpr: 1,
};

/* -------------------------------------------------------------------------
 * Store
 * ---------------------------------------------------------------------- */

export const useThreeStore = create<ThreeState>()((set) => ({
  // Optimistic default: the canvas mounts hidden until `ready` flips, so
  // starting at `true` avoids a visible flash of "off" on capable devices.
  effectsEnabled: true,
  supported: false,
  ready: false,
  quality: "medium",
  isMobile: false,
  theme: "light",
  palette: DEFAULT_PALETTE,
  reducedMotion: false,

  scroll: 0,
  pointerX: 0,
  pointerY: 0,

  route: "/",
  routeKey: 0,

  burstKey: 0,
  focusedProject: null,

  setEffectsEnabled: (effectsEnabled) => set({ effectsEnabled }),
  setSupported: (supported) => set({ supported, ready: true }),
  setQuality: (quality) => set({ quality }),
  setIsMobile: (isMobile) => set({ isMobile }),
  setTheme: (theme, palette) => set({ theme, palette }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),

  setScroll: (scroll) => set({ scroll }),
  setPointer: (pointerX, pointerY) => set({ pointerX, pointerY }),

  // `routeKey` deliberately only increments on an actual change, so an effect
  // keyed on it fires once per navigation rather than once per render.
  setRoute: (route) =>
    set((state) =>
      state.route === route ? state : { route, routeKey: state.routeKey + 1 },
    ),

  triggerBurst: () => set((state) => ({ burstKey: state.burstKey + 1 })),
  setFocusedProject: (focusedProject) => set({ focusedProject }),
}));

/* -------------------------------------------------------------------------
 * Non-reactive helpers
 * ------------------------------------------------------------------------- */

/**
 * Read a snapshot without subscribing.
 *
 * Use this inside `useFrame` and event handlers. Subscribing to `scroll` or
 * `pointerX` reactively would re-render on every frame, which is exactly the
 * cost this store exists to avoid.
 */
export const readThree = () => useThreeStore.getState();

/**
 * Should the 3D layer actually render anything right now?
 *
 * This is the single predicate every 3D component should consult before doing
 * per-frame work. It folds together all four reasons to stop:
 *   • the user turned effects off
 *   • the device can't do WebGL (or detection hasn't finished)
 *   • the OS asked for reduced motion
 *   • we are on the server
 */
export function isThreeActive(): boolean {
  const s = useThreeStore.getState();
  return s.effectsEnabled && s.supported && s.ready && !s.reducedMotion;
}

/**
 * Particle / geometry budget for the current quality tier and viewport.
 *
 * Kept as data (not scattered magic numbers) so tuning happens in one place.
 * Mobile is capped hard: the brief allows only the hero diamond there, and even
 * that runs at the `low` or `medium` tier.
 */
export function budgetsFor(quality: QualityTier, isMobile: boolean) {
  if (isMobile) {
    return {
      particles: quality === "low" ? 240 : 420,
      networkNodes: 18,
      lineSegmentLimit: 26,
      floatingShapes: 3,
      dprCap: 1.25 as const,
      postProcessing: false,
    };
  }

  switch (quality) {
    case "high":
      return {
        particles: 1800,
        networkNodes: 70,
        lineSegmentLimit: 140,
        floatingShapes: 7,
        dprCap: 1.5 as const,
        postProcessing: true,
      };
    case "medium":
      return {
        particles: 1000,
        networkNodes: 46,
        lineSegmentLimit: 80,
        floatingShapes: 5,
        dprCap: 1.5 as const,
        postProcessing: true,
      };
    default:
      return {
        particles: 500,
        networkNodes: 28,
        lineSegmentLimit: 40,
        floatingShapes: 3,
        dprCap: 1 as const,
        postProcessing: false,
      };
  }
}
