# Current Task — FI-13 to FI-17 Immediate Playground Migration

STATUS: COMPLETE
INTENT: migration
MODE: execute
TARGET: Existing FM candidate worktree and Isolated Staging Playground
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACTIVE_WRITER: NONE
WRITER_LOCK: RELEASED
ROUTE: SOLO
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-28-fi13-fi17-immediate-playground-migration-owner-amendment.md
AUTHORITY: Earl's accepted immediate-migration amendment, project governance, exact FI source checkpoint, and live FM/Playground freeze evidence.
REQUIRED_MODEL: GPT-5.6 SOL HIGH
RISK: HIGH — exact candidate migration and isolated external deployment with no Production authority.

OBJECTIVE: Migrate only the missing accepted FI frontend delta through FI-17 plus post-FI17 recovery into the FM branch, preserve FM's backend/data/reset contracts, deploy the exact candidate to the existing isolated Playground, verify the migration, and stop.

SCOPE: deterministic delta calculation; current FI frontend adoption; mixed-file conflict resolution; generated artifact rebuild; focused and final release-candidate verification; existing-Playground deployment; targeted smoke; continuity and receipt closeout.

OUT_OF_SCOPE: Production, main, new migrations/schema, data repopulation, unnecessary reset, new provider resources, Google/provider sends, Figma/Make, Hallmark, Impeccable, broad visual audit, redesign, FI-18, and mutation of the FI source worktree.

CONSTRAINTS: destination wins for FM operational/backend/data/reset behavior; source wins for newer accepted frontend behavior; preserve authorization/privacy/ledger/request/lending/inventory invariants; rebuild generated output from source; one writer; no delegation; no background continuation.

VERIFICATION: `git diff --check`; focused tests for changed/conflicted files; staging/production-mode build and deploy-artifact verification; one final `npm run check:release-candidate`; exact candidate/rollback/isolation preflight; targeted live route smoke; schema 32/migration 0032/no-new-migration proof; zero Production/Google/provider writes.

STOP_CONDITIONS: conflicting writer; unknown tracked work that cannot be preserved; unaccepted FI source; required new migration or Production mutation; unprovable isolation or rollback; invariant-weakening conflict; unrepaired migration P0/P1.

COMPLETED_STATE: FI-00 through FI-17 plus accepted post-FI17 Overview/hero recovery is deployed to the existing Isolated Staging Playground at candidate `9d48eaa8afb81734db3855b1834607e410f717fd`; targeted live verification passed and Production remained unchanged.

NEXT_EXACT_ACTION: STOP. Await a new explicit owner instruction for Production, FI-18, reset, residue cleanup, or any later work.
