# Current Bounded Task

INTENT: BUG_FIX
SECONDARY INTENTS: TESTING, REPOSITORY_MAINTENANCE, conditional DEPLOYMENT limited to isolated staging
MODE: EXECUTE
OBJECTIVE: Confirm and repair only rollout-blocking defects on the v0.7.2 baseline.
TARGET: fix/v0.7.3-rollout-stabilization
SKILLS: lean-ctx for targeted repository reads/searches and capped command execution; no visual-design skill because visual redesign is explicitly out of scope
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/v0.7.3-rollout-stabilization.md
AUTHORITY: Earl's owner-submitted v0.7.3 rollout-stabilization specification; AGENTS.md; canonical current chain; phase/context policy; repository runbooks
REQUIRED_MODEL: Codex primary writer; fresh independent Sol review required on an exact code candidate before staging acceptance is declared complete
ACTIVE_WRITER: CODEX
GIT_STARTING_SHA: 7245c717f2b8bff3f327b47ff844281d94eaa1db
GIT_UPSTREAM: NONE on temporary branch; starting main matched origin/main 0/0
RISK: HIGH - acceptance covers authentication, authorization, privacy, idempotency, ledger/data integrity, and isolated staging boundaries; production remains owner-gated and prohibited
DELIVERABLE: Either (A) a proven no-op intake with no runtime release, or (B) one accepted exact-SHA v0.7.3 candidate containing only reproduced blocker fixes.
SCOPE: Focused Account, Request/RV-01, Lending, Inventory/Release, and public/protected-shell blocker intake; repair only deterministic eligible blockers; required regression evidence and continuity handoff; exact isolated staging acceptance only if code changes.
OUT_OF_SCOPE: V0.8 Inventory/ledger work; broad Request/Lending/Release/Inventory redesign; visual polish; new auth/SSO/MFA/OAuth; migration without amendment; production writes/deploy/release/tag; staging reset without exact invalidation and authority; speculative refactor/cleanup/dependency work.
VERIFICATION: Reproduction evidence, regression tests where practical, changed-surface checks, complete repository gate once at final code head, affected browser/Worker-D1 checks, independent Sol review, exact candidate staging acceptance, and proof production stayed unchanged.
STOP_CONDITIONS: Any stop condition in the accepted specification, including wrong target, competing writer, unknown work, production drift/crossover, private-value exposure, unclassified staging where mutation is required, migration need, invariant regression, exact-SHA mismatch, unresolved P0/P1, two failed repair attempts, or v0.8/v0.9 scope expansion.
NEXT_EXACT_ACTION: Commit and verify Gate 1 specification adoption, then inventory reusable evidence and run the smallest focused acceptance sweep without changing runtime behavior.

PRODUCTION_AUTHORIZATION: NOT GRANTED. Direct owner submission authorizes repository work and isolated staging acceptance only. If a blocker is repaired, freeze the exact staging candidate and stop for Earl's explicit `GO - promote exact candidate <SHA> as v0.7.3` or `NO-GO` decision.
