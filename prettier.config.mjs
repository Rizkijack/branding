/**
 * Prettier config.
 *
 * `prettier-plugin-tailwindcss` re-sorts utility classes so `cn()` output and
 * JSX stay in canonical order — it must stay last in the plugin array.
 *
 * Matches the ESLint style: double quotes, semicolons, 2-space indent, 80 cols.
 */
const config = {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: "always",

  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./src/app/globals.css",
  tailwindFunctions: ["cn", "cva"],

  overrides: [
    {
      // MDX: prose must not be reflowed — that would break authored line breaks.
      files: ["*.mdx"],
      options: { proseWrap: "preserve" },
    },
  ],
};

export default config;
