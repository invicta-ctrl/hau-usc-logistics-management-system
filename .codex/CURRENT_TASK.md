# Current Task — FI-00 through FI-12 Direct Playground Migration

INTENT: final usability deployment and migration closeout
MODE: execute
LANE: FM / FRONTEND MIGRATION
ACTIVE_WRITER: SOL_HIGH:FM-FRESH-FI00-12-PLAYGROUND-2026-08-27
WRITER_LOCK: ACQUIRED_BY_OWNER_AUTHORIZATION
OBJECTIVE: Publish and verify the credential-free Playground-only entry over the already populated and accepted isolated backend, without Production mutation.
AUTHORITATIVE_SOURCES: Candidate AGENTS.md; project policy; current chain; accepted FI-00 through FI-12 migration; superseding full-backend-population amendment; private rollback/provider/acceptance evidence.
DEPLOYED_SOURCE_SHA: `eb6893b9a15d640d0b1df5126ccb8812b07ea75d` remains live until the exact credential-free entry candidate is committed, pushed, and deployed.
COMPLETED: Replacement D1/R2 creation and population; privacy-filtered v4 import; safe public-brand and placeholder-object copy; clean reset bookmark; rollback preservation; schema/integrity/FK/inventory reconciliation; 89-table export parity with zero mismatches; public and temporary authenticated acceptance; Production write count zero.
FRONTEND_DELTA: The sign-in page exposes `Enter Playground` only when `/api/version` returns literal `playground: true`, and obtains a temporary staging-only System Owner session from `/api/playground/session`. Production fails closed and retains ordinary authentication.
CANDIDATE_GATE: PASS — 158 test files / 1,173 tests; build, artifact verification, Cloudflare types/build/dry-run, Apps Script verification; zero lint errors and two pre-existing warnings.
IN_SCOPE NEXT: Commit and push the exact frontend candidate; bind a fresh private config to the existing replacement tuple and exact commit/tree/artifact; dry-run; deploy once; verify visible credential-free entry, authenticated modules, responsive widths, rollback, and Production non-mutation; record and push the final receipt.
OUT_OF_SCOPE: Production deployment or mutation; reverse synchronization; FI-13+; Figma; main promotion; schema beyond 32/0032; provider/email or Google writes; destructive cleanup; unknown-work deletion.
HANDOFF_STATUS: ACTIVE_FINAL_USABILITY_DEPLOY
STOP_CONDITIONS: Stop on dirty-state conflict, candidate/manifest/binding/rollback/privacy/artifact mismatch, failed dry-run, Production crossover, failed acceptance, or unresolved P0/P1/P2; stop after the final receipt.
