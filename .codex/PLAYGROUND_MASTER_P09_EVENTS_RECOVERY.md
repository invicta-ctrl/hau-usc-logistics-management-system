# P09 Events — Full Recovery Audit

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: PASS;NO_PRODUCT_REPAIR_REQUIRED
ROUTE: SOLO

## Authority and boundary

P09 used a fresh headless Chromium context against only the private-manifest-bound isolated Playground. No credentials were used or recorded. No event, request, inventory, ledger, R2, deployment, Production, main, Google, or Figma mutation occurred. Two staging-only System Owner convenience sessions were issued across the preserved diagnostic attempt and the accepted audit attempt.

## Root-cause audit

The accepted root-cause order was checked without skipping the authorization boundary:

1. the staging System Owner session projects `event.manage`;
2. `AppRouteRenderer` gates Events with that exact server-derived capability;
3. the Worker maps `getEventManagement` to the same capability and the D1 service rechecks it;
4. the endpoint is deployed and returns the supported contract;
5. generation-4 baseline series, day, activity, and operational-link relationships are present;
6. the response contract matches the adapter;
7. the adapter resolves the series/day/activity relationships without exposing opaque identifiers;
8. loading terminates and retry remains wired to a new abortable read;
9. the real rows render without preview substitution or a denied/unavailable state.

No application defect remained after the corrected audit, so no speculative Events implementation change was made.

## Preserved diagnostic attempt

Attempt A is preserved privately as invalid harness evidence. The audit script read `/api/auth/session` after Playground entry; that endpoint rotates the CSRF token, while the already-mounted frontend retained the prior token. The subsequent Events request therefore failed with 403. The harness was corrected to derive only boolean role/capability facts from the original Playground-session response, without a token-rotating follow-up read. Attempt B then passed from a new fresh context. The invalid attempt is not treated as product evidence and must not be replayed.

## Accepted fresh-browser evidence

```text
Playground session HTTP: 200
Authenticated System Owner: PASS
event.manage projected: PASS
Events navigation visible: PASS
getEventManagement HTTP: 200
response contract: PASS
event series: 2
event days: 3
event activities: 8
operational links: 2
unresolved day-to-series relationships: 0
unresolved activity-to-day relationships: 0
series/day/activity render headings: PASS
loading visible after settle: NO
denied or unavailable copy: NO
preview fixture copy: NO
console errors: 0
Production mutation: NONE
Playground business-data mutation: NONE
```

The screenshot was visually inspected. The Events hierarchy and real rows are visible in the authenticated shell. Dense desktop table spacing remains a later P15–P25 design-refinement concern, not a P09 functional blocker.

The fresh unauthenticated context received HTTP 401 `SESSION_REQUIRED` and no event record shape. A focused service regression proves an authenticated Requester without `event.manage` receives HTTP 403 `CAPABILITY_REQUIRED` before D1 is read. The route contract also regression-gates terminal denied/unavailable states, abort handling, and the retry trigger.

One aborted Overview bootstrap request was recorded while the audit navigated immediately from the post-entry Overview route into Events. It is a navigation cancellation, not a settled Events request failure; Events itself produced no failed request or console error.

## Reset and live-state evidence

The accepted generation-4 reset installed baseline v2 before P09. The live Events counts and two operational links are present from that reset-backed baseline, with no P09 event mutation. Post-audit read-only D1 inspection remains schema 32 / migration 0032 with baseline v2, reset generation 4, zero foreign-key violations, and a reversible sealed clean bookmark.

The audit sessions correctly moved Playground working state to `DIRTY` / active. Live state now contains three sessions and transient total three. This is expected staging-only audit residue and remains assigned to the P12 lifecycle/reset phase; it was not silently normalized.

## Verification

```text
Focused Vitest: PASS — 5 files, 66 tests
P09 harness safety contract: PASS
P09 capability/denial regression: PASS
P09 adapter/privacy projection: PASS
P09 terminal loading/retry source contract: PASS
Prettier: PASS
Targeted ESLint: PASS
git diff --check: PASS
```

## Next exact action

Begin P10 Administration full recovery. Audit Accounts & access, Staff directory, Activity, Reference administration, Link registry, Brand & media, and System status independently against the exact capability matrix. Preserve staging-only data, safe cross-tab isolation, real-or-disabled mutations, terminal loading states, underprivileged denial, and reset restoration.
