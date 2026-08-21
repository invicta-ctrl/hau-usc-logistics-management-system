# Resume Prompt — v0.8.3 Frontend Design Adoption Specification Review

```text
STATUS: READY_FOR_FRONTEND_ADOPTION_SPEC_REVIEW

Read the branch-local current chain first, then the two v0.8.3 adoption
artifacts:

  .codex/CURRENT.md
  .codex/CURRENT_TASK.md
  .codex/CURRENT_HANDOFF.md
  docs/design/V083_FRONTEND_DESIGN_ADOPTION_INTAKE.md
  docs/design/V083_TO_FRONTEND_INTEGRATION_MAP.md

Functional authority is final v0.8.3 main at
86553349f5c2ebefaa637c30828c560a301f99ba and its reconciled frozen Production
candidate f8e63372bc8afcb6d092970b7f9fc9ee72fd3580. Backend, API,
authentication, authorization, data, migration, privacy, and recovery
contracts win. Visual authority is DESIGN_BASELINE_2026-08-20-F, Figma Make
v39, and retained frontend-design-integration evidence.

Do not use this historical frontend branch as an implementation base. Create a
new isolated worktree from final main only after an owner accepts a new,
contract-complete frontend adoption specification. Pick one mapped surface,
declare the exact visual source, preserve all existing behavior, record a
rollback point, and run focused contract plus visual acceptance.

Do not merge or rebase frontend-design-integration into main. Do not copy old
src/visual runtime code, generated artifacts, preview fixtures, or demo chrome.
Do not modify Figma, deploy, access providers, or change backend/auth/data/
migrations without separate explicit authority.
```
