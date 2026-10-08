/**
 * ============================================================================
 * GLOBAL CANVAS — the fixed, full-screen WebGL layer behind every page
 * ============================================================================
 * Mounted once, from the root layout, above <main>. On the server and during
 * hydration it renders a static CSS gradient — the canvas itself is loaded
 * with `next/dynamic` (ssr: false), so NO WebGL code ever reaches the server
 * bundle and no context is created on a device that will not use one.
 *
 * --------------------------------------------------------------------------- *
 * Why a single global canvas instead of one per page                      *
 * --------------------------------------------------------------------------- *
 * One WebGL context for the whole site. Creating a context per route would
 * mean compiling every shader and re-uploading every geometry on every
 * navigation; a single context means a route change is just a camera move.
 *
 * The cost is that the canvas must be decorative-only: it sets
 * `pointer-events: none` and `aria-hidden`, and it is clipped to the viewport
 * rather than scrolled with content. Everything interactive stays in the DOM.
 *
 * --------------------------------------------------------------------------- *
 * Mobile                                                                    *
 * --------------------------------------------------------------------------- *
 * `isMobile` swaps the whole `Scene` for a `MobileScene`: a static gradient
 * plane plus a single hero diamond. The particle field, node network, floating
 * shapes and camera rig never mount. That is the brief's mobile strategy —
 * the background is a lightweight static gradient, and only the hero diamond
 * is real 3D — and not mounting a component beats mounting and disabling it.
 */

"use client";

import dynamic from "next/dynamic";

import {
  useThreeActive,
  useThreeEnvironment,
} from "@/components/three/use-three-environment";

/**
 * The real canvas. Imported through `next/dynamic` so:
 *   • it is absent from the server bundle entirely (R3F touches `window`)
 *   • it is its own chunk, loaded on demand rather than blocking first paint
 */
const Canvas = dynamic(() => import("@/components/three/ThreeCanvas"), {
  ssr: false,
  // While the chunk loads, the host shows the static gradient (see below).
  loading: () => null,
});

/**
 * Static fallback. This is what renders:
 *   • on the server
 *   • while the dynamic chunk is still loading
 *   • when WebGL is unavailable
 *   • when the visitor has turned effects off
 *   • when the OS asks for reduced motion
 *
 * It is a pure CSS gradient — two radial brand-colour washes over the page
 * background — so the page always has depth even with the GPU off.
 */
function StaticGradient() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg"
    >
      <div
        className="absolute -top-1/4 left-1/4 size-[60vmax] rounded-full opacity-25 blur-[100px]"
        style={{ background: "var(--brand-purple)" }}
      />
      <div
        className="absolute right-1/4 bottom-1/4 size-[45vmax] rounded-full opacity-20 blur-[100px]"
        style={{ background: "var(--brand-blue)" }}
      />
    </div>
  );
}

export function GlobalCanvas() {
  // Wire every DOM signal (scroll, pointer, route, theme, capability) into the
  // store. This is the only component that calls it, so the listeners exist
  // exactly once for the lifetime of the app.
  useThreeEnvironment();

  const active = useThreeActive();

  // The probe has not run yet (or we are on the server): static gradient only.
  if (!active) {
    return <StaticGradient />;
  }

  return <Canvas />;
}

export default GlobalCanvas;
