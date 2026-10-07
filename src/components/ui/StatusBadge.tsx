/**
 * Status pill for a project. Colour is driven by data, never hard-coded per
 * component, so adding a new status is a one-line change in this file.
 */

import { projects, type Project, type ProjectStatus } from "@/data/projects";
import { cn } from "@/lib/utils";

interface StatusMeta {
  readonly label: string;
  readonly color: string;
  /** Longer explanation for the title attribute. */
  readonly hint: string;
}

const STATUS: Record<ProjectStatus, StatusMeta> = {
  live: {
    label: "Live",
    color: "#16a6a1",
    hint: "Deployed and publicly reachable",
  },
  "in-progress": {
    label: "In progress",
    color: "#f7c948",
    hint: "Actively being built",
  },
  archived: {
    label: "Archived",
    color: "#8f8cae",
    hint: "No longer maintained",
  },
};

export function statusMeta(status: ProjectStatus): StatusMeta {
  return STATUS[status] ?? STATUS.archived;
}

export function StatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const meta = statusMeta(status);

  return (
    <span
      title={meta.hint}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5",
        "text-[0.7rem] font-medium text-fg-muted",
        "border border-line bg-surface-2",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full"
        style={{ background: meta.color }}
      />
      {meta.label}
    </span>
  );
}

/** Wrapper type re-export so callers can type their own props from one place. */
export type { Project };
export { projects };
