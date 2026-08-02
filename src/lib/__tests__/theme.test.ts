import { afterEach, describe, expect, it, vi } from "vitest";
import { applyTheme, resolveIsDark } from "../theme";

afterEach(() => {
  document.documentElement.classList.remove("dark");
  vi.restoreAllMocks();
});

describe("resolveIsDark", () => {
  it("resolves 'dark' to true regardless of system preference", () => {
    expect(resolveIsDark("dark")).toBe(true);
  });

  it("resolves 'light' to false regardless of system preference", () => {
    expect(resolveIsDark("light")).toBe(false);
  });

  it("resolves 'system' using the OS-level media query when it prefers dark", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);

    expect(resolveIsDark("system")).toBe(true);
  });

  it("resolves 'system' to false when the OS prefers light", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);

    expect(resolveIsDark("system")).toBe(false);
  });
});

describe("applyTheme", () => {
  it("adds the dark class to <html> for 'dark'", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes the dark class from <html> for 'light'", () => {
    document.documentElement.classList.add("dark");
    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
