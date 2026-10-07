"use client";

/**
 * Light/dark toggle.
 *
 * Hydration: the server cannot know the active theme, so before mount we render
 * a same-size placeholder. `useSyncExternalStore` is the right tool for this —
 * it reports `false` on the server and during hydration, then `true` once
 * mounted, with no `setState` inside an effect and no cascading render.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { MoonIcon, SunIcon } from "@/components/icons/InlineIcons";
import { cn } from "@/lib/utils";

/** No-op subscriber: the mounted flag never changes after the first read. */
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  // false during SSR and the hydration pass, true afterwards. This is the
  // canonical "am I hydrated yet?" check — it avoids both a hydration mismatch
  // and a setState-in-effect.
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const reduceMotion = useReducedMotion();

  const isDark = resolvedTheme === "dark";
  const label = mounted
    ? `Switch to ${isDark ? "light" : "dark"} theme`
    : "Toggle theme";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      // Announce the state change for screen readers.
      aria-pressed={mounted ? isDark : undefined}
      className={cn(
        "relative grid size-10 shrink-0 place-items-center rounded-full",
        "border border-line bg-surface text-fg-muted",
        "transition-colors duration-300 hover:border-brand-purple/50 hover:text-fg",
        className,
      )}
    >
      {!mounted ? (
        // Invisible spacer keeps the button from resizing after hydration.
        <span className="size-5" aria-hidden="true" />
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? "moon" : "sun"}
            initial={
              reduceMotion ? false : { opacity: 0, rotate: -60, scale: 0.7 }
            }
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={
              reduceMotion ? undefined : { opacity: 0, rotate: 60, scale: 0.7 }
            }
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute grid place-items-center text-[1.05rem]"
          >
            {isDark ? <MoonIcon /> : <SunIcon />}
          </motion.span>
        </AnimatePresence>
      )}
    </button>
  );
}
