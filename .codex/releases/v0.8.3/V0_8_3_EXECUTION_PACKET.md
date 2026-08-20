# V0.8.3 Execution Packet — A7-R2 Controlled Completion

## Authority and active state

- **Controlling amendment:** .codex/specs/active/v0.8.3-v1r7-a7-r2-final-acceleration-s17-closure-amendment.md
- **Adoption authority:** Earl's explicit current instruction, adopted 2026-08-20T23:33:37+08:00.
- **Accepted product specification:** .codex/specs/active/v0.8.3-identity-intake-a5-accepted.md.
- **Canonical writer / lock:** TERRA_MAX:/root/v83_completion_terra_writer; HELD and ACTIVE.
- **Canonical baseline at rehydration:** release/v0.8.3-identity-foundation, f3c28ba257e80fabb532979969ddd27cab0959db, tree f81d8ece7d44ff62d66656ac4da0c34265be835b, clean and upstream/live 0/0.
- **Policy-sync boundary:** Context Vault project-extension target remains sync_allowed=false with BLOCKED_ACTIVE_WRITER_AND_DIRTY_WORK. Do not synchronize AGENTS.md or project policy during this release.

A7-R2 supersedes the first A7 draft for v0.8.3 execution. It does not reduce accepted product scope, waive safety or external gates, or authorize v0.8.4 in this session.

## Explicit owner mapping and product disposition

| ID   | A7-R2 capability                                                                                                                                                                                                | Current disposition                                     |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| ID-A | Auth/session/security preservation                                                                                                                                                                              | VERIFIED_NO_OP                                          |
| ID-B | Canonical person and assignment domain                                                                                                                                                                          | PASS                                                    |
| ID-C | Email/provenance and explicit account linkage                                                                                                                                                                   | PASS                                                    |
| ID-D | Existing active-access preservation                                                                                                                                                                             | PASS                                                    |
| ID-E | Two-stage approval                                                                                                                                                                                              | VERIFIED_NO_OP                                          |
| ID-F | Staff Directory                                                                                                                                                                                                 | PASS                                                    |
| ID-G | Staff/account operational activity history                                                                                                                                                                      | ACTIVE / REMAINING until verified canonical integration |
| ID-H | Secure eight-digit verification lifecycle: secure generation, leading-zero preservation, expiry, single use, resend invalidation, attempt controls, rate-limit/backoff, and existing email delivery integration | REMAINING                                               |

Password visibility and password-browser evidence are both PASS.

ID-D is reconciled to the unchanged active-access and no-inferred-privilege evidence. The former ID_D=0 live source-projection bookkeeping is historical only. The unchanged candidate-bound live check is SOURCE_RECONCILIATION_PLAYGROUND_GATE=PENDING; it is not ID-D and no tested code or API is renamed.

## ID-G adopted implementation and single permitted re-review

The isolated Activity History branch is release/v0.8.3-staff-account-activity-history at c13bbdadf7fa46829a3a78dece66f08bfe111013, tree 9fd68d4e8c4b4d19e9e23793834365d35467b499, clean and upstream/live 0/0. It is the preserved 26-path Section 6 implementation from canonical base f3c28ba257e80fabb532979969ddd27cab0959db.

- **Implementation commit:** 2aa73aeaf965d4eb55449e87c3cbda675730ba97.
- **Prior Luna disposition:** ACCEPT_WITH_REQUIRED_REPAIRS.
- **Required repair:** complete.
- **Repair paths:** src/v5/integration/runtime.js; tests/e2e/v5-current-application.spec.js; tests/unit/access-management-repository.test.js.
- **Repair focus:** real Miniflare/D1 execution of actual producer statements and the V5 navigation-away/reload race.
- **Focused evidence:** portable Node 22.23.2; real Miniflare producer/safety test PASS; access-management repository 14/14 PASS; related unit coverage 55/55 PASS; V5 Staff Directory 5/5 PASS; local Worker DTO/400 1/1 PASS; Node syntax, scoped ESLint, exact Prettier, privacy/scope, and diff checks PASS.
- **Integration gate:** canonical integration is forbidden until one focused Luna re-review accepts this invalidated repair evidence.

No Activity History plan rewrite or routine plan-audit loop is authorized. The focused re-review is allowed only because the prior implementation review named a P1 requiring it.

## Migration and external sequence

- **0031:** REQUIRED_IF_TARGET_SCHEMA_REMAINS_30.
- **0032:** REQUIRED because accepted ID-G includes it.
- **Order:** 0031 then 0032.
- **Provider execution:** stage-gated; none occurred in this documentation/adoption slice.
- **No fabricated backfill:** required for both migrations.
- **ID-G provider boundary:** local synthetic SQLite/D1/Miniflare proof only until the later release stage.

Safe read-only rehydration captured only allowlisted public identity facts:

| Environment         | Version            | Candidate                                | Schema / latest migration                      | Ready |
| ------------------- | ------------------ | ---------------------------------------- | ---------------------------------------------- | ----- |
| Production          | 0.8.2              | c316e047c845fa182e82156c95945c4a5e5de2ff | 30 / 0030_production_access_and_operations.sql | true  |
| Isolated Playground | 0.8.2-playground.1 | fc66911209375596e7af418a5e54e9380fb7685a | 30 / 0030_production_access_and_operations.sql | true  |

No endpoint URL, credential, provider identifier, recipient, database value, or private configuration value is recorded. The Playground is not a frozen v0.8.3 candidate and all candidate-bound external gates remain PENDING.

## Exact next gate

Run ONE focused Luna re-review of the invalidated three-path ID-G repair, including P1 real-Miniflare producer execution evidence and the V5 navigation race, then stop for the audit disposition before canonical integration.

Do not request a routine owner pause until the later Playground manual-test and explicit Production-GO gate. Do not perform provider/private access, shared/provider database migration, candidate freeze, Playground or Production change, deployment, or v0.8.4 work in this step.
