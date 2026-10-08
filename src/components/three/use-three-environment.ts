"use client";

/**
 * ============================================================================
 * 3D CAPABILITY DETECTION + PREFERENCES
 * ============================================================================
 * Everything the 3D layer needs to know about *this* device, resolved once on
 * the client and pushed into the zustand store.
 *
 * Deliberately conservative: when in doubt we prefer the fallback. A visitor on
 * a weak laptop should get a fast, correct page rather than a slideshow.
 */

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import {
  DEFAULT_PALETTE,
  isThreeActive,
  readThree,
  useThreeStore,
  type QualityTier,
  type ThreePalette,
} from "@/components/three/store";

/* -------------------------------------------------------------------------
 * localStorage preference
 * ---------------------------------------------------------------------- */

const STORAGE_KEY = "branding-3d-effects";

/**
 * Read the user's 3D preference.
 *
 * Defaults to `true` — the site is designed around the 3D layer, and the
 * toggle exists so people can turn it *off*. An explicit `"off"` is the only
 * thing that disables it.
 */
function readStoredPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    // Private mode / storage disabled. Effects stay on; nothing to persist.
    return true;
  }
}

/** Persist the preference. Failures are non-fatal. */
function writeStoredPreference(enabled: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    /* storage unavailable — the toggle still works for this session */
  }
}

/* -------------------------------------------------------------------------
 * WebGL support probe
 * ---------------------------------------------------------------------- */

/**
 * Can this browser give us a WebGL context at all?
 *
 * Creates a throwaway canvas and immediately discards it. We check `webgl2`
 * first because R3F/three use it when available, then fall back to `webgl`.
 *
 * Note: this is intentionally *separate* from the GPU tier check. A device can
 * support WebGL and still be too slow to bother — that is a quality decision,
 * not a support one.
 */
export function detectWebGL(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");

    if (!gl) return false;

    // Some headless/software stacks hand back a context that immediately dies.
    const context = gl as WebGLRenderingContext;
    const loseContext = context.getExtension("WEBGL_lose_context");
    loseContext?.loseContext();

    // Free the probe canvas right away rather than waiting on GC.
    canvas.width = 0;
    canvas.height = 0;

    return true;
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------
 * Device tier
 * ---------------------------------------------------------------------- */

/**
 * Classify the device into a quality tier.
 *
 * Signals, in order of usefulness:
 *   1. `navigator.deviceMemory` (Chrome/Edge) — GB of RAM. The most direct
 *      proxy for "can this thing push pixels".
 *   2. `navigator.hardwareConcurrency` — logical cores.
 *   3. Viewport width — small screens almost always mean a mobile SoC.
 *
 * We do NOT call drei's `useDetectGPU` here: it downloads a benchmark database
 * over the network, and this project forbids remote assets. A synchronous
 * heuristic runs instantly, costs nothing, and is wrong far less often than it
 * is right in the "too generous" direction.
 */
export function detectQuality(): QualityTier {
  if (typeof window === "undefined") return "medium";

  const nav = navigator as Navigator & {
    deviceMemory?: number;
  };

  const memory = nav.deviceMemory; // GB, may be undefined
  const cores = nav.hardwareConcurrency ?? 4;
  const wide = window.innerWidth >= 1024;

  // Weakest signal wins: a 2GB phone with 8 cores is still a 2GB phone.
  if (memory !== undefined && memory < 4) return "low";
  if (cores <= 2) return "low";
  if (!wide && cores <= 4) return "low";

  // High tier needs headroom on every axis.
  if (wide && cores >= 8 && (memory === undefined || memory >= 8))
    return "high";

  return "medium";
}

/* -------------------------------------------------------------------------
 * Colour probe
 * ---------------------------------------------------------------------- */

/** Read one CSS custom property off `<html>` and return it as a hex string. */
function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

/**
 * Sample the live theme palette.
 *
 * WebGL cannot consume `var(--brand-purple)`, and three's Color parser only
 * understands concrete values. So we resolve the design tokens to real colours
 * here — which also means the 3D layer re-tints automatically when the theme
 * changes, with no duplicated colour definitions.
 *
 * The `.dark` class is applied by next-themes *and* by our pre-paint bootstrap
 * script, so reading the computed style after a theme flip always returns the
 * new values.
 *
 * @param dprCap  Upper bound the renderer should clamp devicePixelRatio to.
 */
export function readPalette(dprCap: number): ThreePalette {
  if (typeof window === "undefined") return { ...DEFAULT_PALETTE, dpr: dprCap };

  return {
    purple: cssVar("--brand-purple", DEFAULT_PALETTE.purple),
    blue: cssVar("--brand-blue", DEFAULT_PALETTE.blue),
    indigo: cssVar("--brand-indigo", DEFAULT_PALETTE.indigo),
    pink: cssVar("--brand-pink", DEFAULT_PALETTE.pink),
    orange: cssVar("--brand-orange", DEFAULT_PALETTE.orange),
    amber: cssVar("--brand-amber", DEFAULT_PALETTE.amber),
    teal: cssVar("--brand-teal", DEFAULT_PALETTE.teal),
    background: cssVar("--bg", DEFAULT_PALETTE.background),
    foreground: cssVar("--fg", DEFAULT_PALETTE.foreground),
    dpr: Math.min(
      dprCap,
      typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
    ),
  };
}

/* -------------------------------------------------------------------------
 * Mounted flag
 * ---------------------------------------------------------------------- */

const subscribeNoop = () => () => {};
const getTrue = () => true;
const getFalse = () => false;

/**
 * `false` on the server and during hydration, `true` after.
 *
 * Used to guard anything that would otherwise produce a hydration mismatch —
 * the 3D toggle's `aria-pressed`, for example. Implemented with
 * `useSyncExternalStore` rather than `useState` + `useEffect` so no setState
 * happens inside an effect (which causes a cascading render).
 */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribeNoop, getTrue, getFalse);
}

/**
 * `isThreeActive()` as a reactive hook: `false` on the server, during hydration
 * and until the capability probe resolves; `true` thereafter whenever effects
 * are enabled, the device supports WebGL, and the OS is not asking for reduced
 * motion.
 *
 * Every 3D host component (`GlobalCanvas`, `HeroDiamondStage`, `Timeline3D`)
 * consults this before mounting a canvas, because a canvas that renders nothing
 * still allocates a WebGL context — the expensive part.
 *
 * Implemented with `useSyncExternalStore` for the same reason as `useMounted`:
 * the `useState` + `useEffect` + `setState` alternative is exactly the
 * cascading-render pattern `react-hooks/set-state-in-effect` exists to catch.
 * The store is the external system; this hook only subscribes to it.
 *
 * The store notifies its listeners on *every* state change — including every
 * scroll tick — so returning a primitive boolean from `getSnapshot` is what
 * stops a scroll burst from re-rendering the hosts: React's `Object.is`
 * comparison sees the same `true`/`false` and bails out.
 */
export function useThreeActive(): boolean {
  return useSyncExternalStore(
    useThreeStore.subscribe,
    () => isThreeActive(),
    getFalse,
  );
}

/* -------------------------------------------------------------------------
 * The main hook
 * ---------------------------------------------------------------------- */

/**
 * Wire the 3D layer into the app.
 *
 * Mounted exactly once, from `<GlobalCanvas>`. Sets up:
 *   • capability + quality detection
 *   • viewport/mobile tracking (resize, debounced through rAF)
 *   • theme + palette mirroring
 *   • reduced-motion mirroring
 *   • scroll and pointer signals (transient, non-reactive)
 *   • route mirroring
 *   • the persisted on/off preference
 */
export function useThreeEnvironment(): void {
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  const setSupported = useThreeStore((s) => s.setSupported);
  const setQuality = useThreeStore((s) => s.setQuality);
  const setIsMobile = useThreeStore((s) => s.setIsMobile);
  const setTheme = useThreeStore((s) => s.setTheme);
  const setReducedMotion = useThreeStore((s) => s.setReducedMotion);
  const setScroll = useThreeStore((s) => s.setScroll);
  const setPointer = useThreeStore((s) => s.setPointer);
  const setRoute = useThreeStore((s) => s.setRoute);
  const setEffectsEnabled = useThreeStore((s) => s.setEffectsEnabled);

  /* ---- One-time: support + quality + stored preference ---- */
  useEffect(() => {
    const supported = detectWebGL();
    const quality = detectQuality();

    setSupported(supported);
    setQuality(quality);
    setEffectsEnabled(readStoredPreference());

    // Expose the tier on <html> so CSS can adapt (e.g. skip the hero canvas
    // entirely on `low`, where even one 3D scene is a liability).
    document.documentElement.dataset.gpu = quality;
  }, [setSupported, setQuality, setEffectsEnabled]);

  /* ---- Viewport / mobile tracking ---- */
  useEffect(() => {
    let frame = 0;

    const update = () => {
      setIsMobile(window.innerWidth < 768);
      document.documentElement.dataset.mobile = String(window.innerWidth < 768);
    };

    // rAF-coalesced so a drag-resize doesn't thrash the store.
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, [setIsMobile]);

  /* ---- Theme + palette ---- */
  useEffect(() => {
    const theme = resolvedTheme === "dark" ? "dark" : "light";

    // Read once the class has actually landed on <html>. next-themes applies it
    // synchronously on toggle, but the very first run can race the bootstrap
    // script, so we defer by a frame when needed.
    const apply = () => {
      const state = readThree();
      const { dprCap } = qualityDpr(state.quality, state.isMobile);
      setTheme(theme, readPalette(dprCap));
    };

    apply();
    const raf = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(raf);
  }, [resolvedTheme, setTheme]);

  /* ---- Reduced motion ---- */
  useEffect(() => {
    // `useReducedMotion` is nullable before mount; treat null as "no".
    setReducedMotion(Boolean(prefersReducedMotion));
  }, [prefersReducedMotion, setReducedMotion]);

  /* ---- Scroll (transient) ---- */
  useEffect(() => {
    let frame = 0;

    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setScroll(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };

    const onScroll = () => {
      // One rAF per scroll burst keeps this off the critical path.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [setScroll]);

  /* ---- Pointer (transient, desktop only) ---- */
  useEffect(() => {
    // Touch devices have no hover; skipping this avoids waking the renderer on
    // every scroll-induced touchmove.
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;

    const flush = () => {
      setPointer(x, y);
    };

    const onMove = (event: PointerEvent) => {
      x = (event.clientX / window.innerWidth) * 2 - 1;
      y = (event.clientY / window.innerHeight) * 2 - 1;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(flush);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, [setPointer]);

  /* ---- Route ---- */
  useEffect(() => {
    setRoute(pathname);
  }, [pathname, setRoute]);
}

/**
 * DPR cap for a tier. Duplicated from `budgetsFor` deliberately: this module is
 * imported before the store has a quality value, and we need the cap to build
 * the initial palette.
 */
function qualityDpr(
  quality: QualityTier,
  isMobile: boolean,
): { dprCap: number } {
  if (isMobile) return { dprCap: 1.25 };
  if (quality === "low") return { dprCap: 1 };
  return { dprCap: 1.5 };
}

/* -------------------------------------------------------------------------
 * Toggle hook (used by the navbar control)
 * ---------------------------------------------------------------------- */

/** Read + toggle the 3D preference, persisting to localStorage. */
export function useEffectsPreference() {
  const enabled = useThreeStore((s) => s.effectsEnabled);
  const supported = useThreeStore((s) => s.supported);
  const ready = useThreeStore((s) => s.ready);
  const setEffectsEnabled = useThreeStore((s) => s.setEffectsEnabled);
  const mounted = useMounted();

  const toggle = () => {
    const next = !enabled;
    setEffectsEnabled(next);
    writeStoredPreference(next);
  };

  return {
    enabled,
    /** Capability decided by the probe. */
    supported,
    /** True once the probe has run — before that, render a neutral state. */
    ready,
    mounted,
    toggle,
    /** Effects are only truly live when supported AND enabled. */
    active: enabled && supported,
  } as const;
}
