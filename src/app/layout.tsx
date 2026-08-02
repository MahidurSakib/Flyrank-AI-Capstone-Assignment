import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { NavLinks } from "@/components/NavLinks";

export const metadata: Metadata = {
  title: "AI Study Assistant",
  description: "An AI-powered study companion built with Next.js.",
};

// Runs before hydration paint so the correct theme applies immediately --
// without this, a user with a saved "dark" preference would see a flash
// of the light theme on every load before React mounts.
const themeInitScript = `
(function() {
  try {
    var raw = localStorage.getItem('ai-study-assistant:settings');
    var theme = raw ? JSON.parse(raw).theme : 'system';
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = theme === 'dark' || (theme !== 'light' && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className="min-h-screen flex flex-col">
        {/* Skip link: first focusable element on every page, invisible
            until focused. Lets keyboard/screen-reader users bypass the
            repeated nav and jump straight to page content. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          Skip to main content
        </a>

        <header
          className="border-b sticky top-0 z-40 backdrop-blur-sm"
          style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--background) 85%, transparent)" }}
        >
          <nav
            aria-label="Main"
            className="max-w-4xl mx-auto flex flex-wrap items-center gap-x-6 gap-y-2 px-4 sm:px-6 py-4"
          >
            <span className="font-semibold text-lg mr-2 tracking-tight">
              AI Study Assistant
            </span>
            <NavLinks />
          </nav>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 focus:outline-none"
        >
          {children}
        </main>

        <footer
          className="border-t text-center text-xs py-4"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        >
          Built with Next.js &amp; Tailwind CSS
        </footer>
      </body>
    </html>
  );
}
