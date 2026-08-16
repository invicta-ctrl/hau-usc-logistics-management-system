# V83 Gate A — GPT-5.6 Sol Web Audit Index

This is the entry point for the independent audit. Everything below is readable from
the repository; no local-only artifacts are required.

```text
AUDIT TARGET:        V83 Gate A provider-free local migration fixture preparation
BRANCH:              research/v83-idc-gate-a-audit-prep-2026-08-16
BASE SHA:            8e58f5376c6942994248b2988742e5dcd076eb90 (origin/release/v0.8.3-identity-foundation)
SOL_AUDIT_INPUT_SHA: 4e7b08a4db834cd37547c4392aad73b5d00c765f
AUTHORITATIVE SPEC:  .codex/specs/active/v0.8.3-identity-intake-a5-accepted.md
MASTER PREP FILE:    docs/reviews/V83_IDC_GATE_A_AUDIT_PREP_2026-08-16.md
TERRA PROMPT FILE:   docs/reviews/V83_GATE_A_TERRA_EXECUTION_PROMPT_DRAFT_2026-08-16.md
```

SHA semantics: `SOL_AUDIT_INPUT_SHA` above identifies the exact packet GPT-5.6 Sol
audited. The corrected preparation SHA is reported externally by the preparer after
the correction commit. The final Sol audit must use that newly reported correction
SHA, not an unspecified branch tip.

Load-bearing source files:

- src/server/identity-foundation/reconciliation.js
- src/server/identity-foundation/contracts.js
- src/server/d1/identity-foundation-repository.js
- src/server/d1/identity-roster-repository.js
- src/server/identity-roster/service.js
- src/server/identity-roster/crypto.js
- src/worker/index.js (route + authorization wiring)

Load-bearing test files:

- tests/unit/identity-foundation-reconciliation.test.js
- tests/unit/identity-foundation-migration.test.js
- tests/unit/identity-foundation-contracts.test.js
- tests/unit/identity-foundation-worker-route-contract.test.js
- tests/unit/account-application-migration-integration.test.js
- tests/unit/v072-migration-contract.test.js

Migration file:

- migrations/0031_canonical_identity_foundation.sql

Exact test command and reproduced result (2026-08-16, Node v26.3.0, Vitest v4.1.10):

```text
npm.cmd run test -- tests/unit/account-application-migration-integration.test.js tests/unit/identity-foundation-contracts.test.js tests/unit/identity-foundation-migration.test.js tests/unit/v072-migration-contract.test.js tests/unit/identity-foundation-reconciliation.test.js tests/unit/identity-foundation-worker-route-contract.test.js tests/unit/http-api-adapter.test.js tests/unit/legacy-runtime-adapter.test.js
-> Test Files 8 passed (8); Tests 31 passed (31); Duration 5.31s
```

UNVERIFIED ITEMS:

- Live private Google source state (Gate B scope).
- Live Cloudflare Production/Playground identity (chain records only).
- Writer-lock holder liveness (heartbeat 2026-08-14T02:03:11+08:00).
- The cause of any aggregate ID-C quarantine cannot be attributed with current ID-C
  output (no reason breakdown is exposed).

DECISIONS GPT SHOULD CHALLENGE:

- Test-side synthetic canonical-row orchestration versus a future Production ID-D
  apply service (NOT_YET_AUTHORIZED marker in the master doc section 6).
- Inline test helpers versus extracting a shared fixture helper.
- Whether any scenario set needs an additional ambiguity variant.

## Final Sol audit questions

1. Were all four prior Sol findings corrected?
2. Is Gate A now described strictly as a fixture/test proof rather than a Production
   apply proof?
3. Is Production ID-D apply behavior clearly `NOT_YET_AUTHORIZED` and unproven?
4. Are migration 0031 expectations accurate?
5. Is the synthetic fixture still provider-free?
6. Is any name-based identity inference present?
7. Are ambiguity and conflicts fail-closed?
8. Are assignments still excluded?
9. Is authorization/privilege inference still excluded?
10. Is fixture repeatability distinguished from future Production idempotency?
11. Is reset sufficient for the disposable in-memory fixture?
12. Is the `.codex` policy internally consistent?
13. Is Gate B still separate?
14. Is secret-rotation diagnosis correctly marked unverified with current ID-C?
15. Is Opus required before Terra execution?
16. Is the Terra prompt ready for Thursday execution after live-state revalidation?

EXPECTED GPT OUTPUT:

- A verdict of AUDIT_READY / AUDIT_READY_WITH_UNVERIFIED_ITEMS / BLOCKED for Gate A.
- Any corrections required in the master preparation doc or the Terra prompt before
  Thursday, with exact file/section references.
- An explicit yes/no on each of the 16 final audit questions above (mirrored in the
  master doc section 19).
