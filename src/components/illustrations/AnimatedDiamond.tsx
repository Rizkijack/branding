"use client";

/**
 * ============================================================================
 * ANIMATED DIAMOND — hero illustration
 * ============================================================================
 * A faceted Ethereum-style octahedron (two stacked pyramids) built from plain
 * SVG polygons, plus orbiting hexagons that react to the pointer.
 *
 * Composition:
 *   <section>            static, provides layout + aria
 *     <motion.g>         pointer parallax container (spring-smoothed)
 *       <motion.div>     float loop (translateY)
 *         <svg>          3D rotation (rotateX/rotateY), continuous
 *           faces        6 polygons with independent gradient fills
 *         </svg>
 *         orbit rings    2 SVG rings + 3 hex nodes on CSS animations
 *       </motion.div>
 *       <span>           soft glow pulse behind everything
 *
 * Why CSS animations for the orbit instead of Framer?
 *   The orbit never changes in React, so driving it with CSS keeps it entirely
 *   on the compositor. Framer is reserved for the pointer parallax, which does
 *   need JS.
 *
 * Accessibility:
 *   • `role="img"` + a real <title>/<desc> so the art is described, not skipped.
 *   • Under `prefers-reduced-motion`, float/rotate/orbit all stop and the
 *     parallax is disabled — the diamond renders in its neutral pose.
 *
 * Performance:
 *   • `pointer-events-none` on the wrapper, so it never blocks clicks.
 *   • Pointer tracking is rAF-throttled via Framer's motion values (no
 *     setState per mousemove).
 *   • Gradients are defined once in <defs> and shared by all faces.
 */

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Art dimensions. The wrapper scales this with CSS, so SVG stays crisp. */
const VB_W = 320;
const VB_H = 360;

export interface AnimatedDiamondProps {
  className?: string;
  /** Show the orbiting hexagons + rings. */
  withOrbits?: boolean;
  /** Show the pulsing glow disc behind the diamond. */
  withGlow?: boolean;
  /** Accessible description; pass null to hide the whole figure from AT. */
  title?: string;
  description?: string;
  /** Content rendered inside the parallax wrapper, after the art. */
  children?: ReactNode;
  /** Spring stiffness. Lower = looser, more playful. */
  parallaxStrength?: number;
}

/* -------------------------------------------------------------------------
 * Pointer parallax
 * ---------------------------------------------------------------------- */

/**
 * Tracks the pointer across `originEl` and exposes smoothed -1..1 offsets.
 * `useMotionValue` + `useSpring` means zero React re-renders while moving.
 */
function PointerParallax({
  strength,
  children,
  className,
}: {
  strength: number;
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  const px = useMotionValue(0);
  const py = useMotionValue(0);

  // Damping the raw pointer values is what makes this feel like depth rather
  // than jitter. Higher damping = slower, heavier follow.
  const sx = useSpring(px, { stiffness: 90, damping: 20, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 90, damping: 20, mass: 0.6 });

  // Transforms are declared up front (never inline inside `style`) so the hook
  // call order stays stable and lint can verify it.
  const x = useTransform(sx, [-1, 1], [-strength * 26, strength * 26]);
  const y = useTransform(sy, [-1, 1], [-strength * 18, strength * 18]);
  const rotateY = useTransform(sx, [-1, 1], [-strength * 9, strength * 9]);
  const rotateX = useTransform(sy, [-1, 1], [strength * 7, -strength * 7]);

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      style={{ x, y, rotateX, rotateY, transformPerspective: 1000 }}
      onPointerMove={(event) => {
        // Ignore touch — a drag that scrolls the page shouldn't drag the art.
        if (event.pointerType !== "mouse") return;
        const { innerWidth, innerHeight } = window;
        px.set((event.clientX / innerWidth) * 2 - 1);
        py.set((event.clientY / innerHeight) * 2 - 1);
      }}
      // Returning to rest when the pointer leaves avoids a stuck tilt.
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------
 * The diamond
 * ---------------------------------------------------------------------- */

export function AnimatedDiamond({
  className,
  withOrbits = true,
  withGlow = true,
  title = "A faceted Ethereum-style octahedron",
  description = "Two mirrored pyramids joined at the waist, lit from the upper left, floating slowly and casting a soft purple glow. Small hexagonal nodes orbit it.",
  children,
  parallaxStrength = 1,
}: AnimatedDiamondProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      // Art must never intercept clicks meant for the CTA buttons beside it.
      className={cn(
        "pointer-events-none relative aspect-[320/360] w-full max-w-[22rem]",
        className,
      )}
      role={title ? "img" : "presentation"}
      aria-label={title ?? undefined}
    >
      {/* Glow disc — sits behind everything, pulses on a CSS animation. */}
      {withGlow ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-1/2 left-1/2 -z-10 h-[68%] w-[68%] -translate-x-1/2 -translate-y-1/2",
            "animate-pulse-glow rounded-full",
          )}
          style={{
            background:
              "radial-gradient(circle, rgb(138 92 246 / 0.42) 0%, rgb(98 126 234 / 0.2) 45%, transparent 70%)",
            filter: reduceMotion ? undefined : "blur(28px)",
          }}
        />
      ) : null}

      <PointerParallax strength={parallaxStrength} className="absolute inset-0">
        {/* Float loop. Nested outside the SVG so it moves the art as one unit. */}
        <div
          className={cn(
            "relative h-full w-full",
            !reduceMotion && "animate-float",
          )}
        >
          {withOrbits ? <Orbits /> : null}

          {/* Continuous 3D rotation. transform-box/transform-origin are set
              below because Safari needs them for 3D on a plain element. */}
          <div
            className="absolute inset-0 grid place-items-center"
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: "center center",
              animation: reduceMotion
                ? undefined
                : "spin-slow 26s linear infinite",
            }}
          >
            <svg
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              width="100%"
              height="100%"
              // The rotation above is on the wrapper; this SVG only draws.
              style={{ transform: "rotateX(-16deg)" }}
            >
              {title ? <title>{title}</title> : null}
              {description ? <desc>{description}</desc> : null}

              <defs>
                {/* Six faceted fills, all inside the violet family so the gem
                    reads as amethyst rather than as a rainbow. */}
                <linearGradient id="d-top-left" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="100%" stopColor="#8a5cf6" />
                </linearGradient>
                <linearGradient id="d-top-mid" x1="0.5" y1="0" x2="0.5" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#6366d9" />
                </linearGradient>
                <linearGradient id="d-top-right" x1="1" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366d9" />
                  <stop offset="100%" stopColor="#8b8ff2" />
                </linearGradient>
                <linearGradient id="d-bot-left" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#5b4ce0" />
                  <stop offset="100%" stopColor="#6366d9" />
                </linearGradient>
                <linearGradient id="d-bot-mid" x1="0.5" y1="1" x2="0.5" y2="0">
                  <stop offset="0%" stopColor="#7c6ff0" />
                  <stop offset="100%" stopColor="#8b8ff2" />
                </linearGradient>
                <linearGradient id="d-bot-right" x1="1" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#b98fd6" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>

                {/* Edge highlight for the specular sliver on the upper left. */}
                <linearGradient id="d-shine" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
                  <stop offset="60%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* --- Upper pyramid: apex at (160,26), waist at y=176 --- */}
              {/* Left face */}
              <polygon points="160,26 52,176 160,176" fill="url(#d-top-left)" />
              {/* Middle face (front, brightest — key light) */}
              <polygon points="160,26 160,176 268,176" fill="url(#d-top-mid)" />
              {/* Right face (darkest, away from light) */}
              <polygon
                points="160,26 268,176 160,176"
                fill="url(#d-top-right)"
                opacity="0.92"
              />

              {/* --- Lower pyramid: apex at (160,334) --- */}
              {/* Left face */}
              <polygon
                points="160,334 52,176 160,176"
                fill="url(#d-bot-left)"
              />
              {/* Middle face — warm bounce from the pink/orange end of the ramp */}
              <polygon
                points="160,334 160,176 268,176"
                fill="url(#d-bot-right)"
              />
              {/* Right face */}
              <polygon
                points="160,334 268,176 160,176"
                fill="url(#d-bot-mid)"
                opacity="0.9"
              />

              {/* Waist seam + facet edges. Crisp hairlines sell the 3D read. */}
              <path
                d="M52 176 H268"
                stroke="#fff"
                strokeOpacity="0.42"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M160 26 V334"
                stroke="#fff"
                strokeOpacity="0.16"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M160 26 L52 176 M160 26 L268 176 M160 334 L52 176 M160 334 L268 176"
                stroke="#fff"
                strokeOpacity="0.1"
                strokeWidth="1"
                fill="none"
              />

              {/* Specular sliver on the upper-left facet. */}
              <polygon points="160,26 52,176 96,176" fill="url(#d-shine)" />
            </svg>
          </div>
        </div>
      </PointerParallax>

      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Orbit rings + hexagonal nodes
 * ---------------------------------------------------------------------- */

/** CSS-only orbit. `animation` runs on the compositor, no JS per frame. */
function Orbits() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* Two tilted ellipses. Each rotates on its own axis, opposite directions. */}
      <svg
        viewBox="0 0 320 360"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        <ellipse
          cx="160"
          cy="180"
          rx="152"
          ry="56"
          stroke="currentColor"
          strokeOpacity="0.28"
          strokeWidth="1"
          className={
            reduceMotion ? undefined : "origin-center animate-spin-slow"
          }
          style={{ transformBox: "fill-box" }}
        />
        <ellipse
          cx="160"
          cy="180"
          rx="126"
          ry="168"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="1"
          className={
            reduceMotion ? undefined : "origin-center animate-spin-slower"
          }
          style={{ transformBox: "fill-box" }}
        />
      </svg>

      {/* Three nodes on the outer ring, phase-shifted so they never align. */}
      <span
        className={cn(
          "absolute top-[46%] left-[4%] size-3 text-brand-purple",
          !reduceMotion && "animate-float",
        )}
      >
        <HexNode />
      </span>
      <span
        className={cn(
          "absolute top-[28%] right-[6%] size-2.5 text-brand-pink",
          !reduceMotion && "animate-float-slow",
        )}
        style={reduceMotion ? undefined : { animationDelay: "0.7s" }}
      >
        <HexNode />
      </span>
      <span
        className={cn(
          "absolute right-[14%] bottom-[18%] size-2 text-brand-blue",
          !reduceMotion && "animate-float",
        )}
        style={reduceMotion ? undefined : { animationDelay: "1.4s" }}
      >
        <HexNode />
      </span>
    </div>
  );
}

/** A small hexagon outline. `currentColor` so callers just set text-*. */
function HexNode({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-full", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    >
      <polygon points="12,2.5 20.5,7.25 20.5,16.75 12,21.5 3.5,16.75 3.5,7.25" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
