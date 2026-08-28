# P21 Checkpoint — Playground Index / QA Hub

DATE: 2026-08-29
STATUS: PASS_LOCAL_IMPLEMENTATION
PROGRAM: PLAYGROUND-MASTER-2026-08-28
BRANCH: reconcile/playground-master
SCOPE: P21 only

## Outcome

The Playground Index is now a compact QA and demonstration launcher rather than a large status dashboard. It provides exact-token-first fuzzy workspace search from the fifteen-entry in-memory registry, grouped modules, route status, connection and access identity, keyboard navigation, recent workspaces stored locally as route IDs only, and one-click native navigation links.

The launcher reports the isolated Playground runtime's backend readiness, baseline ID and version, reset generation, and working state through one bounded cached status request. Authorization-required and unavailable states fail closed without revealing protected reset metadata. The reset shortcut routes through the existing Administration access boundary; it does not invoke reset directly.

Search performs no backend requests. Slash focuses search, Escape clears it, Arrow Down moves from search to the first primary route, and Arrow Up/Down/Home/End traverse primary workspace links. Misspellings such as `invtry` and abbreviated multi-token intent such as `req hub` resolve deterministically. Recently visited routes are validated, de-duplicated, bounded to four, and persisted without session, account, or record data.

No intent prefetch was added in P21. The current preview build is a single-file bundle with no separate route chunks, so speculative route prefetch has no measured transition benefit and would only duplicate heavy loading. P22 establishes the performance baseline before P23 considers route splitting and measured hover, focus, or idle prefetch.

## Verification

- Exact-4173 Playground Index browser suite at 390: 18 passed, 1 intentional inverse-gate skip.
- P21 launcher browser matrix at 390 and 1440: passed for runtime identity, fuzzy search, no per-keystroke requests, keyboard navigation, recent workspaces, registry/filter behavior, focus lifecycle, and absence of speculative preload.
- P20 semantic regression at 390 and 1440: 3 passed, 1 intentional desktop-only applicability skip.
- Focused unit: 3 files, 21 tests passed.
- Full unit: 169 files, 1242 tests passed.
- Fixture boundary: passed.
- Build: 1681 modules transformed; `dist/index.html` and the deterministic shareable were rebuilt.
- Release-candidate lint: zero errors; two pre-existing unused-variable warnings remain in `src/server/public-request-service.js` and `tests/unit/fi07-lending-hub.test.js`.
- `git diff --check`: passed.

The full unit suite emitted expected supervisor refusal, port-ownership, and negative-path application logs while all supervisor tests and the complete suite passed.

## External State

No deployment, D1, R2, Production, main, Google, or Figma mutation occurred. The deployed Playground runtime remains unchanged; live post-deployment acceptance remains assigned to P29–P31.

## Next

P22: measure the current performance baseline before optimization, including artifact bytes, request and payload counts, web-vital lab measures, representative route transitions and data loads, Index search, desktop/mobile widths, constrained CPU, and slower network profiles.
