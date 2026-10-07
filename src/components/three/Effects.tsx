"use client";

/**
 * ============================================================================
 * EFFECTS — post-processing (bloom + subtle chromatic aberration)
 * ============================================================================
 * Deliberately the last thing built and the first thing switched off. Both
 * effects are full-screen passes, and bloom in particular is the single most
 * expensive thing in a typical R3F scene: it renders the scene to a texture,
 * downsamples it several times, blurs, then composites.
 *
 * That is why this component is gated on three independent conditions:
 *
 *   1. `budgetsFor(...).postProcessing` — false on mobile and on the `low` tier
 *   2. the user's own toggle
 *   3. reduced motion → we keep bloom (a static effect) but drop nothing else,
 *      since neither effect animates on its own
 *
 * ---------------------------------------------------------------------------
 * Lazy loading
 * ---------------------------------------------------------------------------
 * `@react-three/postprocessing` and `postprocessing` together are ~180KB of
 * JavaScript. Importing them at the top of `Scene.tsx` would pull that into the
 * initial 3D chunk even for a visitor whose device will never run them.
 *
 * So the caller imports THIS file with `next/dynamic`. That keeps the hash and
 * the bundle entry real (so it is still code-split and cacheable) while
 * guaranteeing the import only happens when the gate passes.
 */

import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
} from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";
import { useMemo } from "react";
import { Vector2 } from "three";

import { useThreeStore } from "@/components/three/store";

export interface EffectsProps {
  /** Quality tier — also adjusts bloom resolution. */
  quality: "high" | "medium" | "low";
  /** Mobile gets a cheaper kernel. */
  isMobile: boolean;
}

export function Effects({ quality, isMobile }: EffectsProps) {
  const theme = useThreeStore((s) => s.theme);
  const dark = theme === "dark";

  /**
   * Chromatic aberration offset.
   *
   * `Vector2` must be memoised: the effect reads it every frame, and handing it
   * a fresh vector on each render would allocate 60 vectors/second and defeat
   * any internal caching in the effect.
   *
   * The value is intentionally tiny — 0.0006 is roughly a one-pixel split at
   * 1440p. Anything larger on a text-heavy page makes body copy look broken,
   * which is the classic chromatic-aberration failure mode.
   */
  const aberrationOffset = useMemo(() => new Vector2(0.0006, 0.0004), []);

  return (
    <EffectComposer
      // `multisampling={0}` disables MSAA inside the composer. It is wasted
      // work here because bloom already softens edges, and it costs real
      // fill-rate on integrated GPUs.
      multisampling={0}
      // Half-float frame buffer: enough range for the bloom threshold without
      // the cost of full float.
      frameBufferType={undefined}
      enableNormalPass={false}
    >
      <Bloom
        // Threshold just above mid-grey so only the genuinely bright
        // iridescent highlights bloom — not the whole object.
        luminanceThreshold={dark ? 0.28 : 0.62}
        luminanceSmoothing={0.22}
        intensity={dark ? 0.85 : 0.4}
        mipmapBlur
        // Lower-res bloom on weaker devices: the blur is the expensive part.
        resolutionX={quality === "high" && !isMobile ? 512 : 256}
        resolutionY={quality === "high" && !isMobile ? 512 : 256}
        kernelSize={isMobile ? KernelSize.SMALL : KernelSize.MEDIUM}
        blendFunction={BlendFunction.ADD}
      />

      <ChromaticAberration
        offset={aberrationOffset}
        // Radial modulation makes the fringe strongest at the edges of the
        // frame and absent in the centre, which is both physically correct for
        // a lens and much kinder to text.
        radialModulation
        modulationOffset={0.35}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

export default Effects;
