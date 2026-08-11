# v0.8.1 Daily-Use Route Regression Evidence

STATUS: V81-S08_EVIDENCE_ACCEPTED_READY_FOR_COMMIT

MILESTONE: V81-S08_EVIDENCE_ACCEPTED_READY_FOR_COMMIT

RELEASE_STATE: V81-S08_EVIDENCE_ACCEPTED_READY_FOR_COMMIT

RELEASE_STATUS: V81-S08_EVIDENCE_ACCEPTED_READY_FOR_COMMIT

V81_S08: EVIDENCE_ACCEPTED_READY_FOR_COMMIT

S08_EVIDENCE_STATE: ACCEPTED_UNCOMMITTED_READY_FOR_COMMIT

SOL_V81_S08_EVIDENCE_ACCEPTANCE: PASS

LUNA_V81_S08_EVIDENCE_REVIEW: PASS_NO_P0_P1_P2_P3

S08_REVIEW_TIMESTAMP: 2026-08-12T01:34:31.2400834+08:00

LOCK_CONTINUITY: A3_V81_S08_EVIDENCE_ACCEPTED_COMMIT_PENDING

AUTHORITY: Earl accepted V1R7-A3 FINAL STANDALONE; Sol accepted the completed S08 evidence and fresh Luna evidence review passed. This packet remains uncommitted pending the exact five-path governance commit/push.

BRANCH: `release/v0.8.1-final-stabilization`

BASELINE_SHA: `e811ceceba730a53186f022df721909e01f776d8`

BASELINE_TREE: `7c594320ee54f26778c9670380fb8927b7a758d1`

## Scope and safety boundary

- Product-source changes: none.
- Test-only changed path: `tests/e2e/v5-current-application.spec.js`.
- Governance evidence scope: this file and the three canonical current-chain records.
- The exact packet is five paths: the test file, this evidence packet, `.codex/CURRENT.md`, `.codex/CURRENT_TASK.md`, and `.codex/CURRENT_HANDOFF.md`.
- The 46 preserved untracked artifacts remain untouched and unstaged.
- No provider, Playground, Production, PR, deployment, migration, merge, recovery-pointer, ref, or runtime action occurred.

## Locked local runner restoration

- `npm.cmd ci` used the tracked `package-lock.json` only.
- Installed packages: 169.
- Package-lock SHA-256 before and after: `415E0545A66C1CFF50A3256C4A7BD6DB9676C6DF17E475FF8D19AEBE6D4DB622`.
- Package-lock and tracked repository state remained unchanged by the install; `node_modules` is ignored tooling output only.

## Daily-use regression results

| Evidence                 | Result                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Focused Vitest           | PASS: 3 files, 25 tests: `v5-admin-parity`, `v5-operations-parity`, and `v5-backend-integration`.                         |
| Playwright V5 matrix     | PASS by A3 gate reuse: 76 passed, 32 skipped, 0 failed across 320, 375, 390, 414, 768, 1024, 1280, 1440, and 1920 widths. |
| Runner cleanup           | PASS: no Vite or Playwright orphan process remained.                                                                      |
| P0/P1 daily-use blockers | 0 open for this gate.                                                                                                     |

An earlier diagnostic matrix exposed the reset-description collision and empty lending fixture. After those two corrections, the conclusive full matrix produced 67 pass/32 skip/9 fail, with all nine failures the same sign-in password locator across nine projects. After correcting that locator, the exact affected-test rerun passed 9/9. A3 gate reuse yields 76/32/0.

## Test-only corrections

1. Reset helper assertion now selects the direct description child, excluding the nested live-status node.
2. The spec-local lending module fixture supplies one authorized `LOAN-DEMO-221` row using an existing synthetic item so the route-local search exercises loaded rows.
3. The sign-in test scopes its password field to the sign-in form and stable `input[name="p"]` FormData contract, excluding reset fields.

CLASSIFICATION: TEST_HARNESS_AND_FIXTURE_ONLY; PRODUCT_DOM_ENDPOINT_PAYLOAD_CAPABILITY_AUTHORIZATION_SCHEMA_PROVIDER_CHANGE=NONE.

## Preservation and external-state continuity

- Capture status: VERIFIED; SHA-256 `118FD12617B64463F052DAC32FD749E49FB7F4618DD2EECD72F3ABEC8277D84E`.
- Restore proof SHA-256: `C5862AE00F84A0DE49AF9C02A3E61EDC20272150ED53531FC3219B88D3A56473`.
- Manifest root SHA-256: `074FEB5B78477731C5C91EBDCD4704E108FFB0EA9D9EB2284CF4C8D19887F21D`.
- Primary/secondary/Design-DNA preservation remains 46/38/3; private refs, Git locks, and Git processes remain 0.
- Provider and live source state are unchanged. The retained temporary local runner tooling does not alter tracked state.

## Deferrals and next gate

B remains evidence-required. D, E, and F remain deferred. This packet authorizes no S09 implementation, product edit, or external action.

NEXT_ACTION_SCOPE: V81_S08_GOVERNANCE_COMMIT_PUSH_THEN_S09

NEXT_EXACT_ACTION: Commit and normally push only the accepted V81-S08 five-path evidence packet, verify local/upstream/remote parity and preserved46, then enter V81-S09 privacy/accessibility/invariant review; no provider, Playground, Production, migration, merge, deploy, or recovery-pointer action.
