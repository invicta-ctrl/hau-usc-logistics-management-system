# Current Bounded Task

INTENT: DEPLOYMENT
SECONDARY INTENTS: MIGRATION + TESTING + REPOSITORY_MAINTENANCE
MODE: EXECUTE
OBJECTIVE: Provision and accept the smallest permanently isolated synthetic-only staging sandbox while preserving the existing operational staging D1 as read-only evidence and leaving production unchanged.
TARGET: maintenance/v0.7.2.1-repository-normalization
SKILLS: cloudflare-deploy + github:yeet + lean-ctx
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/v0.7.2.1-repository-normalization-and-staging-sandbox.md
AUTHORITY: Earl approval; accepted V0.7.2.1 specification; AGENTS.md; current continuity chain
REQUIRED_MODEL: CODEX for bounded implementation; Sol review before integration; escalate security, data, authorization, migration, recovery, or production-boundary decisions
ACTIVE_WRITER: CODEX
GIT_UPSTREAM: NONE - sanctioned local no-push maintenance branch
RISK: HIGH - external staging resource creation, schema application, synthetic identities, email containment, and reset boundaries are safety-critical; production remains excluded
DELIVERABLE: A new exact-SHA isolated staging Worker/D1 and only required R2 bindings, canonical schema, deterministic synthetic seed, reset/reseed proof, staging acceptance evidence, clean committed branch, verified upstream push, and draft PR handoff without merge.
SCOPE: Read-only provider inventory; new uniquely named synthetic-only D1; only minimum dedicated staging Worker/R2/bindings/secrets; existing canonical migrations; approved deterministic synthetic seed; staging email allowlist; exact-SHA deploy; invalidated staging acceptance; bounded repository repairs and handoff.
OUT_OF_SCOPE: Any write to the existing operational staging D1; production mutation or deployment; production-data cloning; migration rewrites; hard deletion or rewriting of immutable records; protected roster mutation; broad re-audit; merge/release/tag/branch cleanup; production promotion.
VERIFICATION: Exact account/resource IDs privately verified; production unreachable; per-resource rollback; migration/integrity/FK/invariant proofs; authentication/permission/mail/workflow/reset/reseed acceptance; exact SHA/status/banner; focused invalidated checks; final logical diff and draft-PR checks.
STOP_CONDITIONS: Unverified exact target; production reachability; any attempted write to the protected staging D1; missing rollback/removal proof; missing or ambiguous allowlist; privacy/auth/ledger/history uncertainty; schema drift; artifact/SHA mismatch; unknown dirty overlap; unresolved P0/P1.
NEXT_EXACT_ACTION: Finish focused verification, review and commit the bounded sandbox lifecycle implementation, generate the private exact-SHA configuration/rollback manifest, then recheck account and resource isolation before the first provider write.

Repository implementation through 6848bb77ca61f542df953ffb2bd43feca5ffca08 completed the approved cleanup, artifact isolation, CI simplification, exact staging target/config guards, mail containment, banner, and documentation/archive batch. `npm run check` passed 119 files/827 tests; `npm run test:e2e` passed 138 tests with 360 intentional project skips; local Worker/D1 acceptance passed 58 tests; tracked artifacts stayed byte-stable across isolated staging/production builds; the final independent Sol review reported no P0/P1. Live read-only aggregate classification found non-synthetic/unclassified staging operational rows, so staging reset/deploy remains blocked before mutation. Production is untouched.

Owner decision 2026-08-08 resolves the disposition by selecting a new isolated sandbox. The previous staging D1 remains protected read-only evidence; it is not a sandbox target.

The bounded implementation targets the existing staging Worker with only the new D1/R2 names recorded in CURRENT. It generates private peppered credentials, seeds 11 synthetic actor scenarios and 36 representative inventory items plus request/deliverable/restock/release/lending/event fixtures, revokes only matching synthetic sessions, archives/disables one exact generation, appends ledger reversal records, retains immutable rows, backs up and restores privately before remote reset, and reseeds a new generation. Local two-generation schema execution passed integrity and foreign-key checks.
