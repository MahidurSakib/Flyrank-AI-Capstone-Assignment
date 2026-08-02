import { describe, expect, it } from "vitest";
import { getUserFacingErrorMessage } from "../chat-errors";

describe("getUserFacingErrorMessage", () => {
  it("returns a generic message for null/undefined errors", () => {
    expect(getUserFacingErrorMessage(null)).toMatch(/went wrong/i);
    expect(getUserFacingErrorMessage(undefined)).toMatch(/went wrong/i);
  });

  it.each([
    ["rate limit exceeded", /rate-limited/i],
    ["429 Too Many Requests", /rate-limited/i],
    ["RESOURCE_EXHAUSTED: quota exceeded", /rate-limited/i],
  ])("classifies %s as a rate-limit message", (raw, expected) => {
    expect(getUserFacingErrorMessage(new Error(raw))).toMatch(expected);
  });

  it("classifies billing/credit errors distinctly from rate limits", () => {
    const message = getUserFacingErrorMessage(
      new Error("Your credit balance is too low to access the API.")
    );
    expect(message).toMatch(/account issue/i);
    expect(message).not.toMatch(/rate-limited/i);
  });

  it.each([
    ["model is overloaded", /overloaded/i],
    ["503 Service Unavailable", /overloaded/i],
    ["529 error from upstream", /overloaded/i],
  ])("classifies %s as an overload message", (raw, expected) => {
    expect(getUserFacingErrorMessage(new Error(raw))).toMatch(expected);
  });

  it("classifies 404/model-not-found errors distinctly", () => {
    const message = getUserFacingErrorMessage(
      new Error("404 model not found: gemini-old-name")
    );
    expect(message).toMatch(/model is unavailable/i);
  });

  it("falls back to a generic safe message for unrecognized errors", () => {
    const message = getUserFacingErrorMessage(new Error("some obscure internal detail"));
    expect(message).toBe("Something went wrong generating a response. Please try again.");
  });

  it("never echoes the raw error text back (no leaking internals)", () => {
    const secret = "sk-ant-super-secret-key-abc123";
    const message = getUserFacingErrorMessage(new Error(`auth failed: ${secret}`));
    expect(message).not.toContain(secret);
  });

  it("handles non-Error thrown values (e.g. plain strings)", () => {
    expect(getUserFacingErrorMessage("rate limit hit")).toMatch(/rate-limited/i);
  });
});
