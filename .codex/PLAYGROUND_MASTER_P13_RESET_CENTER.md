# P13 In-app Playground Reset Center

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: PASS_LOCAL_IMPLEMENTATION; LIVE_UI_RESET_E2E_PENDING_P29_P31
ROUTE: SOLO

## Outcome

Administration -> System status now presents a Playground-only control surface whose single primary action is `Reset Entire Playground`. It shows the sealed baseline ID/version, reset generation, working state, last successful reset, and the reset consequences. The action remains disabled until the System Owner types `RESET PLAYGROUND` exactly.

The frontend receives a narrow reset projection only. Candidate identities, provider/storage details, account IDs, operation references, and correlation data do not cross the adapter into rendered state. Production and any non-Playground runtime receive a generic 404 before database/auth service construction, so neither the status endpoint nor the mutation endpoint is usable there.

## Server and lifecycle enforcement

- The Worker requires the existing authenticated `system.admin` capability and CSRF protection for the mutation.
- The server revalidates the fixed STAGING + Playground label/runtime tuple.
- A current `RESETTING`/`REFRESHING_BASELINE` state or pending reset/refresh rejects a second operation with HTTP 409.
- The UI reports accepted/in-progress state without rendering the internal operation reference.
- The P12 operator now writes a safe `playground.last_reset_receipt` and clears `playground.pending_operation` only after clean-state verification passes.
- The final receipt records generation, completion time, invalidated-session count, and fixed non-sensitive consequences.
- The already-proven P12 reset lifecycle invalidates old sessions. Safe-entry/new-session/new-generation UI acceptance remains explicitly assigned to the exact deployed candidate at P29/P31.

## Generated artifacts

The normal build pipeline rebuilt `dist/index.html` and `HAU-USC_Logistics-Frontend-Shareable.html`; both contain the new primary control. No Playground deployment occurred in P13. The currently deployed Playground runtime remains sourced from `ca28bde`; P29 owns the exact candidate freeze/deploy.

## Verification

```text
Focused reset/service/frontend tests: PASS - 5 files / 24 tests
Full Vitest: PASS - 165 files / 1222 tests
Frontend build: PASS - 1679 modules
Release-candidate ESLint: PASS - 0 errors / 2 pre-existing warnings
Repository-wide ESLint: BLOCKED ONLY BY 26 pre-existing browser-global errors in excluded prototypes/public-portals-r3/app.js
Targeted Prettier: PASS
git diff --check: PASS
Generated reset-control presence: PASS - both tracked HTML artifacts
Production mutation: NONE
Google mutation: NONE
Figma mutation: NONE
Playground deployment: NONE
```

## Next exact action

Begin P14 Profile and personalization. Reconcile the existing authenticated profile contracts against the accepted requirements, then implement only the missing username, password, contact, profile-picture, appearance, and correction-path behavior while preserving institution-controlled identity fields and the reset baseline.
