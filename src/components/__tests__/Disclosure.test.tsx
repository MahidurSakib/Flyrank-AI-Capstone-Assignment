import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Disclosure } from "../Disclosure";

describe("Disclosure", () => {
  it("starts collapsed by default, with content hidden", () => {
    render(
      <Disclosure summary="What is this?">
        <p>Some hidden content</p>
      </Disclosure>
    );

    const button = screen.getByRole("button", { name: "What is this?" });
    expect(button).toHaveAttribute("aria-expanded", "false");

    const content = screen.getByText("Some hidden content");
    expect(content.parentElement).toHaveAttribute("hidden");
  });

  it("expands and reveals content when the trigger is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Disclosure summary="What is this?">
        <p>Some hidden content</p>
      </Disclosure>
    );

    const button = screen.getByRole("button", { name: "What is this?" });
    await user.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    const content = screen.getByText("Some hidden content");
    expect(content.parentElement).not.toHaveAttribute("hidden");
  });

  it("toggles closed again on a second click", async () => {
    const user = userEvent.setup();
    render(
      <Disclosure summary="What is this?">
        <p>Some hidden content</p>
      </Disclosure>
    );

    const button = screen.getByRole("button", { name: "What is this?" });
    await user.click(button);
    await user.click(button);

    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("is operable via the keyboard (Enter) without a mouse", async () => {
    const user = userEvent.setup();
    render(
      <Disclosure summary="What is this?">
        <p>Some hidden content</p>
      </Disclosure>
    );

    await user.tab(); // moves focus to the button (first focusable element)
    const button = screen.getByRole("button", { name: "What is this?" });
    expect(button).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("respects the defaultOpen prop", () => {
    render(
      <Disclosure summary="What is this?" defaultOpen>
        <p>Some hidden content</p>
      </Disclosure>
    );

    expect(screen.getByRole("button", { name: "What is this?" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });
});
