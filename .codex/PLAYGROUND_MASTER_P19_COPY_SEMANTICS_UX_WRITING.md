# P19 Checkpoint — Copy, Semantics, and UX Writing

DATE: 2026-08-29
STATUS: PASS_LOCAL_IMPLEMENTATION
PROGRAM: PLAYGROUND-MASTER-2026-08-28
BRANCH: reconcile/playground-master
SCOPE: P19 only

## Outcome

The frontend now uses concise, operational language across the landing experience, authenticated shell, internal request and lending workflows, inventory, release, supply, Administration, Profile, public flows, error and empty states, and the Playground Index. The slogan `Every request. Every handoff. On record.` was removed without replacement.

`docs/frontend/UI_LANGUAGE_GUIDE.md` is the canonical product-language guide. It defines voice, action labels, statuses, error and recovery patterns, helper text, technical-term boundaries, Playground terminology, and capitalization/date/number conventions. `tests/unit/playground-ui-language.test.js` enforces the highest-risk rejected phrases and required guide sections.

The visible Playground indicator is normalized to:

`PLAYGROUND INSPECTION · Sample data · Actions are unavailable.`

Normal-user copy no longer exposes Worker, D1, R2, provider, contract, or revision internals outside intentional system-status contexts. Action labels identify the object or outcome, and error messages state what happened plus the next available action.

## Verification

- Focused unit: 8 files, 36 tests passed.
- Full unit: 169 files, 1241 tests passed.
- Responsive browser matrix: 20 tests passed across 320, 390, 768, 1024, and 1440 widths.
- Targeted 390 browser checks: 11 tests passed across preview, authentication lifecycle, and request flows.
- Exact inspection-port FI-11 check: 1 test passed.
- Visual inspection: landing and public lending were inspected at 390 and 1440 widths; hierarchy, wrapping, recovery copy, and action labels remained legible. The local unsupervised Vite process cannot activate the capability-gated Playground Index without the private Playground proxy, so the Index visual contract is supported by the accepted multi-width Playwright evidence rather than claimed as a live-browser inspection.
- Fixture boundary: passed.
- Build: 1680 modules transformed; `dist/index.html` and the deterministic shareable were rebuilt.
- Release-candidate lint: zero errors; two pre-existing unused-variable warnings remain in `src/server/public-request-service.js` and `tests/unit/fi07-lending-hub.test.js`.
- `git diff --check`: passed.

An initial Playwright run against port 4174 was discarded because that port belonged to a different worktree. It is not counted as P19 evidence. All accepted browser evidence used this worktree's isolated ports.

## External State

No deployment, D1, R2, Production, main, Google, or Figma mutation occurred. The deployed Playground runtime remains unchanged; live post-deployment acceptance remains assigned to P29–P31.

## Next

P20: audit and correct HTML and accessibility semantics, including heading structure, native action/link roles, labels, fieldset/legend grouping, table headers, dialog semantics, focus management, and useful live regions.
