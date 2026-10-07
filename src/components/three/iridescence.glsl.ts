/**
 * ============================================================================
 * IRIDESCENT SHADER — custom GLSL for the hero diamond
 * ============================================================================
 * A Fresnel-rimmed, animated iridescent gradient. Same "thin-film" read as
 * `MeshPhysicalMaterial`'s iridescence, but with a full hue ramp we control,
 * so it can drift from purple → blue → pink → orange instead of a fixed
 * soap-film band.
 *
 * Implemented as a small onBeforeCompile patch on top of MeshPhysicalMaterial
 * rather than a raw ShaderMaterial: we keep PBR lighting, clearcoat,
 * transmission and shadows for free, and only swap the surface colour term.
 *
 * The patch is intentionally tiny and version-tolerant — it overrides
 * `diffuseColor.rgb` in `map_fragment`, which has been the merge point for the
 * base colour in every modern three.js revision.
 */

import * as THREE from "three";

/** Uniforms the patch adds. Defaults match the brand ramp. */
export interface IridescenceUniforms {
  /** Time in seconds. Drives the slow hue drift along the surface. */
  uTime: { value: number };
  /** Hue shift speed. Low = barely perceptible drift. */
  uSpeed: { value: number };
  /** Fresnel width. Higher = tighter, sharper rim. */
  uFresnelPower: { value: number };
  /** Base saturation, 0..1. Light theme dials this down. */
  uSaturation: { value: number };
  /** Three hue anchors, in 0..1 HSV-ish space. */
  uColorA: { value: THREE.Color };
  uColorB: { value: THREE.Color };
  uColorC: { value: THREE.Color };
}

/** GLSL chunk injected before the lighting term. Kept as a string constant. */
const IRIDESCENCE_CHUNK = /* glsl */ `
  // ---- Iridescence patch (brand ramp) ----
  uniform float uTime;
  uniform float uSpeed;
  uniform float uFresnelPower;
  uniform float uSaturation;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;

  // 3-stop ramp with smooth wrap. 't' scrolls over the surface so the colours
  // appear to flow around the facets instead of sitting still.
  vec3 brandRamp(float t) {
    float cycle = fract(t * 3.0);
    vec3 first = mix(uColorA, uColorB, smoothstep(0.0, 1.0, cycle));
    return mix(first, uColorC, smoothstep(0.66, 1.66, cycle + 0.33));
  }

  // World-space position projected onto a slowly rotating plane. Cheap proxy
  // for "where on the surface am I", and it animates deterministically.
  float surfaceCoord(vec3 worldPos, vec3 worldNormal) {
    float sweep = worldPos.x * 0.55 + worldPos.y * 0.35 + worldPos.z * 0.25;
    return sweep * 0.18 + uTime * uSpeed;
  }
`;

/**
 * Applies the patch to a MeshPhysicalMaterial. Mutates in place and returns the
 * same instance, so callers keep their reference for disposal.
 *
 * `onBeforeCompile` is cached per-fragment-source, so patching once is enough
 * even though the material may be used by several meshes.
 */
export function applyIridescence(
  material: THREE.MeshPhysicalMaterial,
  uniforms: IridescenceUniforms,
): THREE.MeshPhysicalMaterial {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uSpeed = uniforms.uSpeed;
    shader.uniforms.uFresnelPower = uniforms.uFresnelPower;
    shader.uniforms.uSaturation = uniforms.uSaturation;
    shader.uniforms.uColorA = uniforms.uColorA;
    shader.uniforms.uColorB = uniforms.uColorB;
    shader.uniforms.uColorC = uniforms.uColorC;

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>\n${IRIDESCENCE_CHUNK}`,
      )
      .replace(
        "#include <map_fragment>",
        /* glsl */ `
          #include <map_fragment>

          // World-space inputs the lighting block already provides.
          vec3 iridWorldPos = (modelMatrix * vec4(vViewPosition, 1.0)).xyz;
          vec3 iridWorldNormal = normalize(
            (modelMatrix * vec4(normal, 0.0)).xyz
          );

          // View direction for the Fresnel term.
          vec3 iridViewDir = normalize(cameraPosition - iridWorldPos);

          // Fresnel: brightest where the surface turns away.
          float fresnel = pow(
            1.0 - max(dot(iridViewDir, iridWorldNormal), 0.0),
            uFresnelPower
          );

          // Surface coordinate drives the colour flow.
          float coord = surfaceCoord(iridWorldPos, iridWorldNormal);

          // Two samples offset against each other: the body of the facet and
          // the rim read as different hues, which sells the thin-film look.
          vec3 body = brandRamp(coord);
          vec3 rim = brandRamp(coord + 0.18);

          vec3 irid = mix(body, rim, fresnel);
          irid = mix(vec3(dot(irid, vec3(0.299, 0.587, 0.114))), irid, uSaturation);

          // Fold into the lit diffuse term. transmission/clearcoat still apply
          // on top, so the object keeps its glassy weight.
          diffuseColor.rgb *= 0.55;
          diffuseColor.rgb += irid * 0.75;
        `,
      );
  };

  return material;
}
