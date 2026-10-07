/**
 * Loading state for /blog/[slug]. Article-shaped: header bars, then the
 * paragraph rhythm of the body. Uses the same primitives as the other
 * loading.tsx files so the shimmer reads as one system.
 */

import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export default function PostLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="container-page py-16 sm:py-24"
    >
      <span className="sr-only">Loading post…</span>

      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        {/* Header block — mirrors the real article header. */}
        <div className="flex flex-col gap-5 border-b border-line/70 pb-10">
          <Skeleton className="h-3.5 w-24 rounded-pill" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-3/5" />
          <SkeletonText lines={2} />
          <div className="mt-2 flex flex-wrap gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-6 w-16 rounded-pill" />
            <Skeleton className="h-6 w-20 rounded-pill" />
          </div>
        </div>

        {/* Body block — a few paragraphs with a heading and a code panel. */}
        <div className="flex flex-col gap-6">
          <SkeletonText lines={5} />
          <Skeleton className="h-7 w-2/3" />
          <SkeletonText lines={4} />
          <Skeleton className="h-40 w-full rounded-xl2" />
          <SkeletonText lines={6} />
        </div>
      </div>
    </div>
  );
}
