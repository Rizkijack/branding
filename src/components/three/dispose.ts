/**
 * ============================================================================
 * DISPOSAL HELPERS
 * ============================================================================
 * WebGL resources are NOT garbage collected. Every geometry, material and
 * texture we create has to be explicitly `dispose()`d or the context leaks on
 * every route change. This is the one file that makes that mechanical.
 */

import * as THREE from "three";

/** Disposes a single material, tolerating arrays (multi-material meshes). */
export function disposeMaterial(
  material: THREE.Material | THREE.Material[] | undefined,
): void {
  if (!material) return;

  if (Array.isArray(material)) {
    material.forEach((entry) => disposeMaterial(entry));
    return;
  }

  // Dispose any textures the material owns (maps, roughness, normal, …).
  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture) value.dispose();
  }

  material.dispose();
}

/** Disposes a geometry, tolerating undefined. */
export function disposeGeometry(
  geometry: THREE.BufferGeometry | undefined,
): void {
  geometry?.dispose();
}

/**
 * Walks an object3D tree and disposes every geometry and material it finds.
 *
 * Use this on unmount of any scene subtree that builds its own assets — it is
 * the difference between a 200MB tab after ten route changes and a flat one.
 */
export function disposeTree(root: THREE.Object3D | undefined | null): void {
  if (!root) return;

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) disposeGeometry(mesh.geometry);
    if (mesh.material) disposeMaterial(mesh.material);
  });
}
