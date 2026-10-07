"use client";

/**
 * ============================================================================
 * STAGE — procedural environment lighting
 * ============================================================================
 * drei's `<Environment>` has four render paths, chosen by which props you pass
 * (verified against `node_modules/@react-three/drei/core/Environment.js`):
 *
 *   props.ground   → EnvironmentGround
 *   props.map      → EnvironmentMap
 *   props.children → EnvironmentPortal   ← the one we use
 *   otherwise      → EnvironmentCube     ← fetches a remote preset HDR
 *
 * Passing `children` (a set of `<Lightformer>` meshes) routes us to
 * `EnvironmentPortal`, which renders those meshes into a cubemap **on the GPU**.
 * That gives us physically-plausible image-based lighting with:
 *   • zero network requests (the brief forbids remote HDRs)
 *   • zero binary assets in the repo
 *   • lighting we can re-tint from the theme palette
 *
 * `frames={1}` renders the cubemap once and freezes it. The default
 * (`Infinity`) re-renders the environment every frame, which is pure waste for
 * static lighting.
 *
 * ---------------------------------------------------------------------------
 * Why this component subscribes to the theme reactively
 * ---------------------------------------------------------------------------
 * Everywhere else in the 3D layer we read the store imperatively to avoid
 * re-renders. Here we deliberately do the opposite: the colours are passed as
 * *props* to `<Lightformer>`, and R3F needs a React render to push a changed
 * prop into the scene graph. A theme flip is a rare, user-initiated event, so
 * one re-render of five elements is the cheapest correct implementation.
 */

import { Environment, Lightformer } from "@react-three/drei";

import { useThreeStore } from "@/components/three/store";

export interface StageProps {
  /** Lower the environment intensity on mobile / low tier. */
  intensity?: number;
}

/**
 * The lighting rig: five emitters arranged like a photographer's setup.
 *
 *   • a large soft key from upper-left (brightest, sets the form)
 *   • two rim lights in brand pink/blue that pick out the silhouette edges
 *   • a warm bounce from below, implying a lit surface
 *   • a dark "negative fill" behind, which is what stops the object looking
 *     flat by giving the shadow side somewhere to go
 */
export function Stage({ intensity = 1 }: StageProps) {
  const theme = useThreeStore((s) => s.theme);
  const palette = useThreeStore((s) => s.palette);
  const dark = theme === "dark";

  return (
    <Environment
      // `children` is what selects the offline EnvironmentPortal path.
      // See the component doc comment — this is load-bearing.
      frames={1}
      resolution={256}
      environmentIntensity={intensity}
      // Not the scene background: our CSS gradient shows through, and the
      // canvas is transparent over it.
      background={false}
    >
      {/* Key — large, upper-left, brightest. `position` places it on the
          cubemap sphere that surrounds the origin. */}
      <Lightformer
        form="rect"
        intensity={3.2}
        color={dark ? "#ffffff" : "#f6f4ff"}
        scale={[9, 9, 1]}
        position={[-5, 5, 4]}
        target={[0, 0, 0]}
      />

      {/* Rim — pink, behind-right. Reads as a highlight on the right facets. */}
      <Lightformer
        form="rect"
        intensity={dark ? 2.4 : 1.9}
        color={palette.pink}
        scale={[5, 9, 1]}
        position={[6, 1.5, -3]}
        target={[0, 0, 0]}
      />

      {/* Fill — blue, cool, from the left. Lifts the shadow side. */}
      <Lightformer
        form="rect"
        intensity={1.5}
        color={palette.blue}
        scale={[5, 7, 1]}
        position={[-6, -1, -2]}
        target={[0, 0, 0]}
      />

      {/* Bounce — warm, from below. */}
      <Lightformer
        form="circle"
        intensity={1.1}
        color={dark ? palette.orange : palette.amber}
        scale={5}
        position={[0, -6, 2]}
        target={[0, 0, 0]}
      />

      {/* Negative fill — a dark panel behind. Creating a place for shadow to
          live is what makes the object read as three-dimensional rather than
          evenly lit. */}
      <Lightformer
        form="rect"
        intensity={0.35}
        color={dark ? "#05050a" : "#0b0b14"}
        scale={[10, 10, 1]}
        position={[0, 0, 7]}
        target={[0, 0, 0]}
      />
    </Environment>
  );
}