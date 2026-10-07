/**
 * Loading state for /contact.
 *
 * Mirrors the real two-column layout (form card + details card) so the
 * transition into content is a swap rather than a reflow.
 */

import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export default function ContactLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="container-page py-16 sm:py-24"
    >
      <span className="sr-only">Loading contact form…</span>

      {/* Hero bars */}
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
        <Skeleton className="h-3.5 w-28 rounded-pill" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-4/5" />
        <SkeletonText lines={2} className="w-full max-w-xl" />
      </div>

      {/* Form + details */}
      <div className="mt-16 grid items-start gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="flex flex-col gap-5 rounded-card border border-line/70 p-7">
          <Skeleton className="h-6 w-40" />
          <SkeletonText lines={2} className="max-w-md" />

          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton
                className={
                  index === 2
                    ? "h-36 w-full rounded-xl2"
                    : "h-12 w-full rounded-pill"
                }
              />
            </div>
          ))}

          <Skeleton className="mt-2 h-12 w-40 rounded-pill" />
        </div>

        <div className="flex flex-col gap-6">
          {Array.from({ length: 2 }, (_, index) => (
            <div
              key={index}
              className="flex flex-col gap-5 rounded-card border border-line/70 p-7"
            >
              <Skeleton className="h-5 w-24" />
              {Array.from({ length: index === 0 ? 3 : 4 }, (_, row) => (
                <div key={row} className="flex items-center gap-3.5">
                  <Skeleton className="size-9 shrink-0 rounded-pill" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-2.5 w-16" />
                    <Skeleton className="h-3.5 w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
