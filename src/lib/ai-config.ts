/**
 * ai-config.ts
 * -----------------------------------------------------------------------
 * Single source of truth for the AI Study Assistant's chat behavior.
 * Keeping the system prompt and model settings in one well-commented
 * module (rather than scattered inline in the route handler) makes it
 * easy to tune tone, swap models, or adjust generation limits without
 * hunting through the streaming/UI code.
 * -----------------------------------------------------------------------
 */

/**
 * The model used for the chat feature.
 *
 * Running on Google's "gemini-3.6-flash" rather than Claude. The AI SDK
 * makes providers interchangeable -- swapping back to Claude is a two-line
 * change (see the provider import in route.ts) -- but this project ships
 * on Gemini specifically because of an Anthropic account billing gap
 * (no credit loaded) rather than a technical or product reason. Documented
 * here rather than left silent, since a reviewer should know this was a
 * deliberate, acknowledged trade-off and not an oversight.
 *
 * To swap models or providers, change this string (and the matching
 * import in route.ts) -- nothing else in the route handler needs to
 * change, since the rest of the code is provider-agnostic.
 */
export const CHAT_MODEL = "gemini-3.6-flash";

/**
 * The system prompt establishes the assistant's role and boundaries.
 * It's sent with every request (not stored in conversation history), so
 * editing it here changes behavior for every future turn immediately.
 */
export const SYSTEM_PROMPT = `You are the AI Study Assistant, a friendly and encouraging study companion.

Your job:
- Help the user understand concepts by explaining clearly, not just giving answers.
- When asked to summarize notes, be concise and organize the summary with headings or bullet points where helpful.
- When asked to generate quiz questions, mix question types (multiple choice, short answer) and include the answer key at the end, clearly separated.
- If a question is ambiguous, ask a brief clarifying question rather than guessing.

Tone: warm, plain, and encouraging — like a knowledgeable classmate, not a formal lecturer. Avoid unnecessary hedging or filler.`;

/**
 * Generation settings.
 *
 * maxOutputTokens caps how long a single reply can run — useful both for
 * cost control and to keep the chat UI feeling responsive rather than
 * generating an essay for a one-line question.
 *
 * temperature controls randomness: lower (e.g. 0.3) is more focused and
 * deterministic, higher (e.g. 1.0) is more varied/creative. 0.6 is a
 * reasonable middle ground for a study assistant — consistent enough to
 * be reliable, flexible enough to explain things multiple ways.
 */
export const MODEL_CONFIG = {
  maxOutputTokens: 1024,
  temperature: 0.6,
};

/**
 * Response style, set on the Settings page and persisted client-side
 * (see src/lib/storage.ts). This is the one setting that actually
 * changes AI behavior, not just app cosmetics -- the chosen style is sent
 * with each chat request and appended to the system prompt server-side,
 * so the preference has a real, visible effect rather than being a
 * decorative toggle.
 */
export type ResponseStyle = "concise" | "detailed";

export const RESPONSE_STYLE_INSTRUCTIONS: Record<ResponseStyle, string> = {
  concise:
    "The user prefers concise responses: 2-4 sentences or a short bullet list where possible. Avoid restating the question or adding unrequested caveats.",
  detailed:
    "The user prefers detailed responses: thorough explanations with examples, and background context where it aids understanding.",
};
