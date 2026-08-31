# Current Bounded Task — MFR-002 U09 Fullstack Data Path

STATUS: PASS_READY_FOR_PLAYGROUND_INTEGRATION
INTENT: PERFORMANCE_OPTIMIZATION
SECONDARY_INTENTS: FULLSTACK_INTEGRATION;ACCESSIBILITY;REFACTOR;TESTING
MODE: EXECUTE
OBJECTIVE: Remove the accepted Administration, bootstrap, Restocking, Procurement, and Lending query waste without changing business behavior or weakening authorization, privacy, ledger, evidence, or audit truth.
TARGET: work/playground-mfr002-data-path -> Playground
SKILLS: sol-advisor:orchestration
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-31-mfr002-unified-mobile-first-fullstack-performance-transformation.md
AUTHORITY: Earl's current continuation instruction -> accepted MFR-002 specification -> root AGENTS.md -> .agents/PROJECT_POLICY.md -> verified origin/Playground U08 source and tests
REQUIRED_MODEL: GPT-5.6 SOL HIGH
ACTIVE_WRITER: SOL_HIGH:/root
ROUTE: SOLO
RISK: HIGH
SCOPE: U09 only: batch Administration account hydration with a purpose-limited list projection; remove unused generic Restocking and Procurement reads; keep Lending asset/item scope page- and ticket-bound; retrieve visible-ticket history set-wise with a 20-row display bound plus one sentinel; project and visibly disclose historyHasMore; preserve it through preview transitions; focused evidence and non-force Playground integration.
OUT_OF_SCOPE: U10 Worker/cache/security/repository hardening; U11 reset/deployment/freeze; new endpoint; speculative history pagination API; migration/index/schema/provider/data mutation; main or Production mutation; Figma write; business-policy changes.
CONSTRAINTS: One writer; exact U08 remote base; no unbounded history; no SELECT-star list projection for Administration; response equivalence except the deliberate additive historyHasMore field; no live rows_read, p50, or p95 claim without provider evidence; generated dist/.wrangler output remains untracked.
DELIVERABLE: A reviewed U09 checkpoint with deterministic before/after query evidence, truthful bounded Lending-history disclosure, green focused and proportional closeout gates, and exact-tree GitHub parity on Playground.
VERIFICATION: Focused Administration/D1/Lending/adapter/authorization tests; lint; build; fixture boundary; Apps Script; dist; governance; full unit; Cloudflare check; format; diff check; secret scan; exact branch/commit/tree/ancestry/main containment proof.
STOP_CONDITIONS: Authority conflict; unexpected divergence or unknown dirty work; writer conflict; secret/private data; authorization/privacy/evidence/idempotency/ledger/audit regression; migration/index/provider need; non-fast-forward integration; main or Production mutation.
COMPLETED_SO_FAR: U09 source is complete at commit 9a82307ed422ce02bd6e164716e8d8d7a10a826b / tree 222bbc0b7985b50daca81d583911d9979cdab32d. Administration list hydration is set-wise and purpose-limited; Restocking and Procurement omit unused reads; Lending item, asset, and visible-ticket history collections are bounded; the latest-20 history contract exposes a required truthful historyHasMore flag. Focused tests, the 178-file / 1,290-test full suite, lint, build, fixture, Apps Script, canonical artifact, Cloudflare dry-run, changed-file format, and diff checks pass. No schema, migration, index, dependency, provider, deployment, data, main, or Production mutation occurred. Evidence: .codex/evidence/MFR002_U09_DATA_PATH.json.
NEXT_EXACT_ACTION: Publish the exact U09 source and closeout commits to the temporary branch, integrate non-force into Playground, verify remote tree parity and unchanged main, then create work/playground-mfr002-worker-hardening from that integrated lineage.
