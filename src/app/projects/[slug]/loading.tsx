/**
 * Route-level loading state for /projects/[slug]. Shaped like the article: a
 * back-link bar, a title block, a lede, then the two-column checklist.
 *
 * `PageSkeleton` renders its own centred hero placeholder, so we pass the
 * detail-shaped body as children and skip the built-in grid.
 */

import {
  CardGridSkeleton,
  PageSkeleton,
  Skeleton,
  SkeletonText,
} from "@/components/ui/Skeleton";

export default function ProjectDetailLoading() {
  return (
    <PageSkeleton title="Loading project">
      <div className="mt-16 flex flex-col gap-4">
        <Skeleton className="h-3.5 w-40 rounded-pill" />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl2 border border-line/70 bg-surface-2 p-4"
            >
              <Skeleton className="size-5 shrink-0 rounded-full" />
              <SkeletonText lines={2} className="flex-1" />
            </div>
          ))}
        </div>

        <div className="mt-8 max-w-3xl">
          <SkeletonText lines={5} />
        </div>
      </div>

      <CardGridSkeleton count={2} />
    </PageSkeleton>
  );
}
