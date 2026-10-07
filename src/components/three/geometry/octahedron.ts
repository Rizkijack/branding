/**
 * ============================================================================
 * OCTAHEDRON GEOMETRY — the 3D Ethereum-style diamond
 * ============================================================================
 * Plain module: geometry maths only, no React, no "use client".
 *
 * ---------------------------------------------------------------------------
 * Why hand-build this instead of using THREE.OctahedronGeometry?
 * ---------------------------------------------------------------------------
 * `OctahedronGeometry(r, 0)` gives the right silhouette but its UVs are
 * generated per-face from a spherical projection, which is fine for a texture
 * and useless here: we drive colour from the *facet normal*, and more
 * importantly an octahedron authored in the usual way has its "waist" at the
 * equator, giving an unremarkable double-pyramid.
 *
 * The Ethereum mark is distinctive because of its **proportions**: a tall upper
 * pyramid and a shorter, wider lower pyramid, separated by a crisp waist plane.
 * Reproducing that reliably means writing the six vertices by hand and letting
 * `computeVertexNormals()` derive flat normals per triangle.
 *
 * ---------------------------------------------------------------------------
 * Vertex layout
 * ---------------------------------------------------------------------------
 *                  apex  (0, +topH, 0)
 *                    /\
 *                   /  \
 *          (-r,0,-r)----(+r,0,-r)      ← waist (4 corners, y = 0)
 *                   \  /
 *                    \/
 *                 nadir  (0, -botH, 0)
 *
 * Six triangles total: 4 upper + 4 lower. `flatShading` on the material (set in
 * `createIridescentMaterial`) keeps each face reading as a distinct facet.
 */

import * as THREE from "three";

export interface OctahedronOptions {
  /** Waist radius — distance from the axis to each of the 4 waist corners. */
  radius?: number;
  /** Height of the upper pyramid. */
  topHeight?: number;
  /** Height of the lower pyramid. Smaller than `topHeight` for the ETH look. */
  bottomHeight?: number;
}

/** Defaults chosen to match the proportions of the 2D SVG original. */
export const OCTAHEDRON_DEFAULTS: Required<OctahedronOptions> = {
  radius: 1,
  topHeight: 1.42,
  bottomHeight: 1.12,
};

/**
 * Build a faceted octahedron as a non-indexed `BufferGeometry`.
 *
 * Non-indexed (36 vertices for 6 triangles) is deliberate. An indexed mesh
 * would share vertices between adjacent faces, and `computeVertexNormals()`
 * would then *average* the normals across the seam — destroying the hard
 * facets. Duplicating vertices keeps every face's normal exact, which is what
 * the iridescent shader reads.
 *
 * The caller owns the returned geometry and MUST dispose it.
 */
export function createOctahedronGeometry(
  options: OctahedronOptions = {},
): THREE.BufferGeometry {
  const { radius, topHeight, bottomHeight } = {
    ...OCTAHEDRON_DEFAULTS,
    ...options,
  };

  const apex = new THREE.Vector3(0, topHeight, 0);
  const nadir = new THREE.Vector3(0, -bottomHeight, 0);

  // The four waist corners, in order, going around the Y axis.
  const waist = [
    new THREE.Vector3(radius, 0, 0),
    new THREE.Vector3(0, 0, radius),
    new THREE.Vector3(-radius, 0, 0),
    new THREE.Vector3(0, 0, -radius),
  ];

  const positions: number[] = [];

  /** Push one triangle, wound counter-clockwise when seen from outside. */
  const pushTriangle = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
  ) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };

  // ---- Upper pyramid: apex + two adjacent waist corners ----
  for (let i = 0; i < 4; i += 1) {
    const current = waist[i];
    const next = waist[(i + 1) % 4];
    pushTriangle(apex, current, next);
  }

  // ---- Lower pyramid: nadir + two adjacent waist corners ----
  // Wound in reverse so the outward normal points down-and-out, not inward.
  for (let i = 0; i < 4; i += 1) {
    const current = waist[i];
    const next = waist[(i + 1) % 4];
    pushTriangle(nadir, next, current);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );

  // Derives a flat normal per triangle, since no vertices are shared.
  geometry.computeVertexNormals();

  // Bounding sphere is needed for frustum culling and raycasting; computing it
  // now avoids three doing it lazily mid-frame.
  geometry.computeBoundingSphere();

  return geometry;
}

/**
 * Wireframe overlay geometry for the facet edges.
 *
 * The SVG original had crisp hairlines along every edge, and that detail does a
 * lot of work in selling the "cut gem" read at a glance. Drawing them as a
 * separate line overlay (rather than trying to stroke a mesh) keeps the main
 * material free to be purely physical.
 *
 * Returns a geometry of 12 edges (6 pyramid edges + 4 waist + 2 axis lines).
 */
export function createFacetEdgesGeometry(
  options: OctahedronOptions = {},
): THREE.BufferGeometry {
  const { radius, topHeight, bottomHeight } = {
    ...OCTAHEDRON_DEFAULTS,
    ...options,
  };

  const apex = new THREE.Vector3(0, topHeight, 0);
  const nadir = new THREE.Vector3(0, -bottomHeight, 0);

  const waist = [
    new THREE.Vector3(radius, 0, 0),
    new THREE.Vector3(0, 0, radius),
    new THREE.Vector3(-radius, 0, 0),
    new THREE.Vector3(0, 0, -radius),
  ];

  const points: number[] = [];

  const segment = (a: THREE.Vector3, b: THREE.Vector3) => {
    points.push(a.x, a.y, a.z, b.x, b.y, b.z);
  };

  for (let i = 0; i < 4; i += 1) {
    const current = waist[i];
    const next = waist[(i + 1) % 4];

    // Pyramid edges.
    segment(apex, current);
    segment(nadir, current);

    // Waist ring.
    segment(current, next);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  geometry.computeBoundingSphere();

  return geometry;
}

/* -------------------------------------------------------------------------
 * Scroll keyframe path
 * ------------------------------------------------------------------------- */

/** One waypoint the diamond passes through as the visitor scrolls the home page. */
export interface DiamondKeyframe {
  /** Scroll position, 0..1 across the whole document. */
  at: number;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

/**
 * Where the hero diamond sits at each point of the home page scroll.
 *
 * These are consumed by a Catmull-Rom curve so the motion is smooth rather than
 * snapping between waypoints. Values are hand-tuned against the section layout in
 * `src/app/page.tsx`:
 *
 *   0.00  hero          — centred in the right column, gently rotated
 *   0.22  capabilities  — swings left and recedes
 *   0.45  featured work — moves behind the cards, smaller
 *   0.70  stats/writing — drifts right and up
 *   1.00  socials/CTA   — returns toward centre, slightly larger for the CTA
 */
export const HOME_DIAMOND_PATH: readonly DiamondKeyframe[] = [
  {
    at: 0,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 1,
  },
  {
    at: 0.22,
    position: [-1.1, 0.35, -1.4],
    rotation: [0.25, 1.1, -0.15],
    scale: 0.78,
  },
  {
    at: 0.45,
    position: [0.9, -0.2, -2.2],
    rotation: [-0.2, 2.2, 0.2],
    scale: 0.62,
  },
  {
    at: 0.7,
    position: [1.3, 0.5, -1.6],
    rotation: [0.15, 3.1, -0.1],
    scale: 0.72,
  },
  {
    at: 1,
    position: [0, 0.15, -0.6],
    rotation: [0, 4.2, 0],
    scale: 0.95,
  },
];

/**
 * Build a Catmull-Rom curve through the keyframe positions.
 *
 * `centripetal` parameterisation is the right choice for hand-authored
 * waypoints: it avoids the cusps and self-intersections that the default
 * `uniform` mode produces when points are unevenly spaced, which is exactly the
 * case here.
 *
 * The caller owns the result; `Curve` allocates no GPU resources, so `dispose`
 * is not required — it just becomes garbage.
 */
export function createDiamondPath(
  keyframes: readonly DiamondKeyframe[] = HOME_DIAMOND_PATH,
): THREE.CatmullRomCurve3 {
  const points = keyframes.map((k) => new THREE.Vector3(...k.position));
  return new THREE.CatmullRomCurve3(points, false, "centripetal", 0.5);
}

/**
 * Sample the scroll path.
 *
 * The curve is parameterised 0..1 across the *keyframes*, not across scroll, so
 * we first map scroll → curve parameter, then sample. Because our keyframes are
 * already evenly spaced on the `at` axis this is close to identity, but doing it
 * explicitly means adding an uneven keyframe later "just works".
 */
export function sampleDiamondPath(
  curve: THREE.CatmullRomCurve3,
  scroll: number,
  keyframes: readonly DiamondKeyframe[] = HOME_DIAMOND_PATH,
): { position: THREE.Vector3; rotation: THREE.Euler; scale: number } {
  const clamped = Math.min(1, Math.max(0, scroll));

  // ---- Find the bracketing keyframes ----
  let upper = keyframes.findIndex((k) => k.at >= clamped);
  if (upper <= 0) upper = keyframes.length - 1;

  const from = keyframes[upper - 1];
  const to = keyframes[upper];

  // Guard against a zero-width span (duplicate `at` values).
  const span = to.at - from.at;
  const localT = span > 0 ? (clamped - from.at) / span : 0;

  // Curve parameter for this local segment.
  const curveT = (upper - 1 + localT) / (keyframes.length - 1);

  const position = curve.getPointAt(Math.min(1, Math.max(0, curveT)));

  // Rotations and scale interpolate linearly — the smoothing that matters is in
  // the position path, and easing rotation through a spline makes the spin feel
  // unpredictably fast.
  const lerp = THREE.MathUtils.lerp;
  const rotation = new THREE.Euler(
    lerp(from.rotation[0], to.rotation[0], localT),
    lerp(from.rotation[1], to.rotation[1], localT),
    lerp(from.rotation[2], to.rotation[2], localT),
  );

  const scale = lerp(from.scale, to.scale, localT);

  return { position, rotation, scale };
}
