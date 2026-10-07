/**
 * ============================================================================
 * EFFECTS TOGGLE — the "3D effects: on/off" switch in the navbar
 * ============================================================================
 * Persists to localStorage (`branding-3d-effects`) and updates the store, which
 * the canvas layer subscribes to.
 *
 * Accessibility notes
 * -------------------
 * Uses `aria-pressed` (not `aria-checked`): this is a toggle *button* that
 * changes a setting, which is exactly the `pressed` semantics. The visible
 * state is reinforced by colour AND the icon, so colour is never the only cue.
 *
 * The control is hidden when the probe has not finished, because before then
 * there is nothing meaningful to toggle — showing a switch that silently does
 * nothing on click is worse than showing it late.
 */

"use client";

import { useReducedMotion } from "framer-motion";

import { SparklesIcon } from "@/components/icons/InlineIcons";
import { useMounted } from "@/components/three/use-three-environment";
import { useEffectsPreference } from "@/components/three/use-three-environment";
import { cn } from "@/lib/utils";

export function EffectsToggle({ className }: { className?: string }) {
  const { enabled, supported, ready, toggle } = useEffectsPreference();
  const mounted = useMounted();

  // Before the probe resolves we render nothing rather than a dead switch.
  if (!mounted || !ready || !supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      title={enabled ? "3D effects are on — click to turn off" : "3D effects are off — click to turn on"}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-pill border px-3 text-[0.76rem] font-medium",
        "transition-colors duration-250",
        enabled
          ? "border-brand-purple/45 bg-brand-purple/10 text-brand-purple"
          : "border-line bg-surface text-fg-subtle hover:text-fg",
        className,
      )}
    >
      <SparklesIcon
        className={cn(
          "text-[0.85rem] transition-transform duration-400",
          enabled && "rotate-0 scale-100",
        )}
      />
      <span className="hidden sm:inline">3D</span>
      <span className="sr-only">3D effects</span>
    </button>
  );
}

export default EffectsToggle;
