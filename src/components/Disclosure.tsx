"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Disclosure — implements the W3C ARIA Authoring Practices "Disclosure
 * (Show/Hide)" pattern.
 * https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 *
 * Requirements implemented:
 * - A native <button> as the trigger (gets Enter/Space activation and
 *   keyboard focus for free)
 * - aria-expanded reflects open/closed state
 * - aria-controls points at the content region's id
 * - Content is removed from the accessibility tree and tab order via the
 *   `hidden` attribute when collapsed
 */

interface DisclosureProps {
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function Disclosure({ summary, children, defaultOpen = false }: DisclosureProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className="rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <h3>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => setIsOpen((open) => !open)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
        >
          {summary}
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </h3>
      <div id={contentId} hidden={!isOpen} className="px-4 pb-4 text-sm" style={{ color: "var(--muted)" }}>
        {children}
      </div>
    </div>
  );
}
