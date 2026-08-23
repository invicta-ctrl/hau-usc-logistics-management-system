# Specifications

The current accepted specification is named by `.codex/CURRENT.md`. It may live under `.codex/specs/active/` or `.codex/specs/accepted/` — follow the pointer, not the directory. Read only that specification during a cold start.

As of 2026-08-23 the current pointer names `.codex/specs/accepted/2026-08-23-r3-a1-figma-make-design-sync-codex-preview-handoff.md` (R3-A1).

Accepted release specifications and amendments that are not named by the current pointer remain durable evidence. They do not override it. In particular, the FVR-02 specifications and amendments carry `FIGMA_WRITE: FORBIDDEN` and `PROVIDER_WRITE: FORBIDDEN` in their front matter, and name a DeepSeek/Sol writer-orchestrator model contract. Both are **historical**: R3-A1 supersedes the provider-write prohibition for the two canonical HAU-USC design files only, and R3/R3-A1 were executed under Earl's direct instruction with `ACTIVE_WRITER: NONE` at entry. Superseded v0.6 phase/model specifications are retained under `.codex/archive/specs/v0.6/` for history only.

Every non-trivial behavior, architecture, migration, deployment, or destructive maintenance change requires an accepted specification or approved amendment before implementation.
