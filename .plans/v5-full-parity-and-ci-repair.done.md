# V5 Full Functional and Visual Parity with Clean CI

## Summary

Continue the accepted v0.8.1 work on the real `src/` application, using the frozen V5 prototype as visual authority and the exact deployed v0.8.0 Worker/API behavior as functional authority. Replace the prototype preview harness with a server-validated playground Index, expose every required Production capability through existing or minimal V5-native controls, remove backend-route mock leakage, repair clean-checkout CI, deploy one exact replacement candidate only to the isolated playground, and stop for Earl.

## Type

Enhancement and fix

## Source Issue/Task

The accepted OTG amendment in `.codex/specs/active/v0.8.1-v5-backend-integration-steer.md`, including its preceding minimum-contract-field and live-browser amendments, plus the failed GitHub Actions evidence for PR #23.

## Original Requirements (100% Coverage Required)

| # | Requirement | Plan Step(s) |
|---|-------------|--------------|
| 1 | Continue the existing task, branch, and preserved state without restart. | 1, 9 |
| 2 | Treat the frozen V5 prototype as visual reference and real `src/` as implementation/live-preview target. | 1, 3, 7 |
| 3 | Treat exact deployed Production behavior and matching source as functional authority. | 1, 2, 4 |
| 4 | Bind runtime data only to isolated playground D1/R2 and stop on authority mismatch. | 1, 4, 8 |
| 5 | Preserve V5 shell, rail, topbar, typography, hierarchy, components, motion, themes, and responsive behavior. | 3, 7 |
| 6 | Limit visual differences to real data, accepted contract fields/copy, and explicit playground-only controls. | 3, 7 |
| 7 | Wire every required current Production capability to existing or smallest V5-native controls, preferably with zero new CSS. | 2, 4 |
| 8 | Allow unexposed capabilities only when obsolete/out of scope or explicitly owner-deferred. | 2, 6 |
| 9 | Provide a playground-only searchable, grouped V5 Index from every playground surface with slash quick navigation. | 3, 4, 5 |
| 10 | Never show playground Index/utilities in Production or bypass authorization/persona enforcement. | 3, 5, 8 |
| 11 | Classify every surface exactly once using the six accepted route classifications. | 2, 6 |
| 12 | Leave zero prototype mock records on backend-supported routes. | 4, 6, 7 |
| 13 | Fully wired routes include real reads/commands, auth, validation, lifecycle, loading/empty/denied/error, and D1/R2/audit/history/ledger proof where applicable. | 4, 7 |
| 14 | Keep primary local/browser preview on the real `src/` app and use prototype only side-by-side. | 3, 7 |
| 15 | Prove cross-module workflows, Index, desktop/tablet/mobile, light/dark, and exact deployed playground candidate. | 7, 8 |
| 16 | Keep Production unchanged and prohibit automatic playground-to-Production promotion. | 8, 9 |
| 17 | Preserve schema 30/migration 0030; create no migration, Google write, provider email, M1/M2, or unrelated redesign. | 1, 4, 8, 9 |
| 18 | Repair clean-checkout release-manifest and browser-smoke CI failures without weakening governed checks. | 5, 7 |
| 19 | Update accepted mapping, canonical records, PR evidence, and stop for Earl manual testing. | 6, 8, 9 |

**Coverage Check**: 19 of 19 requirements mapped to plan steps.

## Status

Complete. Exact candidate is frozen for the isolated playground and the canonical handoff stops for Earl manual testing.

## Context

The current branch already contains the isolated playground architecture and a first V5 integration checkpoint. The latest owner amendment supersedes the earlier allowance for broad `BACKEND_CAPABILITY_NOT_EXPOSED_BY_V5` deferrals and requires parity against the deployed current Production backend while preserving the V5 design.

## Current State

- `src/index.html` boots the vendored V5 application through `src/v5/integration/entry.js`.
- Backend-backed prototype arrays are cleared, but only a subset of Production commands is wired.
- The shipped V5 runtime still displays a prototype preview bar, fake viewport/state selectors, and copy claiming no live service.
- The existing integration map leaves required Production actions unexposed or `noop`.
- Clean CI still hashes a missing legacy Apps Script HTML file and runs the legacy selector suite against the V5 shell.
- The deployed isolated playground checkpoint remains v0.8.1-playground.1 and is not the final candidate.

## Desired State

The real application is visually V5, data- and action-complete for required Production capabilities, mock-free on backend-supported routes, protected by server-owned environment and authorization checks, and equipped with a playground-only V5 Index. Clean CI and local acceptance pass; one frozen deterministic candidate is deployed only to the isolated playground and the task stops for Earl.

## CLAUDE.md Requirements

No `CLAUDE.md` exists in the repository. Root `AGENTS.md`, `.codex/CURRENT.md`, the accepted V5 steer, and the isolated-playground specification govern this work.

### Naming Conventions

- Use existing lowercase kebab-case script/test names and existing V5 module paths.
- Modify canonical integration modules directly; do not create `v2`, `new`, `enhanced`, or temporary variants.

### Architecture Requirements

- Browser calls same-origin Worker/API only; server bindings select environment resources.
- Preserve schema, transactions, authorization, append-only ledger, audit/history, R2 privacy, and one-way baseline invariants.
- V5 owns presentation; the deployed v0.8.0 source owns functional contracts.
- Production promotion is structurally absent from candidate automation.

### Type Requirements

- This codebase is JavaScript with runtime contract tests rather than TypeScript application types.
- Reuse API DTOs, service-method signatures, route records, and existing V5 state objects; introduce no loose parallel schema.

### Other Guidelines

- Preserve unknown work and the recorded superseded-work stash.
- No migration, Production mutation/deploy, Google write, email send, force push, or unknown branch deletion.

## Existing Types

### Types to Reuse

- `LAUNCH_SERVICE_METHODS` and `PROTECTED_RUNTIME_SERVICE_METHODS` from `src/services/launch-service-contract.js` for the functional inventory.
- `HttpApiAdapter` and `createLegacyRuntimeAdapter` from `src/services/` for exact Worker/API contracts.
- `SURFACES`, `GROUPS`, `NAV`, and route records from `src/v5/src/registry.js` for complete Index and classification.
- Existing bootstrap/module DTO state from `src/app/bootstrap-contract.js` and the V5 integration view models.
- Existing V5 button, form, table, card, details, dialog, drawer, toast, chip, and empty/error patterns.

### Types to Create

- No new TypeScript types. Add a frozen JavaScript route-capability/classification manifest only if it prevents documentation/runtime/test drift.

### Type Guidelines

- Do not add `any` or unvalidated generic payload escape hatches.
- Validate visible form data against the exact existing command contracts before invoking an adapter.
- Prefer existing DTOs and service signatures over duplicate structures.

## Impact Analysis

### Files to Modify

- `src/v5/src/app.js` — replace preview-only chrome/copy with fail-closed playground-aware Index access and retain V5 route search/theme behavior.
- `src/v5/src/registry.js` and `src/v5/src/surfaces/*.js` — add only minimal V5-native parity controls and route metadata using existing patterns.
- `src/v5/integration/backend.js` — expose exact safe environment/status and existing API methods needed by the V5 runtime.
- `src/v5/integration/runtime.js` — environment verification, authorization-aware Index, complete reads/actions, lifecycle states, and mock-free bindings.
- `src/v5/integration/view-models.js` — map authoritative DTOs without fabricated records.
- `src/v5/styles/*.css` — expected unchanged; modify only if an accepted existing V5 rule must be reused/corrected for exact parity and record the reason.
- `tests/unit/v5-backend-integration.test.js` and focused domain tests — deterministic environment, classification, mock-denial, and command tests.
- `tests/e2e/` and Playwright configuration — V5-native real-source journeys and responsive/theme acceptance.
- `.github/workflows/ci.yml` and/or `package.json` — run the intentional V5 smoke suite rather than obsolete selectors.
- `scripts/create-release-candidate-manifest.mjs` and `tests/unit/release-pipeline.test.js` — remove the nonexistent legacy Apps Script artifact dependency.
- `docs/V5_BACKEND_INTEGRATION_MAP.md`, integrity evidence, canonical records, changelog/status, and PR #23 evidence — exact final classifications and candidate handoff.

### Files to Create

- Focused V5 Playwright spec/config files only where separation from archived legacy selector coverage is required.
- Deterministic route-capability manifest/test helper only if one canonical source is needed across runtime, docs generation, and tests.

### Files to Delete

- None initially. Obsolete preview-harness code is removed in place; historical legacy tests remain as source-level regression evidence unless superseded tests prove they are dead and accepted governance permits deletion.

### Dependencies Affected

- Vite single-file build bridge depends on V5 `app.js` exports and boot marker.
- Runtime adapters depend on session/CSRF state and Worker endpoint signatures.
- CI, release-candidate manifesting, and deployment evidence depend on deterministic `dist/index.html` generation.
- Documentation and canonical records depend on final test/deployment identities.

### Breaking Changes

- Prototype-only width/state controls and illustrative service-denial copy are intentionally removed from the shipped real app.
- Backend contracts, routes, schema, resource bindings, and production behavior do not change.

## Implementation Steps

### Step 1: Reverify Authorities and Preserve State
**Files**: `.codex/CURRENT*.md`, Git/provider read-only evidence
**Action**: Confirm branch/HEAD/upstream/clean state, exact deployed Production identity/contracts, schema/migration, and isolated playground Worker/D1/R2 identity.
**Why**: All later wiring and deployment must be bound to exact authorities.

### Step 2: Complete Production Capability and Route Audit
**Files**: `src/services/*`, `src/visual/*`, `src/v5/src/registry.js`, `docs/V5_BACKEND_INTEGRATION_MAP.md`
**Action**: Map every V5 route/control to exact Production reads and commands; identify required V5-native additions, obsolete/prototype-only controls, owner deferrals, auth, D1/R2, and lifecycle evidence.
**Why**: Broad unexposed-backend deferral is no longer accepted.

### Step 3: Replace Preview Harness with Protected Playground Navigation
**Files**: `src/v5/src/app.js`, `src/v5/integration/backend.js`, `src/v5/integration/runtime.js`
**Action**: Remove fake viewport/state selectors and preview copy; render Index access only after same-origin server confirmation of STAGING/playground and applicable authorized persona. Keep grouped/searchable route Index and slash/Ctrl-K navigation; fail closed in Production and on spoofed browser state.
**Why**: The real app must not ship the prototype harness, while the playground requires a complete safe Index.

### Step 4: Implement Full V5-Native Functional Parity
**Files**: `src/v5/src/surfaces/*.js`, `src/v5/integration/runtime.js`, `src/v5/integration/view-models.js`, `src/v5/integration/backend.js`
**Action**: Wire every required read/action using exact service contracts, authorization, revisions, reasons, idempotency, evidence metadata, validation, lifecycle refreshes, audit/history/ledger consequences, and safe state handling. Compose missing controls only from existing V5 patterns and remove all `noop` behavior for supported capabilities.
**Why**: Required Production behavior must remain available under V5 rather than merely preserved server-side.

### Step 5: Repair Clean-Checkout CI and Candidate Identity
**Files**: `scripts/create-release-candidate-manifest.mjs`, `tests/unit/release-pipeline.test.js`, `.github/workflows/ci.yml`, `package.json`, Playwright config/specs
**Action**: Hash only real candidate artifacts; run an intentional V5 smoke suite at representative widths instead of the incompatible legacy selector matrix; retain unit/integration coverage for backend contracts and production-denial guards.
**Why**: CI must prove the current architecture from a clean checkout.

### Step 6: Finalize Exact Route Classification and Mock Audit
**Files**: `docs/V5_BACKEND_INTEGRATION_MAP.md`, runtime manifest/tests
**Action**: Give every surface exactly one accepted classification, document exact commands and evidence, prove zero mock rows on supported routes, and record only evidence-backed prototype-only or owner-deferred items.
**Why**: The amendment defines classification and mock-zero as completion gates.

### Step 7: Verify Functional and Visual Acceptance
**Files**: focused unit/e2e tests and generated acceptance evidence
**Action**: Run route/control contract tests, cross-module journeys, Index access/denial, build/manifest checks, clean CI-equivalent check, and 1440/1024/768/390 plus 320 safety captures in light/dark. Compare real `src/` against frozen V5 for equivalent states and inspect screenshots.
**Why**: Both full functional parity and exact V5 visual parity are mandatory.

### Step 8: Freeze and Deploy One Exact Playground Candidate
**Files**: generated build/manifest, private playground config/evidence outside repository
**Action**: Review logical diff, freeze commit/tree/build/artifact identities, push the exact branch, deploy only through the isolated-playground path, verify D1/R2 isolation and real routes, rerun smoke/reconciliation, and recheck safe Production fingerprints unchanged.
**Why**: Earl must test the exact verified candidate and Production must remain untouched.

### Step 9: Close Canonical Handoff and Stop
**Files**: `.codex/CURRENT*.md`, `CHANGELOG.md`, status/runbooks, PR #23
**Action**: Record exact results, classifications, candidate/deployment identity, unrun checks/risks, and `WAITING_FOR_EARL_MANUAL_TESTING`; update the draft PR and stop without Production promotion.
**Why**: This is the accepted completion boundary.

## REMOVAL SPECIFICATION

### Code to Remove

#### From `src/v5/src/app.js`
- Prototype `previewBar()` controls for synthetic surface state and viewport simulation.
  - **Why removing**: They are reference-harness controls, not the real app or safe playground utilities.
  - **Replacement**: Step 3 provides a server-validated playground Index entry and real responsive behavior.
- Index copy stating that no live service is contacted and all records are illustrative.
  - **Why removing**: False in the integrated playground.
  - **Replacement**: Step 3 provides accurate isolated-playground/testing copy.
- Preview-bar height synchronization tied to the old simulation harness.
  - **Why changing**: The synthetic harness is removed.
  - **Replacement**: Height synchronization remains only for the server-verified, playground-only identity bar so it cannot overlap the V5 shell.

#### From `src/v5/integration/runtime.js` and V5 surfaces
- Non-destructive generic `noop` interception for backend-supported Production actions.
  - **Why removing**: It masks required capability gaps.
  - **Replacement**: Step 4 exact command handlers and V5-native forms.
- Any mock-backed route data fallback presented as operational truth.
  - **Why removing**: Violates mock-zero acceptance.
  - **Replacement**: Authoritative API view models and honest empty/denied/error states.

#### From `scripts/create-release-candidate-manifest.mjs`
- Hashing of `apps-script/AppScript.html`.
  - **Why removing**: The V5 candidate build no longer generates this legacy artifact in a clean checkout.
  - **Replacement**: Existing deterministic Cloudflare and shareable application artifact hashes.

#### From ordinary CI browser smoke
- Invocation of the full legacy selector suite against the V5 application.
  - **Why removing**: It tests obsolete DOM contracts and produces skip-heavy failure instead of V5 acceptance.
  - **Replacement**: Step 5 V5-native smoke/route/responsive tests; backend behavior remains covered by unit/integration suites.

### Removal Checklist

- [x] Prototype preview controls and false illustrative copy removed
- [x] Preview-only viewport/state handlers removed; height sync is scoped to the protected playground bar
- [x] Supported-action `noop` paths removed
- [x] Backend-supported mock fallbacks removed
- [x] Legacy Apps Script HTML hash removed from release manifest
- [x] CI points to the V5-native browser suite
- [x] No dead imports, listeners, selectors, or stale documentation remain

**VERIFICATION**: Search for `Animated redesign preview`, `Not production`, preview viewport/state action names, supported `data-act="noop"`, `BACKEND_CAPABILITY_NOT_EXPOSED_BY_V5`, legacy Apps Script manifest hash, and mock collection mutations; every remaining occurrence must be intentionally classified.

## Anti-Patterns to Avoid

- Do not retain a parallel old frontend, dual-run fallback, browser-selectable backend, feature-flag migration, or temporary compatibility bridge.
- Do not fabricate command fields, IDs, revisions, reasons, evidence, or successful results.
- Do not satisfy parity with a generic raw-JSON command console.
- Do not weaken server authorization because a control is hidden.
- Do not change Production resources, schema, or backend architecture.
- Replace obsolete preview behavior cleanly and use the existing V5 language for new parity controls.

## Validation Criteria

### Pre-Implementation Checklist

- [x] Applicable `AGENTS.md` and accepted amendments reviewed
- [x] No relevant `CLAUDE.md` exists
- [x] Current branch/HEAD/upstream and preserved stash identified
- [x] Existing service adapters, route registry, V5 runtime, and CI failure evidence identified
- [x] Exact route/action audit finalized

### Post-Implementation Checklist

- [x] All steps completed and this file renamed `.done.md`
- [x] Every route has exactly one accepted classification
- [x] Mock data remaining on backend-supported routes equals zero
- [x] Playground Index is complete, searchable, reachable, authorized, and Production-denied
- [x] Required Production actions are V5-native and fully wired
- [x] Focused unit/integration tests pass
- [x] V5 Playwright cross-module and responsive light/dark tests pass
- [x] `npm run lint`, build, full test, governance, handoff, artifact, Cloudflare dry-run, and full `npm run check` pass
- [x] Frozen-V5 versus integrated-src visual parity passes at required viewports/themes
- [x] Exact candidate commit/tree/build/artifact identities match the playground deployment
- [x] Safe before/after Production fingerprints are unchanged
- [x] Candidate automation contains no Production continuation
- [x] Canonical records and PR #23 are updated and task stops for Earl
