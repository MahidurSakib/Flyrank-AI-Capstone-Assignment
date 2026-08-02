"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
  { href: "/health", label: "Health" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`text-sm font-medium transition-colors ${
              isActive ? "" : "hover:opacity-80"
            }`}
            style={{
              color: isActive ? "var(--accent)" : "var(--muted)",
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
