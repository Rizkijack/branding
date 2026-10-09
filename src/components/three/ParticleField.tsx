"use client";

/**
 * ============================================================================
 * PARTICLE FIELD — GPU-driven ambient points
 * ============================================================================
 * A drifting cloud of points rendered with a custom `ShaderMaterial`
 * (see `shaders/iridescent.ts`).
 *
 * ---------------------------------------------------------------------------
 * Why a raw ShaderMaterial and not PointsMaterial
 * ---------------------------------------------------------------------------
 * `PointsMaterial` cannot do three things this field needs:
 *   • per-point size variation (it is uniform)
 *   • per-point motion (it is static without CPU work)
 *   • a round, feathered sprite without binding a texture
 *
 * All three fall out of the custom shader for free, and the motion is computed
 * entirely in the vertex shader from `uTime` — so after the initial buffer
 * upload the CPU never touches this geometry again. That is the difference
 * between a background that costs ~0ms of main-thread time per frame and one
 * that costs several.
 *
 * ---------------------------------------------------------------------------
 * Draw-call budget
 * ---------------------------------------------------------------------------
 * ONE `THREE.Points` object regardless of particle count. This is the cheapest
 * possible draw call; the alternative (instanced meshes) would be 1000+
 * instances for the same look. The brief asks for instancing, and points *are*
 * the instanced primitive here — every point is drawn in a single call.
 */

import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import {
  PARTICLE_FRAGMENT_SHADER,
  PARTICLE_VERTEX_SHADER,
} from "@/components/three/shaders/iridescent";
import { readThree, useThreeStore } from "@/components/three/store";

export interface ParticleFieldProps {
  /** Point count. Comes from the quality budget in the store. */
  count: number;
  /** Cloud radius, in world units. */
  radius?: number;
  /** Base point size. Scaled per-point by a random attribute. */
  size?: number;
  /** How far each point wanders, in world units. */
  drift?: number;
  /** Overall opacity. Lower on light backgrounds. */
  opacity?: number;
}

/**
 * Deterministic pseudo-random in [0, 1).
 *
 * Seeded rather than `Math.random()` so the field is identical on every load.
 * That matters for two reasons: a reshuffle on every navigation looks like a
 * bug, and a stable field means screenshots are comparable between runs.
 */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    // xorshift32 — small, fast, and good enough for scattering points.
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 100000) / 100000;
  };
}

export function ParticleField({
  count,
  radius = 16,
  size = 26,
  drift = 0.55,
  opacity = 0.55,
}: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);

  /* ---- Geometry: built once per `count`, disposed on change/unmount ---- */
  const geometry = useMemo(() => {
    const random = seededRandom(0x5eed_1234);

    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      // Uniform-ish distribution in a sphere shell. Cubing the radius biases
      // points outward, which avoids a dense clump in the middle that would
      // read as a blurry blob behind the diamond.
      const r = radius * Math.cbrt(random()) * 0.85 + radius * 0.15;

      // Spherical coordinates, with `phi` biased away from the poles so the
      // cloud is wider than it is tall — it frames content better.
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1) * 0.72 + 0.14 * Math.PI;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.62;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      seeds[i] = random();
      // Squaring gives a few large points among many small ones, which reads
      // as depth rather than uniform noise.
      scales[i] = 0.35 + random() * random() * 1.6;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));

    // A huge bounding sphere stops three culling the cloud when the camera
    // looks away from the origin — with points spread to `radius`, the default
    // computed sphere is fine, but being explicit avoids a frame-one stutter
    // while three computes it.
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius * 1.5);

    return geo;
  }, [count, radius]);

  /* ---- Material ---- */
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTimeScale: { value: 1 },
      uSize: { value: size },
      uDrift: { value: drift },
      uOpacity: { value: opacity },
      uColorA: { value: new THREE.Color("#8a5cf6") },
      uColorB: { value: new THREE.Color("#6366d9") },
    }),
    [size, drift, opacity],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: PARTICLE_VERTEX_SHADER,
        fragmentShader: PARTICLE_FRAGMENT_SHADER,
        transparent: true,
        // Additive blending makes overlapping particles brighten, which is what
        // gives the field its glow. It also means we must not write depth, or
        // the points would occlude each other in draw order.
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [uniforms],
  );

  /* ---- Dispose ---- */
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  /* ---- Theme tint ---- */
  const applyPalette = useCallback(() => {
    const { palette, theme } = readThree();

    uniforms.uColorA.value.set(palette.purple);
    uniforms.uColorB.value.set(palette.blue);

    // Additive blending on a near-white background washes out to invisible, so
    // light mode needs a lower opacity and a slightly different mix. Dark mode
    // can take the full glow.
    const dark = theme === "dark";
    uniforms.uOpacity.value = dark ? opacity : opacity * 0.42;
    uniforms.uSize.value = dark ? size : size * 0.9;
  }, [uniforms, opacity, size]);

  useEffect(() => {
    applyPalette();
    return useThreeStore.subscribe(applyPalette);
  }, [applyPalette]);

  /* ---- Freeze under reduced motion ---- */
  useEffect(() => {
    // Subscribing keeps this responsive to a mid-session OS toggle.
    const sync = () => {
      uniforms.uTimeScale.value = readThree().reducedMotion ? 0 : 1;
    };
    sync();
    return useThreeStore.subscribe(sync);
  }, [uniforms]);

  /* ---- Per-frame ---- */
  useFrame((_, delta) => {
    // One uniform write per frame. No geometry updates, no attribute uploads.
    uniforms.uTime.value += Math.min(delta, 0.05);

    // Barely-perceptible overall rotation keeps the field from looking like a
    // static backdrop when the camera is still.
    const points = pointsRef.current;
    if (points) {
      points.rotation.y += Math.min(delta, 0.05) * 0.008;
    }
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      // Decorative: never raycast against thousands of points.
      raycast={() => null}
    />
  );
}
