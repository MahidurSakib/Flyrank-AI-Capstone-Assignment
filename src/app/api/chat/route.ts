import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { CHAT_MODEL, MODEL_CONFIG, SYSTEM_PROMPT, RESPONSE_STYLE_INSTRUCTIONS, type ResponseStyle } from "@/lib/ai-config";
import { getUserFacingErrorMessage } from "@/lib/chat-errors";

// Allow streaming responses up to 30 seconds before Vercel times out the
// function. Chat replies for a study assistant should finish well within
// this window; raise it only if you expect long-running generations.
export const maxDuration = 30;

// A hard cap on how many prior turns we forward to the model. Without this,
// a very long conversation would keep growing the request payload and
// token cost on every turn with no upper bound. Trimming to the most
// recent turns keeps latency and cost predictable -- a deliberate
// trade-off (older context is dropped) rather than an oversight.
const MAX_HISTORY_MESSAGES = 20;

/**
 * POST /api/chat
 *
 * Receives the full conversation history from the client (sent by the
 * `useChat` hook on every turn), calls the model with streaming enabled,
 * and pipes the response back as a UI message stream that `useChat` knows
 * how to consume token-by-token.
 *
 * Currently configured for Google's Gemini (see ai-config.ts for why --
 * an Anthropic billing gap, not a technical choice). The API key is read
 * server-side only, from process.env.GOOGLE_GENERATIVE_AI_API_KEY (set in
 * `.env.local`, never committed). It never reaches the browser -- the
 * client only ever talks to this route.
 *
 * Error handling / resilience:
 * - Malformed request bodies are rejected with a 400 before we ever call
 *   the model, instead of throwing an unhandled exception.
 * - Missing server configuration (no API key set) is caught explicitly
 *   and reported with a clear message, rather than surfacing the raw
 *   provider SDK error to the client.
 * - Model/network failures during streamText are caught by onError and
 *   turned into a UI-visible error message instead of a silently dropped
 *   connection -- the client's `error` state (see chat/page.tsx) then
 *   renders a retry affordance.
 */
export async function POST(req: Request) {
  let messages: UIMessage[];
  let responseStyle: ResponseStyle | undefined;

  try {
    const body = await req.json();
    messages = body.messages;
    responseStyle = body.responseStyle;
    if (!Array.isArray(messages)) {
      throw new Error("`messages` must be an array");
    }
  } catch {
    return new Response(
      JSON.stringify({ error: "Malformed request: expected a JSON body with a messages array." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "Server is missing GOOGLE_GENERATIVE_AI_API_KEY. Set it in your environment and redeploy.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const trimmedMessages = messages.slice(-MAX_HISTORY_MESSAGES);

  const system = responseStyle
    ? `${SYSTEM_PROMPT}\n\n${RESPONSE_STYLE_INSTRUCTIONS[responseStyle]}`
    : SYSTEM_PROMPT;

  const result = streamText({
    model: google(CHAT_MODEL),
    system,
    messages: await convertToModelMessages(trimmedMessages),
    ...MODEL_CONFIG,
    onError: ({ error }) => {
      // Logged server-side for observability; the stream itself carries a
      // generic error part to the client so we don't leak internal detail
      // (rate limit specifics, stack traces) to the browser.
      console.error("[api/chat] streamText error:", error);
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onError: getUserFacingErrorMessage,
    }),
  });
}
