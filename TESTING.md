# Testing Evidence

## How to run

```bash
npm run test            # run once
npm run test:watch      # watch mode
npm run test:coverage   # run with coverage report
```

CI runs `test:coverage` automatically on every push (`.github/workflows/ci.yml`).

## What's covered

47 tests across 7 files, using Vitest + React Testing Library. Deliberately
weighted toward the app's actual risk surface -- the resilience and
persistence logic that's new this capstone -- rather than only the easy,
decorative components.

- **`Modal.test.tsx`** (9 tests) — the highest-risk UI component, since
  it implements a full W3C APG focus trap. Covers correct
  `role="dialog"`/`aria-modal` semantics, focus moving into the dialog on
  open, focus returning to the trigger on close, Escape closing it,
  custom footer actions, the actual Tab/Shift+Tab wrap-around logic at
  both boundaries, and the backdrop-click-to-close behavior.
- **`Disclosure.test.tsx`** (5 tests) — collapsed-by-default state,
  `aria-expanded` toggling, keyboard operability (Tab + Enter, no mouse),
  and the `defaultOpen` prop.
- **`NavLinks.test.tsx`** (3 tests) — `aria-current="page"` is set on the
  link matching the current route, unset elsewhere, and every route
  renders a link (`next/navigation`'s `usePathname` is mocked).
- **`chat-errors.test.ts`** (12 tests) — the actual error-classification
  logic that turns raw provider errors into safe, user-facing messages:
  rate-limit/quota patterns, billing/credit patterns, overload patterns,
  model-not-found patterns, the generic fallback, non-`Error` thrown
  values, and — importantly — a test that a raw secret embedded in an
  error message is never echoed back to the client.
- **`storage.test.ts`** (10 tests) — the localStorage persistence layer
  for settings and chat history: defaults, partial-update merging,
  corrupted-JSON fallback, session title derivation (including
  truncation of long first messages), update-in-place preserving
  `createdAt`, empty-message no-ops, most-recent-first ordering (using
  fake timers to make the ordering assertion deterministic rather than
  timing-dependent), and deletion.
- **`theme.test.ts`** (6 tests) — theme resolution (`light`/`dark`
  resolve directly; `system` defers to a mocked `matchMedia`) and DOM
  class application.
- **`route.test.ts`** (2 tests) — the `/api/health` route handler is
  called directly and asserted to return the correct shape and a
  genuinely current timestamp.

## Actual coverage output (last run)

```
 RUN  v4.1.10 /ai-study-assistant
      Coverage enabled with v8

 ✓ src/components/__tests__/Modal.test.tsx (9 tests) 531ms
 ✓ src/components/__tests__/Disclosure.test.tsx (5 tests) 510ms
 ✓ src/components/__tests__/NavLinks.test.tsx (3 tests) 354ms
 ✓ src/lib/__tests__/storage.test.ts (10 tests) 13ms
 ✓ src/app/api/health/__tests__/route.test.ts (2 tests) 8ms
 ✓ src/lib/__tests__/theme.test.ts (6 tests) 7ms
 ✓ src/lib/__tests__/chat-errors.test.ts (12 tests) 5ms

 Test Files  7 passed (7)
      Tests  47 passed (47)

 % Coverage report from v8
-----------------|---------|----------|---------|---------|-------------------
File             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------|---------|----------|---------|---------|-------------------
All files        |   94.35 |    86.58 |     100 |     100 |
 app/api/health  |     100 |      100 |     100 |     100 |
  route.ts       |     100 |      100 |     100 |     100 |
 components      |   96.07 |     90.9 |     100 |     100 |
  Disclosure.tsx |     100 |      100 |     100 |     100 |
  Modal.tsx      |   94.87 |     87.5 |     100 |     100 | 64-69,90
  NavLinks.tsx   |     100 |      100 |     100 |     100 |
 lib             |   93.05 |    83.67 |     100 |     100 |
  chat-errors.ts |     100 |      100 |     100 |     100 |
  storage.ts     |    92.3 |       75 |     100 |     100 | 41,54-75,80-107
  theme.ts       |    87.5 |    88.88 |     100 |     100 | 26
-----------------|---------|----------|---------|---------|-------------------
```

**94.35% statement coverage, 100% line/function coverage** — well above
the ≥50% bar, and concentrated on the logic that's actually new and
actually risky this capstone (error handling, persistence, theming), not
just the parts that were easy to test.

## What's not covered (and why)

- **`chat/page.tsx`**, **`settings/page.tsx`**, **`history/page.tsx`** are
  not unit tested directly. They're composition layers over `useChat` and
  the fully-tested `lib/` modules and components above. The realistic way
  to verify their actual behavior (streaming, stop-mid-generation,
  multi-turn memory, live theme switching) is manual/end-to-end testing
  against a live model, documented in the Deployment Checklist, rather
  than mocking the entire AI SDK stream protocol and browser APIs for a
  unit test that would mostly test the mock.
- **`src/app/api/chat/route.ts`** is not unit tested directly for the same
  reason, but its one genuinely risky piece of logic -- classifying
  errors into safe messages -- *is* extracted into `chat-errors.ts` and
  is fully unit tested there.
- A handful of defensive branches in `storage.ts` (e.g. the
  `hasWindow()` guard's false branch, which only matters in a
  server-rendering context these client-only functions are never actually
  called from) and `Modal.tsx` (an unreachable-in-practice empty-
  focusable-elements guard) are intentionally left uncovered rather than
  padded with tests that would exercise mocks more than real behavior.
