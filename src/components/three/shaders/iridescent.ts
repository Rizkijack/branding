/**
 * ============================================================================
 * IRIDESCENT GLSL SHADER — custom animated gradient for the diamond
 * ============================================================================
 * Plain module (no "use client"): nothing here touches React, the DOM, or the
 * three renderer at import time. It only exports strings and a factory.
 *
 * ---------------------------------------------------------------------------
 * What it does
 * ---------------------------------------------------------------------------
 * Thin-film iridescence in the real world comes from light interfering with
 * itself inside a layer roughly one wavelength thick. Two consequences we can
 * exploit cheaply:
 *
 *   1. The colour depends on the *angle* you view the surface from.
 *   2. The colour depends on the *thickness* of the film.
 *
 * So the shader computes a view-dependent term and a thickness term, mixes them
 * into a hue, and samples a four-stop brand ramp (purple → blue → pink →
 * orange) at that hue. The result is genuinely view-dependent — rotate the
 * camera or the mesh and the gradient slides across the facets, which a baked
 * texture can never do.
 *
 * The "animated" part is the thickness term drifting with `uTime`, giving a
 * slow oil-slick shimmer without any texture fetch.
 *
 * ---------------------------------------------------------------------------
 * Integration strategy (important)
 * ---------------------------------------------------------------------------
 * This is registered as an `onBeforeCompile` hook on a standard
 * `MeshPhysicalMaterial`, NOT as a raw `ShaderMaterial`.
 *
 * That distinction is the whole trick. A `ShaderMaterial` would mean hand-
 * writing lighting, PBR, transmission, clearcoat and iridescence — hundreds of
 * lines, and it would immediately fall out of sync with three's implementation.
 * Instead we let three keep its entire physically-based pipeline and only
 * inject our colour into the two places we care about:
 *
 *   • `diffuseColor`  — the base albedo, so our gradient lights normally
 *   • `totalEmissiveRadiance` — a low-level emissive term so the iridescence
 *     still reads in shadow, which is what makes it feel like a gem
 *
 * We also must declare our uniforms on the material's own uniform object, since
 * three will not pick them up from anywhere else.
 *
 * ---------------------------------------------------------------------------
 * Reduced motion
 * ---------------------------------------------------------------------------
 * `uTimeScale` is driven from JS. When the OS asks for reduced motion we set it
 * to 0, which freezes the shimmer while keeping the view-dependent gradient
 * intact — the material still looks right, it just stops moving.
 */

import * as THREE from "three";

/* -------------------------------------------------------------------------
 * Uniform names — exported so the React layer and this file cannot drift
 * ---------------------------------------------------------------------- */

export const IRIDESCENCE_UNIFORMS = {
  time: "uTime",
  timeScale: "uTimeScale",
  hueShift: "uHueShift",
  saturation: "uSaturation",
  /** How strongly the view-angle term drives the hue. */
  viewStrength: "uViewStrength",
  /** Base "film thickness" that the time term modulates. */
  thickness: "uThickness",
  emissiveGain: "uEmissiveGain",
  /** Brand ramp, four stops. */
  colorA: "uColorA",
  colorB: "uColorB",
  colorC: "uColorC",
  colorD: "uColorD",
  /** 0 = light theme, 1 = dark. Nudges brightness without a second shader. */
  darkness: "uDarkness",
} as const;

export type IridescenceUniformName =
  (typeof IRIDESCENCE_UNIFORMS)[keyof typeof IRIDESCENCE_UNIFORMS];

/** Values the React layer can pass in. All optional but the ramp colours. */
export interface IridescenceParams {
  /** Ramp stops, as hex strings. */
  colorA: THREE.ColorRepresentation;
  colorB: THREE.ColorRepresentation;
  colorC: THREE.ColorRepresentation;
  colorD: THREE.ColorRepresentation;
  hueShift?: number;
  saturation?: number;
  viewStrength?: number;
  thickness?: number;
  emissiveGain?: number;
  timeScale?: number;
  darkness?: number;
}

/* -------------------------------------------------------------------------
 * GLSL — shared by both injection points
 * ------------------------------------------------------------------------- */

/**
 * Uniform + varying declarations, plus the ramp sampler.
 *
 * `THREE.ShaderChunk.common` already provides `PI` and friends, so we only add
 * what is genuinely new.
 */
const SHADER_HEAD = /* glsl */ `
  uniform float ${IRIDESCENCE_UNIFORMS.time};
  uniform float ${IRIDESCENCE_UNIFORMS.timeScale};
  uniform float ${IRIDESCENCE_UNIFORMS.hueShift};
  uniform float ${IRIDESCENCE_UNIFORMS.saturation};
  uniform float ${IRIDESCENCE_UNIFORMS.viewStrength};
  uniform float ${IRIDESCENCE_UNIFORMS.thickness};
  uniform float ${IRIDESCENCE_UNIFORMS.emissiveGain};
  uniform float ${IRIDESCENCE_UNIFORMS.darkness};
  uniform vec3  ${IRIDESCENCE_UNIFORMS.colorA};
  uniform vec3  ${IRIDESCENCE_UNIFORMS.colorB};
  uniform vec3  ${IRIDESCENCE_UNIFORMS.colorC};
  uniform vec3  ${IRIDESCENCE_UNIFORMS.colorD};

  varying vec3 vIridescentNormalW;
  varying vec3 vIridescentViewDir;

  /**
   * Four-stop ramp sampled at t in [0,1], in linear-ish sRGB space.
   * Three overlapping smoothsteps give a continuous blend with no branching.
   */
  vec3 iridescentRamp(float t) {
    t = fract(t);

    vec3 c = ${IRIDESCENCE_UNIFORMS.colorA};
    c = mix(c, ${IRIDESCENCE_UNIFORMS.colorB}, smoothstep(0.00, 0.34, t));
    c = mix(c, ${IRIDESCENCE_UNIFORMS.colorC}, smoothstep(0.30, 0.68, t));
    c = mix(c, ${IRIDESCENCE_UNIFORMS.colorD}, smoothstep(0.64, 1.00, t));

    // Wrap the last stop back to the first so the ramp is seamless — without
    // this the hue would jump when 't' crosses 1.0, which is very visible on a
    // continuously rotating object.
    c = mix(c, ${IRIDESCENCE_UNIFORMS.colorA}, smoothstep(0.94, 1.00, t));

    return c;
  }

  /**
   * The iridescence computation itself.
   *
   * @param normalW  World-space (or view-space, consistently) face normal.
   * @param viewDir  Direction from surface to camera.
   */
  vec3 iridescentColor(vec3 normalW, vec3 viewDir) {
    vec3 n = normalize(normalW);
    vec3 v = normalize(viewDir);

    // ---- 1. View-angle term -------------------------------------------
    // Fresnel-ish: 0 when looking straight on, 1 at grazing angles.
    float facing = clamp(dot(n, v), 0.0, 1.0);
    float fresnel = pow(1.0 - facing, 2.2);

    // ---- 2. Facet identity --------------------------------------------
    // A cheap hash of the normal. Adjacent facets get visibly different hues,
    // which is what sells the "faceted gem" read rather than a smooth blob.
    float facet = dot(n, vec3(0.62, 0.41, 0.68)) * 0.5 + 0.5;

    // ---- 3. Animated film thickness -----------------------------------
    // Two out-of-phase sine waves so the shimmer never looks like a single
    // pulse travelling one direction.
    float t = ${IRIDESCENCE_UNIFORMS.time} * ${IRIDESCENCE_UNIFORMS.timeScale};
    float wave = sin(t * 0.55 + facet * 2.6) * 0.5 + sin(t * 0.31 - facet * 1.7) * 0.5;

    float thickness = ${IRIDESCENCE_UNIFORMS.thickness} + wave * 0.045;

    // ---- 4. Combine into a hue ----------------------------------------
    float hue =
        facet * 0.55
      + fresnel * ${IRIDESCENCE_UNIFORMS.viewStrength}
      + thickness * 6.0
      + ${IRIDESCENCE_UNIFORMS.hueShift};

    vec3 color = iridescentRamp(hue);

    // Desaturate toward luminance for a more "glassy" highlight at the edges.
    float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(vec3(lum), color, ${IRIDESCENCE_UNIFORMS.saturation});

    // Brighten grazing angles so the silhouette catches light.
    color *= 1.0 + fresnel * 0.55;

    // Slight lift in dark mode keeps it from disappearing into the background.
    color *= mix(1.0, 1.18, ${IRIDESCENCE_UNIFORMS.darkness});

    return color;
  }
`;

/* -------------------------------------------------------------------------
 * Material factory
 * ------------------------------------------------------------------------- */

/** Handle returned to React so uniforms can be animated from `useFrame`. */
export interface IridescentMaterialHandle {
  material: THREE.MeshPhysicalMaterial;
  uniforms: Record<string, THREE.IUniform>;
  /**
   * Detach the `onBeforeCompile` hook.
   *
   * MUST be called on unmount. three caches compiled programs keyed partly by
   * the material's shader source; leaving a stale hook behind can leak the
   * program and, worse, bleed the custom shader into an unrelated material that
   * happens to share a cache key.
   */
  dispose: () => void;
}

/**
 * Build a `MeshPhysicalMaterial` with the iridescent gradient injected.
 *
 * The PBR settings below are what make it read as a gem rather than plastic:
 *   • `transmission` + `ior` — light passes through and refracts
 *   • `thickness` — gives the transmission something to work with (volume)
 *   • `iridescence` — three's own thin-film model, layered *on top of* our
 *     gradient for the physically-accurate component
 *   • `clearcoat` — a crisp lacquer layer that catches the key light
 *   • `flatShading` — REQUIRED. Without it the octahedron's facets would be
 *     normal-averaged into a smooth sphere-like blob and every gradient term
 *     above would collapse to a single value.
 *
 * @param params   Ramp colours and tuning.
 * @param existing Optional material to reuse (avoids re-creating on re-render).
 */
export function createIridescentMaterial(
  params: IridescenceParams,
  existing?: THREE.MeshPhysicalMaterial,
): IridescentMaterialHandle {
  const material = existing ?? new THREE.MeshPhysicalMaterial();

  /* ---- Base PBR configuration ---- */
  material.color = new THREE.Color(params.colorA);
  material.metalness = 0.12;
  material.roughness = 0.16;
  material.transmission = 0.58;
  material.ior = 1.62;
  material.thickness = 1.4;
  material.attenuationDistance = 2.4;
  material.attenuationColor = new THREE.Color(params.colorB);

  // three's built-in thin-film iridescence, on top of our gradient.
  material.iridescence = 0.85;
  material.iridescenceIOR = 1.38;
  material.iridescenceThicknessRange = [140, 620];

  material.clearcoat = 1;
  material.clearcoatRoughness = 0.08;
  material.envMapIntensity = 1.25;

  // Critical for the faceted look — see the note in the doc comment.
  material.flatShading = true;

  // Our gradient provides the colour; a lit surface on top of it would wash out.
  material.emissive = new THREE.Color(params.colorC);
  material.emissiveIntensity = 0.22;
  material.transparent = true;
  material.opacity = 1;

  /* ---- Uniforms ---- */
  // three does NOT collect uniforms from arbitrary places — they must live on
  // the material's own `uniforms` object to be bound.
  const uniforms: Record<string, THREE.IUniform> = {
    [IRIDESCENCE_UNIFORMS.time]: { value: 0 },
    [IRIDESCENCE_UNIFORMS.timeScale]: { value: params.timeScale ?? 1 },
    [IRIDESCENCE_UNIFORMS.hueShift]: { value: params.hueShift ?? 0 },
    [IRIDESCENCE_UNIFORMS.saturation]: { value: params.saturation ?? 1.15 },
    [IRIDESCENCE_UNIFORMS.viewStrength]: { value: params.viewStrength ?? 0.75 },
    [IRIDESCENCE_UNIFORMS.thickness]: { value: params.thickness ?? 0.3 },
    [IRIDESCENCE_UNIFORMS.emissiveGain]: { value: params.emissiveGain ?? 0.35 },
    [IRIDESCENCE_UNIFORMS.colorA]: { value: new THREE.Color(params.colorA) },
    [IRIDESCENCE_UNIFORMS.colorB]: { value: new THREE.Color(params.colorB) },
    [IRIDESCENCE_UNIFORMS.colorC]: { value: new THREE.Color(params.colorC) },
    [IRIDESCENCE_UNIFORMS.colorD]: { value: new THREE.Color(params.colorD) },
    [IRIDESCENCE_UNIFORMS.darkness]: { value: params.darkness ?? 0 },
  };

  // Carry the runtime-added uniform collection on the material. three does not
  // know about this field, but nothing reads it either — we simply keep our
  // own reference for `useFrame` to write into.
  material.userData.uniforms = uniforms;

  /* ---- Shader injection ---- */
  const previousOnBeforeCompile = material.onBeforeCompile?.bind(material);

  material.onBeforeCompile = (shader, renderer) => {
    previousOnBeforeCompile?.(shader, renderer);

    // 1. Bind our uniforms alongside three's.
    Object.assign(shader.uniforms, uniforms);

    // 2. Declarations. Prepended to both stages; `varying`s must match exactly.
    shader.vertexShader = `${SHADER_HEAD}\n${shader.vertexShader}`;
    shader.fragmentShader = `${SHADER_HEAD}\n${shader.fragmentShader}`;

    // 3. Vertex: pass world normal + view direction to the fragment stage.
    //
    //    `#include <defaultnormal_vertex>` has just run, so `transformedNormal`
    //    is available. We use the *object* normal rotated to world space rather
    //    than the eye-space normal because the gradient should stay stable as
    //    the camera moves, not slide with it.
    shader.vertexShader = shader.vertexShader.replace(
      "#include <worldpos_vertex>",
      /* glsl */ `
        #include <worldpos_vertex>
        vIridescentNormalW = normalize(mat3(modelMatrix) * objectNormal);
        vIridescentViewDir = normalize(cameraPosition - (modelMatrix * vec4(transformed, 1.0)).xyz);
      `,
    );

    // 4. Fragment: override diffuse colour, then add an emissive term.
    //
    //    `#include <color_fragment>` is the earliest reliable point where
    //    `diffuseColor` exists and has not yet been consumed by the lighting
    //    chunks.
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      /* glsl */ `
        #include <color_fragment>
        vec3 iridescent = iridescentColor(vIridescentNormalW, vIridescentViewDir);
        diffuseColor.rgb *= iridescent;
      `,
    );

    //    Emissive: keeps the iridescence readable in shadow. three accumulates
    //    into `totalEmissiveRadiance`; we add rather than overwrite so
    //    `emissiveIntensity` still has an effect.
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      /* glsl */ `
        #include <emissivemap_fragment>
        totalEmissiveRadiance += iridescent * ${IRIDESCENCE_UNIFORMS.emissiveGain} * 0.35;
      `,
    );
  };

  // Force a program recompile if the material was already compiled once.
  material.customProgramCacheKey = () => "iridescent-v1";

  return {
    material,
    uniforms,
    dispose: () => {
      material.onBeforeCompile = previousOnBeforeCompile;
      material.dispose();
    },
  };
}

/* -------------------------------------------------------------------------
 * Standalone shader for the particle field (raw ShaderMaterial)
 * ------------------------------------------------------------------------- */

/**
 * Vertex shader for the ambient particle field.
 *
 * Kept as a genuine `ShaderMaterial` (not an injection) because points need no
 * lighting at all — there is nothing to preserve, so injecting into a PBR
 * pipeline would be pure overhead.
 *
 * Motion is computed entirely on the GPU from `uTime` and a per-point seed, so
 * the CPU never touches the buffer after upload.
 */
export const PARTICLE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uTimeScale;
  uniform float uSize;
  uniform float uDrift;

  attribute float aSeed;
  attribute float aScale;

  varying float vFade;
  varying float vSeed;

  void main() {
    vSeed = aSeed;

    vec3 pos = position;

    // Each point drifts on its own ellipse. Phase comes from the seed so the
    // field never pulses in unison.
    float phase = aSeed * 6.2831853;
    float t = uTime * uTimeScale;

    pos.x += sin(t * 0.22 + phase) * uDrift;
    pos.y += cos(t * 0.17 + phase * 1.3) * uDrift * 0.8;
    pos.z += sin(t * 0.13 + phase * 0.7) * uDrift * 0.6;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Perspective-correct sizing with a floor, so distant points stay visible
    // instead of vanishing into sub-pixel noise.
    gl_PointSize = max(1.0, uSize * aScale * (1.0 / -mvPosition.z));

    // Fade the far field out to avoid a hard pop at the frustum edge.
    vFade = smoothstep(60.0, 8.0, -mvPosition.z);
  }
`;

/**
 * Fragment shader for the particle field.
 *
 * Draws a soft round sprite without a texture: `gl_PointCoord` gives us a
 * 0..1 coordinate inside the point, and a smoothstep cuts a circle with a
 * feathered edge. Cheaper than binding and sampling an alpha map, and it costs
 * no memory.
 */
export const PARTICLE_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;

  varying float vFade;
  varying float vSeed;

  void main() {
    // Round, feathered sprite.
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.05, dist);

    // Per-point colour blend so the field reads as iridescent rather than flat.
    vec3 color = mix(uColorA, uColorB, vSeed);
    color *= 1.0 + sin(vSeed * 12.0) * 0.08;

    gl_FragColor = vec4(color, alpha * uOpacity * vFade);
  }
`;
