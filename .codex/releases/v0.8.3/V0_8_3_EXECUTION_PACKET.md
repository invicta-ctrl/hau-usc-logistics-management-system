# V0.8.3 Execution Packet — A7-R2 Controlled Completion

## Authority and active state

- **Controlling amendment:** .codex/specs/active/v0.8.3-v1r7-a7-r2-final-acceleration-s17-closure-amendment.md
- **Adoption authority:** Earl's explicit current instruction, adopted 2026-08-20T23:33:37+08:00.
- **Accepted product specification:** .codex/specs/active/v0.8.3-identity-intake-a5-accepted.md.
- **Canonical writer / lock:** TERRA_MAX:/root/v83_completion_terra_writer; HELD and ACTIVE.
- **Integrated ID-G canonical baseline:** release/v0.8.3-identity-foundation at merge 45bbc1caf661d64a1abfdf1f775878ec89d88853, tree 4baebecc466b258d1b3729cff376bfafb2640ef6, pushed clean and live-equal before this continuity update.
- **Integrated ID-H canonical baseline:** release/v0.8.3-identity-foundation at fast-forward fb93da76cbf71ec0419036d86c0b780b18bfeff4, tree 0947c934bd40a9bb8d4fe8bbae99e09e13f235df; exact nine accepted paths, clean and live-equal before this continuity update.
- **Policy-sync boundary:** Context Vault project-extension target remains sync_allowed=false with BLOCKED_ACTIVE_WRITER_AND_DIRTY_WORK. Do not synchronize AGENTS.md or project policy during this release.

A7-R2 supersedes the first A7 draft for v0.8.3 execution. It does not reduce accepted product scope, waive safety or external gates, or authorize v0.8.4 in this session.

## Explicit owner mapping and product disposition

| ID   | A7-R2 capability                                                                                                                                                                                                | Current disposition |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| ID-A | Auth/session/security preservation                                                                                                                                                                              | VERIFIED_NO_OP      |
| ID-B | Canonical person and assignment domain                                                                                                                                                                          | PASS                |
| ID-C | Email/provenance and explicit account linkage                                                                                                                                                                   | PASS                |
| ID-D | Existing active-access preservation                                                                                                                                                                             | PASS                |
| ID-E | Two-stage approval                                                                                                                                                                                              | VERIFIED_NO_OP      |
| ID-F | Staff Directory                                                                                                                                                                                                 | PASS                |
| ID-G | Staff/account operational activity history                                                                                                                                                                      | PASS                |
| ID-H | Secure eight-digit verification lifecycle: secure generation, leading-zero preservation, expiry, single use, resend invalidation, attempt controls, rate-limit/backoff, and existing email delivery integration | PASS                |

Password visibility and password-browser evidence are both PASS.

ID-D is reconciled to the unchanged active-access and no-inferred-privilege evidence. The former ID_D=0 live source-projection bookkeeping is historical only. The unchanged candidate-bound live check is SOURCE_RECONCILIATION_PLAYGROUND_GATE=PENDING; it is not ID-D and no tested code or API is renamed.

## ID-G accepted integration evidence

The isolated Activity History branch remains preserved. Its accepted repair/current commit is c13bbdadf7fa46829a3a78dece66f08bfe111013, tree 9fd68d4e8c4b4d19e9e23793834365d35467b499; the normal history-preserving merge is 45bbc1caf661d64a1abfdf1f775878ec89d88853, tree 4baebecc466b258d1b3729cff376bfafb2640ef6.

- **Implementation commit:** 2aa73aeaf965d4eb55449e87c3cbda675730ba97.
- **Prior Luna disposition:** ACCEPT_WITH_REQUIRED_REPAIRS.
- **Required repair:** complete.
- **Repair paths:** src/v5/integration/runtime.js; tests/e2e/v5-current-application.spec.js; tests/unit/access-management-repository.test.js.
- **Repair focus:** real Miniflare/D1 execution of actual producer statements and the V5 navigation-away/reload race.
- **Focused Luna repair re-review:** ACCEPT; P0=0; P1=0; P2=0.
- **Focused evidence:** portable Node 22.23.2; real Miniflare producer/safety test PASS; access-management repository 14/14 PASS; related unit coverage 55/55 PASS; V5 Staff Directory 5/5 PASS; local Worker DTO/400 1/1 PASS; Node syntax, scoped ESLint, exact Prettier, privacy/scope, and diff checks PASS.
- **Scope and blob proof:** exact 26 Section 6 product/migration/test paths, no unexpected paths; those 26 blobs were byte-identical to c13bbdadf7fa46829a3a78dece66f08bfe111013. The seven A7 adoption-record blobs were byte-identical to 0d784ba348a82101b7c7e6a794b7a35f0ab82452 at merge time.
- **Integration result:** normal non-force merge, task-branch push, and canonical fast-forward all PASS. Merge parents are c13bbdadf7fa46829a3a78dece66f08bfe111013 and 0d784ba348a82101b7c7e6a794b7a35f0ab82452.

No Activity History plan rewrite or routine plan-audit loop is authorized. The accepted product blobs did not change after their focused Node 22.23.2 verification, so that evidence is reused rather than rerun for the history-preserving integration.

## ID-H accepted integration evidence

- **Implementation/integration:** accepted isolated branch `release/v0.8.3-eight-digit-verification` at fb93da76cbf71ec0419036d86c0b780b18bfeff4, tree 0947c934bd40a9bb8d4fe8bbae99e09e13f235df; normal canonical fast-forward and push PASS.
- **Authorized scope and blob proof:** exact nine account-application source/test paths, no unexpected paths; every accepted task blob matched before canonical integration.
- **Focused evidence:** portable Node 22.23.2; unit/SQLite-D1/provider/resend/Worker/V5 80/80 PASS; legacy eight-digit browser 1/1 PASS; V5 browser 29 PASS with 7 intentional skips; syntax, scoped ESLint, exact Prettier, privacy/scope, and diff checks PASS.
- **Independent review:** Luna ACCEPT; P0=0; P1=0; P2=0.
- **P3 advisory:** nonblocking and unrepaired; `tests/e2e/v072-account-access.spec.js` hard-codes committed-harness port 4173. It is not expanded in this release slice.
- **Live boundary:** `ID_H_PLAYGROUND_DELIVERY_GATE=PENDING`; provider/private mutations are 0. This is distinct from the provider-free implementation PASS.

## Migration and external sequence

- **0031:** REQUIRED_IF_TARGET_SCHEMA_REMAINS_30.
- **0032:** source present and REQUIRED because accepted ID-G includes it.
- **Target schema:** 32; required order is 0031 then 0032 when the target begins at schema 30.
- **Order:** 0031 then 0032.
- **Provider application:** PENDING and stage-gated; none occurred in this integration slice.
- **No fabricated backfill:** required for both migrations.
- **ID-G provider boundary:** local synthetic SQLite/D1/Miniflare proof only until the later release stage.

Safe read-only rehydration captured only allowlisted public identity facts:

| Environment         | Version            | Candidate                                | Schema / latest migration                      | Ready |
| ------------------- | ------------------ | ---------------------------------------- | ---------------------------------------------- | ----- |
| Production          | 0.8.2              | c316e047c845fa182e82156c95945c4a5e5de2ff | 30 / 0030_production_access_and_operations.sql | true  |
| Isolated Playground | 0.8.2-playground.1 | fc66911209375596e7af418a5e54e9380fb7685a | 30 / 0030_production_access_and_operations.sql | true  |

No endpoint URL, credential, provider identifier, recipient, database value, or private configuration value is recorded. The Playground is not a frozen v0.8.3 candidate. SOURCE_RECONCILIATION_PLAYGROUND_GATE and ID_H_PLAYGROUND_DELIVERY_GATE are PENDING; the A7-R2 pre-freeze release gate/candidate-freeze step is next and no freeze was executed in this continuity slice.

## Exact next gate

V83_ID_H_PROVIDER_FREE_FINAL_RELEASE_GATE_CANDIDATE_FREEZE: run A7-R2 Section 16 provider-free final release-gate verification, then only on an all-green result freeze the exact v0.8.3 candidate under Section 17. SOURCE_RECONCILIATION_PLAYGROUND_GATE and ID_H_PLAYGROUND_DELIVERY_GATE remain post-freeze Playground gates.

Do not request a routine owner pause until the later Playground manual-test and explicit Production-GO gate. Do not perform provider/private access, shared/provider database migration, candidate freeze, Playground or Production change, deployment, or v0.8.4 work in this step.
