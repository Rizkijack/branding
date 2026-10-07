"use client";

/**
 * Theme provider.
 *
 * next-themes writes `class="dark"` onto <html>, which is what globals.css keys
 * off. `defaultTheme: "light"` matches the brief — light is the default, but
 * `enableSystem` means a visitor who prefers dark still gets dark on first
 * paint (and after hydration, if they have no stored choice).
 *
 * `disableTransitionOnChange` is important here: swapping themes without a
 * transition prevents a 200ms rainbow smear across every element on the page.
 */

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      storageKey="branding-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
