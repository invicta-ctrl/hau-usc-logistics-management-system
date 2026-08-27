# Current Task — FI-00 through FI-12 Direct Playground Migration Path

INTENT: migration acceptance
MODE: execute
LANE: FM / FRONTEND MIGRATION
ACTIVE_WRITER: TERRA_HIGH:/root/fi00_fi12_candidate_resume
WRITER_LOCK: ACQUIRED
FM_WRITER_LOCK: HELD
LOCK_DEPENDENCIES: Deployed source 8992e670861f136ce803ef03b68aa4687dcda8fc; accepted amendment; private deploy receipt; fresh local non-persistent browser only.
LOCK_OUTPUTS: Private sanitized public-smoke receipt; no login/session/data/provider mutation.
OBJECTIVE: Complete the fresh local Playwright public-smoke evidence, preserve the authenticated-read blocker, then release the lock and stop.
AUTHORITATIVE_SOURCES: Candidate AGENTS.md; project policy; this current chain; accepted FI-00 through FI-12 packet; migration-only amendment; private preflight/rollback/deploy evidence.
DEPLOYED_SOURCE_SHA: 8992e670861f136ce803ef03b68aa4687dcda8fc; upload count 1; retries 0; private deployed-version receipt retained outside Git.
IN_SCOPE NEXT: Fresh local non-persistent Playwright direct read-only endpoints/browser rendering; no login or session/storage inspection; authenticated read remains excluded from the fresh harness.
OUT_OF_SCOPE: New resources; baseline refresh/export/import; data/schema migration; Production; FI-13+; cleanup; product/frontend changes; workflow dispatch; login/session creation, inspection, refresh, logout, or deletion; and any data mutation.
SMOKE_RECEIPT: Prior browser-surface availability failure retained. AUTHENTICATED_READ_BLOCKED_NO_EXISTING_SESSION remains expected for the fresh non-persistent harness.
NEXT_ACTION: Run the bounded local browser public smoke, then record PASS evidence plus the only remaining existing-session blocker.
HANDOFF_STATUS: FM_LOCAL_PLAYWRIGHT_SMOKE_LOCK_HELD
STOP_CONDITIONS: Stop on browser transport unavailability, candidate, manifest, binding, rollback, privacy, authorization, dry-run, artifact, or reconciliation mismatch; stop after the migration receipt.
