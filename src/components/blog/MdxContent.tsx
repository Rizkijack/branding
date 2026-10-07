/**
 * ============================================================================
 * MDX CONTENT
 * Compiles a post's MDX body to React on the server and renders it inside the
 * site's `.prose-post` scope.
 *
 * SERVER COMPONENT (no "use client"). Shiki and rehype-pretty-code stay in the
 * server bundle — see `serverExternalPackages` in next.config.ts — so the
 * highlighter never reaches the client.
 *
 * Styling split of responsibility:
 *   • globals.css owns everything inside code fences (background, line numbers,
 *     token colours via --syntax-* custom properties). `keepBackground: false`
 *     is required for that: shiki would otherwise inline a background colour
 *     that overrides the themed surface.
 *   • This file owns the prose-level elements — headings, links, tables,
 *     quotes — via the `components` map below.
 * ============================================================================
 */

import { MDXRemote, type MDXComponents } from "next-mdx-remote-client/rsc";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------
 * Slug helper
 * ---------------------------------------------------------------------- */

/**
 * GitHub-style slug from heading children.
 *
 * MDX ships no heading ids by default (that would need `rehype-slug`), so the
 * id is derived here from the rendered text. Inline code children are ignored,
 * which matches how GitHub slugifies `## Using \`tools\``.
 */
function slugify(children: ReactNode): string {
  const text = flattenText(children);

  return (
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "section"
  );
}

/** Depth-first text extraction, skipping element children (e.g. inline code). */
function flattenText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean")
    return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join("");

  if (typeof node === "object" && "props" in node) {
    const { children } = node.props as { children?: ReactNode };
    return flattenText(children);
  }

  return "";
}

/* -------------------------------------------------------------------------
 * Element overrides
 * ---------------------------------------------------------------------- */

/** h2/h3 props, minus `tag` which is our own discriminator. */
type HeadingProps = Omit<ComponentPropsWithoutRef<"h2">, "ref"> & {
  tag: "h2" | "h3";
};

/** h2/h3 get a stable id plus enough top margin to clear the sticky navbar. */
function Heading({ tag, className, ...props }: HeadingProps) {
  const { children } = props;
  const id = props.id ?? slugify(children);
  const Tag = tag;

  return (
    <Tag
      {...props}
      id={id}
      className={cn(
        "group/anchor scroll-mt-28",
        // A hairline rule under h2 keeps long posts scannable.
        tag === "h2" &&
          "mt-14 border-t border-line pt-8 first:mt-0 first:border-t-0 first:pt-0",
        className,
      )}
    >
      {children}
      {/* Anchor target for the heading; it becomes visible on hover or focus,
          and globals.css supplies the focus ring. */}
      <a
        href={`#${id}`}
        aria-label="Link to this section"
        className="ml-2 inline-block text-brand-purple/50 opacity-0 transition-opacity group-hover/anchor:opacity-100 focus-visible:opacity-100"
      >
        #
      </a>
    </Tag>
  );
}

/**
 * Anchors.
 *
 * External links open in a new tab with `rel="noopener noreferrer"` and get a
 * trailing ↗ affordance; internal links stay in place. `isExternal` is the same
 * predicate `Button` uses, so link behaviour is consistent site-wide.
 */
function Anchor({
  href = "",
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"a">) {
  const external = /^https?:\/\//i.test(href);

  return (
    <a
      {...props}
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "font-medium underline decoration-brand-purple/35 decoration-1 underline-offset-[3px]",
        "transition-colors hover:decoration-brand-purple",
        external && "inline-flex items-baseline gap-0.5",
        className,
      )}
    >
      {children}
      {external ? (
        <span aria-hidden="true" className="text-[0.8em] leading-none">
          ↗
        </span>
      ) : null}
    </a>
  );
}

/**
 * Wide tables get a horizontal scroll container instead of blowing out the
 * column on a phone. `tabIndex` + `role="region"` makes the scroll area
 * reachable and announced by assistive tech.
 */
function ScrollableTable(props: ComponentPropsWithoutRef<"table">) {
  return (
    <div
      role="region"
      aria-label="Table"
      tabIndex={0}
      className="-mx-4 my-8 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <table
        {...props}
        className={cn("my-0 w-full text-left", props.className)}
      />
    </div>
  );
}

/**
 * Media. There are no raster assets in the content layer, but an MDX author can
 * still drop an external image in — this keeps it inside the prose measure and
 * defers loading instead of blowing up the layout.
 *
 * `<img>` rather than `next/image`: MDX authors supply arbitrary external URLs,
 * and next/image would require every allowed host in `remotePatterns`. With no
 * image assets in this project that config would be fiction.
 */
function MdxImage({ alt = "", ...props }: ComponentPropsWithoutRef<"img">) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- see note above */
    <img
      {...props}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn("rounded-xl2 border border-line", props.className)}
    />
  );
}

/**
 * `pre` / `code` inside a fence are produced by rehype-pretty-code and styled
 * entirely by globals.css, so these are pure passthroughs. Inline code gets the
 * same passthrough — `.prose-post :not(pre) > code` handles its look.
 */
function Pre(props: ComponentPropsWithoutRef<"pre">) {
  return <pre {...props} />;
}

function Code(props: ComponentPropsWithoutRef<"code">) {
  return <code {...props} />;
}

const components: MDXComponents = {
  a: Anchor,
  h2: (props) => <Heading tag="h2" {...props} />,
  h3: (props) => <Heading tag="h3" {...props} />,
  h4: (props) => (
    <h4 {...props} className={cn("mt-8 scroll-mt-28", props.className)} />
  ),
  table: ScrollableTable,
  img: MdxImage,
  pre: Pre,
  code: Code,
  hr: () => (
    <div aria-hidden="true" className="my-12 divider-gradient w-full" />
  ),
  blockquote: (props) => (
    <blockquote
      {...props}
      className={cn(
        "my-8 rounded-xl2 border border-l-2 border-brand-purple/20 border-l-brand-purple/60",
        "bg-surface-2/60 py-2 pl-6 not-italic",
        props.className,
      )}
    />
  ),
};

/* -------------------------------------------------------------------------
 * Component
 * ---------------------------------------------------------------------- */

export interface MdxContentProps {
  /** Frontmatter-stripped MDX body, as returned by `getPostBySlug`. */
  source: string;
  /** Extra overrides merged on top of the site defaults. */
  components?: MDXComponents;
  className?: string;
}

export async function MdxContent({
  source,
  components: extra,
  className,
}: MdxContentProps) {
  return (
    <article
      className={cn(
        "prose-post prose prose-lg max-w-none",
        // `prose` resets margins aggressively; the post header already handles
        // vertical rhythm, so only horizontal rhythm is tightened here.
        "prose-headings:scroll-mt-28",
        className,
      )}
    >
      <MDXRemote
        source={source}
        components={extra ? { ...components, ...extra } : components}
        options={{
          mdxOptions: {
            /**
             * GitHub Flavored Markdown. Without this remark drops tables,
             * strikethrough, task lists and autolinks entirely — the pipe table
             * in the trading post would render as literal `|` text.
             */
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
              [
                rehypePrettyCode,
                {
                  // Both themes are emitted; `.dark` swaps the CSS variables in
                  // globals.css. `keepBackground: false` lets the CSS own the
                  // block background so it follows the theme.
                  theme: {
                    light: "github-light",
                    dark: "github-dark-dimmed",
                  },
                  keepBackground: false,
                  defaultLang: "plaintext",
                },
              ],
            ],
          },
        }}
      />
    </article>
  );
}
