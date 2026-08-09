# Project Status

## Current state

- **Milestone:** Isolated Staging Playground + Git Branch Governance + Production Parity is complete and awaiting Earl manual testing through draft PR #23.
- **Production identity:** protected production remains `v0.8.0` at `3059098ff2a2935fec59df52748ccae420aadba7`; no production deployment, migration, or business-data mutation occurred.
- **Playground:** exact frozen branch-tip candidate deploys only by explicit workflow dispatch to distinct working D1/R2 bindings; readiness, safe status, module switcher, real-login path, session protection, dirty/reset reconciliation, and CLEAN state pass.
- **Parity:** the one-way production-derived D1/R2 baseline is verified with explicit privacy exceptions; credentials, sessions, private evidence, and protected roster identity are excluded or replaced deterministically.
- **Git:** permanent pointers are `main`, `backup/last-known-good`, and `regression/r1` through `regression/r3`; the only active temporary production-bound branch is `release/v0.8.1-isolated-staging-playground`. No staging, playground, production, or develop branch was created.
- **Migration:** `NONE_REQUIRED`; schema 30 and `0030_production_access_and_operations.sql` remain current.
- **Recovery:** prior staging Worker/D1/R2, fresh private exports, D1 reset bookmarks, R2 manifests, and rollback evidence remain outside Git.
- **External boundaries:** Google writes and provider/email sends are none. Production D1 and R2 read-only pre/post fingerprints are unchanged.
- **Writer:** none; handoff is ready.
- **Next action:** Earl manually tests the exact PR #23 playground candidate. Any code change invalidates approval; production requires a separate explicit GO.

## Verification

- Canonical `npm run check`: governance/handoff, lint (zero errors; one existing warning), deterministic build, 133 files / 891 tests, Apps Script, dist parity, Cloudflare types, and dry-run pass.
- Playground suite: 8 files / 23 tests pass, including production-denial, branch-governance, baseline, reset, read-only R2 fingerprint, and session-guard coverage.
- Live privileged playground probe and deliberate D1/R2 dirty/reset rehearsal pass.
- Production D1 export integrity/FK/schema/migration and exact pre/post fingerprint pass; safe R2 pre/post fingerprint evidence is retained privately.
