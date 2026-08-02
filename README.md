# AI Study Assistant



## Project Brief

AI Study Assistant is a Next.js app that helps students get unstuck while
studying — summarizing notes, generating quiz questions, and working
through concepts in a real-time streaming conversation with an LLM. It's
built for a student (like me) who wants a focused, no-friction place to
ask study questions without switching between five different tabs and
tools. I chose this idea because it's something I'd actually use myself
during this internship, which made the "solve a real problem" requirement
concrete rather than invented for the assignment.

## Live deployment



## Features

- **Streaming AI chat** with a working Stop button, visible "thinking"
  indicator, and auto-scroll that releases the moment you scroll up
- **Chat history** — every conversation is saved to the browser and
  listed on the History page; reopen or delete any past conversation
- **Settings that actually do something** — theme (light/dark/system)
  applies instantly app-wide; response style (concise/detailed) is sent
  with every chat request and genuinely changes how the model responds,
  not just a cosmetic label
- **Resilient error handling** — malformed requests, missing config, and
  provider errors (rate limits, billing, overload) are all caught and
  surfaced as a clear, recoverable message with a Retry button
- **Accessible by construction** — a hand-built Modal and Disclosure
  following W3C ARIA Authoring Practices patterns, a skip link, labeled
  landmarks, and `aria-current` on the active nav route

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS (class-based dark mode)
- Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/react`) + Gemini
- lucide-react for icons
- Vitest + React Testing Library for testing
- GitHub Actions for CI
- Deployed on Vercel

## Setup & run

```bash
npm install && npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

You'll need a Google Generative AI API key for the chat feature to
actually respond (get a free one at
[aistudio.google.com](https://aistudio.google.com)):

```bash
cp .env.example .env.local
# then edit .env.local and set GOOGLE_GENERATIVE_AI_API_KEY
```

## Architecture overview

```
src/
  app/
    api/
      chat/route.ts     # POST handler: streams the model's response via the AI SDK
      health/route.ts   # GET handler: simple liveness check, returns JSON
    chat/page.tsx        # Main AI interaction — streaming, stop, retry, clear, history
    history/page.tsx     # Lists saved conversations, open or delete any of them
    settings/page.tsx    # Theme + response-style preferences, applied live
    health/page.tsx      # Server Component that fetches and renders /api/health
    page.tsx              # Home page, with a real FAQ using <Disclosure>
    layout.tsx             # Root layout: theme-init script, skip link, nav landmarks
  components/
    Modal.tsx              # W3C APG "Dialog (Modal)" pattern, hand-built
    Disclosure.tsx          # W3C APG "Disclosure" pattern, hand-built
    NavLinks.tsx            # Client component; marks active route via aria-current
    __tests__/              # Unit tests for all three above
  lib/
    ai-config.ts             # System prompt + model + generation settings, one file
    chat-errors.ts            # Pure error-classification logic, unit tested in isolation
    storage.ts                 # localStorage persistence: settings + chat sessions
    theme.ts                    # Theme resolution ("system" -> light/dark), unit tested
    __tests__/                   # Unit tests for all four lib modules above
```

**Why this split:** route handlers stay thin (parse request → call
`streamText` → return a stream), all AI *behavior* configuration lives in
one file (`ai-config.ts`), and the logic most worth getting right --
error classification, persistence, theme resolution -- is pulled out into
small, pure(ish), independently unit-tested modules rather than buried
inline in components where it's harder to verify in isolation.

## AI integration — how and why

**How:** `src/app/api/chat/route.ts` receives the full conversation
history from the client on every turn, calls the model via the AI SDK's
`streamText`, and streams the response back as it's generated. The client
(`chat/page.tsx`) uses the `useChat` hook to render tokens as they arrive,
show a "thinking" indicator before the first token, and expose a working
Stop button.

**Which model, and why not Claude:** this project is built for a
Claude-focused internship, and the code was originally written against
Claude via `@ai-sdk/anthropic`. It currently runs on Google's
`gemini-3.6-flash` instead, because the Anthropic account used for this
project has no billing credit loaded, and Google's API offers a free
tier that let development and testing continue without that blocker.
This is a deliberate, acknowledged trade-off, not an oversight — it's
documented here and in `src/lib/ai-config.ts` rather than left silent.
The AI SDK's provider abstraction means switching back is a two-line
change: swap the `@ai-sdk/google` import and `CHAT_MODEL` string for
`@ai-sdk/anthropic` and a Claude model id in `ai-config.ts` and
`route.ts` — nothing else in the app needs to change.

**The system prompt** (in `src/lib/ai-config.ts`) instructs the model to:
- Explain concepts rather than just answering, since this is a study tool
- Organize summaries with headings/bullets when useful
- Mix question types when generating quizzes, with a clearly separated
  answer key
- Ask a clarifying question rather than guess on ambiguous requests

**Response style is a real setting, not a gimmick:** the Settings page's
concise/detailed choice is sent as `responseStyle` in every chat request
body and appended to the system prompt server-side
(`RESPONSE_STYLE_INSTRUCTIONS` in `ai-config.ts`). Changing it on the
Settings page changes the model's actual next reply — there's no fake
setting that does nothing.

**Why this design, not "just a chatbot":** the brief specifically warns
against AI as a gimmick. The meaningful integration here isn't the
API call itself — it's the surrounding product decisions: a system prompt
tuned to a specific use case, a user-facing preference that actually
reaches the model, a message-count cap to bound cost, and — most
importantly — real error handling so a rate limit or billing hiccup
degrades gracefully instead of breaking the whole page.

## Testing

See **[TESTING.md](./TESTING.md)** for the full breakdown and real
coverage output. Summary: 47 tests across 7 files, **94.35% statement
coverage**, covering the Modal's actual focus-trap logic, the error
classification logic, the localStorage persistence layer, and theme
resolution — not just the easy, decorative surface area.

```bash
npm run test            # run once
npm run test:coverage   # with coverage report
```

CI runs `npm run build` and `npm run test:coverage` on every push via
GitHub Actions (`.github/workflows/ci.yml`).

## Accessibility

- Both custom components (`Modal`, `Disclosure`) are built directly
  against the W3C ARIA Authoring Practices patterns — correct roles,
  keyboard interaction, and focus management, verified by both automated
  tests and manual keyboard-only testing
- Settings' theme and response-style controls use `role="radiogroup"` /
  `role="radio"` with `aria-checked`, inside a labeled `<fieldset>`
- Skip-to-content link, labeled nav landmark, `aria-current="page"` on
  the active route
- A visible, consistent `:focus-visible` ring app-wide, rather than
  relying on inconsistent browser defaults
- See the Deployment Checklist for Lighthouse/axe audit results

## Known limitations & future improvements

- **No cross-device sync** — chat history and settings live in this
  browser's localStorage only. A real account + database would be the
  natural next step if this needed to follow a user across devices.
- **No message-level regenerate/edit** — you can retry a failed request
  or clear the whole conversation, but can't yet edit a single past
  message and regenerate from there.
- **No automated monitoring/alerting** — errors are logged to Vercel's
  console but nothing pages anyone. Fine for a portfolio project, not for
  production with real users.
- **Markdown in streamed responses isn't specially rendered** — long
  responses with code blocks or formatting render as plain text with
  preserved whitespace, not parsed Markdown. A streaming-aware Markdown
  renderer is a natural next step if responses get more structured.

## License
MIT
