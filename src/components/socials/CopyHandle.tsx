"use client";

/**
 * ============================================================================
 * COPY TO CLIPBOARD
 * ============================================================================
 * A tiny client affordance used for the email address on /socials and /contact.
 * Kept separate from the server-rendered page so the clipboard API never pulls
 * a page into the client bundle.
 *
 * Accessibility notes:
 *  • the button is a real <button> with a descriptive aria-label, so it is
 *    reachable by keyboard and announced with a stable name;
 *  • the result is announced through a polite live region rather than by
 *    swapping the accessible name, which would break voice-control users
 *    mid-utterance;
 *  • `navigator.clipboard` is unavailable on insecure origins, so we fall back
 *    to a hidden <textarea> + execCommand before declaring failure.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { CheckIcon, CopyIcon } from "@/components/icons/InlineIcons";
import { cn } from "@/lib/utils";

/** How long the "Copied" confirmation stays on screen. */
const CONFIRM_MS = 1800;

/**
 * Copy `text` to the clipboard. Resolves false when neither the async
 * Clipboard API nor the legacy execCommand path worked, so the caller can show
 * an honest failure instead of a false confirmation.
 */
async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied or a non-secure context — fall through.
    }
  }

  try {
    const scratch = document.createElement("textarea");
    scratch.value = text;
    scratch.setAttribute("readonly", "");
    scratch.setAttribute("aria-hidden", "true");
    scratch.style.position = "fixed";
    scratch.style.top = "-1000px";
    scratch.style.opacity = "0";
    document.body.appendChild(scratch);
    scratch.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(scratch);
    return ok;
  } catch {
    return false;
  }
}

export function CopyHandle({
  value,
  /** What is being copied, e.g. "email address". Used in the button label. */
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending reset timer so a rapid second click can't orphan it.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);

    const ok = await copyText(value);
    setState(ok ? "copied" : "failed");

    timer.current = setTimeout(() => setState("idle"), CONFIRM_MS);
  }, [value]);

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${label}`}
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-pill border border-line",
          "bg-surface-2 text-fg-muted transition-colors duration-300",
          "hover:border-brand-purple/50 hover:text-fg",
          "disabled:opacity-60",
          state === "copied" && "border-brand-teal/60 text-brand-teal",
          state === "failed" && "border-brand-pink/60 text-brand-pink",
        )}
      >
        {state === "copied" ? (
          <CheckIcon className="text-[0.95rem]" />
        ) : (
          <CopyIcon className="text-[0.95rem]" />
        )}
      </button>

      {/* Announced after the press, so it never interrupts the button name. */}
      <span role="status" aria-live="polite" className="sr-only">
        {state === "copied"
          ? `${label} copied to clipboard`
          : state === "failed"
            ? `Could not copy the ${label}`
            : ""}
      </span>
    </span>
  );
}
