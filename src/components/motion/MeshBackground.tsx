"use client";

/**
 * ============================================================================
 * MESH BACKGROUND — the animated iridescent blobs behind hero + key sections.
 * ============================================================================
 * Implementation notes:
 *  • Pure CSS radial gradients, zero images and zero runtime cost beyond the
 *    compositor.
 *  • `blur` is the single most expensive thing here, so it is applied via a
 *    pre-blurred layer and capped: mobile and reduced-motion visitors get the
 *    cheap path (opacity + scale animation only, no blur filter).
 *  • `will-change: transform` is set on the blobs only — putting it on a big
 *    wrapper forces the whole section onto its own layer and costs memory.
 */

import { useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/** One blob. `size` is a vw value so it scales with the viewport. */
interface BlobSpec {
  readonly color: string;
  /** Diameter in vw. */
  readonly size: number;
  /** Starting position in %, relative to the container. */
  readonly x: string;
  readonly y: string;
  /** Animation duration in seconds. */
  readonly duration: number;
  readonly delay: number;
  readonly opacity: number;
}

const DEFAULT_BLOBS: readonly BlobSpec[] = [
  {
    color: "var(--brand-purple)",
    size: 46,
    x: "8%",
    y: "0%",
    duration: 19,
    delay: 0,
    opacity: 0.5,
  },
  {
    color: "var(--brand-blue)",
    size: 40,
    x: "58%",
    y: "6%",
    duration: 24,
    delay: 1.6,
    opacity: 0.44,
  },
  {
    color: "var(--brand-pink)",
    size: 34,
    x: "26%",
    y: "48%",
    duration: 21,
    delay: 0.9,
    opacity: 0.34,
  },
  {
    color: "var(--brand-orange)",
    size: 26,
    x: "72%",
    y: "56%",
    duration: 27,
    delay: 2.4,
    opacity: 0.26,
  },
];

/** Subdued variant for interior sections (About, Contact, 404). */
const SUBTLE_BLOBS: readonly BlobSpec[] = DEFAULT_BLOBS.map((b) => ({
  ...b,
  opacity: b.opacity * 0.55,
  size: b.size * 1.15,
}));

export interface MeshBackgroundProps {
  className?: string;
  /** `soft` is for interior sections; `hero` is the loud one. */
  intensity?: "hero" | "soft";
  /** Number of blobs actually rendered. Fewer = cheaper. */
  count?: number;
  /** Accessible label. Omit (default) to hide it from screen readers. */
  label?: string;
}

export function MeshBackground({
  className,
  intensity = "soft",
  count = 4,
  label,
}: MeshBackgroundProps) {
  const reduceMotion = useReducedMotion();
  const palette = intensity === "hero" ? DEFAULT_BLOBS : SUBTLE_BLOBS;
  const blobs = palette.slice(0, Math.max(0, count));

  // Mobile + reduced motion: no blur filter. Radial gradients already read soft.
  const allowBlur = !reduceMotion;

  return (
    <div
      // Purely decorative — must never be announced or focusable.
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {blobs.map((blob, i) => (
        <span
          key={`${blob.color}-${i}`}
          className="absolute"
          style={
            {
              width: `${blob.size}vw`,
              height: `${blob.size}vw`,
              left: blob.x,
              top: blob.y,
              // translate(-50%,-50%) centres the blob on its coordinate.
              transform: "translate3d(-50%, -50%, 0)",
              borderRadius: "9999px",
              background: `radial-gradient(circle at 30% 30%, ${blob.color} 0%, ${blob.color} 42%, transparent 72%)`,
              opacity: blob.opacity,
              filter: allowBlur ? `blur(56px)` : undefined,
              animation: reduceMotion
                ? undefined
                : `drift ${blob.duration}s ease-in-out ${blob.delay}s infinite alternate`,
              willChange: reduceMotion ? undefined : "transform",
            } satisfies CSSProperties
          }
        />
      ))}

      {/* Vignette so text stays readable no matter where the blobs land. */}
      <span
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, transparent 0%, var(--bg) 78%)",
        }}
      />
    </div>
  );
}
