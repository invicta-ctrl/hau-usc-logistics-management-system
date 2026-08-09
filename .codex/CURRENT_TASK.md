# Current Bounded Task

INTENT: BACKEND_INTEGRATION
MODE: EXECUTE
OBJECTIVE: Connect the current isolated playground backend to the frozen impeccable-whole-site-redesign-v5 frontend through non-visual adapters without changing the frontend.
SECONDARY_INTENTS: SOFTWARE_FEATURE, TESTING, DEPLOYMENT
SKILLS: browser:control-in-app-browser for the explicitly requested live localhost preview; Hallmark and Impeccable are explicitly prohibited
RESULT: PLAYGROUND_ACCEPTED_AWAITING_EARL
TARGET: current active release branch and the frozen prototypes/impeccable-whole-site-redesign-v5 frontend
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/v0.8.1-v5-backend-integration-steer.md
AUTHORITY: Earl's superseding 2026-08-09 backend-integration steer, repository governance, current playground backend contracts, and the frozen v5 prototype
REQUIRED_MODEL: CODEX
STARTING_SHA: a06566f58ffeed826d8b7a53fe0421d9d68802b1
PRODUCTION_SHA: 3059098ff2a2935fec59df52748ccae420aadba7
PRODUCTION_VERSION: v0.8.0
CANDIDATE_SHA: 947afedb7d0ec4528b4834220facc13ab55930f1
PR: #23 DRAFT
RUNTIME: exact V5 candidate 947afedb7d0ec4528b4834220facc13ab55930f1 is live in the Isolated Staging Playground; built-in-browser and read-only API acceptance passed
SCHEMA: 30
LATEST_MIGRATION: 0030_production_access_and_operations.sql
NEW_MIGRATION: NONE
DELIVERABLE: frozen-v5 route mapping and non-visual backend adapters with real playground auth/D1/R2/actions, tests, visual non-regression, exact playground deployment, and stopped production boundary
VERIFICATION: frontend fingerprints; route provenance; focused full-stack tests; full repository gate; representative browser and visual non-regression; generated parity; exact playground workflow; complete diff; governance and handoff
RISK: HIGH
SCOPE: accepted steer and amendments, frozen v5 reference, current Worker/API clients and contracts, adapters/data bindings, supported routes/actions/media, repository-native live localhost/built-in-browser preview, tests, artifacts, canonical docs, draft PR, and playground-only deployment
OUT_OF_SCOPE: frontend redesign, CSS/theme/copy/route changes, old frontend control import, new product behavior, migration, production deployment/mutation, automatic promotion, M1/M2, Google/provider-email writes, unrelated cleanup, force push, unknown branch/resource deletion
STOP_CONDITIONS: unknown work, writer conflict, visual/CSS requirement, missing critical backend/control, migration or auth-architecture need, playground/production crossover, unproven isolation, unresolved P0/P1, non-regression failure, or exact identity drift
EXTERNAL_WRITES: bounded existing branch/PR update and exact playground-only candidate workflow after all local gates; no production, D1/R2 business-data, Google, or provider-email write
ACTIVE_WRITER: NONE
HANDOFF_STATUS: READY_FOR_HANDOFF
BLOCKER: NONE
COMPLETED_BEFORE_STOP: 33-route/control inventory; current-authority fingerprint reconciliation; V5 adapter/data-binding/runtime integration; owner-authorized request/tracking/lending fields; same-origin playground proxy; deterministic classic-script V5 build/shareable; focused and full repository gates; exact isolated-playground deployment; built-in-browser runtime acceptance
NEXT_EXACT_ACTION: Earl tests the exact deployed V5 candidate in the Isolated Staging Playground and issues explicit production GO or a bounded correction steer; do not promote automatically.
