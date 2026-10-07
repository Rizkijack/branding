"use client";

/**
 * ============================================================================
 * PROJECT FILTER
 * ============================================================================
 * The tech filter bar above /projects. Presentational + a thin controlled-state
 * wrapper: it owns nothing but the `onChange` call, so the same component can
 * be reused by the home page or a future "featured only" toggle.
 *
 * The chips themselves are real <button>s (see `FilterChip` in ui/Tag) and
 * carry `aria-pressed`, so a screen reader reports the active filter as a
 * toggle button in a pressed state rather than an unlabelled div.
 *
 * All state lives in <ProjectGrid>; this component is controlled.
 * ============================================================================
 */

import { FilterChip } from "@/components/ui/Tag";

export interface ProjectFilterProps {
  /** Every tag with how many projects carry it. */
  tags: readonly { name: string; count: number }[];
  /** `null` means "no filter" (the All chip). */
  activeTag: string | null;
  onChange: (tag: string | null) => void;
}

export function ProjectFilter({
  tags,
  activeTag,
  onChange,
}: ProjectFilterProps) {
  return (
    <nav aria-label="Filter projects by technology" className="relative z-30">
      <ul className="flex list-none flex-wrap items-center gap-2 p-0">
        <li>
          <FilterChip
            active={activeTag === null}
            onClick={() => onChange(null)}
          >
            All
          </FilterChip>
        </li>

        {tags.map((tag) => (
          <li key={tag.name}>
            <FilterChip
              active={activeTag === tag.name}
              count={tag.count}
              onClick={() => onChange(tag.name)}
            >
              {tag.name}
            </FilterChip>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Screen-reader-friendly summary of what is currently visible. */
export function filterLabel(
  activeTag: string | null,
  visible: number,
  total: number,
): string {
  return activeTag
    ? `Showing ${visible} of ${total} projects tagged ${activeTag}`
    : `Showing all ${total} projects`;
}
