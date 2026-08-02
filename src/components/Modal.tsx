import {
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";

/**
 * Modal — implements the W3C ARIA Authoring Practices "Dialog (Modal)" pattern.
 * https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 *
 * Requirements implemented:
 * - role="dialog" + aria-modal="true" + aria-labelledby pointing at the title
 * - Focus moves into the dialog when it opens (first focusable element)
 * - Tab / Shift+Tab are trapped within the dialog (focus loop)
 * - Escape closes the dialog
 * - Focus returns to the element that triggered the dialog when it closes
 */

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  title: string;
  children: ReactNode;
  /** Custom footer buttons (e.g. Cancel + Confirm). Defaults to a single Close button. */
  footer?: ReactNode;
}

export function Modal({ isOpen, onClose, titleId, title, children, footer }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Move focus into the dialog on open, and restore it to the trigger on close.
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;

    const dialogNode = dialogRef.current;
    const focusable = dialogNode?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const firstFocusable = focusable?.[0];
    firstFocusable?.focus();

    return () => {
      previouslyFocusedElement.current?.focus();
    };
  }, [isOpen]);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    // Trap focus: cycle Tab/Shift+Tab within the dialog's focusable elements.
    const dialogNode = dialogRef.current;
    if (!dialogNode) return;

    const focusable = Array.from(
      dialogNode.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        className="w-full max-w-md rounded-xl border p-6 shadow-xl"
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <div className="mt-4">{children}</div>
        <div className="mt-6 flex justify-end gap-2">
          {footer ?? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
