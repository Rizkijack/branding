"use client";

/**
 * ============================================================================
 * HERO DIAMOND — the 3D centrepiece
 * ============================================================================
 * A faceted octahedron with the custom iridescent GLSL shader, plus an edge
 * overlay and two orbit rings. Wrapped in drei's `Float` for idle drift.
 *
 * ---------------------------------------------------------------------------
 * Motion layers, in order of composition (outermost first)
 * ---------------------------------------------------------------------------
 *   1. `Float`              — buoyant vertical drift, off under reduced motion
 *   2. scroll path group    — position/scale along the home-page keyframe curve
 *   3. pointer tilt group   — head-tracking rotation, spring-damped
 *   4. spin group           — continuous Y rotation, off under reduced motion
 *   5. mesh + edges + rings
 *
 * Splitting these into separate groups rather than accumulating everything on
 * one object is what keeps the motions independently controllable. Adding them
 * all to a single `rotation` would make the spin fight the pointer tilt.
 *
 * ---------------------------------------------------------------------------
 * Resource ownership
 * ---------------------------------------------------------------------------
 * Every geometry and material this file creates is created in a `useMemo` and
 * disposed in a `useEffect` cleanup. three.js does not garbage-collect GPU
 * resources, so skipping this leaks VRAM on every remount — which matters
 * because this component unmounts whenever the user toggles 3D off.
 */

import { useFrame } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import {
  createDiamondPath,
  createFacetEdgesGeometry,
  createOctahedronGeometry,
  sampleDiamondPath,
} from "@/components/three/geometry/octahedron";
import { createIridescentMaterial } from "@/components/three/shaders/iridescent";
import { readThree, useThreeStore } from "@/components/three/store";

export interface HeroDiamondProps {
  /** Where the diamond lives, in world units. */
  position?: [number, number, number];
  /** Overall scale multiplier. */
  scale?: number;
  /**
   * Drive position/rotation/scale from document scroll via the keyframe curve.
   * Only the home page wants this — elsewhere the diamond sits still.
   */
  scrollDriven?: boolean;
  /** Show the two orbit rings. */
  withRings?: boolean;
  /** Disable pointer head-tracking (used by the smaller inline previews). */
  noPointerTilt?: boolean;
}

/** Radians per second for the base spin. Slow enough to read as "floating". */
const SPIN_SPEED = 0.24;

/** How strongly the pointer tilts the diamond. */
const TILT_STRENGTH = 0.28;

export function HeroDiamond({
  position = [0, 0, 0],
  scale = 1,
  scrollDriven = false,
  withRings = true,
  noPointerTilt = false,
}: HeroDiamondProps) {
  const reduceMotion = useReducedMotion();

  /* ---- Refs to the composed motion groups ---- */
  const pathGroup = useRef<THREE.Group>(null);
  const tiltGroup = useRef<THREE.Group>(null);
  const spinGroup = useRef<THREE.Group>(null);

  /* ---- Scroll path, allocated once ---- */
  // `createDiamondPath` only allocates plain JS vectors (no GPU buffers), so
  // there is nothing to dispose — it just becomes garbage.
  const path = useMemo(() => createDiamondPath(), []);

  /* ---- Geometry ---- */
  const bodyGeometry = useMemo(() => createOctahedronGeometry(), []);
  const edgeGeometry = useMemo(() => createFacetEdgesGeometry(), []);
  const ringGeometry = useMemo(() => new THREE.TorusGeometry(1.85, 0.012, 8, 96), []);

  /* ---- Material ---- */
  // Built once with placeholder colours; the palette effect below re-tints it
  // when the theme changes, so we never rebuild the material (and never
  // recompile the shader) on a theme flip.
  const handle = useMemo(
    () =>
      createIridescentMaterial({
        colorA: "#8a5cf6",
        colorB: "#627eea",
        colorC: "#f472b6",
        colorD: "#ff9f5a",
        timeScale: 1,
        saturation: 1.15,
        viewStrength: 0.75,
        thickness: 0.3,
        emissiveGain: 0.35,
      }),
    [],
  );

  /* ---- Edge material ---- */
  const edgeMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#ffffff"),
        transparent: true,
        opacity: 0.32,
        // The edges sit exactly on the surface, so depth-testing them against
        // it produces z-fighting. Pushing them toward the camera is the
        // standard fix and costs nothing.
        depthWrite: false,
      }),
    [],
  );

  /* ---- Ring material ---- */
  const ringMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#8a5cf6"),
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      }),
    [],
  );

  /* ---- Dispose everything on unmount ---- */
  useEffect(() => {
    return () => {
      bodyGeometry.dispose();
      edgeGeometry.dispose();
      ringGeometry.dispose();

      // `handle.dispose()` also detaches the onBeforeCompile hook, which is
      // required — a stale hook would bleed our shader into any material that
      // later shares the same program cache key.
      handle.dispose();
      edgeMaterial.dispose();
      ringMaterial.dispose();
    };
  }, [
    bodyGeometry,
    edgeGeometry,
    ringGeometry,
    handle,
    edgeMaterial,
    ringMaterial,
  ]);

  /* ---- Re-tint from the live theme palette ---- */
  //
  // The store's palette is derived from the CSS custom properties, so the 3D
  // colours can never drift from the 2D design tokens. We subscribe here rather
  // than reading per-frame because a theme change is rare and a per-frame
  // colour lookup would be wasteful.
  const applyPalette = useCallback(
    (palette: ReturnType<typeof readThree>["palette"], dark: boolean) => {
      const u = handle.uniforms;

      u.uColorA.value.set(palette.purple);
      u.uColorB.value.set(palette.blue);
      u.uColorC.value.set(palette.pink);
      u.uColorD.value.set(palette.orange);
      u.uDarkness.value = dark ? 1 : 0;

      // Keep the PBR layer consistent with the gradient ramp.
      handle.material.color.set(palette.purple);
      handle.material.attenuationColor.set(palette.blue);
      handle.material.emissive.set(palette.pink);

      // Edges read as a dark hairline on light backgrounds but a bright one on
      // dark, otherwise they vanish into the page.
      edgeMaterial.color.set(dark ? "#ffffff" : "#ffffff");
      edgeMaterial.opacity = dark ? 0.34 : 0.5;

      ringMaterial.color.set(palette.purple);
    },
    [handle, edgeMaterial, ringMaterial],
  );

  // Subscribe imperatively so a palette change does not re-render this tree.
  useEffect(() => {
    const apply = () => {
      const state = readThree();
      applyPalette(state.palette, state.theme === "dark");
    };

    apply();
    // zustand's `subscribe` returns its own unsubscribe function.
    return useThreeStore.subscribe(apply);
  }, [applyPalette]);

  /* ---- Freeze the shader when motion is reduced ---- */
  useEffect(() => {
    const u = handle.uniforms;
    // 0 freezes the shimmer while keeping the view-dependent gradient intact,
    // so the material still looks correct — it simply stops moving.
    u.uTimeScale.value = reduceMotion ? 0 : 1;
  }, [handle, reduceMotion]);

  /* ---- Per-frame ---- */
  const smoothedTilt = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    const state = readThree();

    // Clamp delta: a backgrounded tab produces a huge delta on resume, which
    // would teleport the diamond across its path in one frame.
    const dt = Math.min(delta, 0.05);

    /* ---- Shader time ---- */
    handle.uniforms.uTime.value += dt;

    /* ---- Scroll path ---- */
    if (scrollDriven) {
      const sample = sampleDiamondPath(path, state.scroll);

      const group = pathGroup.current;
      if (group) {
        // Damp toward the sampled pose instead of snapping. Without this the
        // diamond jitters on trackpad scroll, where many small events arrive
        // between frames.
        group.position.lerp(sample.position, 1 - Math.pow(0.001, dt));
        group.scale.setScalar(
          THREE.MathUtils.lerp(group.scale.x, sample.scale, 1 - Math.pow(0.001, dt)),
        );
        group.rotation.x = THREE.MathUtils.lerp(
          group.rotation.x,
          sample.rotation.x,
          1 - Math.pow(0.002, dt),
        );
        group.rotation.z = THREE.MathUtils.lerp(
          group.rotation.z,
          sample.rotation.z,
          1 - Math.pow(0.002, dt),
        );
      }
    }

    /* ---- Pointer head-tracking ---- */
    //
    // Damped here rather than in the DOM layer so it composes correctly with
    // the spin and the path. `reducedMotion` pins it to neutral.
    if (!noPointerTilt) {
      const targetX = reduceMotion ? 0 : -state.pointerY * TILT_STRENGTH;
      const targetY = reduceMotion ? 0 : state.pointerX * TILT_STRENGTH;

      const k = 1 - Math.pow(0.0015, dt);
      smoothedTilt.current.x += (targetX - smoothedTilt.current.x) * k;
      smoothedTilt.current.y += (targetY - smoothedTilt.current.y) * k;

      const group = tiltGroup.current;
      if (group) {
        group.rotation.x = smoothedTilt.current.x;
        group.rotation.y = smoothedTilt.current.y;
      }
    }

    /* ---- Continuous spin ---- */
    const spinner = spinGroup.current;
    if (spinner && !reduceMotion) {
      spinner.rotation.y += dt * SPIN_SPEED;
    }
  });

  return (
    <group position={position} scale={scale}>
      <group ref={pathGroup}>
        <group ref={tiltGroup}>
          <group ref={spinGroup}>
            {/* ---- Body ---- */}
            <mesh geometry={bodyGeometry} material={handle.material} />

            {/* ---- Facet edges ---- */}
            <lineSegments geometry={edgeGeometry} material={edgeMaterial} />

            {/* ---- Orbit rings ---- */}
            {withRings ? (
              <>
                <mesh
                  geometry={ringGeometry}
                  material={ringMaterial}
                  rotation={[Math.PI / 2.6, 0.2, 0]}
                  scale={[1, 1, 1]}
                />
                <mesh
                  geometry={ringGeometry}
                  material={ringMaterial}
                  rotation={[Math.PI / 1.7, -0.5, 0.4]}
                  scale={[0.82, 0.82, 0.82]}
                />
              </>
            ) : null}
          </group>
        </group>
      </group>
    </group>
  );
}
