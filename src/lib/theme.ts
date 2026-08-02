import type { Theme } from "./storage";

/**
 * theme.ts
 * -----------------------------------------------------------------------
 * Resolves a user's theme preference (which may be "system") into a
 * concrete light/dark value, and applies it to the document. Split out
 * from the Settings page so the resolution logic -- the part with actual
 * branching to get wrong -- is unit-testable without rendering React.
 * -----------------------------------------------------------------------
 */

export function resolveIsDark(theme: Theme): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  // "system": defer to the OS-level preference.
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/** Applies the resolved theme to <html> by toggling the `dark` class. */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolveIsDark(theme));
}
