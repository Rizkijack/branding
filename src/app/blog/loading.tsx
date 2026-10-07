/**
 * Loading state for /blog. Mirrors the real page shape: a hero band of bars
 * followed by the card grid, so the transition into content is a swap rather
 * than a jump.
 */

import { CardGridSkeleton, PageSkeleton } from "@/components/ui/Skeleton";

export default function BlogLoading() {
  return (
    <PageSkeleton title="Loading posts">
      <CardGridSkeleton count={6} />
    </PageSkeleton>
  );
}
