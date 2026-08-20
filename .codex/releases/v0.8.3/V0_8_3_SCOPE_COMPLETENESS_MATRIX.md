# V0.8.3 Scope Completeness Matrix — A7-R2 Reconciled

## Controlling authority

V1R7-A7-R2 is the controlling v0.8.3 execution amendment, adopted under Earl's explicit current instruction at 2026-08-20T23:33:37+08:00. The accepted product specification remains .codex/specs/active/v0.8.3-identity-intake-a5-accepted.md. The canonical writer is TERRA_MAX:/root/v83_completion_terra_writer and the writer lock remains HELD.

## Product matrix

| ID                        | Capability                                                                      | Status                   | Evidence / next bounded gate                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| ID-A                      | Auth/session/security preservation                                              | VERIFIED_NO_OP           | Fresh evidence reused; no new implementation authorized.                                                                        |
| ID-B                      | Canonical person and assignment domain                                          | PASS                     | Additive canonical identity foundation remains accepted.                                                                        |
| ID-C                      | Email/provenance and explicit account linkage                                   | PASS                     | Provider-free implementation and protected count-only reconciliation contract remain accepted.                                  |
| ID-D                      | Existing active-access preservation                                             | PASS                     | Unchanged active-access and no-inferred-privilege evidence. The former ID_D=0 live-probe bookkeeping is historical only.        |
| ID-E                      | Two-stage approval                                                              | VERIFIED_NO_OP           | Existing distinct-reviewer, fail-closed contract remains preserved.                                                             |
| ID-F                      | Staff Directory                                                                 | PASS                     | ACCESS_ADMIN read-only canonical projection remains accepted; the existing no-live-Worker-403 P3 is accepted residual evidence. |
| ID-G                      | Staff/account operational activity history                                      | PASS                     | Canonically integrated at 45bbc1caf661d64a1abfdf1f775878ec89d88853 after focused Luna ACCEPT P0=0/P1=0/P2=0.                    |
| ID-H                      | Secure eight-digit verification lifecycle, including existing email integration | IMPLEMENTATION REMAINING | First classify every criterion, then make one evidence-bounded provider-free implementation slice.                              |
| Password visibility       | Applicable password surfaces                                                    | PASS                     | Existing browser evidence accepted.                                                                                             |
| Password browser evidence | Browser proof for password surfaces                                             | PASS                     | Existing browser evidence accepted.                                                                                             |

## ID-G integrated evidence

- **Canonical rehydration base:** f3c28ba257e80fabb532979969ddd27cab0959db, tree f81d8ece7d44ff62d66656ac4da0c34265be835b.
- **Implementation:** 2aa73aeaf965d4eb55449e87c3cbda675730ba97; repaired/current c13bbdadf7fa46829a3a78dece66f08bfe111013, tree 9fd68d4e8c4b4d19e9e23793834365d35467b499.
- **Integration:** normal merge 45bbc1caf661d64a1abfdf1f775878ec89d88853, tree 4baebecc466b258d1b3729cff376bfafb2640ef6; canonical fast-forward and normal push PASS.
- **Authorized scope:** exact 26 Section 6 product/migration/test paths; outside authorized paths 0. Product-26 blobs were byte-identical to c13bbdadf7fa46829a3a78dece66f08bfe111013; A7 adoption-7 blobs were byte-identical to 0d784ba348a82101b7c7e6a794b7a35f0ab82452 at merge time.
- **Independent review:** prior ACCEPT_WITH_REQUIRED_REPAIRS; required three-path repair complete; focused Luna repair re-review ACCEPT with P0=0, P1=0, P2=0.
- **Focused evidence:** portable Node 22.23.2; real Miniflare producer/safety execution PASS; access-management repository 14/14; related units 55/55; V5 Staff Directory 5/5; local Worker DTO/400 1/1; Node syntax, ESLint, Prettier, privacy/scope, and diff PASS.
- **Provider boundary:** migration 0032 source is present and required, but provider application remains pending and stage-gated; provider/private mutations are 0.

## Release-gate disposition

| Gate                                      | Status                                                                           |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| MIGRATION_0031_DECISION                   | REQUIRED_IF_TARGET_SCHEMA_REMAINS_30                                             |
| MIGRATION_0032_DECISION                   | SOURCE_PRESENT_AND_REQUIRED_BECAUSE_ACCEPTED_ID_G_INCLUDES_0032                  |
| Migration application                     | STAGE_GATED; provider application PENDING; no shared/provider database execution |
| Candidate freeze                          | NOT_AUTHORIZED; ID-H_IMPLEMENTATION is remaining                                 |
| SOURCE_RECONCILIATION_PLAYGROUND_GATE     | PENDING; candidate-bound and read-only, not ID-D                                 |
| ID_H_PLAYGROUND_DELIVERY_GATE             | PENDING; candidate-bound                                                         |
| Playground manual/browser acceptance      | PENDING                                                                          |
| Earl Production GO                        | PENDING                                                                          |
| Production release / reconciliation / S17 | REMAINING                                                                        |

Safe read-only current environment facts: Production is v0.8.2 at c316e047c845fa182e82156c95945c4a5e5de2ff, schema 30, latest migration 0030_production_access_and_operations.sql, ready; isolated Playground is v0.8.2-playground.1 at fc66911209375596e7af418a5e54e9380fb7685a, schema 30, same latest migration, ready. No private endpoint, credential, provider, recipient, or database value was recorded.

## Historical evidence, not active instructions

The seventh Activity History plan-audit rejection, the eighth recovery-wording P2, and the ninth plan-audit PASS are retained historical evidence only. They do not reopen the accepted plan. The accepted P3 no-live-Worker-403 residual remains accepted where already recorded.

The old ID_D=0 label and blocked live source probe are historical. Under A7-R2, ID-D is PASS; the only current live-source status is SOURCE_RECONCILIATION_PLAYGROUND_GATE=PENDING after candidate freeze and isolated Playground deployment.

## Next bounded action

V83_ID_H_PROVIDER_FREE_CLASSIFICATION_AND_IMPLEMENTATION: first read-only classify every A7-R2 ID-H criterion as PASS_EXISTING, REPAIR_REQUIRED, or PLAYGROUND_LIVE_PROOF_REQUIRED, then implement one bounded provider-free ID-H slice; stop before candidate freeze or any provider/private, Playground, or Production action.

No routine owner pause occurs before the later Playground manual-test and explicit Production-GO gate. No v0.8.4 work starts in this session.
