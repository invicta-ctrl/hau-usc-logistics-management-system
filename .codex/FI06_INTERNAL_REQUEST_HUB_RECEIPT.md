# FI-06 Internal Request Hub frontend integration receipt

STATUS: ACCEPTED_CHECKPOINT_COMPLETE
IMPLEMENTATION_WRITER: TERRA_MAX:/root/fi06_request_hub_writer
ACTIVE_WRITER: NONE
WRITER_LOCK: RELEASED
BASELINE: `d76a52208fea6229d07b01cbff02b3515a699654`
ACCEPTED PACKET: `.codex/specs/accepted/2026-08-24-fi06-internal-request-hub-frontend-integration.md`

## Completed bounded implementation

- Mounted the Make v44 Internal Request Hub only in the DOL internal route. It
  requires the existing `view.internal` and `view.request` server capabilities
  and remains distinct from the requester-facing External Request Center.
- Added a strict, same-origin, credentialed Request bootstrap v2 projection for
  the existing `GET /api/bootstrap/request` contract. The browser accepts the
  required request and line lifecycle fields, event series/days/events,
  inventory projection, pagination, and scope revision only; malformed or
  incomplete responses fail closed without inventing values.
- Preserved the server as authority for search/filter/page scope, review
  capability, legal line routes, stock and reservation truth, idempotency, and
  concurrency. The `request.review` capability is only a presentation gate;
  `POST /api/reviewRequest` remains authoritative.
- Delivered the dense desktop queue and mobile cards, lifecycle/context
  inspector, loading/empty/filtered-empty/error/denied/refreshing/stale and
  read-only states, semantic theme tokens, and an accessible fixed/fullscreen
  inspector with focus trap, Escape, opener restoration, backdrop and scroll
  containment.
- Every reviewable line requires an explicit route. Notes are optional; the
  first invalid line receives focus and an alert. A stable `clientRequestId`
  is reused for an identical retry and changes for a changed line route or
  note. Writes disable during refresh/stale/submission, cannot double-submit,
  and server success, conflict, denial, and error receipts remain truthful and
  recover through an authoritative refetch.
- A4 Preview Index inspection mounts the same component only through its
  labelled deterministic local fixture/action. It creates no Session and sends
  zero protected Request bootstrap or review traffic.

## Evidence

- Focused adapter/preview units: 34/34 passed:
  `npm test -- tests/unit/frontend-backend-adapter.test.js tests/unit/preview-index-foundation.test.js`.
- The reproducible FI-06 matrix command is:
  `npx playwright test -c playwright.frontend.config.js tests/e2e/r3-a1-a2-routing.spec.js --grep "FI-06"`.
  The accepted regular matrix passed 55 tests with 5 intentional exact-4173
  Preview Index skips across 320, 390, 768, 1024, and 1440.
- Exact trusted local-preview evidence is:
  `$env:HAU_FRONTEND_E2E_PORT='4173'; npx playwright test -c playwright.frontend.config.js tests/e2e/r3-a1-a2-routing.spec.js --project=frontend-1440 --grep "FI-06 preview inspection"`.
  It passed 1/1 and observed no protected `/api/bootstrap/request` or
  `/api/reviewRequest` traffic.
- `npm.cmd run build` regenerated `dist/index.html` and
  `HAU-USC_Logistics-Frontend-Shareable.html` from the accepted source.
  `npm.cmd run verify:dist` passed; both artifacts have SHA-256
  `725857F273E32239628FB241FA2A14C4E04F049D2753BAEDB72F88C058A2E1F7`.
- Targeted Prettier passed for the changed FI-06 paths. `appTypes.ts` and
  `useAppController.ts` intentionally retain their HEAD legacy formatting so
  their diffs remain limited to the reviewed `canReviewRequests` semantics;
  `check:agents`, `check:continuation`, and `handoff:verify` passed at
  checkpoint closeout.
- `git diff --check` passed. No default-config Playwright experiments are
  acceptance evidence.

## Boundaries and next action

No backend/Worker/auth/capability semantic change, stock or reservation math,
Release action, provider/Figma, Playground, Production, main, migration, D1/R2,
package, deployment, commit, or push occurred. The pre-existing untracked
`.ai-bridge/` remains untouched. FI-07 is intake and repository-handshake only;
it requires its own accepted packet and writer lock before implementation.
