/**
 * PostCSS config.
 *
 * Tailwind v4 runs as a PostCSS plugin. This is the standard wiring, and it is
 * what makes `@import "tailwindcss"`, `@theme`, `@utility` and `@keyframes`
 * inside `src/app/globals.css` actually compile.
 *
 * Note: `@tailwindcss/turbopack` (a `turbopack.rules` CSS loader in
 * next.config.ts) is an alternative to this file — but NOT both at once. Using
 * PostCSS is the portable option: it works with `next dev`, `next build` and
 * `next build --webpack` identically.
 *
 * `@tailwindcss/postcss` bundles its own Lightning CSS-based engine, so no
 * `autoprefixer` or `cssnano` is required.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
