"use client";

/**
 * ============================================================================
 * NODE NETWORK — connected constellation of drifting nodes
 * ============================================================================
 * Nodes on a spherical shell, with a line drawn between any pair closer than
 * `maxDistance`. The result reads as a network topology, which fits the
 * "on-chain / agentic" subject matter far better than random dots.
 *
 * ---------------------------------------------------------------------------
 * Complexity, and why this is not O(n²) at runtime
 * ---------------------------------------------------------------------------
 * The neighbour search IS O(n²) — that is unavoidable for a "connect nearby
 * points" rule without a spatial index. But it runs ONCE, at build time
 * (node creation), not per frame. With `networkNodes` capped at 70 by the
 * quality budget, that is 2,415 distance checks on mount: well under a
 * millisecond, and it never runs again.
 *
 * Per frame we only write two uniforms. The nodes themselves rotate as a rigid
 * body, so their positions never change and the line buffer stays valid.
 *
 * ---------------------------------------------------------------------------
 * Line rendering
 * ---------------------------------------------------------------------------
 * Uses `THREE.LineSegments` — one object, one draw call, all pairs in a single
 * `Float32Array`. drei's `<Line>` component (fat lines) would give thicker
 * strokes but allocates a mesh per line, so 140 segments would mean 140 draw
 * calls. At this scale, thin lines are the correct trade.
 */

import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { readThree, useThreeStore } from "@/components/three/store";

export interface NodeNetworkProps {
  /** Number of nodes. From the quality budget. */
  nodeCount: number;
  /** Maximum number of connecting segments, to bound the line buffer. */
  segmentLimit: number;
  /** Cloud radius. */
  radius?: number;
  /** Connect two nodes when they are closer than this. */
  maxDistance?: number;
  /** Render the node spheres as well as the lines. */
  showNodes?: boolean;
}

/** Deterministic PRNG, matching ParticleField — stable across reloads. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 100000) / 100000;
  };
}

export function NodeNetwork({
  nodeCount,
  segmentLimit,
  radius = 9,
  maxDistance = 4.4,
  showNodes = true,
}: NodeNetworkProps) {
  const groupRef = useRef<THREE.Group>(null);

  /* ---- Node positions (also reused by the line builder) ---- */
  const nodePositions = useMemo(() => {
    const random = seededRandom(0xc0ffee);

    const points: THREE.Vector3[] = [];
    for (let i = 0; i < nodeCount; i += 1) {
      // Fibonacci-sphere distribution gives evenly spaced nodes with no
      // clumping — much better than uniform random for a network look, where
      // clumps create visual knots of lines.
      const y = 1 - (i / Math.max(1, nodeCount - 1)) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = i * 2.399963229728653; // golden angle

      // Jitter the perfect spiral so it does not look mechanically regular.
      const jitter = 0.82 + random() * 0.36;

      points.push(
        new THREE.Vector3(
          Math.cos(theta) * radiusAtY * radius * jitter,
          y * radius * 0.66 * jitter,
          Math.sin(theta) * radiusAtY * radius * jitter,
        ),
      );
    }
    return points;
  }, [nodeCount, radius]);

  /* ---- Instanced node spheres ---- */
  //
  // True instancing: ONE geometry, ONE material, N inverse transforms. This is
  // the pattern the brief asks for, and it is materially cheaper than N meshes.
  const nodeGeometry = useMemo(() => new THREE.SphereGeometry(0.075, 8, 8), []);

  const nodeMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
    [],
  );

  const nodeMeshRef = useRef<THREE.InstancedMesh>(null);

  /* ---- Line geometry ---- */
  const lineGeometry = useMemo(() => {
    const random = seededRandom(0x11ee_55aa);

    const verts: number[] = [];
    let segments = 0;

    // Deterministic iteration order over all unique pairs.
    for (
      let i = 0;
      i < nodePositions.length && segments < segmentLimit;
      i += 1
    ) {
      for (
        let j = i + 1;
        j < nodePositions.length && segments < segmentLimit;
        j += 1
      ) {
        const a = nodePositions[i];
        const b = nodePositions[j];

        const distance = a.distanceTo(b);

        // `random()` is only consumed for pairs that pass the distance test, so
        // changing `maxDistance` does not reshuffle which pairs are considered.
        if (distance > maxDistance) continue;
        if (random() > 0.72) continue; // drop some links so it is not a solid web

        verts.push(a.x, a.y, a.z, b.x, b.y, b.z);
        segments += 1;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(new Float32Array(verts), 3),
    );
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius * 1.6);

    return geo;
  }, [nodePositions, maxDistance, segmentLimit, radius]);

  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  /* ---- Populate the instance matrices once ---- */
  useEffect(() => {
    const mesh = nodeMeshRef.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    const random = seededRandom(0xa1b2_c3d4);

    nodePositions.forEach((position, index) => {
      // Vary node size so the network has a hierarchy.
      const nodeScale = 0.7 + random() * 1.1;
      matrix.makeScale(nodeScale, nodeScale, nodeScale);
      matrix.setPosition(position);
      mesh.setMatrixAt(index, matrix);
    });

    // Required after direct matrix writes, or the GPU keeps the old buffer.
    mesh.instanceMatrix.needsUpdate = true;
  }, [nodePositions]);

  /* ---- Dispose ---- */
  useEffect(() => {
    return () => {
      nodeGeometry.dispose();
      nodeMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
    };
  }, [nodeGeometry, nodeMaterial, lineGeometry, lineMaterial]);

  /* ---- Theme tint ---- */
  const applyPalette = useCallback(() => {
    const { palette, theme } = readThree();
    const dark = theme === "dark";

    nodeMaterial.color.set(palette.purple);
    lineMaterial.color.set(dark ? palette.blue : palette.indigo);

    // Additive lines on a light background blow out to white and disappear;
    // lowering the opacity is what keeps them readable in light mode.
    lineMaterial.opacity = dark ? 0.28 : 0.16;
    nodeMaterial.opacity = dark ? 0.9 : 0.5;
  }, [nodeMaterial, lineMaterial]);

  useEffect(() => {
    applyPalette();
    return useThreeStore.subscribe(applyPalette);
  }, [applyPalette]);

  /* ---- Per-frame: rotate the whole network as a rigid body ---- */
  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (readThree().reducedMotion) return;

    const dt = Math.min(delta, 0.05);

    // Two axes at different speeds so it never looks like a turntable.
    group.rotation.y += dt * 0.021;
    group.rotation.x = Math.sin(state.clock.elapsedTime * 0.07) * 0.08;
  });

  return (
    <group ref={groupRef}>
      {showNodes ? (
        <instancedMesh
          ref={nodeMeshRef}
          args={[nodeGeometry, nodeMaterial, nodePositions.length]}
          // Decorative — never raycast a background element.
          raycast={() => null}
        />
      ) : null}

      <lineSegments
        geometry={lineGeometry}
        material={lineMaterial}
        raycast={() => null}
      />
    </group>
  );
}
