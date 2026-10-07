"use client";

/**
 * ============================================================================
 * CAMERA RIG — damping toward a per-route pose
 * ============================================================================
 * The camera is never written to directly. Instead this rig keeps a *target*
 * pose and eases the real camera toward it every frame, which produces the
 * "camera has weight" feel and means a route change or a fast scroll can never
 * snap.
 *
 * ---------------------------------------------------------------------------
 * Where the target comes from
 * ---------------------------------------------------------------------------
 *   • `ROUTE_POSES`  — a hand-tuned pose per route. A fly-through between routes
 *                      is really just a lerp between two of these.
 *   • scroll         — offsets the pose vertically, so scrolling dollies the
 *                      camera rather than moving the page content.
 *   • pointer        — a small lateral offset, which is what makes the whole
 *                      scene feel like a window rather than a backdrop.
 *
 * ---------------------------------------------------------------------------
 * Damping maths
 * ---------------------------------------------------------------------------
 * `1 - pow(decay, dt)` is the frame-rate-independent form of "move a fraction
 * of the way toward the target each frame". The naive `lerp(a, b, 0.1)` moves
 * 10% per *frame*, so it is twice as fast at 120fps as at 60fps. Using `dt`
 * makes the motion identical on every display.
 *
 * The decay constants are tuned per axis: rotation and position settle at
 * slightly different rates so the motion never looks mechanically rigid.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { readThree } from "@/components/three/store";

/** A camera target pose. */
interface Pose {
  position: [number, number, number];
  /** Look-at point. */
  target: [number, number, number];
  /** Field of view, in degrees. */
  fov: number;
}

/**
 * Per-route camera poses.
 *
 * The intent is that each page feels like a different *room* in the same
 * building — the background is continuous, but the vantage point shifts enough
 * that navigating is perceptible even before the DOM transition finishes.
 *
 * Keys are matched by prefix, so `/projects/my-slug` uses the `/projects` pose.
 * Unlisted routes fall back to `DEFAULT_POSE`.
 */
const ROUTE_POSES: Record<string, Pose> = {
  "/": { position: [0, 0, 9.5], target: [0, 0, 0], fov: 42 },
  // Pull back and left: the about page is text-dense, so the background should
  // recede rather than compete.
  "/about": { position: [-1.6, 0.7, 12.4], target: [0.4, -0.3, 0], fov: 40 },
  // Lower and closer to the shapes, suggesting "workshop".
  "/projects": { position: [1.9, -0.6, 11], target: [-0.5, 0.2, 0], fov: 44 },
  // Highest and furthest: reading position.
  "/blog": { position: [0.9, 1.5, 13.2], target: [-0.2, -0.4, 0], fov: 38 },
  // Orbit slightly right so the diamond reads as being circled by the icons.
  "/socials": { position: [2.4, 0.4, 9.8], target: [-0.6, 0, 0], fov: 43 },
  // Tightest framing, aimed at the form.
  "/contact": { position: [-0.9, 0.5, 10.4], target: [0.3, 0, 0], fov: 44 },
};

/** Used for any route not in the table, and for 404s. */
const DEFAULT_POSE: Pose = ROUTE_POSES["/"];

/** Maximum scroll-driven vertical camera offset, in world units. */
const SCROLL_TRAVEL = 1.5;

/** Maximum pointer-driven lateral offset. Deliberately small. */
const POINTER_TRAVEL = 0.55;

/** Frame-rate-independent damping constants (higher = snappier). */
const POSITION_DECAY = 0.0016;
const TARGET_DECAY = 0.0022;
const FOV_DECAY = 0.004;

/** Resolve a pathname to a pose, longest-prefix first. */
export function poseForRoute(pathname: string): Pose {
  if (ROUTE_POSES[pathname]) return ROUTE_POSES[pathname];

  // Walk up the path: "/blog/some-post" → "/blog" → "".
  const segments = pathname.split("/").filter(Boolean);
  while (segments.length > 0) {
    segments.pop();
    const candidate = `/${segments.join("/")}`;
    if (ROUTE_POSES[candidate]) return ROUTE_POSES[candidate];
  }

  return DEFAULT_POSE;
}

export function CameraRig() {
  const camera = useThree((state) => state.camera);

  /* ---- Persistent scratch objects (never allocated per frame) ---- */
  const desiredPosition = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    const state = readThree();

    // Clamp so a resumed background tab does not fling the camera.
    const dt = Math.min(delta, 0.05);

    const pose = poseForRoute(state.route);

    // ---- Scroll: dolly down as the page advances ----
    const scrollOffset = (state.scroll - 0.5) * SCROLL_TRAVEL;

    // ---- Pointer: small lateral + vertical parallax ----
    const pointerX = state.reducedMotion ? 0 : state.pointerX;
    const pointerY = state.reducedMotion ? 0 : state.pointerY;

    desiredPosition.current.set(
      pose.position[0] + pointerX * POINTER_TRAVEL,
      pose.position[1] + scrollOffset - pointerY * POINTER_TRAVEL * 0.6,
      pose.position[2],
    );

    desiredTarget.current.set(
      pose.target[0] + pointerX * POINTER_TRAVEL * 0.35,
      pose.target[1] + scrollOffset * 0.5,
      pose.target[2],
    );

    // ---- Ease ----
    //
    // Under reduced motion we jump straight to the target. There is no
    // *continuous* animation in that case — the camera only moves when the
    // route changes, which is a discrete, expected response to a user action.
    const positionLerp = state.reducedMotion
      ? 1
      : 1 - Math.pow(POSITION_DECAY, dt);
    const targetLerp = state.reducedMotion ? 1 : 1 - Math.pow(TARGET_DECAY, dt);
    const fovLerp = state.reducedMotion ? 1 : 1 - Math.pow(FOV_DECAY, dt);

    camera.position.lerp(desiredPosition.current, positionLerp);
    currentTarget.current.lerp(desiredTarget.current, targetLerp);

    // Always look at the eased target, never the raw one — this is what keeps
    // the motion smooth instead of the camera snapping to look at a moving dot.
    camera.lookAt(currentTarget.current);

    // ---- FOV (only PerspectiveCamera has one) ----
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, pose.fov, fovLerp);
      // `updateProjectionMatrix` is required after any FOV change; skipping it
      // silently does nothing.
      camera.updateProjectionMatrix();
    }
  });

  return null;
}