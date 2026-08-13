# v0.8.3 Identity Foundation Execution Packet

STATUS: ID_A_COMPLETE_ID_B_BLOCKED_ON_OWNER_DECISIONS
BASE_BRANCH: main
BASE_SHA: 7d826f2683fbca8058ff08e8ae40acc1e095c076
BRANCH: release/v0.8.3-identity-foundation
ACCEPTED_SPEC: .codex/specs/active/v0.8.3-identity-intake-a5-accepted.md

## Entry facts refreshed after v0.8.2

- v0.8.2 S17 is complete on main and the exact governance closeout is
  `7d826f2683fbca8058ff08e8ae40acc1e095c076`.
- Production runtime is v0.8.2 on the separately deployed candidate
  `c316e047c845fa182e82156c95945c4a5e5de2ff`, schema 30, migration 0030.
- The V83 branch starts clean from the exact current main lineage.
- No V82 data change invalidated the existing account/session security seams.

## Stage plan

1. S00 — A5 minimal ID-A authority and privacy boundary: PASS.
2. S01 — post-V82 Git/runtime/schema freshness: PASS.
3. S02 — temporary release branch and Terra writer lock: PASS.
4. S03 — ID-A auth/session preservation verification: PASS (7 files, 42 tests).
5. S04 — verified preservation no-op: PASS; no source/schema/provider diff.
6. S05 — BLOCKED at the ID-B owner-decision gate; no person/assignment work.

## Exact ID-A verification scope

- `tests/unit/auth-service.test.js`
- `tests/unit/auth-http-handler.test.js`
- `tests/unit/auth-crypto.test.js`
- `tests/unit/auth-cookies.test.js`
- `tests/unit/authorization.test.js`
- `tests/unit/v072-auth-repository-contract.test.js`
- `tests/unit/v072-auth-repository-d1.test.js`

## Prohibited actions

No source implementation, migration, schema/repository extension, backfill,
private roster read, Google/Drive/Cloudflare action, deployment, release
promotion, provider mutation, or frontend adoption. Do not inspect Make or
route-design material before both required acknowledgements and
`READY_FOR_ADOPTION`.

## Stop condition

Stop on the first focused contract failure, privacy breach, unexpected diff,
or missing owner decision. `ID-B` through `ID-H` require the separate accepted
decision table defined by the accepted specification.
