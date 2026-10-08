/**
 * ============================================================================
 * HERO DIAMOND STAGE — the drop-in replacement for <AnimatedDiamond>
 * ============================================================================
 * Renders the 3D octahedron in a fixed-size box, or the original SVG when the
 * 3D layer is off / unsupported / reduced-motion.
 *
 * This is the component the home page actually uses. It owns the decision, so
 * `Hero.tsx` stays declarative and never has to know why 3D is unavailable.
 *
 * --------------------------------------------------------------------------- *
 * Sizing                                                                     *
 * --------------------------------------------------------------------------- *
 * The canvas is `absolute inset-0` inside a relatively-positioned wrapper
 * whose aspect ratio is fixed by the `aspect-*` class. That is what stops the
 * layout from shifting when the canvas swaps in — the box exists either way.
 *
 * --------------------------------------------------------------------------- *
 * Accessibility                                                              *
 * --------------------------------------------------------------------------- *
 * The canvas host is `aria-hidden`: the diamond is decorative. The SVG
 * fallback carries the same role, so nothing here is ever announced.
 */

"use client";

import dynamic from "next/dynamic";

import { AnimatedDiamond } from "@/components/illustrations/AnimatedDiamond";
import { useThreeActive } from "@/components/three/use-three-environment";
import { cn } from "@/lib/utils";

/**
 * The inner canvas. Dynamic so `three`/`@react-three/fiber` never reach the
 * server bundle and this component stays cheap when 3D is off.
 */
const HeroDiamondCanvas = dynamic(
  () => import("@/components/three/HeroDiamondCanvas"),
  { ssr: false, loading: () => null },
);

export interface HeroDiamondStageProps {
  /** Tailwind size classes for the wrapper, e.g. "w-full max-w-[21rem]". */
  className?: string;
  /**
   * Fixed aspect ratio so the box does not shift when the canvas mounts.
   * Defaults to the SVG original's ~4/3.
   */
  aspect?: string;
  /** Drive the diamond along the home-page scroll path. */
  scrollDriven?: boolean;
}

export function HeroDiamondStage({
  className,
  aspect = "aspect-[4/3]",
  scrollDriven = false,
}: HeroDiamondStageProps) {
  const active = useThreeActive();

  // Before the probe resolves (or SSR): the original SVG. It is the exact same
  // illustration the site shipped before the 3D layer existed.
  if (!active) {
    return <AnimatedDiamond className={cn(className)} />;
  }

  return (
    <div className={cn("relative", aspect, className)}>
      <div className="absolute inset-0" aria-hidden="true">
        <HeroDiamondCanvas scrollDriven={scrollDriven} />
      </div>
    </div>
  );
}

export default HeroDiamondStage;
