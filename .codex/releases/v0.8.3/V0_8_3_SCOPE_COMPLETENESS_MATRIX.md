# V0.8.3 Scope Completeness Matrix — A7-R2 Reconciled

## Controlling authority

V1R7-A7-R2 is the controlling v0.8.3 execution amendment, adopted under Earl's explicit current instruction at 2026-08-20T23:33:37+08:00. The accepted product specification remains .codex/specs/active/v0.8.3-identity-intake-a5-accepted.md. The canonical writer is TERRA_MAX:/root/v83_completion_terra_writer and the writer lock remains HELD.

## Product matrix

| ID                        | Capability                                                                      | Status         | Evidence / next bounded gate                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID-A                      | Auth/session/security preservation                                              | VERIFIED_NO_OP | Fresh evidence reused; no new implementation authorized.                                                                                         |
| ID-B                      | Canonical person and assignment domain                                          | PASS           | Additive canonical identity foundation remains accepted.                                                                                         |
| ID-C                      | Email/provenance and explicit account linkage                                   | PASS           | Provider-free implementation and protected count-only reconciliation contract remain accepted.                                                   |
| ID-D                      | Existing active-access preservation                                             | PASS           | Unchanged active-access and no-inferred-privilege evidence. The former ID_D=0 live-probe bookkeeping is historical only.                         |
| ID-E                      | Two-stage approval                                                              | VERIFIED_NO_OP | Existing distinct-reviewer, fail-closed contract remains preserved.                                                                              |
| ID-F                      | Staff Directory                                                                 | PASS           | ACCESS_ADMIN read-only canonical projection remains accepted; the existing no-live-Worker-403 P3 is accepted residual evidence.                  |
| ID-G                      | Staff/account operational activity history                                      | PASS           | Canonically integrated at 45bbc1caf661d64a1abfdf1f775878ec89d88853 after focused Luna ACCEPT P0=0/P1=0/P2=0.                                     |
| ID-H                      | Secure eight-digit verification lifecycle, including existing email integration | PASS           | Provider-free implementation canonically integrated at fb93da76cbf71ec0419036d86c0b780b18bfeff4; live Playground delivery proof remains pending. |
| Password visibility       | Applicable password surfaces                                                    | PASS           | Existing browser evidence accepted.                                                                                                              |
| Password browser evidence | Browser proof for password surfaces                                             | PASS           | Existing browser evidence accepted.                                                                                                              |

## ID-G integrated evidence

- **Canonical rehydration base:** f3c28ba257e80fabb532979969ddd27cab0959db, tree f81d8ece7d44ff62d66656ac4da0c34265be835b.
- **Implementation:** 2aa73aeaf965d4eb55449e87c3cbda675730ba97; repaired/current c13bbdadf7fa46829a3a78dece66f08bfe111013, tree 9fd68d4e8c4b4d19e9e23793834365d35467b499.
- **Integration:** normal merge 45bbc1caf661d64a1abfdf1f775878ec89d88853, tree 4baebecc466b258d1b3729cff376bfafb2640ef6; canonical fast-forward and normal push PASS.
- **Authorized scope:** exact 26 Section 6 product/migration/test paths; outside authorized paths 0. Product-26 blobs were byte-identical to c13bbdadf7fa46829a3a78dece66f08bfe111013; A7 adoption-7 blobs were byte-identical to 0d784ba348a82101b7c7e6a794b7a35f0ab82452 at merge time.
- **Independent review:** prior ACCEPT_WITH_REQUIRED_REPAIRS; required three-path repair complete; focused Luna repair re-review ACCEPT with P0=0, P1=0, P2=0.
- **Focused evidence:** portable Node 22.23.2; real Miniflare producer/safety execution PASS; access-management repository 14/14; related units 55/55; V5 Staff Directory 5/5; local Worker DTO/400 1/1; Node syntax, ESLint, Prettier, privacy/scope, and diff PASS.
- **Provider boundary:** migration 0032 source is present and required, but provider application remains pending and stage-gated; provider/private mutations are 0.

## ID-H integrated evidence

- **Implementation/canonical integration:** fb93da76cbf71ec0419036d86c0b780b18bfeff4, tree 0947c934bd40a9bb8d4fe8bbae99e09e13f235df; exact nine accepted paths, isolated branch preserved, canonical fast-forward and push PASS.
- **Focused evidence:** portable Node 22.23.2; unit/SQLite-D1/provider/resend/Worker/V5 80/80 PASS; legacy eight-digit browser 1/1 PASS; V5 browser 29 PASS with 7 intentional skips; syntax/ESLint/Prettier/privacy/scope/diff PASS.
- **Independent review:** Luna ACCEPT; P0=0; P1=0; P2=0. P3 is a nonblocking, unrepaired committed-harness port-4173 advisory in `tests/e2e/v072-account-access.spec.js`.
- **Live separation:** `ID_H_IMPLEMENTATION=PASS`; `ID_H_PLAYGROUND_DELIVERY_GATE=PENDING`; exact frozen pre-migration Playground deployment is PASS, while provider email delivery remains 0.

## Release-gate disposition

| Gate                                      | Status                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIGRATION_0031_DECISION                   | FIRST_HISTORICAL_APPLY_RESTORED_BY_SECOND_OWNER_RESET;SECOND_REAPPLY_PASS_AND_TERMINALLY_RECONCILED                                               |
| MIGRATION_0032_DECISION                   | SOURCE_PRESENT_AND_REQUIRED_BECAUSE_ACCEPTED_ID_G_INCLUDES_0032                                                                                   |
| Schema target                             | 32; required migration order is 0031 then 0032 when target begins at schema 30                                                                    |
| Owner-authorized Playground reset         | PASS twice: second reset restored clean working D1/R2 schema30/0030 with fresh private recovery receipts; Production unchanged                    |
| Migration application                     | Second-reset 0031 reapply PASS: CLEAN schema31/ledger0031/FKs/11 canonical-identity invariants/recovery/runtime; one atomic 0032 is strictly next |
| Candidate freeze                          | PASS: f8e63372bc8afcb6d092970b7f9fc9ee72fd3580 / tree 5788251d483f23ec5e19048e1a946b3a00450436                                                    |
| Pre-migration Playground deployment       | PASS: workflow dispatched once; exact f8/tree/artifact/runtime/binding proof; reset-reconciled schema30/0030 checkpoint                           |
| SOURCE_RECONCILIATION_PLAYGROUND_GATE     | PENDING; candidate-bound and read-only, not ID-D                                                                                                  |
| ID_H_PLAYGROUND_DELIVERY_GATE             | PENDING; candidate-bound                                                                                                                          |
| Playground manual/browser acceptance      | PENDING                                                                                                                                           |
| Earl Production GO                        | PENDING                                                                                                                                           |
| Production release / reconciliation / S17 | REMAINING                                                                                                                                         |

Safe read-only and post-deploy facts: Production remains v0.8.2 at c316e047c845fa182e82156c95945c4a5e5de2ff, schema 30, latest migration 0030_production_access_and_operations.sql, ready; isolated Playground is v0.8.3-playground.1 at frozen f8e63372bc8afcb6d092970b7f9fc9ee72fd3580, tree 5788251d483f23ec5e19048e1a946b3a00450436, CLEAN at schema 31 / migration 0031_canonical_identity_foundation.sql, ready, and binding-isolated. Redacted Time Travel recovery, Worker rollback history, R2/config identity, provider secret/config name presence, and candidate artifact proof all PASS. Safe endpoints expose candidate identity but not tree; unchanged typed binding evidence remains the tree/artifact proof. No private endpoint, credential, provider identifier, recipient, database value, or recovery value was recorded.

## Historical evidence, not active instructions

The seventh Activity History plan-audit rejection, the eighth recovery-wording P2, and the ninth plan-audit PASS are retained historical evidence only. They do not reopen the accepted plan. The accepted P3 no-live-Worker-403 residual remains accepted where already recorded.

The old ID_D=0 label and blocked live source probe are historical. Under A7-R2, ID-D is PASS; the only current live-source status is SOURCE_RECONCILIATION_PLAYGROUND_GATE=PENDING after candidate freeze and isolated Playground deployment.

The only current P3 is the nonblocking, unrepaired committed-harness port-4173 advisory in `tests/e2e/v072-account-access.spec.js`; it does not alter the accepted ID-H implementation PASS or authorize a scope expansion.

## Next bounded action

V83_ISOLATED_PLAYGROUND_MIGRATION_0032_ATOMIC_FILE_IMPORT_AND_RECONCILIATION: from the isolated Playground schema31/0031 CLEAN state, validate the root-authorized private atomic 0032 wrapper locally and, only from fresh CLEAN schema31/0031, use its one remote file import; prove ledger, schema, foreign keys, activity-history DDL/triggers, append-only invariants, and Production non-crossover before final automated acceptance. Source reconciliation and live email delivery remain later candidate-bound Playground gates.

No routine owner pause occurs before the later Playground manual-test and explicit Production-GO gate. No v0.8.4 work starts in this session.
