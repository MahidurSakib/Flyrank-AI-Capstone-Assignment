# Reflection

_This section is intentionally left as a template. The evaluation
criteria explicitly checks that reflection "shows honest thinking, not
just 'it was great!'" — that only works if it's actually your own
thinking. Answer each prompt in your own words before submitting; delete
this note once you have._

## What was hardest? Why?

_Prompt: think about a specific moment, not a general feeling. Was it the
Vercel AI SDK's version churn (the useChat API changed shape between
versions you found in tutorials vs. what actually shipped)? Was it
debugging the Anthropic billing error and realizing "credit balance too
low" wasn't a code bug at all? Was it getting the focus trap in Modal.tsx
actually correct rather than just visually working? Pick the real one and
say what made it hard — not just that it was hard._

## What would you do differently next time?

_Prompt: this is different from "what's broken now" (that's Known
Limitations in the README). This is about your process. Maybe: choosing
a provider before confirming billing was set up, so you lost time
mid-build. Maybe: not writing tests until the end, so a couple of them
required going back and slightly restructuring a component to be
testable. Maybe: nothing about the code, but about how you scoped time
across the 8 weeks._

## One thing you learned that surprised you

_Prompt: something concrete, not "I learned a lot." Maybe it's that
`aria-modal="true"` alone doesn't reliably hide background content from
every screen reader, and Radix's Dialog does more work under the hood
than you expected. Maybe it's that streaming UIs have a whole category of
bugs (auto-scroll fighting the user, the "thinking indicator" flickering
against the first token) that don't exist in a normal request/response
app. Maybe it's realizing how much of "AI integration" is really error
handling and prompt config, not the API call itself._
