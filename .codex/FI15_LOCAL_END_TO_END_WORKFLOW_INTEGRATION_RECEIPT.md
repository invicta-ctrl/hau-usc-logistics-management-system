# FI-15 Local End-to-End Workflow Integration Receipt

STATUS: CLOSED__HARNESS_REPAIRED__FI16_ACTIVE
DATE: 2026-08-27
PROGRAM: HAU-USC Logistics FI-14 through FI-17 local frontend integration completion
BRANCH: frontend-design-integration
START_HEAD: d69424bbbf34620e70020435360a6340d2cd5ce8
START_TREE: 5654abf1ed94e5dd453c9767fabba70c8032bbd5
AUTHORITY: `.codex/specs/accepted/2026-08-27-fi14-fi17-local-integration-completion-owner-amendment.md`; SOL-ADVISOR-GLOBAL-001; synchronized project policy; accepted frontend and backend contracts.

## Integrated workflow result

- Public landing, lending submission, tracking, account application, requester intent, authenticated External Request Center, internal request review, Inventory, Profile, activation/reset, session-preserving Home, sign-out, and staff-gate workflows passed locally.
- Conflict, denied, empty, loading, refreshing, stale, media-error, and retry states remained truthful and did not invent local success.
- The exact 4173 Preview Index lending inspection remained local-only and issued no protected lending traffic.
- Six custody/return mutation simulations ran only on the isolated 4174 test harness; the suite intentionally skips those simulations on the accepted 4173 inspection origin.

## Reproduced defect and repair

- The integrated run reproducibly timed out while waiting for Playwright's global `load` event even though the landing DOM and UI were fully rendered. The timeout occurred before the workflow assertion and migrated among direct root navigations.
- `tests/e2e/r3-a1-a2-routing.spec.js` now uses `waitUntil: 'domcontentloaded'` for its 22 root navigations, matching the established exact-origin preview convention. Application source, route behavior, assertions, and network contracts were not changed.

## Verification

- Reproduced failing FI-06 retained-data refresh case before repair: failed at `page.goto('/')` after 30 seconds with the rendered landing page captured.
- Focused post-repair FI-06 retained-data refresh case: 1 passed in 2.1 seconds.
- Full `r3-a1-a2-routing.spec.js` at 4173 / 1440px: 35 passed, 1 mobile-only skip.
- `frontend-cutover.spec.js` in the integrated 4173 / 1440px run: all 11 tests passed.
- FI-07 exact-4173 no-protected-traffic inspection: passed.
- FI-07 isolated 4174 / 1440px workflow run: 6 passed, 1 exact-4173-only skip.
- `git diff --check`: passed.

## Acceptance

```text
FI15_LOCAL_SCOPE_COMPLETE = TRUE
KNOWN_FI15_FRONTEND_REGRESSIONS = 0
EXTERNAL_WRITES = 0
PLAYGROUND_WRITES = 0
PRODUCTION_WRITES = 0
```

NEXT_EXACT_ACTION: Execute FI-16 whole-product local convergence and complete frontend acceptance at 320, 390, 768, 1024, and 1440 CSS px.

