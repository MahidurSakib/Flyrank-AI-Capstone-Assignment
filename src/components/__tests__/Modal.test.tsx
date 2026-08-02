import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Modal } from "../Modal";

// A small harness so we can render a real trigger button, open the modal,
// and verify focus actually returns to that trigger on close -- this
// can't be tested by rendering the Modal in isolation.
function ModalHarness() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open modal</button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} titleId="t" title="Test dialog">
        <input type="text" placeholder="a field" />
      </Modal>
    </div>
  );
}

describe("Modal", () => {
  it("is not rendered when closed", () => {
    render(
      <Modal isOpen={false} onClose={() => {}} titleId="t" title="Test dialog">
        content
      </Modal>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders with correct dialog semantics when open", () => {
    render(
      <Modal isOpen onClose={() => {}} titleId="t" title="Test dialog">
        content
      </Modal>
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Test dialog")).toBeInTheDocument();
  });

  it("moves focus into the dialog when it opens", async () => {
    const user = userEvent.setup();
    render(<ModalHarness />);

    await user.click(screen.getByRole("button", { name: "Open modal" }));

    const field = await screen.findByPlaceholderText("a field");
    expect(field).toHaveFocus();
  });

  it("returns focus to the trigger when closed", async () => {
    const user = userEvent.setup();
    render(<ModalHarness />);

    const trigger = screen.getByRole("button", { name: "Open modal" });
    await user.click(trigger);
    await screen.findByPlaceholderText("a field");

    await user.keyboard("{Escape}");

    expect(trigger).toHaveFocus();
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} titleId="t" title="Test dialog">
        <input type="text" placeholder="a field" />
      </Modal>
    );

    await screen.findByPlaceholderText("a field");
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders custom footer actions when provided", () => {
    render(
      <Modal
        isOpen
        onClose={() => {}}
        titleId="t"
        title="Confirm"
        footer={<button>Custom action</button>}
      >
        content
      </Modal>
    );
    expect(screen.getByRole("button", { name: "Custom action" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("wraps focus from the last element back to the first on Tab", async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen onClose={() => {}} titleId="t" title="Test dialog">
        <input type="text" placeholder="first field" />
        <button>Last button</button>
      </Modal>
    );

    const firstField = await screen.findByPlaceholderText("first field");
    expect(firstField).toHaveFocus();

    // Tab through every focusable element in the dialog, ending on the last.
    await user.tab(); // -> "Last button" (the only other element before Close)
    await user.tab(); // -> "Close" (the default footer button, the true last element)
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();

    // One more Tab should wrap back to the first element, not escape the dialog.
    await user.tab();
    expect(firstField).toHaveFocus();
  });

  it("wraps focus from the first element back to the last on Shift+Tab", async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen onClose={() => {}} titleId="t" title="Test dialog">
        <input type="text" placeholder="first field" />
      </Modal>
    );

    const firstField = await screen.findByPlaceholderText("first field");
    expect(firstField).toHaveFocus();

    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it("closes when the backdrop (outside the dialog) is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} titleId="t" title="Test dialog">
        <input type="text" placeholder="a field" />
      </Modal>
    );

    await screen.findByPlaceholderText("a field");
    const backdrop = screen.getByRole("dialog").parentElement!;
    await user.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
