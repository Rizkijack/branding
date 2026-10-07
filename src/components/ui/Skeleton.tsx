/**
 * Loading placeholder. Uses a CSS shimmer (see the `skeleton` utility in
 * globals.css) rather than a JS animation so it costs nothing on the main
 * thread. All skeletons are aria-hidden; the surrounding region should carry a
 * `role="status"` + visually-hidden "Loading…" label.
 */

import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("skeleton rounded-xl", className)} />
  );
}

/** Text placeholder: `lines` bars with decreasing width, like real paragraphs. */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          // Keep the last line short so the block reads as a paragraph.
          className={i === lines - 1 ? "h-3.5 w-2/5" : "h-3.5 w-full"}
        />
      ))}
    </div>
  );
}

/** Full-page loading skeleton used by loading.tsx files. */
export function PageSkeleton({
  title = "Loading",
  children,
}: {
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="container-page py-20 sm:py-28"
    >
      {/* Screen-reader-only status text; the visible skeleton is decorative. */}
      <span className="sr-only">{title}…</span>

      <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
        <Skeleton className="h-3.5 w-32 rounded-pill" />
        <Skeleton className="h-12 w-full max-w-xl" />
        <Skeleton className="h-12 w-4/5 max-w-md" />
        <SkeletonText lines={3} className="mt-2 w-full max-w-xl" />
      </div>

      {children ?? (
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-card border border-line/70 p-7"
            >
              <Skeleton className="h-3 w-24 rounded-pill" />
              <Skeleton className="h-6 w-3/4" />
              <SkeletonText lines={3} />
              <div className="mt-1 flex gap-2">
                <Skeleton className="h-6 w-16 rounded-pill" />
                <Skeleton className="h-6 w-20 rounded-pill" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Grid of card skeletons — used by /projects and /blog loading states. */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex flex-col gap-4 rounded-card border border-line/70 p-7"
        >
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-3 w-16 rounded-pill" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-6 w-4/5" />
          <SkeletonText lines={3} />
          <div className="mt-2 flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16 rounded-pill" />
            <Skeleton className="h-6 w-20 rounded-pill" />
            <Skeleton className="h-6 w-14 rounded-pill" />
          </div>
        </div>
      ))}
    </div>
  );
}
