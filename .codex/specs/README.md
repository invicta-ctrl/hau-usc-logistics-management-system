# Specifications

The current accepted specification is named by `.codex/CURRENT.md` and lives under `.codex/specs/active/`. Read only that specification during a cold start.

Accepted release specifications and amendments outside `active/` remain durable evidence. They do not override the current pointer. Superseded v0.6 phase/model specifications are retained under `.codex/archive/specs/v0.6/` for history only.

Every non-trivial behavior, architecture, migration, deployment, or destructive maintenance change requires an accepted specification or approved amendment before implementation.

The accepted backend foundation `.codex/specs/accepted/2026-08-24-r3-a1-a2-b1-a1-secure-backend-foundation.md` governs only the isolated `backend/r3-a1-a2-b1` worktree through `.codex/backend/CURRENT.md`. It does not replace the repository-wide current pointer or authorize another worktree.
