/**
 * ============================================================================
 * /projects/[slug] — detail
 * ============================================================================
 * Server component, statically generated for every entry in `projects`.
 *
 * Next 16: `params` is a Promise, so both `generateMetadata` and the page
 * itself must await it. `generateStaticParams` returns `{ slug }[]`.
 * ============================================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ArrowLeftIcon, CheckIcon } from "@/components/icons/InlineIcons";
import { MeshBackground } from "@/components/motion/MeshBackground";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/Button";
import { Eyebrow, Lede, Section } from "@/components/ui/Typography";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tag } from "@/components/ui/Tag";
import { getProject, getRelatedProjects, projects } from "@/data/projects";
import { buildMetadata } from "@/lib/site";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------
 * Static params + metadata
 * ---------------------------------------------------------------------- */

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    // Unknown slug: fall back to the index metadata so we never emit an
    // empty <title>.
    return buildMetadata({ title: "Project", path: "/projects" });
  }

  const base = buildMetadata({
    title: project.title,
    description: project.summary,
    path: `/projects/${project.slug}`,
    keywords: [...project.tech, "project", project.status, project.year],
  });

  return {
    ...base,
    // A project page is closer to an article than to a listing page, which
    // changes how link previews are rendered by some crawlers.
    openGraph: { ...base.openGraph, type: "article" },
  };
}

/* -------------------------------------------------------------------------
 * Minimal markdown renderer
 * ---------------------------------------------------------------------- */

/**
 * Handles ONLY the subset used by `Project.body`: `##`/`###` headings,
 * paragraphs, `-` bullet lists and fenced code blocks. Anything else (tables,
 * images, links, JSX) would render as literal text — the data layer is authored
 * in-house, so a full markdown pipeline would be dead weight here.
 *
 * Inline `**bold**` and `*italic*` are supported because the prose uses them.
 * No dangerouslySetInnerHTML: text is split into nodes, so a `body` string can
 * never inject markup.
 */
function renderInline(text: string): ReactNode[] {
  // Order matters: bold must be matched before italic, otherwise the leading
  // `*` of `**bold**` would be consumed as an italic marker.
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-fg">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={i}
          className="rounded-[0.4rem] border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-brand-purple"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

type Block =
  | { kind: "heading"; level: 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "code"; lang: string; source: string };

function parseMarkdown(md: string): Block[] {
  const blocks: Block[] = [];
  const lines = md.split("\n");

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) continue;

    // Fenced code block — consume until the closing fence.
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const source: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        source.push(lines[i]);
        i += 1;
      }
      blocks.push({ kind: "code", lang, source: source.join("\n") });
      continue;
    }

    const heading = /^(#{2,3})\s+(.*)$/.exec(trimmed);
    if (heading) {
      blocks.push({
        kind: "heading",
        level: heading[1].length as 2 | 3,
        text: heading[2],
      });
      continue;
    }

    // Bullet list — consume every consecutive `- ` line.
    if (trimmed.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2));
        i += 1;
      }
      i -= 1; // the outer loop's i += 1 accounts for the next line
      blocks.push({ kind: "list", items });
      continue;
    }

    blocks.push({ kind: "paragraph", text: trimmed });
  }

  return blocks;
}

function ProjectBody({ source }: { source: string }) {
  const blocks = parseMarkdown(source);

  return (
    <div className="mt-10 flex max-w-3xl flex-col gap-5">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "heading":
            return block.level === 2 ? (
              <h2
                key={i}
                className="mt-6 text-[clamp(1.35rem,1.1rem+1vw,1.75rem)] font-bold"
              >
                {renderInline(block.text)}
              </h2>
            ) : (
              <h3 key={i} className="mt-4 text-[1.15rem] font-bold">
                {renderInline(block.text)}
              </h3>
            );

          case "list":
            return (
              <ul key={i} className="flex list-none flex-col gap-2.5 p-0">
                {block.items.map((item, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2.5 text-[0.98rem] leading-relaxed text-fg-muted"
                  >
                    <CheckIcon className="mt-1 shrink-0 text-brand-purple" />
                    <span>{renderInline(item)}</span>
                  </li>
                ))}
              </ul>
            );

          case "code":
            return (
              <pre
                key={i}
                className="overflow-x-auto rounded-xl2 border border-line bg-surface-2 p-4 text-[0.86rem] leading-relaxed"
              >
                <code className="font-mono">{block.source}</code>
              </pre>
            );

          case "paragraph":
          default:
            return (
              <p
                key={i}
                className="text-[0.98rem] leading-[1.75] text-fg-muted"
              >
                {renderInline(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Page
 * ---------------------------------------------------------------------- */

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) notFound();

  const related = getRelatedProjects(slug, 2);

  return (
    <>
      {/* ---------------------------------------------------------------
          Header
          --------------------------------------------------------------- */}
      <section className="relative isolate overflow-hidden">
        <MeshBackground intensity="soft" />

        <div className="relative z-10 container-page pt-10 pb-14 sm:pt-14 sm:pb-20">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-[0.85rem] font-medium text-fg-muted transition-colors hover:text-brand-purple"
          >
            <ArrowLeftIcon />
            All projects
          </Link>

          <div className="mt-10 flex flex-col gap-5">
            {/* Status + year. Eyebrow is uppercase, so the values read as labels. */}
            <div className="flex flex-wrap items-center gap-3">
              <Eyebrow as="p">
                {project.year} · {project.role}
              </Eyebrow>
              <StatusBadge status={project.status} />
            </div>

            <h1 className="max-w-4xl text-[clamp(2.2rem,1.3rem+4vw,3.9rem)] leading-[1.05] font-bold">
              {project.title}
            </h1>

            {/* max-w caps the measure so the long description stays readable. */}
            <div className="max-w-3xl">
              <Lede className="text-[1.05rem] sm:text-[1.12rem]">
                {project.description}
              </Lede>
            </div>

            {/* Meta row */}
            <ul className="mt-2 flex list-none flex-wrap items-center gap-2 p-0">
              {project.tech.map((tech) => (
                <li key={tech}>
                  <Tag size="md">{tech}</Tag>
                </li>
              ))}
            </ul>

            {/* CTAs. `Button` sets target=_blank + rel=noopener for absolute
                hrefs, so the external behaviour is automatic. */}
            {(project.link || project.repo) && (
              <div className="mt-4 flex flex-wrap gap-3">
                {project.link ? (
                  <Button href={project.link} size="md">
                    Visit project
                  </Button>
                ) : null}
                {project.repo ? (
                  <Button href={project.repo} variant="secondary" size="md">
                    Source code
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          What I built + long-form body
          --------------------------------------------------------------- */}
      <Section className="pb-20 sm:pb-28">
        <div className="container-page">
          <div className="mt-14">
            <Eyebrow as="h2">What I built</Eyebrow>

            <ul className="mt-6 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
              {project.highlights.map((item) => (
                <li
                  key={item}
                  className={cn(
                    "flex items-start gap-3 rounded-xl2 border border-line/70 bg-surface-2 p-4",
                    "text-[0.92rem] leading-relaxed text-fg-muted",
                  )}
                  // The left edge picks up the project's accent colour.
                  style={{ borderLeftColor: project.accent }}
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: `${project.accent}22`,
                      color: project.accent,
                    }}
                  >
                    <CheckIcon />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {project.body ? (
              <>
                <Eyebrow as="h2" className="mt-16">
                  Notes
                </Eyebrow>
                <ProjectBody source={project.body} />
              </>
            ) : null}
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------------
          Related work
          --------------------------------------------------------------- */}
      {related.length > 0 ? (
        <Section className="pb-24 sm:pb-32">
          <div className="container-page">
            <header className="flex flex-col gap-3">
              <Eyebrow as="h2">Related work</Eyebrow>
              <h2 className="-mt-1 text-[clamp(1.6rem,1.2rem+1.8vw,2.4rem)] font-bold">
                Shares a stack with {project.title}
              </h2>
            </header>

            <ul className="mt-10 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2">
              {related.map((item) => (
                <li key={item.slug} className="flex">
                  <ProjectCard project={item} compact />
                </li>
              ))}
            </ul>

            <p className="mt-10 text-[0.85rem] text-fg-subtle">
              <Link
                href="/projects"
                className="text-brand-purple underline-offset-4 hover:underline"
              >
                Browse the full index
              </Link>
            </p>
          </div>
        </Section>
      ) : null}
    </>
  );
}
