/**
 * chat-errors.ts
 * -----------------------------------------------------------------------
 * Pure error-classification logic, extracted out of route.ts so it can be
 * unit tested directly without spinning up the AI SDK's streaming
 * machinery. This is the actual "resilience" logic for the capstone --
 * worth testing in isolation rather than only indirectly via a live
 * (and costly) API call.
 * -----------------------------------------------------------------------
 */

/**
 * Maps a raw error (from either Gemini or Anthropic -- kept provider
 * agnostic in case this project is ever switched back) into a safe,
 * user-facing message. Never echoes the original error text back to the
 * client, since that can leak internal details (stack traces, account
 * identifiers, rate-limit specifics an attacker could use to probe
 * limits).
 */
export function getUserFacingErrorMessage(error: unknown): string {
  if (error == null) {
    return "Something went wrong generating a response.";
  }

  const message = error instanceof Error ? error.message : String(error);

  if (/rate.?limit|quota|resource_exhausted|429/i.test(message)) {
    return "The AI service is rate-limited right now. Please wait a moment and try again.";
  }
  if (/credit|billing/i.test(message)) {
    return "The AI service is temporarily unavailable (account issue). Please try again later.";
  }
  if (/overloaded|529|503|unavailable/i.test(message)) {
    return "The AI service is overloaded right now. Please try again in a few seconds.";
  }
  if (/not.?found|404/i.test(message)) {
    return "The configured AI model is unavailable right now. Please contact the site owner.";
  }

  return "Something went wrong generating a response. Please try again.";
}
