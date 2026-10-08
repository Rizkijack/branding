"use client";

/**
 * ============================================================================
 * FLOATING SHAPES — decorative faceted solids
 * ============================================================================
 * A handful of slowly rotating icosahedrons, tori and hexagonal prisms scattered
 * through the background volume. They give the scene parallax depth: because
 * they sit at different z distances, the camera rig's scroll dolly makes them
 * slide past each other.
 *
 * ---------------------------------------------------------------------------
 * Performance
 * ---------------------------------------------------------------------------
 * Each shape is its own mesh, which would normally be a red flag — but the count
 * is capped at 7 by the quality budget, so this is 7 draw calls total, compared
 * with the particle field's 1. That is a fine trade for the variety.
 *
 * Geometries and materials are shared across instances of the same shape type
 * (`useMemo` at the parent level) so we allocate 3 geometries rather than 7.
 * They are disposed once, by the parent.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { readThree, useThreeStore } from "@/components/three/store";

/** Shape families the field is built from. */
type ShapeKind = "icosahedron" | "torus" | "prism";

interface ShapeSpec {
  kind: ShapeKind;
  position: [number, number, number];
  /** Base scale. */
  scale: number;
  /** Rotation speed, radians/second, per axis. */
  spin: [number, number, number];
  /** Index into the palette for the tint. */
  tint: "purple" | "blue" | "pink" | "teal" | "orange";
}

/**
 * Hand-placed so nothing overlaps the text column on the home page and nothing
 * sits dead-centre where the diamond lives.
 *
 * All shapes stay outside a ~3-unit radius around the origin, which is the
 * keep-out zone for the hero diamond and the site's content column.
 */
const SHAPE_LAYOUT: readonly ShapeSpec[] = [
  {
    kind: "icosahedron",
    position: [-7.2, 3.1, -6.5],
    scale: 0.62,
    spin: [0.11, 0.17, 0.05],
    tint: "purple",
  },
  {
    kind: "torus",
    position: [7.8, -2.4, -7.2],
    scale: 0.72,
    spin: [0.09, -0.13, 0.07],
    tint: "blue",
  },
  {
    kind: "prism",
    position: [-6.4, -3.6, -8.5],
    scale: 0.68,
    spin: [-0.07, 0.15, 0.1],
    tint: "pink",
  },
  {
    kind: "icosahedron",
    position: [6.1, 4.3, -9.4],
    scale: 0.44,
    spin: [0.14, 0.1, -0.08],
    tint: "teal",
  },
  {
    kind: "torus",
    position: [-8.6, 0.4, -11.2],
    scale: 0.5,
    spin: [-0.1, 0.12, 0.09],
    tint: "orange",
  },
  {
    kind: "prism",
    position: [9.2, 1.8, -10.6],
    scale: 0.4,
    spin: [0.08, -0.16, 0.06],
    tint: "purple",
  },
  {
    kind: "icosahedron",
    position: [0.5, -5.2, -12.4],
    scale: 0.56,
    spin: [0.06, 0.12, 0.11],
    tint: "blue",
  },
];

export interface FloatingShapesProps {
  /** How many shapes to render. Clamped to the layout length. */
  count: number;
}

export function FloatingShapes({ count }: FloatingShapesProps) {
  const groupRef = useRef<THREE.Group>(null);

  const specs = useMemo(
    () =>
      SHAPE_LAYOUT.slice(0, Math.max(0, Math.min(count, SHAPE_LAYOUT.length))),
    [count],
  );

  /* ---- Shared geometries: 3 total, regardless of shape count ---- */
  const geometries = useMemo(
    () => ({
      // detail: 0 keeps the facet count low and the silhouette crisp.
      icosahedron: new THREE.IcosahedronGeometry(1, 0),
      torus: new THREE.TorusGeometry(1, 0.32, 8, 24),
      // A 6-sided cylinder IS a hexagonal prism.
      prism: new THREE.CylinderGeometry(1, 1, 1.25, 6, 1, false),
    }),
    [],
  );

  /* ---- One material per shape (they tint independently) ---- */
  const materials = useMemo(
    () =>
      specs.map(
        () =>
          new THREE.MeshStandardMaterial({
            transparent: true,
            opacity: 0.5,
            roughness: 0.24,
            metalness: 0.32,
            flatShading: true,
            // No env map on these; a little emissive keeps them from going
            // pitch black when they rotate away from the key light.
            emissiveIntensity: 0.35,
          }),
      ),
    [specs],
  );

  /* ---- Dispose ---- */
  useEffect(() => {
    return () => {
      Object.values(geometries).forEach((geo) => geo.dispose());
      materials.forEach((mat) => mat.dispose());
    };
  }, [geometries, materials]);

  /* ---- Theme tint ---- */
  useEffect(() => {
    const apply = () => {
      const { palette, theme } = readThree();
      const dark = theme === "dark";

      specs.forEach((spec, index) => {
        const material = materials[index];
        if (!material) return;

        const color = palette[spec.tint];
        material.color.set(color);
        material.emissive.set(color);

        // On a light background, opaque metal reads as a grubby smudge. Lower
        // opacity and emissive let them float as suggested forms instead.
        material.opacity = dark ? 0.52 : 0.3;
        material.emissiveIntensity = dark ? 0.42 : 0.22;
      });
    };

    apply();
    return useThreeStore.subscribe(apply);
  }, [specs, materials]);

  /* ---- Per-frame rotation ---- */
  useFrame((state, delta) => {
    if (readThree().reducedMotion) return;

    const group = groupRef.current;
    if (!group) return;

    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    group.children.forEach((child, index) => {
      const spec = specs[index];
      if (!spec) return;

      child.rotation.x += dt * spec.spin[0];
      child.rotation.y += dt * spec.spin[1];
      child.rotation.z += dt * spec.spin[2];

      // Slow bob on top of the rotation, phase-offset per shape.
      const baseY = spec.position[1];
      child.position.y = baseY + Math.sin(t * 0.32 + index * 1.7) * 0.28;
    });
  });

  return (
    <group ref={groupRef}>
      {specs.map((spec, index) => (
        <mesh
          key={`${spec.kind}-${index}`}
          geometry={geometries[spec.kind]}
          material={materials[index]}
          position={spec.position}
          scale={spec.scale}
          // Decorative background elements: never participate in raycasting.
          raycast={() => null}
        />
      ))}
    </group>
  );
}
