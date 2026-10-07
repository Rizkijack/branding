/**
 * Route-level loading state for /projects. Mirrors the real layout — centred
 * hero placeholder plus a three-up card grid — so the transition to the
 * rendered page doesn't shift content.
 *
 * `PageSkeleton` already renders a card grid as its default child, so we only
 * need to override it to match the 1/2/3-column rhythm the real page uses.
 */

import { CardGridSkeleton, PageSkeleton } from "@/components/ui/Skeleton";

export default function ProjectsLoading() {
  return (
    <PageSkeleton title="Loading projects">
      <CardGridSkeleton count={6} />
    </PageSkeleton>
  );
}
