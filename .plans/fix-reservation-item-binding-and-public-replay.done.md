# Fix Reservation Item Binding and Public Replay

## Summary

Repair the two P1 findings from the exact-SHA review of
`5ef9421494ab51af8e0524b694ff0f3ff81503f0`: bind every request-line
reservation to the line's authoritative catalog item, and bind public request
idempotency keys to a canonical payload fingerprint without disclosing an
unrelated tracking token. Preserve the accepted atomic reservation-capacity
guard and public request transaction.

## Type

Fix

## Source Issue/Task

Owner-authorized v0.7.2 execution; exact-SHA security and transaction reviews
required by `.codex/V0_7_2_CODEX_CONTINUATION_HANDOFF.md`.

## Original Requirements

| # | Requirement | Plan step |
|---|---|---|
| 1 | A reservation item must equal the authoritative request-line item. | 1 |
| 2 | A mismatch must fail before any reservation, ATP, audit, idempotency, or revision effect. | 1, 3 |
| 3 | Existing same-line concurrency and valid procurement/top-up behavior must remain atomic. | 1, 3 |
| 4 | Public exact retries must return the original result only for the same normalized payload. | 2, 3 |
| 5 | Same-key/different-payload public retries must fail without exposing the prior tracking token. | 2, 3 |
| 6 | Historical public requests lacking a durable fingerprint must fail closed. | 2, 3 |
| 7 | Full repository, Worker/D1, browser, artifact, review, and exact-head CI gates must pass. | 4 |

Coverage: 7 of 7 requirements mapped.

## Status

Implementation and focused verification complete. Full local gates are green;
exact-SHA reviews and exact-head CI remain release gates.

## Context

`reserveStock` currently validates that the caller-selected item is active but
does not compare it to `request_lines.item_id`. The wrong reservation then
holds ATP while `confirmRelease` correctly looks for the line's authoritative
item, permanently stranding the request. Public request replay currently keys
only on the public actor and `clientRequestId`, so a reused key returns the
prior tracking token without comparing payloads.

## Desired State

Both paths fail closed before disclosure or state mutation, while valid exact
retries and reservation transactions retain their current behavior.

## AGENTS.md Compliance

- Keep one bounded repair slice and the parent as the only writer.
- Use CodeGraph before code discovery; use targeted reads and deterministic
  tests.
- Preserve unknown work and generated-source pipelines.
- Require zero P0/P1, complete gates, exact commit/push, and durable handoff.
- Do not invent identity configuration or touch staging/production without all
  private and recovery gates.

No applicable `CLAUDE.md` exists under the repository or affected directories.

## Existing Types and Patterns

- Reuse `ApiError`, `fingerprint`, `replay`, `idempotency_keys`, and D1 batch
  patterns already present in the server modules.
- Reuse the existing public request normalized command structure and public
  result object; no new runtime type is required.
- Reuse real local Worker/D1 Playwright tests and the existing mutation helper.

## Impact Analysis

### Files to modify

- `src/server/d1/operational-service.js`: select and compare the authoritative
  line item before replay/mutation.
- `src/server/public-request-service.js`: canonical fingerprint, durable replay
  lookup, fail-closed legacy collision, and atomic receipt insertion.
- `tests/cloudflare-e2e/rv01-request-visibility.spec.js`: wrong-item rejection
  with zero ATP/reservation effect.
- Public request unit/Worker tests selected from existing suites: exact replay
  and changed-payload conflict without tracking-token disclosure.
- `.codex/CURRENT_TASK.md`: record the review failure and bounded repair.

### Files to create

- This plan only; no migration is needed because `idempotency_keys` already
  stores actor, fingerprint, result, and timestamp.

### Dependencies and breaking changes

- Public requests created before fingerprint receipts cannot be safely replayed
  by client key and will return a conflict; this is intentional fail-closed
  behavior, not a compatibility adapter.
- No API shape changes for valid first submissions or exact retries.

## Implementation Steps

### Step 1: Bind reservation to request-line item

**File:** `src/server/d1/operational-service.js`

- Include `line.item_id` in the scoped request-line lookup.
- Reject a missing or mismatched authoritative item before replay and before the
  guarded batch.
- Keep location and entity-scope checks and all atomic batch ordering intact.

### Step 2: Bind public request replay to payload

**File:** `src/server/public-request-service.js`

- Canonicalize the submitted command and compute a protected fingerprint.
- Read `idempotency_keys` before returning any prior request or tracking token.
- Return the stored result only when actor and fingerprint match.
- Return a 409 conflict for a changed payload or a historical request that has
  no fingerprint receipt.
- Insert the receipt in the same D1 batch as the request, access, lines,
  history, audit, and revisions.

### Step 3: Add regressions

**Files:** existing public request and RV-01 Worker/D1 test files.

- Prove a wrong-item reservation returns 409 and changes neither item ATP nor
  line reservations/status.
- Prove public exact retry returns the same request/tracking result.
- Prove changed-payload reuse returns conflict and does not disclose a tracking
  code or create a second request.

### Step 4: Verify and freeze

- Run focused unit and Worker/D1 tests.
- Run `npm run check`, full local Worker/D1, and browser `--workers=2` gates.
- Restore the default build and prove staging artifact preflight fails.
- Commit/push, run fresh exact-SHA security and transaction reviews, and require
  exact-head CI green.

## Removal Specification

- Remove the unsafe request-table-only public replay branch that returns a
  tracking token without a fingerprint match.
- Do not retain a fallback that reconstructs tracking tokens for historical
  requests without a durable receipt.
- No files, migrations, or public API fields are removed.

## Anti-Patterns to Avoid

- No status-only or post-commit validation.
- No plain batch that weakens the reservation sentinel.
- No raw-payload/order-sensitive fingerprint.
- No tracking-token return before fingerprint match.
- No new migration or compatibility fallback when the existing idempotency
  table provides the required durable contract.

## Validation Criteria

- [x] Wrong-item reservation fails with zero state/ATP effect.
- [x] Valid reservation, top-up, procurement release, and concurrent loser
      behavior remain green.
- [x] Public exact retry returns the original result.
- [x] Changed-payload and legacy-key collision fail closed without tracking
      disclosure.
- [ ] Full gates, deterministic artifact, exact reviews, and CI pass.
