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
]);

export default eslintConfig;
