# Fix Mobile Request Submit CI

## Summary

Repair the CI-only pointer interception race in both existing 390px Request
Center accessibility scenarios. Preserve product behavior and exercise the
same form submission through its keyboard-accessible path.

## Type

Fix

## Source Issue/Task

PR #9 exact-head `browser-smoke` failure at run `30072625327`, job
`89416485586`.

## Original Requirements

| # | Requirement | Plan step |
| --- | --- | --- |
| 1 | Restore the exact-head `browser-smoke` check | 2–4 |
| 2 | Preserve Request Center submission behavior | 2 |
| 3 | Keep the accessibility proof user-realistic | 2 |
| 4 | Run focused and full browser verification | 3 |
| 5 | Push safely and verify exact remote CI | 4 |
| 6 | Do not mutate production | 1–4 |

Coverage check: 6 / 6 requirements mapped.

## Status

In Progress

## Context

The form and button are valid. In the slower two-worker Linux CI run,
Playwright's pointer clicks repeatedly auto-scroll the buttons beneath fixed
header/mobile-nav geometry or the transient toast, while the same suite passes
locally. This is a test interaction race, not a server or form failure.

## Current State

`tests/e2e/request-accessibility.spec.js` submits both mobile form scenarios
with pointer clicks. CI reports pointer interception until the 30-second test
timeout.

## Desired State

The accessibility scenario focuses the submit control and presses Enter,
exercising the same native form submit event without depending on overlay
timing.

## Repository Instruction Compliance

- Root `AGENTS.md` and `.codex/CURRENT.md` govern this repository.
- Preserve the dirty durable Phase 6 handoff files.
- Change only the failing test interaction.
- Never reset, clean, discard, force-push, or mutate production.

No `CLAUDE.md` applies.

## Existing Types

No types are created or changed. Existing Playwright `Locator` behavior is
reused.

## Impact Analysis

### Files to modify

- `tests/e2e/request-accessibility.spec.js` — replace both flaky pointer clicks
  with focus plus Enter.

### Files to create

- This temporary durable fix plan only.

### Files to delete

- None.

### Dependencies and breaking changes

No runtime dependency or breaking change.

## Implementation Steps

### Step 1: Confirm the failure

Use the exact GitHub Actions log and preserve the failure URL/snippet.

### Step 2: Repair the interaction

Focus each existing `Submit for DOL Review` button and press Enter. Do not
alter application code or bypass form validation/submission.

### Step 3: Verify

Run the focused 390px scenario, `git diff --check`, and the full browser suite.

### Step 4: Publish and reconcile

Commit/push the targeted repair and durable Phase 6 records, then verify all six
PR checks on the exact new head.

## REMOVAL SPECIFICATION

No product code is removed. Replace only the two pointer-click statements.

Removal checklist:

- [x] Old pointer-click line removed
- [x] No forced click or JavaScript submission added
- [x] No dead helper introduced

## Anti-Patterns to Avoid

- Do not use `force: true`.
- Do not call `form.submit()` or bypass native validation.
- Do not weaken fixed header/mobile navigation behavior.
- Do not suppress or retry a failing GitHub check without fixing the test.

## Validation Criteria

### Pre-implementation

- [x] Exact failing job and log inspected
- [x] Affected file identified
- [x] Repository instructions preserved

### Post-implementation

- [x] Focused 390px scenario passes
- [x] Full Playwright passes
- [x] `git diff --check` passes
- [ ] Exact-head PR checks pass 6 / 6
- [x] Production remains untouched
