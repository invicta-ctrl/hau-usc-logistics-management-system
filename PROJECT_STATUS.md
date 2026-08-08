# Project Status

## Current state

- **Milestone:** V0.7.3 Rollout Stabilization is complete with `NO RUNTIME PATCH REQUIRED`; next is the owner decision for a bounded v0.8.0 Inventory Truth and Ledger Lock specification.
- **Branch/HEAD:** Protected no-op closeout PR #19 merged to canonical `main` at `8b4ad05c6754b3de627535577d24216023dca8ca`; resolve current Git identity during the next handshake.
- **Writer:** NONE; the writer lock is released.
- **Authority:** `.codex/specs/active/v0.7.3-rollout-stabilization.md` records the completed no-op outcome. No accepted v0.8.0 implementation specification exists.
- **Runtime:** Production remains immutable v0.7.2 at `84eacfcdb47a3985fed48e3ba14bb413946d4410`; no v0.7.3 version bump, tag, release, staging deployment, or production action occurred.
- **Next action:** Ask Earl to approve the first bounded v0.8.0 objective/specification before claiming a writer lock or changing code or an environment.

## V0.7.3 acceptance result

No eligible rollout blocker was confirmed. Focused Account/Profile/Auth/Public Request/Public Lending/Inventory/Release unit tests passed 89/89; RV-01 Worker/D1 tests passed 19/19; ten coherent focused Worker/D1 Account/Lending/Inventory/Release/privacy cases passed; and six Account/Public portal UI cases passed. The exact `c4fa46f` full repository gate and provider/recovery/auth evidence remain valid because no source, test, migration, dependency, artifact, or deploy configuration changed.

Live production reported v0.7.2, schema 30/0030, ready/protected. The permanent sandbox reported v0.7.2 at `c4fa46f267733eeceb5d82a825431c6337f8e4e0`, schema 30/0030, ready/protected, exact-resource matched, one-recipient contained, synthetic generation 4, and production-isolated. Public shells returned 200 and protected anonymous access failed closed with a safe error.

The sandbox's four governed brand-image endpoints return 404. This is a cosmetic staging asset-population gap: the login, portals, Request, and Lending shells remain available, and sign-in behavior remains covered by passing tests and unchanged staging auth evidence. It is not eligible for the blocker-only v0.7.3 patch.

## Resume

Read `AGENTS.md` -> `.codex/CURRENT.md` -> `.codex/CURRENT_TASK.md` -> `.codex/CURRENT_HANDOFF.md`, then the completed v0.7.3 specification. Run `npm run handoff:verify` before accepting or transferring state.
