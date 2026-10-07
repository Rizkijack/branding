"use client";

/**
 * ============================================================================
 * SCENE — what lives inside the global <Canvas>
 * ============================================================================
 * Composition root for the ambient 3D layer. It owns nothing but the layout of
 * the scene; every child manages its own resources.
 *
 * ---------------------------------------------------------------------------
 * Render gating (and why there is no IntersectionObserver here)
 * ---------------------------------------------------------------------------
 * The canvas host is `position: fixed` and covers the viewport, so it is by
 * definition always "in view" — an IntersectionObserver would always report
 * intersecting and add nothing. The cases that actually need a pause are:
 *
 *   • the tab is hidden  → handled below via `visibilitychange`
 *   • the canvas is not mounted at all (mobile, effects off, reduced motion,
 *     no WebGL)  → handled by `GlobalCanvas`, which simply renders a static
 *     gradient instead. No GPU context is ever created in those cases, which
 *     beats pausing one.
 *
 * `frameloop` is switched between "always" and "never". R3F v9 applies a
 * runtime frameloop change — verified in
 * `node_modules/@react-three/fiber/dist/events-*.esm.js`:
 *   `if (changed('frameloop')) state.setFrameloop(frameloop)`
 * — so flipping this genuinely stops the loop rather than just making it cheap.
 *
 * "never" rather than "demand" is deliberate: with `demand` R3F still renders on
 * every `invalidate()`, and a continuously animating scene invalidates every
 * frame. "never" hard-stops it.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect } from "react";

import { CameraRig } from "@/components/three/CameraRig";
import { FloatingShapes } from "@/components/three/FloatingShapes";
import { HeroDiamond } from "@/components/three/HeroDiamond";
import { NodeNetwork } from "@/components/three/NodeNetwork";
import { ParticleField } from "@/components/three/ParticleField";
import { Stage } from "@/components/three/Stage";
import {
  budgetsFor,
  readThree,
  useThreeStore,
  type QualityTier,
} from "@/components/three/store";

/**
 * Post-processing is ~180KB of JS. Loading it lazily means a visitor whose
 * device fails the quality gate never downloads or parses it.
 *
 * `ssr: false` is required — `postprocessing` touches `window` on import.
 */
const Effects = dynamic(() => import("@/components/three/Effects"), {
  ssr: false,
});

/* -------------------------------------------------------------------------
 * Visibility driver
 * ------------------------------------------------------------------------- */

/**
 * Owns the `frameloop` decision and keeps a lightweight FPS sample.
 */
function RenderScheduler() {
  const { invalidate, setFrameloop } = useThree();
  const reducedMotion = useReducedMotion();

  /* ---- Pause when the tab is hidden ---- */
  useEffect(() => {
    let wasRunning = false;

    const sync = () => {
      const hidden = document.visibilityState !== "visible";

      if (hidden) {
        setFrameloop("never");
        wasRunning = false;
        return;
      }

      // Reduced motion gets "demand": the scene is static, but a route change
      // still needs frames to ease the camera. Otherwise: full speed.
      setFrameloop(reducedMotion ? "demand" : "always");

      // Returning from "never" needs one explicit kick, or the first frame is
      // missed and the canvas stays blank until the next interaction.
      if (!wasRunning) {
        invalidate();
        wasRunning = true;
      }
    };

    sync();
    document.addEventListener("visibilitychange", sync);

    // The reduced-motion flip can arrive while the tab is visible, so re-run.
    const unsubscribeReduced = useThreeStore.subscribe(sync);

    return () => {
      document.removeEventListener("visibilitychange", sync);
      unsubscribeReduced();
    };
  }, [reducedMotion, setFrameloop, invalidate]);

  /* ---- Adaptive quality guard ----
   *
   * A rolling FPS average. If the device cannot hold a reasonable frame rate we
   * drop the dpr, which is the highest-leverage single change (cost scales with
   * the square of the pixel ratio). This is a floor, not a benchmark: it only
   * ever steps *down*, and only twice.
   */
  const dprRef = useThree((state) => state.viewport.dpr);
  const sample = useFrameSample();
  const gl = useThree((state) => state.gl);

  useFrame(() => {
    const fps = sample();
    if (fps === null) return;

    // 45fps is the threshold: comfortably below 60 (so we only trigger on a
    // genuine problem) and above the point where motion looks broken.
    if (fps < 45) {
      const next = Math.max(1, gl.getPixelRatio() - 0.25);
      if (next < gl.getPixelRatio()) {
        gl.setPixelRatio(next);
        // eslint-disable-next-line no-console -- one line, once per step-down
        console.info(`[three] dpr stepped down to ${next} (${fps|0}fps)`);
      }
    }
    void dprRef;
  });

  return null;
}

/**
 * Rolling FPS estimator.
 *
 * Averages over ~1 second windows rather than reporting instantaneous frame
 * time, because a single slow frame (a GC pause, a texture upload) is not a
 * reason to degrade quality for the rest of the session.
 *
 * Returns `null` until the first window has filled, so the caller never acts on
 * a partial sample.
 */
function useFrameSample() {
  let frames = 0;
  let elapsed = 0;

  return () => {
    // `useFrame` gives delta in seconds; we accumulate here rather than in a
    // ref because this closure is created once per mount and never read by
    // anything else.
    frames += 1;
    elapsed += 1 / 60;

    if (elapsed < 1) return null;

    const fps = frames / elapsed;
    frames = 0;
    elapsed = 0;
    return fps;
  };
}

/* -------------------------------------------------------------------------
 * Scene
 * ------------------------------------------------------------------------- */

export interface SceneProps {
  quality: QualityTier;
  isMobile: boolean;
}

export function Scene({ quality, isMobile }: SceneProps) {
  const budgets = budgetsFor(quality, isMobile);

  return (
    <>
      <RenderScheduler />
      <CameraRig />
      <Stage intensity={isMobile ? 0.85 : 1} />

      <ParticleField
        count={budgets.particles}
        radius={isMobile ? 13 : 17}
        size={isMobile ? 22 : 28}
        drift={0.6}
        opacity={0.55}
      />

      <NodeNetwork
        nodeCount={budgets.networkNodes}
        segmentLimit={budgets.lineSegmentLimit}
        radius={isMobile ? 7.5 : 9.5}
      />

      <FloatingShapes count={budgets.floatingShapes} />

      {budgets.postProcessing ? (
        <Effects quality={quality} isMobile={isMobile} />
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------------- *
 * Mobile scene
 * ------------------------------------------------------------------------- */

/**
 * The mobile scene: a static gradient plane and one hero diamond.
 *
 * The particle field, node network, floating shapes and camera rig are NOT
 * included — not mounting a component beats mounting and disabling it. Mobile
 * fill-rate is the bottleneck, and the brief specifies a lightweight static
 * gradient background with only the hero diamond in 3D.
 *
 * `frameloop` is `demand` on mobile (see `ThreeCanvas`), so after the first
 * frame the GPU does nothing until the diamond's scroll-driven pose changes.
 */
export function MobileScene({ quality }: { quality: QualityTier }) {
  return (
    <>
      <Stage intensity={0.7} />

      <HeroDiamond
        position={[0, 0.2, 0]}
        scale={quality === "low" ? 1.05 : 1.25}
        // The home page drives the diamond along its scroll path; on every
        // other route it sits still.
        scrollDriven={readThree().route === "/"}
        withRings={quality !== "low"}
      />
    </>
  );
}

export default Scene;
