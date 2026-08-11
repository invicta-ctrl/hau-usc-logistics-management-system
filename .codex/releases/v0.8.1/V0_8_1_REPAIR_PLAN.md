# v0.8.1 R1/R2 Focused Repair Plan

STATUS: V81-S05_PLAN_ACCEPTED_READY_FOR_COMMIT

MILESTONE: V81-S05_PLAN_ACCEPTED_READY_FOR_COMMIT

RELEASE_STATE: V81-S05_PLAN_ACCEPTED_READY_FOR_COMMIT

RELEASE_STATUS: V81-S05_PLAN_ACCEPTED_READY_FOR_COMMIT

V81_S05: PLAN_ACCEPTED_READY_FOR_COMMIT

S05_PLAN_STATE: ACCEPTED_UNCOMMITTED_READY_FOR_GOVERNANCE_COMMIT

SOL_V81_S05_PLAN_ACCEPTANCE: PASS

LUNA_V81_S05_HIGH_RISK_REVIEW: PASS_NO_P0_P1_P2_P3

S05_ACCEPTANCE_TIMESTAMP: 2026-08-11T22:08:34.9301739+08:00

S05_ACCEPTANCE_BASELINE_SHA: f7d732646649a08487192e1722cb8811902eb548

S05_ACCEPTANCE_BASELINE_TREE: e65745acb5b2bad603a094dadbfdf42fca3db166

S05_ACCEPTANCE_P2_CORRECTION: V20_RELEASE_ID_FAIL_CLOSED_GUARD_AND_MISMATCH_TESTS

PRODUCT_EDITS_AT_ACCEPTANCE: NONE

AUTHORITY: Earl accepted V1R7-A3 FINAL STANDALONE; Sol authorized V81-S05 plan materialization only. This plan is accepted by Sol and fresh Luna, remains uncommitted pending the exact four-file governance commit/push, and authorizes no product edit until that parity is verified.

PRIVACY: Sanitized operational evidence only. No raw owner-feedback text, private paths, Annex material, personal data, credentials, or provider identifiers are recorded here.

## Current baseline and boundary

- Branch: `release/v0.8.1-final-stabilization`.
- Baseline commit: `f7d732646649a08487192e1722cb8811902eb548`; tree `e65745acb5b2bad603a094dadbfdf42fca3db166`.
- S03 ledger and S04 classification are committed; S05 is design and contract-test planning only.
- This file and the three current-chain records are the only files changed at this gate. No product, test, CSS, provider, environment, deployment, migration, PR, merge, or recovery-pointer action is authorized.
- The 46 preserved untracked artifacts remain outside scope and must not be staged, moved, rendered, copied, cleaned, reset, or discarded.

## S06 — R1 access, copy, and form clarity

### R1.1 — V-01, V-02, and V-04: guarded activation and recovery clarity

Owned later source seam: `src/v5/integration/admin-parity.js`.

1. Render the starter activation control only when the current integration has a server-issued activation CSRF value. Its dispatch remains fail-closed when that value is absent.
2. Keep the existing reset-token endpoint and payload unchanged. Put reset completion behind a native, keyboard-accessible collapsed disclosure on sign-in.
3. Replace opaque internal jargon with this exact proposed copy: `Paste the reset token from your approved password-recovery message.`
4. Label the activation email input `USC work email` and associate the hint `Use your approved USC work email.`
5. Do not add a domain allowlist or alter enumeration behavior, endpoint, provider binding, password handling, CSRF, TTL, reset lifecycle, capability, audit, or authorization behavior.

### R1.2 — V-06 through V-09: lending form presentation only

Owned later source seam: `src/v5/integration/operations-parity.js`.

1. Display the enum label `USC Staff/Officer`.
2. Display `Student ID No.` while preserving `studentIdNumber` and the D1 one-to-eight-digit invariant and error behavior.
3. Display `Contact Number`; do not tighten type or validation because internal D1 `contact` remains optional text.
4. Omit optional `notes` from the default lending-create UI only. Preserve backend optional notes and all review or return notes.

### R1.3 — V-25: release identifiers remain distinct

Owned later source seam: `src/v5/integration/operations-parity.js`.

1. Label `requestId` as `Request Ticket ID`.
2. Label `requestLineId` as `Release item`.
3. Do not collapse request and line identity or alter payload keys or values.

### R1.4 — V-39: static institutional landing copy

Owned later source seam: `src/v5/src/surfaces/public.js`.

Replace only the static institutional sentence with this exact proposed copy:

> As the University's highest student governing body, the Council represents the tertiary student community through leadership, service, and shared responsibility.

Server-published announcement projection remains authoritative. This is a static copy correction only.

### R1.5 — styling constraint

Use existing component and design-system CSS only if minimal disclosure styling is required. No theme, brand, layout, landing composition, or visual-system redesign is allowed.

## S07 — R2 queue discovery and contextual affordances

### R2.1 — V-12 and V-22: route-local search over authorized rows

Owned later source seams: `src/v5/src/surfaces/operations.js` and `src/v5/integration/runtime.js`.

1. Add accessible route-local search inputs and status for lending and release.
2. Filter only already-authorized loaded DOM rows on the client; do not issue a backend query, retrieve new data, or widen record scope.
3. Provide keyboard and touch support, a reset per route, and an `aria-live` empty-result status.
4. Reapply filtering after an authorized row refresh.

### R2.2 — V-17, V-20, and V-33: selected-route contextual mounts

Owned later source seams: `src/v5/src/surfaces/operations.js`, `src/v5/integration/operations-parity.js`, and `src/v5/integration/runtime.js` only if needed.

1. Add route-specific contextual mount points inside the selected Request detail, the existing Release review plane, and the Events workbench.
2. Mount controller forms in those selected-route positions instead of the detached root section. Preserve existing fallback behavior for unselected routes.
3. Use route-specific headings instead of a generic detached wall.
4. Preserve existing capability and state filters, commands, payloads, and selected-record scope.
5. Release contextual mount is fail-closed: render or mount release commands only when `selectedReleaseId` resolves to an authorized server-scoped request and equals the request ID used by the form. If IDs differ or are missing, preserve the existing fallback plane and expose no release submit form. Do not synchronize IDs, query new data, or change payloads; release prefill or selection repair remains V-24 B evidence-required and deferred.
6. Add a `New Event` trigger that is hidden and inert by default. Reveal and enable it only when the capability-gated `event-series-save` definition exists, and focus the exact existing form when triggered.
7. Do not add create-restock, media upload, custody-rule changes, new lifecycle commands, browser-invented identifiers, service state, or a generic dialog migration.

### R2.3 — interaction and responsive constraint

Reuse current design tokens and components. The contextual action plane must remain selected-record scoped and reachable on desktop and mobile, with visible focus and reduced-motion-safe behavior.

## Later product-file allowlist

This allowlist applies only after the named fresh Luna review and durable S05 governance commit. Any other later product path requires Sol re-acceptance.

| Path                                        | Later purpose                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| `src/v5/integration/admin-parity.js`        | R1 guarded activation, recovery disclosure, and labels.                   |
| `src/v5/integration/operations-parity.js`   | R1 labels and R2 route-specific form mounting.                            |
| `src/v5/integration/runtime.js`             | R2 authorized-row refresh and selected-record integration only if needed. |
| `src/v5/src/surfaces/public.js`             | R1 static institutional sentence only.                                    |
| `src/v5/src/surfaces/operations.js`         | R2 search and contextual mount surfaces.                                  |
| `src/v5/styles/components.css`              | Minimal disclosure styling only if needed.                                |
| `tests/unit/v5-admin-parity.test.js`        | R1 guarded auth and label contracts.                                      |
| `tests/unit/v5-operations-parity.test.js`   | R1 form and R2 mounting contracts.                                        |
| `tests/unit/v5-backend-integration.test.js` | Payload and invariant regression coverage.                                |
| `tests/e2e/v5-current-application.spec.js`  | Route-level accessibility and contextual-flow coverage.                   |

## Non-negotiable invariants

1. No endpoint, payload, enum, capability, authorization, revision, audit, migration, schema, provider, environment, or route-registry change.
2. `requestId` and `requestLineId` remain distinct.
3. Divergent or missing release IDs cannot mount or submit; V-24 ID-prefill or synchronization remains deferred.
4. Release recipient attestation remains required.
5. Only server-scoped records may appear; no browser-invented identifiers or service state are allowed.
6. No notes are deleted from storage. No protected media, profile, roster, authentication lifecycle, or custody-rule change is allowed.
7. B is evidence-required and unselected. D, E, and F remain deferred. No B, D, E, or F implementation is authorized by this plan.
8. The preserved 46 artifacts remain untouched.

## Focused verification plan for later S06/S07 work

1. Run `node --check` for changed JavaScript, exact Prettier, and `git diff --check`.
2. Run focused admin-parity, operations-parity, and backend-integration unit tests.
3. Add or update current-application E2E assertions for collapsed auth disclosure, conditional activation, labels and no default notes, search filtering and `aria-live`, contextual mount without detached root wall, and capability-gated New Event.
4. Add a focused `tests/unit/v5-operations-parity.test.js` scenario with two authorized requests and mismatched `selectedRequestId` and `selectedReleaseId`, asserting no `release-confirm`, wrong `requestId`, or wrong line options.
5. Add a current-application E2E assertion that a release-ID mismatch never submits.
6. Run `npm.cmd run check:governance`.
7. Reserve repository-required V5 verify, distribution, and browser checks for S08 through S12.
8. If local Vitest or Vite remains unavailable without source change, record TOOLING_NO_EFFECT and require CI at the exact commit; do not install, link, or redesign the test harness.
9. Run structural privacy, keyboard, focus-visible, reduced-motion, and contract-string checks proving endpoints, payload keys, and capabilities are unchanged.

## Risk and control table

| Group             | Risk                            | Required control                                                                                              | Stop trigger                                                                                          |
| ----------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| R1 V-01/V-02/V-04 | High auth-lifecycle crossover   | Server-issued CSRF conditional; reset flow unchanged and fail-closed.                                         | Endpoint, CSRF, TTL, enumeration, or reset lifecycle drift.                                           |
| R1 V-06–V-09      | Medium form/invariant drift     | Labels only; preserve D1 identifiers, optional contact, and stored notes.                                     | Payload, validation, enum, or note-storage drift.                                                     |
| R1 V-25           | High identity collapse          | Keep request and release-line identifiers distinct.                                                           | Any `requestId`/`requestLineId` collapse.                                                             |
| R1 V-39           | Low copy authority drift        | Change only the named static sentence.                                                                        | Announcement projection or published content logic changes.                                           |
| R2 V-12/V-22      | Medium record-scope expansion   | Filter loaded authorized DOM rows only; retain reset and live status.                                         | Backend query, new data, or broadened records.                                                        |
| R2 V-17/V-20      | High command/context regression | Rehome existing selected-route forms with fallback, unchanged commands, and fail-closed matching release IDs. | Any divergent-ID mount or payload, detached-root regression, command, payload, or attestation change. |
| R2 V-33           | High capability bypass          | New Event remains hidden/inert unless `event-series-save` exists.                                             | Capability bypass, new event contract, or invented ID/state.                                          |
| B/D/E/F           | High scope expansion            | Retain evidence-required or deferred state.                                                                   | Any unaccepted B/D/E/F implementation.                                                                |

## Acceptance criteria for S05 review

1. The plan contains only R1 and R2 work, maps every selected ledger item, and preserves the exact later file allowlist.
2. Every proposed change is contract-neutral under the stated invariants, or is explicitly deferred.
3. The reset, activation, lending, release identity, event capability, authorized-row, and custody boundaries are explicit and fail-closed where applicable; divergent or missing release IDs cannot mount or submit.
4. The plan requires focused unit and E2E mismatch proof before product edits.
5. The plan specifies focused accessibility, privacy, invariant, rollback, and test proof before product edits.
6. One fresh read-only Luna audit passes on this exact plan and four-file governance diff before any S06 product edit.

## Rollback and stop conditions

- Roll back later S06 and/or S07 by reverting their exact commits only.
- Later R2 rollback covers this contextual mount guard only; it does not synchronize release IDs or alter stored data.
- No data or provider rollback is expected because the plan permits no persistent contract or data change.
- Stop for any endpoint, payload, capability, schema, record-set, custody, protected media, authentication-lifecycle, unknown-tracked-dirt, failed invariant/test, or outside-allowlist requirement.

## S05 exact next action

NEXT_ACTION_SCOPE: V81_S05_GOVERNANCE_COMMIT_PUSH_THEN_S06

NEXT_EXACT_ACTION: Commit and normally push only the accepted V81-S05 four-file governance packet, verify local/upstream/remote parity and preserved46, then enter V81-S06 and implement only R1 under the accepted repair plan; B remains evidence-required and R2/D/E/F remain outside S06; no provider, Playground, Production, migration, merge, deploy, or recovery-pointer action.
