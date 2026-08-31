# Current Bounded Task — MFR-002 U03 App Shell and Responsive Navigation

STATUS: READY_FOR_INTEGRATION
INTENT: FRONTEND_REDESIGN
SECONDARY_INTENTS: ACCESSIBILITY;PERFORMANCE_OPTIMIZATION;REFACTOR;REPOSITORY_MAINTENANCE
MODE: EXECUTE
OBJECTIVE: Make mobile the primary application frame and desktop a deliberate enhancement without changing route, capability, authentication, or business semantics.
TARGET: work/playground-mfr002-shell -> Playground
SKILLS: personal-context;figma-design-to-code;control-browser
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-31-mfr002-unified-mobile-first-fullstack-performance-transformation.md
AUTHORITY: Earl's HAU-USC-MFR-002 launcher and accepted specification -> repository root AGENTS.md -> .agents/PROJECT_POLICY.md -> DESIGN.md -> verified Playground continuity and source
REQUIRED_MODEL: GPT-5.6 SOL ULTRA
ACTIVE_WRITER: SOL_ULTRA:/root
RISK: HIGH
SCOPE: U03 only: authenticated shell; shared public shell where applicable; mobile and desktop navigation; responsive page frame and page/context headers; drawer/sheet/inspector shell behavior; sticky actions; safe-area and keyboard viewport handling; route focus management; 200% zoom resilience; focused tests and evidence; safe Playground integration.
OUT_OF_SCOPE: U04 landing, Public Lending, authenticated Request entry, auth/profile redesign; route information architecture or business-semantic changes; backend/API/auth/data/schema/migration/provider changes; deployment; Figma writes; main or Production mutation.
CONSTRAINTS: One writer; sequential Playground branch; preserve route/capability visibility, authentication boundaries, preview behavior, all six theme families, all twelve Light/Dark appearances, U02 token authority, 44px targets, reduced-motion/forced-color/focus contracts, accepted backend behavior, and U01 performance architecture.
DELIVERABLE: A responsive shell that retains all functions at 320px, is excellent at 390px, composes intentionally at 768px, transitions deliberately at 1024px, remains intentional at 1440px, and has no obscured focus or accidental horizontal overflow.
VERIFICATION: Focused shell/unit tests; navigation and accessibility Playwright enumeration at 320/390/768/1024/1440; 200% zoom and keyboard/focus checks where a browser is available; theme/foundation drift and contrast checks; full unit suite; lint; canonical and staging builds/artifact verification; governance/handoff; diff and secret checks.
STOP_CONDITIONS: Authority conflict; unexpected branch divergence or unknown dirty work; writer conflict; secret/private data; main/Production mutation; route/capability/auth regression; theme/contrast regression; U01 asset architecture or P23 budget regression; non-fast-forward integration.
COMPLETED_SO_FAR: U00 through U02 are integrated into Playground. U03 now has one shared shell geometry source, capability-filtered mobile navigation, 76/272px desktop rails, route-focus/document-title management, safe dynamic-viewport drawers with inert background and focus restoration, viewport-bound inspectors, sticky mobile actions, semantic public section navigation, and focused five-width/zoom contracts. All 171 unit files and 1,255 tests pass with one intentional skip; lint has zero errors/two pre-existing warnings; 66/66 contrast pairs, generated-design checks, canonical/staging artifacts, and byte-identical hero verification pass. Rendered-browser execution remains explicitly UNRUN because no usable browser path exists in this environment.
NEXT_EXACT_ACTION: Commit and publish the exact U03 branch, fast-forward integrate it into Playground, verify exact containment and main nonmutation, then create work/playground-mfr002-entry-flows.
