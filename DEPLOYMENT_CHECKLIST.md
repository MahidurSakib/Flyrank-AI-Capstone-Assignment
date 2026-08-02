# Deployment Checklist

## Pre-deploy

- [x] `npm run build` completes with zero errors, zero TypeScript errors
- [x] `npm run test` passes (47/47 tests)
- [x] CI (`.github/workflows/ci.yml`) runs build + tests on every push
- [x] No secrets committed — `.env.local` is gitignored; only `.env.example`
      (with blank values) is in the repo
- [x] `GOOGLE_GENERATIVE_AI_API_KEY` is read only in
      `src/app/api/chat/route.ts` (server-side); confirmed via DevTools
      Network tab that it never appears in any client-visible request or
      response

## Environment variables (set in Vercel, not just locally)

| Variable | Required | Where it's used |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | `src/app/api/chat/route.ts` — server only |
| `NEXT_PUBLIC_SITE_URL` | No (has a runtime fallback) | `src/app/health/page.tsx` |

**Note:** running on Gemini rather than Claude due to an Anthropic billing
gap on this account — see README's "AI integration" section for the full
explanation and how to switch back.

**Note:** environment variables must be added in Vercel's Project Settings
→ Environment Variables, and a **redeploy** triggered afterward — adding a
variable alone does not apply it to an already-running deployment.

## How it fails safely

- **AI provider errors** (rate limit, billing, overload, network failure):
  classified by `src/lib/chat-errors.ts` (unit tested in isolation — see
  TESTING.md) into a plain-English message, shown in the chat UI as a
  dismissible error bubble with a **Retry** button — the user is never
  left staring at a stuck loading state with no explanation and no way
  forward.
- **Malformed requests** (bad JSON, missing `messages` array): rejected
  with an explicit 400 response before any model call is attempted.
- **Missing server config** (no API key set): caught explicitly and
  returns a clear 500 with a message identifying the missing variable,
  rather than surfacing a raw Anthropic SDK stack trace to the client.
- **Long conversations**: capped to the last 20 messages sent to the model
  per turn, bounding cost and latency growth rather than letting the
  request payload grow unbounded.

## Rollback plan

This is a Hobby-tier Vercel deployment with a single environment. If a bad
deploy goes out:

1. Go to the Vercel project → **Deployments**
2. Find the last known-good deployment
3. Click the **⋯** menu → **Promote to Production** (or use the **Instant
   Rollback** button on the project overview page, which targets the
   previous production deployment automatically)

No database or persisted state exists yet (chat history is in-memory,
client-side only), so a rollback carries no data-migration risk — this is
about as low-stakes as a rollback gets, which is itself worth noting as a
known limitation (see README).

## Monitoring

No dedicated APM is set up. Current visibility:
- **Vercel's built-in dashboard** — Function Invocations, Edge Requests,
  and error counts are visible under the project's Observability tab
  with no extra setup
- **Server-side console logging** — `route.ts`'s `onError` callbacks log
  the full error server-side (visible in Vercel's Runtime Logs) even
  though the client only sees a sanitized message
- **Planned improvement**: wire up Vercel's log drains or a lightweight
  error-tracking service (e.g. Sentry) if this moves beyond a portfolio
  project — noted in the README's known limitations

## Post-deploy verification

- [ ] Visit the live URL, not just localhost
- [ ] Send a chat message — confirm visible token-by-token streaming
- [ ] Stop mid-stream, then send another message — confirm it still works
- [ ] Ask a follow-up referencing an earlier message — confirm multi-turn
      memory works
- [ ] Send a message, go to History, confirm the conversation appears;
      open it and confirm messages restore correctly; delete it and
      confirm it's gone
- [ ] On Settings, switch theme — confirm it applies instantly app-wide,
      and persists after a refresh
- [ ] On Settings, switch response style, then ask the same question in
      both modes — confirm the reply actually differs (this proves the
      setting reaches the model, not just the UI)
- [ ] Open DevTools → Network — confirm the API key never appears
      anywhere in a browser-visible request or response
- [ ] Resize to 375px width — confirm the layout and chat remain usable
- [ ] Run Lighthouse (Chrome DevTools → Lighthouse tab) against the live
      URL — record scores below
- [ ] Run an accessibility audit (axe DevTools or WAVE) — record findings
      below

### Audit results
_(Fill in after running against the live deployment — see README for how.)_

| Metric | Score/Result |
|---|---|
| Lighthouse Performance | |
| Lighthouse Accessibility | |
| Lighthouse Best Practices | |
| Lighthouse SEO | |
| axe/WAVE violations found | |
| One concrete fix made based on findings | |

**Signed off by:** _______________  **Date:** _______________
