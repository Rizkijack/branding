/**
 * ============================================================================
 * HERO DIAMOND CANVAS — a self-contained canvas for the home hero
 * ============================================================================
 * A small, dedicated R3F `<Canvas>` that renders ONLY the octahedron.
 *
 * --------------------------------------------------------------------------- *
 * Why a second canvas instead of the global one                           *
 * --------------------------------------------------------------------------- *
 * The global background canvas is `position: fixed` and `pointer-events:
 * none`, clipped to the viewport. The hero diamond needs to live *inside the
 * document flow* at a specific size and position so it scrolls with content
 * and aligns with the text column. A fixed viewport canvas cannot do that.
 *
 * Two canvases means two WebGL contexts. This one renders a single mesh with
 * one shader and no post-processing, so its cost is trivial — and it is
 * unmounted entirely on mobile (where the mobile scene in the global canvas
 * already draws the diamond) and when effects are off.
 *
 * --------------------------------------------------------------------------- *
 * Performance                                                              *
 * --------------------------------------------------------------------------- *
 *   dpr={[1, 1.5]}     capped pixel ratio — the diamond is small on screen
 *   frameloop          "always" (it must animate continuously)
 *   shadows            off — one object does not need to shadow itself
 */

"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

import { HeroDiamond } from "@/components/three/HeroDiamond";
import { Stage } from "@/components/three/Stage";

export interface HeroDiamondCanvasProps {
  /** Drive the diamond along the home-page scroll keyframe path. */
  scrollDriven?: boolean;
}

export default function HeroDiamondCanvas({
  scrollDriven = false,
}: HeroDiamondCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.2], fov: 42, near: 0.1, far: 50 }}
      dpr={[1, 1.5]}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      }}
      // The canvas is decorative; it must never capture pointer events.
      style={{ pointerEvents: "none" }}
      frameloop="always"
    >
      <Suspense fallback={null}>
        {/* Procedural environment lighting: five Lightformers rendered into a
            cubemap on the GPU. No remote HDR, no network request. */}
        <Stage intensity={1} />

        <HeroDiamond scrollDriven={scrollDriven} withRings scale={1.15} />
      </Suspense>
    </Canvas>
  );
}
