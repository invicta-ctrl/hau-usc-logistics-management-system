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
- **Live boundary:** `ID_H_PLAYGROUND_DELIVERY_GATE=PENDING`; provider email delivery is 0. This is distinct from the provider-free implementation PASS and from the exact frozen pre-migration Playground deployment recorded below.

## Migration and external sequence

- **0031:** APPLIED_ONCE_HISTORICALLY; its state was restored by the second owner-authorized Playground reset, so one reapply is now pending.
- **0032:** source present and REQUIRED because accepted ID-G includes it.
- **Target schema:** 32; required order is 0031 then 0032 when the target begins at schema 30.
- **Order:** 0031 then 0032.
- **Provider application:** isolated Playground-only and stage-gated; no email delivery occurred in the freeze/deployment stage.
- **No fabricated backfill:** required for both migrations.
- **ID-G provider boundary:** local synthetic SQLite/D1/Miniflare proof only until the later release stage.

## Frozen candidate and pre-migration deployment receipt

- **Frozen candidate:** `f8e63372bc8afcb6d092970b7f9fc9ee72fd3580`, tree `5788251d483f23ec5e19048e1a946b3a00450436`, package version `0.8.3`.
- **Bound identities:** lockfile SHA-256 `28c8436fa65cefacb1b7d5ac0ad95ae136af10a765e928efb53c5b23f85967cd`; tracked application SHA-256 `f28d224c49df31ed1505dc2c367fe97c841ebed1a56b2c85fed064bfc6829481`; staging application SHA-256 `60dd9c63a99d347dfa4f7a4315639cc2fb9725578bf6e194e0d84cc8f5415a99`; Worker-source SHA-256 `5b37974f449b659e89ddb480a6fa09ea403c1329d303623932f38240738a44ca`.
- **Migration set:** `0031_canonical_identity_foundation.sql` SHA-256 `3de13ba44182f2db45b61378373549cab1e7e08c56df58cd6bd2b3f109b09444`, then `0032_staff_account_activity_history.sql` SHA-256 `16c0bf78f32729147b0fb8aa5e701ebe6b66b2f75db114f3ea6f968a4fad5abb`.
- **Pre-freeze:** A7-R2 Section 16 PASS, including redacted authenticated account scope, existing Production/Playground baseline identities, remote schema-30/0030 ledger with foreign keys, Time Travel recovery marker, Worker rollback history, isolated D1/R2 bindings, and provider secret/config name presence.
- **Workflow:** dispatched exactly once with f8 and the canonical release branch; exact-head package and pre-migration isolated Playground deploy both PASS. The run reference is intentionally redacted.
- **Post-deploy:** direct reconciliation proves the deployed STAGING Worker has f8/tree/artifact bindings, `PLAYGROUND_MODE=true`, readiness, schema `30`/migration `0030`, and bindings distinct from unchanged Production. One bounded follow-up proved Wrangler's deployment list is oldest-first and selected the latest record by timestamp; the earlier array-index observation was therefore a selection error, not candidate drift. The schema-30 workflow check is the accepted pre-migration compatibility checkpoint, not final A7-R2 Section 21 acceptance.
- **Recovery:** Playground D1 Time Travel bookmark is present; Worker rollback history and R2/config identity were verified without recording private resource identities. Production mutation is zero.

Safe read-only and post-deploy facts are limited to allowlisted public identity facts:

| Environment         | Version            | Candidate                                | Schema / latest migration                      | Ready |
| ------------------- | ------------------ | ---------------------------------------- | ---------------------------------------------- | ----- |
| Production          | 0.8.2              | c316e047c845fa182e82156c95945c4a5e5de2ff | 30 / 0030_production_access_and_operations.sql | true  |
| Isolated Playground | 0.8.3-playground.1 | f8e63372bc8afcb6d092970b7f9fc9ee72fd3580 | 30 / 0030_production_access_and_operations.sql | true  |

No endpoint URL, credential, provider identifier, recipient, database value, or private configuration value is recorded. The Playground remains the exact frozen v0.8.3 candidate after its second accepted reset; it is currently CLEAN at sealed schema30/0030 pending one 0031 reapply. SOURCE_RECONCILIATION_PLAYGROUND_GATE and ID_H_PLAYGROUND_DELIVERY_GATE remain PENDING.

## Owner-authorized Playground reset receipt

- **Authority:** Earl's exact `RESET PLAYGROUND` command.
- **Scope:** only isolated Playground working D1/R2 state; no Git source/artifact, baseline, Production resource, or recovery-pointer mutation.
- **Recovery:** a new private pre-reset D1 recovery receipt was captured before restoring the sealed clean Playground bookmark.
- **Terminal reconciliation:** working state `CLEAN`; schema `30` / migration `0030`; foreign keys PASS; reset probe absent; working R2 brand identity equals the sealed baseline; working evidence is empty; exact f8 runtime/bindings and Production non-crossover PASS.
- **Privacy:** the receipt, resource identities, bookmarks, hashes, URL, credentials, and values remain private and unrecorded in Git.

## Isolated Playground migration 0031 receipt

- **Scope:** applied exactly once to the isolated provider-disabled Playground D1 through an operator configuration containing only `0031_canonical_identity_foundation.sql`.
- **Recovery:** private pre- and post-migration Time Travel recovery receipts were captured; no recovery pointer was rotated.
- **Terminal reconciliation:** working state `CLEAN`; schema `31`; ledger `0031` with `0032` absent and no pending `0031`; foreign keys, canonical-identity STRICT tables, immutable identifier trigger, indexes, and FK declarations PASS; exact-f8 runtime/readiness PASS; Production mutation `0`.

## Second owner-authorized Playground reset receipt

- **Authority:** Earl's second exact `RESET PLAYGROUND` command after the bounded session-only DIRTY reconciliation.
- **Scope:** only isolated Playground working D1/R2 state; no Git source/artifact, baseline, Production resource, or recovery-pointer mutation.
- **Terminal reconciliation:** fresh private pre/post-reset recovery evidence; working state `CLEAN`; schema `30` / migration `0030`; foreign keys PASS; reset probe absent; working R2 brand identity equals the sealed baseline; working evidence is empty; exact f8 runtime/bindings and Production non-crossover PASS.
- **Consequence:** the historical 0031 application was restored with the sealed baseline. One isolated provider-disabled 0031 reapply is authorized and strictly next; 0032 remains unattempted.

## Exact next gate

V83_ISOLATED_PLAYGROUND_REAPPLY_0031_THEN_0032_AND_RECONCILIATION: from the second-reset CLEAN schema30/0030 state, reapply only `0031_canonical_identity_foundation.sql` and terminally reconcile it. Then validate the root-authorized private atomic 0032-plus-ledger wrapper locally and, only from a fresh CLEAN schema31/0031 boundary, execute its one remote file import and prove ledger, schema, foreign keys, activity-history DDL/triggers, append-only invariants, and Production non-crossover before final automated acceptance. SOURCE_RECONCILIATION_PLAYGROUND_GATE and ID_H_PLAYGROUND_DELIVERY_GATE remain later post-migration Playground gates.

Do not request a routine owner pause until the later Playground manual-test and explicit Production-GO gate. Do not change source, dependencies, build/workflow/repository runtime config, Production, recovery pointers, AGENTS/project policy, or v0.8.4 in this step.
