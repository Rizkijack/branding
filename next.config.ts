import type { NextConfig } from "next";

/**
 * MDX is compiled at build time by `next-mdx-remote-client/rsc` (see
 * `src/lib/blog.ts` + `src/components/blog/MdxContent.tsx`), which means we do
 * NOT need `@next/mdx` or a webpack/MDX loader here. Posts are plain .mdx files
 * read from disk, so the build stays a plain static export.
 *
 * Styling: Tailwind v4 is wired up through `postcss.config.mjs`
 * (`@tailwindcss/postcss`). That is the portable setup and works for
 * `next dev`, `next build` and `next build --webpack` alike. Do NOT also add a
 * `turbopack.rules` CSS loader for `@tailwindcss/turbopack` — the two would
 * fight over the same file and `@utility` / `@theme` blocks would pass through
 * unprocessed.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * `cacheComponents` (formerly `dynamicIO`) stays OFF on purpose.
   *
   * Every page here is either static or reads local files at build time, so
   * there is nothing dynamic to require a Suspense boundary. Leaving it off
   * keeps the mental model simple: add a "use cache" only when you actually
   * introduce a runtime dependency such as fetch() to a live API.
   */
  cacheComponents: false,

  /**
   * MDX + shiki are parsed on the server only. This keeps the highlighter out of
   * the client bundle entirely, which is the main Lighthouse lever for the blog.
   */
  serverExternalPackages: ["rehype-pretty-code", "shiki"],

  /**
   * Emit the `light`/`dark` colour-scheme so native UI (scrollbars, form
   * controls, the mobile URL bar) matches the active theme.
   */
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },

  // Headers that apply to every route. Safe defaults; no CSP because inline SVG
  // gradients and Next's inline theme script would need per-page nonces.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default nextConfig;
