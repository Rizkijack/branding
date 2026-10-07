/**
 * ============================================================================
 * CAPABILITY DETECTION
 * ============================================================================
 * Everything "should this browser even try WebGL, and how hard?" lives here.
 *
 * The result is cached for the tab's lifetime and stored in the zustand slice,
 * so the whole 3D layer mounts or falls back from one value. Detection runs
 * client-side only — the server always renders the SVG fallback.
 */

import type { Capability } from "./constants";

/** Cached after the first successful probe; `null` until then. */
let cached: Capability | null = null;

/**
 * Minimal but real WebGL probe. Creates a temporary canvas, asks for a context
 * and immediately bins it. `failIfMajorPerformanceCaveat` is deliberately NOT
 * set — a software rasteriser is still "supported" for this workload and we'd
 * rather decide the quality tier ourselves than hard-fail it.
 */
function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const attributes: WebGLContextAttributes = {
      powerPreference: "high-performance",
      antialias: true,
    };

    const gl =
      canvas.getContext("webgl2", attributes) ??
      canvas.getContext("webgl", attributes) ??
      (canvas.getContext("experimental-webgl", attributes) as
        | WebGLRenderingContext
        | null);

    return !!gl && typeof gl.getParameter === "function";
  } catch {
    // Security policies (e.g. a locked-down iframe) can throw on getContext.
    return false;
  }
}

/**
 * Coarse "is this a weak GPU / small device" heuristic. No GPU blacklist is
 * reliable from JS, so this combines the signals that actually correlate with
 * pain: small screen, touch-primary, few cores, little RAM, and a save-data
 * preference.
 */
function detectLowEnd(): boolean {
  if (typeof window === "undefined") return false;

  // Save-Data is the most explicit signal a visitor can give.
  const nav = navigator as Navigator & {
    saveData?: boolean;
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };

  if (nav.saveData) return true;
  if (nav.connection?.saveData) return true;

  // Slow connection types usually mean a constrained device too.
  const effectiveType = nav.connection?.effectiveType;
  if (effectiveType === "slow-2g" || effectiveType === "2g") return true;

  // Few cores = weak CPU. The fallback path is cheap; the 3D path is not.
  const cores = navigator.hardwareConcurrency;
  if (cores && cores <= 4) return true;

  // Under ~4GB RAM is a strong hint this is not a workstation.
  const memory = nav.deviceMemory;
  if (memory && memory <= 4) return true;

  // Touch + small viewport: a phone, where fill-rate is the bottleneck.
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const isSmall = Math.min(window.innerWidth, window.innerHeight) < 720;
  if (isTouch && isSmall) return true;

  return false;
}

/**
 * The single entry point. Returns "none" when WebGL is unavailable, "low" on a
 * weak/small device, otherwise "high". Memoised — the second call is free.
 */
export function detectCapabilities(): Capability {
  if (cached) return cached;

  if (typeof window === "undefined") return "none";
  if (!detectWebGL()) return (cached = "none");

  cached = detectLowEnd() ? "low" : "high";
  return cached;
}

/** Forces a re-probe. Only useful in tests. */
export function resetCapabilities(): void {
  cached = null;
}

/**
 * `prefers-reduced-motion`. Read fresh each time: users toggle this while a
 * page is open, and a stale read would freeze the scene for the rest of the
 * session.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
