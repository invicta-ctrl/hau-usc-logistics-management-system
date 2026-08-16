# V83 Gate A — GPT-5.6 Sol Web Audit Index

This is the entry point for the independent audit. Everything below is readable from
the repository; no local-only artifacts are required.

```text
AUDIT TARGET:        V83 Gate A provider-free local migration fixture preparation
BRANCH:              research/v83-idc-gate-a-audit-prep-2026-08-16
BASE SHA:            8e58f5376c6942994248b2988742e5dcd076eb90 (origin/release/v0.8.3-identity-foundation)
FINAL PREP SHA:      branch tip of research/v83-idc-gate-a-audit-prep-2026-08-16
                     (reconstruct with: git rev-parse research/v83-idc-gate-a-audit-prep-2026-08-16)
AUTHORITATIVE SPEC:  .codex/specs/active/v0.8.3-identity-intake-a5-accepted.md
MASTER PREP FILE:    docs/reviews/V83_IDC_GATE_A_AUDIT_PREP_2026-08-16.md
TERRA PROMPT FILE:   docs/reviews/V83_GATE_A_TERRA_EXECUTION_PROMPT_DRAFT_2026-08-16.md
```

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

DECISIONS GPT SHOULD CHALLENGE:

- Test-side orchestration of the "ID-D local apply" versus a future product apply
  service (NOT_YET_AUTHORIZED marker in the master doc section 6).
- Inline test helpers versus extracting a shared fixture helper.
- Whether any scenario set needs an additional ambiguity variant.

EXPECTED GPT OUTPUT:

- A verdict of AUDIT_READY / AUDIT_READY_WITH_UNVERIFIED_ITEMS / BLOCKED for Gate A.
- Any corrections required in the master preparation doc or the Terra prompt before
  Thursday, with exact file/section references.
- An explicit yes/no on each of the 14 audit questions in the master doc section 19.
