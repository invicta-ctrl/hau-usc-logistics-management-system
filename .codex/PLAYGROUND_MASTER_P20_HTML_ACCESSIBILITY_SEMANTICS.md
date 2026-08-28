# P20 Checkpoint — HTML and Accessibility Semantics

DATE: 2026-08-29
STATUS: PASS_LOCAL_IMPLEMENTATION
PROGRAM: PLAYGROUND-MASTER-2026-08-28
BRANCH: reconcile/playground-master
SCOPE: P20 only

## Outcome

The current Playground frontend now uses native navigation links for route changes and buttons for actions, preserves one meaningful H1 per rendered workspace, exposes logical heading order, associates previously unnamed Inventory and Profile fields with labels, and gives every audited table column header an explicit `scope="col"`. The shared table primitive also applies column scope by default.

The accessibility matrix audits all sixteen public, Playground Index, and inspection routes at 390 and 1440 widths for H1 structure, heading-order gaps, visible form labels, accessible link/button names, scoped table headers, and unique IDs. Existing Release Desk and shell coverage continues to prove dialog focus containment, Escape handling, focus restoration, keyboard operation, and mobile-drawer focus behavior. The desktop matrix also verifies critical landing actions remain reachable with a 200 percent zoom-equivalent viewport and that the document does not introduce blocking horizontal overflow.

Native navigation exposed one stale authenticated hash during sign-out: React state moved home, then hash rehydration reopened Staff Sign In. Sign-out now clears the route hash before releasing the session, and the existing FI-04 lifecycle test verifies the corrected behavior at both 390 and 1440 widths.

## Verification

- New semantic browser audit: 3 passed, 7 intentionally skipped by viewport applicability across the five-width frontend matrix.
- Targeted 390 browser checks: 10 passed, 1 intentional desktop-only skip.
- Targeted 1440 browser checks: 10 passed, 1 intentional mobile-only skip.
- Focused unit: 6 files, 34 tests passed.
- Full unit: 169 files, 1241 tests passed.
- Fixture boundary: passed.
- Build: 1680 modules transformed; `dist/index.html` and the deterministic shareable were rebuilt.
- Release-candidate lint: zero errors; two pre-existing unused-variable warnings remain in `src/server/public-request-service.js` and `tests/unit/fi07-lending-hub.test.js`.
- `git diff --check`: passed.

The attempted broad 385-case Playwright run was cancelled after excessive parallel load and is not counted as evidence. All accepted P20 browser evidence used the isolated exact-4173 test route, one worker, and bounded current-route coverage. The full unit suite emitted expected supervisor refusal/port-ownership test fixtures while all 53 supervisor tests and the complete suite passed.

## External State

No deployment, D1, R2, Production, main, Google, or Figma mutation occurred. The deployed Playground runtime remains unchanged; live post-deployment acceptance remains assigned to P29–P31.

## Next

P21: redesign the Playground Index as a fast QA/demo launcher with in-memory fuzzy search, keyboard navigation, grouped modules, route and backend health, baseline/generation identity, recent workspaces, authorized reset access, and deliberate intent-based prefetch.
