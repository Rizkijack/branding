"use client";

/**
 * ============================================================================
 * NAVBAR
 * ============================================================================
 * Sticky, translucent + blurred once scrolled. Behaviour notes:
 *
 *  • Active link is tracked with `usePathname()` rather than a scroll spy, so
 *    it is correct on first paint and on deep links. Matches `/` exactly and
 *    every other route by prefix (`/blog/x` highlights "Blog").
 *  • The active underline is a shared `layoutId` element, so it *slides* between
 *    links instead of blinking. That is the one place layout animation earns its
 *    keep.
 *  • Mobile menu: sheet under the navbar, locks body scroll, closes on Escape,
 *    on route change, and on backdrop click. Focus returns to the trigger.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { CloseIcon, LogoMark, MenuIcon } from "@/components/icons/InlineIcons";
import { EffectsToggle } from "@/components/three/EffectsToggle";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { navItems } from "@/lib/site";
import { cn } from "@/lib/utils";

/** True when `pathname` should highlight the nav entry at `href`. */
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();

  /* --- Scroll state: past the top of the page, show the blur + border --- */
  useEffect(() => {
    // `passive` so this listener can never block the scroll.
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* --- Close the mobile sheet whenever the route changes --- */
  // Deriving instead of an effect: storing `openPathname` alongside `menuOpen`
  // and computing `isOpen = menuOpen && openPathname === pathname` means a
  // navigation closes the sheet as a render result, not a second render pass.
  const [menuState, setMenuState] = useState({
    open: false,
    /** The path the sheet was opened on. */
    path: pathname,
  });
  const menuOpen = menuState.open && menuState.path === pathname;

  const toggleMenu = useCallback(() => {
    setMenuState((prev) => ({ ...prev, open: !prev.open }));
  }, []);

  /* --- Escape to close + lock body scroll while open --- */
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape")
        setMenuState((prev) => ({ ...prev, open: false }));
    };

    // Compensate for the disappearing scrollbar so the page doesn't jump.
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [menuOpen]);

  /** Close the sheet and hand focus back to the hamburger. */
  const closeMenu = useCallback(() => {
    setMenuState((prev) => ({ ...prev, open: false }));
    triggerRef.current?.focus();
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 h-[var(--nav-h)] w-full",
          "transition-[background-color,border-color,box-shadow,backdrop-filter] duration-400",
          scrolled || menuOpen
            ? "border-b border-line/80 bg-bg/80 shadow-sm backdrop-blur-xl backdrop-saturate-150"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <nav
          aria-label="Main"
          className="container-page flex h-full items-center justify-between gap-4"
        >
          {/* ---- Brand ---- */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5 rounded-pill py-1 pr-2"
            aria-label="Rizkijack — home"
          >
            <LogoMark className="size-7 transition-transform duration-500 group-hover:rotate-180" />
            <span className="font-display text-[0.98rem] font-bold tracking-tight">
              Rizkijack
            </span>
          </Link>

          {/* ---- Desktop links ---- */}
          <ul className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative block rounded-pill px-3.5 py-2 text-[0.88rem] font-medium",
                      "transition-colors duration-250",
                      active ? "text-fg" : "text-fg-muted hover:text-fg",
                    )}
                  >
                    {item.label}
                    {/* Shared layoutId → the underline slides between links. */}
                    {active ? (
                      <motion.span
                        layoutId="nav-active-underline"
                        aria-hidden="true"
                        className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full"
                        style={{ backgroundImage: "var(--grad-hero)" }}
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 380, damping: 32 }
                        }
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* ---- Right cluster ---- */}
          <div className="flex items-center gap-2">
            {/* 3D on/off. Renders nothing until the capability probe resolves,
                so it never shows a dead switch. */}
            <EffectsToggle />

            <ThemeToggle />

            <Button
              href="/contact"
              size="sm"
              className="hidden sm:inline-flex"
              trailingIcon={false}
            >
              Connect
            </Button>

            <button
              ref={triggerRef}
              type="button"
              onClick={toggleMenu}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className="grid size-10 place-items-center rounded-full border border-line bg-surface text-fg md:hidden"
            >
              {menuOpen ? (
                <CloseIcon className="text-[1.1rem]" />
              ) : (
                <MenuIcon className="text-[1.1rem]" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* ---- Mobile sheet ---- */}
      <AnimatePresence>
        {menuOpen ? (
          <>
            {/* Backdrop doubles as the click-outside target. */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={closeMenu}
              className="fixed inset-0 z-40 bg-bg/70 backdrop-blur-sm md:hidden"
            />

            <motion.div
              key="sheet"
              id="mobile-nav"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -18 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 top-[var(--nav-h)] z-40 md:hidden"
            >
              <div className="container-page pt-4">
                <ul className="flex flex-col gap-1 rounded-card border border-line bg-surface/95 p-3 shadow-lg backdrop-blur-xl">
                  {navItems.map((item, index) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <motion.li
                        key={item.href}
                        initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.04 * index + 0.04,
                          duration: 0.3,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          onClick={closeMenu}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-4 py-3",
                            "text-[0.95rem] font-medium transition-colors",
                            active
                              ? "bg-brand-purple/12 text-brand-purple"
                              : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                          )}
                        >
                          {item.label}
                          {active ? (
                            <span
                              aria-hidden="true"
                              className="size-1.5 rounded-full bg-brand-purple"
                            />
                          ) : null}
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
