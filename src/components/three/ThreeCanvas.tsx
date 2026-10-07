/**
 * ============================================================================
 * THREE CANVAS — the <Canvas> host
 * ============================================================================
 * Exists only so `GlobalCanvas` can import it through `next/dynamic`. Keeping
 * the R3F `<Canvas>` element in its own module is what keeps `three`,
 * `@react-three/fiber` and `@react-three/drei` out of the server bundle —
 * `next/dynamic` with `ssr: false` cuts the import graph at this file.
 *
 * --------------------------------------------------------------------------- *
 * Renderer settings                                                          *
 * --------------------------------------------------------------------------- *
 *   dpr={[1, cap]}    Pixel ratio is floored at 1 and capped by the quality
 *                      budget. Above ~1.5 the cost (which scales with the
 *                      square of the pixel ratio) stops buying visible quality.
 *   gl.alpha          The CSS gradient shows through the canvas, so the
 *                      background is never painted by WebGL.
 *   powerPreference   "high-performance" asks the driver for the discrete GPU
 *                      on dual-GPU laptops, where the default is often the
 *                      integrated one.
 *   frameloop         "demand" under reduced motion (the scene is static, but
 *                      a route change still needs a frame to ease the camera);
 *                      "always" otherwise.
 */

"use client";

import { Canvas } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { Suspense } from "react";

import { MobileScene, Scene } from "@/components/three/Scene";
import { useThreeStore } from "@/components/three/store";

export default function ThreeCanvas() {
  const isMobile = useThreeStore((s) => s.isMobile);
  const quality = useThreeStore((s) => s.quality);
  const reducedMotion = useReducedMotion();

  return (
    <div
      // Decorative-only. `pointer-events:none` means the canvas never swallows
      // a click, and `aria-hidden` keeps it out of the accessibility tree.
      // `-z-10` puts it behind <main> but above the body background.
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    >
      <Canvas
        // Camera sits at the home-page rest pose; the rig damps it from there.
        camera={{ position: [0, 0, 9.5], fov: 42, near: 0.1, far: 100 }}
        dpr={[1, quality === "low" ? 1 : isMobile ? 1.25 : 1.5]}
        gl={{
          alpha: true,
          antialias: quality !== "low",
          powerPreference: "high-performance",
          // `never` for the WebGL context loss policy: we do not want the
          // renderer to try to recover while the tab is backgrounded.
          preserveDrawingBuffer: false,
        }}
        frameloop={reducedMotion ? "demand" : "always"}
      >
        <Suspense fallback={null}>
          {isMobile ? (
            <MobileScene quality={quality} />
          ) : (
            <Scene quality={quality} isMobile={false} />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
