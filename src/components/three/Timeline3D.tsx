/**
 * ============================================================================
 * TIMELINE 3D — milestone nodes along a curved path (/about)
 * ============================================================================
 * A horizontal 3D timeline: one faceted node per timeline entry, threaded onto
 * a shallow Catmull-Rom curve. Hovering a node lifts it and reveals its title.
 *
 * --------------------------------------------------------------------------- *
 * Placement — why this is a separate band, not an overlay                  *
 * --------------------------------------------------------------------------- *
 * The accessible `<ol>` timeline in `AboutSections.tsx` is the real content:
 * it has the links, the focus targets and the full text. This canvas is
 * deliberately rendered as its OWN block, above that section, rather than
 * absolutely positioned over it.
 *
 * That is a deliberate choice against the obvious approach. Overlaying the
 * canvas would need `pointer-events: auto` for hover, which would then swallow
 * clicks on the cards and links beneath it — trading real functionality for
 * decoration. Sitting in its own box, the canvas can have pointer events and
 * the DOM timeline keeps all of its interactivity.
 *
 * --------------------------------------------------------------------------- *
 * Accessibility                                                             *
 * --------------------------------------------------------------------------- *
 * The host is `aria-hidden`, so the canvas contributes nothing to the
 * accessibility tree. Every fact shown here also exists as real DOM text in
 * the `<ol>` below it; nothing is 3D-only.
 *
 * --------------------------------------------------------------------------- *
 * Reduced motion / 3D off                                                  *
 * --------------------------------------------------------------------------- *
 * The host returns `null` entirely. Half-mounting a canvas would still
 * allocate a WebGL context, which is the expensive part — so it does not.
 *
 * --------------------------------------------------------------------------- *
 * Frameloop                                                                *
 * --------------------------------------------------------------------------- *
 * `always`. The hover lift is a continuous ease toward a target, so `demand`
 * would freeze it mid-animation: the mesh would jump instead of settling.
 */

"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { isThreeActive, useThreeStore } from "@/components/three/store";
import type { TimelineEntry } from "@/data/profile";

/* ------------------------------------------------------------------------- *
 * Layout constants
 * ------------------------------------------------------------------------- */

/** Horizontal span the timeline covers, in world units. */
const TIMELINE_WIDTH = 10;

/** Vertical bow in the curve. Small, so nodes stay near a readable line. */
const TIMELINE_BOW = 0.9;

/** Node base radius, in world units. */
const NODE_RADIUS = 0.34;

/**
 * Easing decay for the hover lift.
 *
 * `1 - pow(DECAY, dt)` is the frame-rate-independent form of "move a fraction
 * of the way toward the target each frame". The naive `lerp(a, b, 0.05)` is
 * twice as fast at 120fps as at 60fps; this is identical on every display.
 */
const HOVER_DECAY = 0.02;

/** Radians per second for the idle gem spin. Slow — it is an ornament. */
const SPIN_SPEED = 0.4;

/**
 * Per-kind colours. These deliberately match the accent tokens used by the DOM
 * timeline in `AboutSections.tsx` (`kindMeta`) so the two layers agree:
 *   education → --brand-blue    experience → --brand-purple
 *   milestone → --brand-pink
 */
const KIND_COLORS: Record<TimelineEntry["kind"], string> = {
  education: "#627eea",
  experience: "#8a5cf6",
  milestone: "#f472b6",
};

/* ------------------------------------------------------------------------- *
 * One node
 * ------------------------------------------------------------------------- */

interface NodeProps {
  entry: TimelineEntry;
  position: [number, number, number];
  index: number;
  hovered: number | null;
  onHover: (index: number | null) => void;
}

function TimelineNode({
  entry,
  position,
  index,
  hovered,
  onHover,
}: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const isHovered = hovered === index;

  const geometry = useMemo(
    () => new THREE.OctahedronGeometry(NODE_RADIUS, 0),
    [],
  );

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(KIND_COLORS[entry.kind]),
        emissive: new THREE.Color(KIND_COLORS[entry.kind]),
        emissiveIntensity: 0.45,
        roughness: 0.25,
        metalness: 0.4,
        flatShading: true,
      }),
    [entry.kind],
  );

  /* ---- Dispose on unmount ---- *
   * The component unmounts whenever the 3D layer is toggled off, so without
   * this each toggle would leak one geometry and one material per entry. */
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // Clamp delta: a backgrounded tab produces a huge gap on resume, which
    // would otherwise fling a hovered node past its target in one frame.
    const dt = Math.min(delta, 0.05);
    const ease = 1 - Math.pow(HOVER_DECAY, dt);

    /* ---- Lift the hovered node off the line ---- */
    const targetY = position[1] + (isHovered ? 0.45 : 0);
    group.position.y = THREE.MathUtils.lerp(group.position.y, targetY, ease);

    const targetScale = isHovered ? 1.35 : 1;
    group.scale.setScalar(
      THREE.MathUtils.lerp(group.scale.x, targetScale, ease),
    );

    /* ---- Idle spin ---- *
     * This only runs while the component is mounted, and the host unmounts the
     * whole canvas under `prefers-reduced-motion` (see `Timeline3D`), so there
     * is no separate guard needed here — that condition cannot be true. */
    const mesh = meshRef.current;
    if (mesh) {
      mesh.rotation.y += dt * SPIN_SPEED;
      mesh.rotation.x = Math.sin(state.clock.elapsedTime * 0.5 + index) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        onPointerOver={(event) => {
          // stopPropagation: without it every node behind this one in the
          // raycast order would also report a hover.
          event.stopPropagation();
          onHover(index);
        }}
        onPointerOut={() => onHover(null)}
      />

      {/* Label on hover.
          `Html` renders a real DOM element over the canvas. The whole host is
          aria-hidden and this label is pointer-events:none, so it is purely
          visual — the DOM timeline carries the same text accessibly. */}
      {isHovered ? (
        <Html
          center
          distanceFactor={11}
          position={[0, NODE_RADIUS + 0.75, 0]}
          zIndexRange={[20, 0]}
          wrapperClass="pointer-events-none select-none"
          style={{ pointerEvents: "none" }}
        >
          <div className="pointer-events-none w-max max-w-[14rem] rounded-pill border border-line bg-surface/90 px-3.5 py-2 text-center shadow-lg backdrop-blur-md">
            <p className="text-[0.72rem] font-semibold tracking-wide text-fg-muted uppercase">
              {entry.period}
            </p>
            <p className="mt-0.5 text-[0.82rem] font-bold text-fg">
              {entry.title}
            </p>
            <p className="mt-0.5 text-[0.74rem] text-fg-subtle">{entry.org}</p>
          </div>
        </Html>
      ) : null}
    </group>
  );
}

/* ------------------------------------------------------------------------- *
 * The scene
 * ------------------------------------------------------------------------- */

function TimelineScene({ entries }: { entries: readonly TimelineEntry[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  /* ---- Curve the nodes thread onto ---- */
  const { curve, positions } = useMemo(() => {
    const count = entries.length;

    // Control points along a shallow arc.
    const controls: THREE.Vector3[] = entries.map((_, index) => {
      const t = count === 1 ? 0.5 : index / (count - 1);
      const x = (t - 0.5) * TIMELINE_WIDTH;
      // Parabolic bow: highest in the middle.
      const y = TIMELINE_BOW * (1 - Math.pow(t - 0.5, 2) * 4);
      return new THREE.Vector3(x, y, 0);
    });

    const path = new THREE.CatmullRomCurve3(controls, false, "centripetal", 0.5);

    return {
      curve: path,
      positions: controls.map((c) => [c.x, c.y, c.z] as [number, number, number]),
    };
  }, [entries]);

  /* ---- Line geometry for the curve ---- */
  const lineGeometry = useMemo(() => {
    const points = curve.getPoints(128);
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [curve]);

  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#8a5cf6"),
        transparent: true,
        opacity: 0.45,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      lineGeometry.dispose();
      lineMaterial.dispose();
    };
  }, [lineGeometry, lineMaterial]);

  return (
    <>
      {/* Key light from upper-left, cool fill from lower-right, ambient to
          lift the shadow side. Procedural — no environment map, which keeps
          this canvas cheap enough to sit on a text page. */}
      <directionalLight position={[4, 6, 5]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[-5, -3, 2]} intensity={0.5} color="#8b9ff5" />
      <ambientLight intensity={0.35} />

      <lineSegments geometry={lineGeometry} material={lineMaterial} />

      {entries.map((entry, index) => (
        <TimelineNode
          key={entry.id}
          entry={entry}
          index={index}
          position={positions[index]}
          hovered={hovered}
          onHover={setHovered}
        />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------------- *
 * Host
 * ------------------------------------------------------------------------- */

export interface Timeline3DProps {
  entries: readonly TimelineEntry[];
  className?: string;
}

/**
 * Renders the 3D timeline band.
 *
 * Returns `null` — not a smaller or cheaper version — whenever the 3D layer
 * should not run. A canvas that renders nothing still allocates a WebGL
 * context, which is the expensive part, so the whole subtree is dropped.
 */
export function Timeline3D({ entries, className }: Timeline3DProps) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);

  /**
   * The store's defaults represent "not probed yet" and only resolve on the
   * client. Reading them during render before hydration would produce a
   * server/client mismatch, so the decision is deferred to an effect.
   */
  useEffect(() => {
    setMounted(true);
    setActive(isThreeActive());

    // Re-render only when the *predicate* flips. zustand calls this listener
    // on every state change (including every scroll tick), so the comparison
    // is what stops the canvas from re-mounting on a scroll burst.
    const unsubscribe = useThreeStore.subscribe(() => {
      setActive((current) => {
        const next = isThreeActive();
        return current === next ? current : next;
      });
    });

    return unsubscribe;
  }, []);

  if (!mounted || !active || entries.length === 0) return null;

  return (
    // `aria-hidden` + `pointer-events-none` on the wrapper: the band is
    // decorative and must never intercept a click meant for the page.
    <div
      aria-hidden="true"
      className={className}
      style={{ pointerEvents: "none" }}
    >
      <Canvas
        camera={{ position: [0, 0.6, 8], fov: 38, near: 0.1, far: 50 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        // See the file header: the hover ease is continuous, so the loop must
        // run continuously.
        frameloop="always"
      >
        <TimelineScene entries={entries} />
      </Canvas>
    </div>
  );
}

export default Timeline3D;
