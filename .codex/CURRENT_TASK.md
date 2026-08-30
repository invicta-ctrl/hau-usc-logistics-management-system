# Current Bounded Task — MFR-002 U01 Build Foundation

STATUS: READY_FOR_INTEGRATION
INTENT: SOFTWARE_FEATURE
SECONDARY_INTENTS: PERFORMANCE_OPTIMIZATION;REFACTOR;ACCESSIBILITY;REPOSITORY_MAINTENANCE
MODE: EXECUTE
OBJECTIVE: Make every canonical frontend build a normal cacheable application artifact, retire the verified-dead shareable/demo architecture, preserve P23 deployment limits, restore deterministic Apps Script recovery packaging, and establish a measured U01 baseline.
TARGET: work/playground-mfr002-build-foundation -> Playground
SKILLS: personal-context
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-31-mfr002-unified-mobile-first-fullstack-performance-transformation.md
AUTHORITY: Earl's HAU-USC-MFR-002 launcher and accepted specification -> repository root AGENTS.md -> .agents/PROJECT_POLICY.md -> verified Playground continuity and Git state
REQUIRED_MODEL: GPT-5.6 SOL ULTRA
ACTIVE_WRITER: SOL_ULTRA:/root
RISK: HIGH
SCOPE: U01 only: build/dependency mapping, ordinary application output, shareable/demo retirement, Apps Script sidecar isolation and parity, deployment artifact guards, stale dynamic-chunk recovery, deep-link proof, build/request baseline, focused documentation, tests, commit/push, and safe fast-forward Playground integration.
OUT_OF_SCOPE: Route or information-architecture redesign; U02 visual-system work; provider/D1/R2/reset/schema/migration changes; deployment; Figma writes; main or Production mutation.
CONSTRAINTS: One writer; sequential Playground branches; root-relative content-hashed application assets; 20,000,000-byte maximum emitted artifact; exact environment marker for deployable artifacts; normal build carries no deploy marker; preserve accepted data/auth/audit behavior; no generated dist in Git.
DELIVERABLE: Canonical, staging, and Production-mode builds use the same normal asset architecture; obsolete offline artifacts are absent; Apps Script recovery generation is independent and deterministic; stale chunks recover once without loops; build and release manifests bind every emitted file.
VERIFICATION: Normal/staging/Production-mode builds; canonical and deploy artifact verifiers; byte-identical hero reconstruction; SPA fallback and root-relative HTTP asset smoke; Apps Script build/check; focused build/release/recovery tests; full unit suite; lint; Cloudflare dry-run; governance/handoff; diff and secret checks.
STOP_CONDITIONS: Authority conflict; unexpected branch divergence or unknown dirty work; writer conflict; secret/private data; main/Production mutation; P23 asset-budget regression; Apps Script parity loss; non-fast-forward integration.
COMPLETED_SO_FAR: U00 is integrated at 471d45d. U01 emits a 1,502-byte canonical entry with two direct hashed assets and a nine-file manifest, preserves two-part hero reconstruction across all modes, removes the shareable/demo pipeline and 53 unreachable production dependencies, restores complete Apps Script generated-partial parity, adds bounded Vite preload recovery, and passes focused tests plus real HTTP deep-link/static-asset smoke.
NEXT_EXACT_ACTION: Commit and push the verified U01 branch, fast-forward integrate it into Playground, verify exact containment and main nonmutation, then create work/playground-mfr002-design-foundation.
