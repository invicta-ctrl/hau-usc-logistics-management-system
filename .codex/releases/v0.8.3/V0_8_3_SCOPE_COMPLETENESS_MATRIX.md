# V0.8.3 Scope Completeness Matrix — A7-R2 Reconciled

## Controlling authority

V1R7-A7-R2 is the controlling v0.8.3 execution amendment, adopted under Earl's explicit current instruction at 2026-08-20T23:33:37+08:00. The accepted product specification remains .codex/specs/active/v0.8.3-identity-intake-a5-accepted.md. The canonical writer is TERRA_MAX:/root/v83_completion_terra_writer and the writer lock remains HELD. FAST_CLOSE=ACTIVE.

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
- **Provider boundary:** migration 0032 is PASS through one root-authorized atomic isolated Playground file import with exit 0 and no retry; private recovery evidence is captured, provider email delivery remains 0, and Production mutation remains 0.

## ID-H integrated evidence

- **Implementation/canonical integration:** fb93da76cbf71ec0419036d86c0b780b18bfeff4, tree 0947c934bd40a9bb8d4fe8bbae99e09e13f235df; exact nine accepted paths, isolated branch preserved, canonical fast-forward and push PASS.
- **Focused evidence:** portable Node 22.23.2; unit/SQLite-D1/provider/resend/Worker/V5 80/80 PASS; legacy eight-digit browser 1/1 PASS; V5 browser 29 PASS with 7 intentional skips; syntax/ESLint/Prettier/privacy/scope/diff PASS.
- **Independent review:** Luna ACCEPT; P0=0; P1=0; P2=0. P3 is a nonblocking, unrepaired committed-harness port-4173 advisory in `tests/e2e/v072-account-access.spec.js`.
- **Live separation:** `ID_H_IMPLEMENTATION=PASS`; `ID_H_PLAYGROUND_DELIVERY_GATE=PENDING`; exact frozen pre-migration Playground deployment is PASS, while provider email delivery remains 0.

## Release-gate disposition

| Gate                                      | Status                                                                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| MIGRATION_0031_DECISION                   | FIRST_HISTORICAL_APPLY_RESTORED_BY_SECOND_OWNER_RESET;SECOND_REAPPLY_PASS_AND_TERMINALLY_RECONCILED                                              |
| MIGRATION_0032_DECISION                   | SOURCE_PRESENT_AND_REQUIRED_BECAUSE_ACCEPTED_ID_G_INCLUDES_0032;ONE_ATOMIC_FILE_IMPORT_PASS_NO_RETRY                                             |
| Schema target                             | 32; required migration order is 0031 then 0032 when target begins at schema 30                                                                   |
| Owner-authorized Playground reset         | PASS twice: second reset restored clean working D1/R2 schema30/0030 with fresh private recovery receipts; Production unchanged                   |
| Migration application                     | PASS: second-reset 0031 reapply then one atomic 0032 import; CLEAN schema32/single ledger0032/FKs/Activity History invariants/recovery/runtime   |
| Candidate freeze                          | PASS: f8e63372bc8afcb6d092970b7f9fc9ee72fd3580 / tree 5788251d483f23ec5e19048e1a946b3a00450436                                                   |
| Pre-migration Playground deployment       | PASS: workflow dispatched once; exact f8/tree/artifact/runtime/binding proof; reset-reconciled schema30/0030 checkpoint                          |
| Schema32 automated acceptance             | PASS_WITH_P3_ADVISORY: exact f8/runtime/schema32/readiness/public routes/unauth deny; image-suffix HTML fallback retained for later visual check |
| SOURCE_RECONCILIATION_PLAYGROUND_GATE     | COMPLETED_NONPASS: invoked once/no retry; aggregate safeFlags=false, exact subtype redacted and unretained; not ID-D                             |
| ID_H_PLAYGROUND_DELIVERY_GATE             | PENDING; candidate-bound                                                                                                                         |
| Playground manual/browser acceptance      | PENDING                                                                                                                                          |
| Earl Production GO                        | PENDING                                                                                                                                          |
| Production release / reconciliation / S17 | REMAINING                                                                                                                                        |

Safe read-only and post-deploy facts: Production remains v0.8.2 at c316e047c845fa182e82156c95945c4a5e5de2ff, schema 30, latest migration 0030_production_access_and_operations.sql, ready. The last terminal pre-source Playground reconciliation was frozen f8/tree at schema 32 / migration 0032, ready and binding-isolated. One isolated probe-binding deployment then preserved exact f8/tree/artifact, isolated D1/R2, provider-disabled state, and Production zero. The subsequent source probe is NONPASS, so no post-probe state reconciliation is claimed. Redacted Time Travel recovery, Worker rollback history, R2/config identity, provider secret/config name presence, and candidate artifact proof all PASS. Safe endpoints expose candidate identity but not tree; unchanged typed binding evidence remains the tree/artifact proof. No private endpoint, credential, provider identifier, recipient, database value, or recovery value was recorded.

## Historical evidence, not active instructions

The seventh Activity History plan-audit rejection, the eighth recovery-wording P2, and the ninth plan-audit PASS are retained historical evidence only. They do not reopen the accepted plan. The accepted P3 no-live-Worker-403 residual remains accepted where already recorded.

The old ID_D=0 label and the earlier blocked live source probe are historical. Under A7-R2, ID-D is PASS; the current live-source status is SOURCE_RECONCILIATION_PLAYGROUND_GATE=COMPLETED_NONPASS after candidate freeze and isolated Playground deployment.

The only current P3 is the nonblocking, unrepaired committed-harness port-4173 advisory in `tests/e2e/v072-account-access.spec.js`; it does not alter the accepted ID-H implementation PASS or authorize a scope expansion.

## Historical former next action

V83_ISOLATED_PLAYGROUND_SCHEMA32_AUTOMATED_ACCEPTANCE was completed PASS_WITH_P3_ADVISORY before the current material state stop.

## Active source-reconciliation nonpass checkpoint

The schema32 automated acceptance is complete. Earl authorized the retained DIRTY active session as `OWNER_AUTHORIZED_PLAYGROUND_SESSION`; one isolated probe-binding deployment and two authorized session bootstraps then occurred with no reset or revoke. The candidate-bound source probe was invoked once and returned `COMPLETED_NONPASS`; the private receipt retains aggregate `safeFlags=false`, but not raw response material, safe HTTP/status/component/quarantine classification, or local response-shape-validator failure. Schema32/single ledger0032/FKs/exact Activity History objects/new rows were green before source invocation; post-NONPASS reconciliation is not claimed. Provider/email, browser/manual, and Production remain unperformed.

Next action: stop for Earl direction. Do not retry the source probe or call an external endpoint; do not activate provider/email, run browser/manual acceptance, or access Production. No v0.8.4 work starts in this session.
