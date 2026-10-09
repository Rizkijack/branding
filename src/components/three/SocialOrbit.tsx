/**
 * ============================================================================
 * SOCIAL ORBIT — platforms orbiting a central core (/socials)
 * ============================================================================
 * One faceted node per *live* social link, evenly spaced on a ring around a
 * larger core, drifting in a slow full rotation. Purely ambient.
 *
 * --------------------------------------------------------------------------- *
 * Why ambient, not interactive                                                *
 * --------------------------------------------------------------------------- *
 * The brief's rule for every canvas on this site is: decorative, `aria-hidden`
 * and `pointer-events: none`. That is what keeps a canvas layer from swallowing
 * clicks meant for the real content — on this page the `SocialTable` below
 * carries the actual links, handles and copy buttons.
 *
 * Hover affordances are therefore deliberately omitted. Under `pointer-events:
 * none` no pointer event ever reaches the canvas, so an `onPointerOver` handler
 * and an `<Html>` label here would be dead code. `Timeline3D` is the exception,
 * not the pattern: it drops `pointer-events: none` because it sits in its own
 * block with nothing clickable behind it, which this band could do too if the
 * orbit ever wants labels — see the header of that file for the reasoning.
 *
 * --------------------------------------------------------------------------- *
 * Frameloop                                                                   *
 * --------------------------------------------------------------------------- *
 * `always`. The orbit is continuous by design; `demand` would freeze it after
 * one frame. This is the one canvas on the site that never stops drawing, so
 * it is the strongest argument for the toggle in the navbar — the whole
 * subtree vanishes (context and all) when effects are off or reduced motion is
 * requested.
 *
 * --------------------------------------------------------------------------- *
 * Accessibility                                                               *
 * --------------------------------------------------------------------------- *
 * The host is `aria-hidden`. Every platform shown here also appears as a real
 * row in `SocialTable` with its URL and handle, so nothing is 3D-only.
 */

"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { useThreeActive } from "@/components/three/use-three-environment";
import type { ProfileLink } from "@/data/profile";

/* ------------------------------------------------------------------------- *
 * Constants
 * ------------------------------------------------------------------------- */

/** Ring radius in world units. Sized against the camera below so the top and
 * bottom nodes clear the frame with headroom. Nodes only wobble by rotation,
 * so this bounding circle never grows. */
const RING_RADIUS = 2.5;

/** Node base radius. Smaller than the core so the hierarchy reads at a glance. */
const NODE_RADIUS = 0.3;

/** Core radius — the hub the platforms orbit. */
const CORE_RADIUS = 0.55;

/** Rotation of the whole ring, radians per second. Slow: it is a backdrop. */
const ORBIT_SPEED = 0.11;

/** Idle gem spin per node, radians per second. */
const SPIN_SPEED = 0.4;

/** Wobble amplitude in radians — keeps the nodes from looking locked. */
const WOBBLE = 0.25;

/**
 * Per-platform colours, keyed by `ProfileLink.id`. Deliberately the brand
 * tokens used across the site (see `globals.css`) so the orbit belongs to the
 * same palette as the DOM table. Unknown ids fall back to the brand purple.
 */
const PLATFORM_COLORS: Record<string, string> = {
  github: "#8a5cf6",
  x: "#6366d9",
  website: "#b98fd6",
};

const FALLBACK_COLOR = "#8a5cf6";

/* ------------------------------------------------------------------------- *
 * One node
 * ------------------------------------------------------------------------- */

interface NodeProps {
  social: ProfileLink;
  position: [number, number, number];
  index: number;
}

function SocialNode({ social, position, index }: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const color = PLATFORM_COLORS[social.id] ?? FALLBACK_COLOR;

  const geometry = useMemo(
    () => new THREE.OctahedronGeometry(NODE_RADIUS, 0),
    [],
  );

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.45,
        roughness: 0.25,
        metalness: 0.4,
        flatShading: true,
      }),
    [color],
  );

  /* ---- Dispose on unmount ------------------------------------------------ *
   * The host unmounts whenever the 3D layer is toggled off; without this each
   * toggle would leak one geometry and one material per platform. */
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Clamp delta: a backgrounded tab produces a huge gap on resume, which
    // would otherwise spin the gems a full turn in one frame.
    const dt = Math.min(delta, 0.05);

    mesh.rotation.y += dt * SPIN_SPEED;
    mesh.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + index) * WOBBLE;
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      geometry={geometry}
      material={material}
    />
  );
}

/* ------------------------------------------------------------------------- *
 * The core
 * ------------------------------------------------------------------------- */

function OrbitCore() {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(
    () => new THREE.OctahedronGeometry(CORE_RADIUS, 0),
    [],
  );

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(FALLBACK_COLOR),
        emissive: new THREE.Color(FALLBACK_COLOR),
        emissiveIntensity: 0.55,
        roughness: 0.2,
        metalness: 0.55,
        flatShading: true,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const dt = Math.min(delta, 0.05);

    // Spins on the opposite axis to the ring so the two motions don't read as
    // one geared mechanism.
    mesh.rotation.x += dt * SPIN_SPEED * 0.6;
    mesh.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.18;
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}

/* ------------------------------------------------------------------------- *
 * The scene
 * ------------------------------------------------------------------------- */

function SocialOrbitScene({ socials }: { socials: readonly ProfileLink[] }) {
  const groupRef = useRef<THREE.Group>(null);

  /* ---- Ring positions: even angles, 12 o'clock for the first entry ---- */
  const positions = useMemo(() => {
    return socials.map((_, index) => {
      const angle = (index / socials.length) * Math.PI * 2 + Math.PI / 2;
      return [
        Math.cos(angle) * RING_RADIUS,
        Math.sin(angle) * RING_RADIUS,
        0,
      ] as [number, number, number];
    });
  }, [socials]);

  /* ---- The ring itself ---- */
  const ringGeometry = useMemo(() => {
    const segments = 128;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * RING_RADIUS,
          Math.sin(angle) * RING_RADIUS,
          0,
        ),
      );
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, []);

  const ringMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(FALLBACK_COLOR),
        transparent: true,
        opacity: 0.4,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      ringGeometry.dispose();
      ringMaterial.dispose();
    };
  }, [ringGeometry, ringMaterial]);

  /* ---- Slow full rotation of the whole ring ---- */
  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const dt = Math.min(delta, 0.05);
    group.rotation.z -= dt * ORBIT_SPEED;
  });

  return (
    <>
      {/* Procedural lighting — no environment map, matching the other bands. */}
      <directionalLight position={[4, 6, 5]} intensity={1.6} color="#ffffff" />
      <directionalLight
        position={[-5, -3, 2]}
        intensity={0.5}
        color="#8b8ff2"
      />
      <ambientLight intensity={0.35} />

      <group ref={groupRef}>
        <lineLoop geometry={ringGeometry} material={ringMaterial} />

        <OrbitCore />

        {socials.map((social, index) => (
          <SocialNode
            key={social.id}
            social={social}
            position={positions[index]}
            index={index}
          />
        ))}
      </group>
    </>
  );
}

/* ------------------------------------------------------------------------- *
 * Host
 * ------------------------------------------------------------------------- */

export interface SocialOrbitProps {
  /** Only links with a URL become nodes — the orbit shows what is live. */
  socials: readonly ProfileLink[];
  className?: string;
}

/**
 * Renders the socials orbit band.
 *
 * Returns `null` whenever the 3D layer should not run, for the same reason
 * `Timeline3D` does: a canvas that renders nothing still allocates a WebGL
 * context, which is the expensive part, so the whole subtree is dropped.
 */
export function SocialOrbit({ socials, className }: SocialOrbitProps) {
  const active = useThreeActive();

  if (!active || socials.length === 0) return null;

  return (
    // `aria-hidden` + `pointer-events: none`: the band is decorative and must
    // never intercept a pointer meant for the page. See the file header for
    // why that means no hover affordances.
    <div
      aria-hidden="true"
      className={className}
      style={{ pointerEvents: "none" }}
    >
      <Canvas
        camera={{ position: [0, 0, 8.5], fov: 40, near: 0.1, far: 50 }}
        dpr={[1, 1.5]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        frameloop="always"
      >
        <SocialOrbitScene socials={socials} />
      </Canvas>
    </div>
  );
}

export default SocialOrbit;
