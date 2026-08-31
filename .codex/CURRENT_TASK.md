# Current Bounded Task — MFR-002 U04 Entry Flows

STATUS: PASS_READY_FOR_INTEGRATION
INTENT: FRONTEND_REDESIGN
SECONDARY_INTENTS: ACCESSIBILITY;PERFORMANCE_OPTIMIZATION;REFACTOR;REPOSITORY_MAINTENANCE
MODE: EXECUTE
OBJECTIVE: Make the landing, no-login Public Lending, authenticated requester entry, generic staff gateway, account lifecycle, and Profile experience fast, beautiful, correct, role-clear, and recoverable.
TARGET: work/playground-mfr002-entry-flows -> Playground
SKILLS: personal-context;figma-design-to-code;control-browser
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-31-mfr002-unified-mobile-first-fullstack-performance-transformation.md
AUTHORITY: Earl's HAU-USC-MFR-002 launcher and accepted specification -> repository root AGENTS.md -> .agents/PROJECT_POLICY.md -> DESIGN.md -> verified Playground continuity and source
REQUIRED_MODEL: GPT-5.6 SOL ULTRA
ACTIVE_WRITER: SOL_ULTRA:/root
RISK: HIGH
SCOPE: U04 only: public landing and hero value/cost; no-login Public Lending browse/request/receipt/tracking/policy flow; authenticated External Request entry and mobile form sequence; generic staff sign-in and existing activation/application/status/recovery lifecycle; Profile presentation; truthful loading/empty/error/retry/receipt states; focused tests/evidence and safe Playground integration.
OUT_OF_SCOPE: U05 Overview/Inventory redesign; internal Request/Lending/Release and later operational route redesign; new identity or business policy; backend/API/auth/data/schema/migration/provider changes; deployment; Figma writes; main or Production mutation.
CONSTRAINTS: One writer; sequential Playground branch; Public Lending never requires sign-in; External Request requires authenticated request.create authority; Staff Sign In remains a generic gateway; preserve password-manager semantics, account lifecycle, server-owned records/status/permissions, U03 shell/focus contracts, all six theme families and twelve Light/Dark appearances, normal asset build, and P23 performance architecture.
DELIVERABLE: A role-clear first journey with measured hero cost, mobile-first forms, recoverable errors, durable private receipt guidance, and clean Profile presentation without marketing filler or fabricated state.
VERIFICATION: Measure before changing hero/media behavior; focused entry/auth/profile/unit tests; exact five-width public/auth/request matrix and 200% reflow where a browser is available; password-manager and keyboard/focus semantics; theme/foundation drift and contrast; full unit suite; lint; canonical/staging artifact and performance comparison; governance/handoff/diff/secret checks.
STOP_CONDITIONS: Authority conflict; unexpected branch divergence or unknown dirty work; writer conflict; secret/private data; main/Production mutation; Public Lending authentication regression; requester/generic-gateway identity regression; password-manager/account-lifecycle regression; backend or provider scope expansion; theme/contrast or U03 shell regression; P23 budget regression; non-fast-forward integration.
COMPLETED_SO_FAR: U00 through U03 are integrated into Playground. U04 now has a poster-first landing with zero initial hero-media bytes; one compact no-login Public Lending shell with a recoverable three-step mobile request and one-time private receipt; native authenticated requester forms and focused receipt; theme-aware generic auth/account lifecycle panels with password-manager and keyboard semantics; Profile accessibility cleanup; focused/full tests, lint, design/contrast checks, canonical/staging artifact verification, deterministic five-width enumeration, and exact evidence. Main remains f7e5bf8 with tree 480cf65. Fresh rendered-browser acceptance is explicitly UNRUN because no usable browser can reach the workspace preview.
NEXT_EXACT_ACTION: Run the final governance, handoff, diff, and secret checks; create one coherent U04 commit; publish its exact tree to the temporary branch; then non-force fast-forward Playground while proving main unchanged.
