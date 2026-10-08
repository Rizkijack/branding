import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier/flat";

/**
 * Flat ESLint config.
 *
 * Order matters: `eslint-config-prettier` runs LAST so it can switch off every
 * formatting rule that would otherwise conflict with Prettier. Putting it first
 * would let react/next rules re-enable formatting errors.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettierConfig,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // MDX is not linted by ESLint; Prettier formats it instead.
    "src/content/**",
  ]),

  {
    rules: {
      // Unused args prefixed with "_" are intentional placeholders.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],

      // `any` is almost always a lost `unknown` in this codebase.
      "@typescript-eslint/no-explicit-any": "warn",

      // The hooks rules are the highest-value checks in a client-heavy app.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Next's <Image> is required for any raster asset.
      "@next/next/no-img-element": "error",
    },
  },

  {
    /**
     * `react-hooks/immutability` is on by default in eslint-plugin-react-hooks
     * v7, and it flags every mutation of a value that flowed through a hook.
     *
     * In `src/components/three` those values are three.js scene-graph objects —
     * shader uniforms, materials, cameras — which are mutable *by design* and
     * have no immutable counterpart. Writing
     *
     *     handle.uniforms.uTime.value += delta
     *
     * inside `useFrame` is precisely what React Three Fiber's `useFrame` exists
     * for, and it cannot be expressed any other way: three.js has no
     * withUniforms()-style API, and re-creating a material per frame would
     * leak GPU resources and recompile shaders every frame.
     *
     * The rule exists to stop in-place mutation of React *props and state*.
     * Nothing in this directory stores scene objects in React state — they
     * live in refs, in `useMemo` factories and in R3F's own reconciler — so the
     * rule cannot fire here for the reason it was written. Every reported site
     * is a false positive of that one shape.
     *
     * It is therefore turned off for this directory only. The scope is narrow
     * on purpose: the rest of `src/` keeps the rule, so a genuine
     * state-mutation anywhere else in the app is still an error.
     *
     * One residual gap is worth naming: components such as `Stage` select the
     * store's `palette` object via `useThreeStore((s) => s.palette)`, and that
     * *is* React state — mutating it in place would be a real bug this rule
     * would once have caught. Nothing in this directory does so (the palette
     * is always replaced via `setTheme`, never written field by field), but if
     * that ever changes, re-enable the rule here instead of relying on it
     * staying off.
     */
    files: ["src/components/three/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/immutability": "off",
    },
  },
]);

export default eslintConfig;
