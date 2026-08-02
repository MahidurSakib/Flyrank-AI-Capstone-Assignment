import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavLinks } from "../NavLinks";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname,
}));

describe("NavLinks", () => {
  it("marks the link matching the current route with aria-current", () => {
    usePathname.mockReturnValue("/chat");
    render(<NavLinks />);

    expect(screen.getByRole("link", { name: "Chat" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("marks no link as current when the route doesn't match any nav item", () => {
    usePathname.mockReturnValue("/some-unknown-route");
    render(<NavLinks />);

    for (const name of ["Home", "Chat", "History", "Settings", "Health"]) {
      expect(screen.getByRole("link", { name })).not.toHaveAttribute("aria-current");
    }
  });

  it("renders a link for every route", () => {
    usePathname.mockReturnValue("/");
    render(<NavLinks />);

    expect(screen.getAllByRole("link")).toHaveLength(5);
  });
});
