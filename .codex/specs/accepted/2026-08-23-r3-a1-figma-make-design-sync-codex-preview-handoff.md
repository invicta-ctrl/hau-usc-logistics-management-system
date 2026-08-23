# R3-A1 — Figma / Figma Make design-authority synchronization and Codex preview-adoption handoff

STATUS: ACCEPTED
OWNER: Earl
DATE: 2026-08-23
SLUG: r3-a1-figma-make-design-sync-codex-preview-handoff
PARENT: R3 (`HAU_USC_Logistics_ClaudeCode_Frontend_Only_Workflow_UX_Figma_Code_Reconciliation_R3_2026-08-23.md`, owner-held)
BRANCH: frontend-design-integration
PRIMARY_EXECUTOR: Claude Code
NEXT_EXECUTOR: Codex
RISK: HIGH — live design-provider writes and branch-wide authority synchronization

FIGMA_DESIGN_WRITE: AUTHORIZED_BY_R3_A1 — `hXJElH4p72KfgAaoUyfNOC` only
FIGMA_MAKE_WRITE: AUTHORIZED_BY_R3_A1 — `rP9W9MQlZkyQrUx38TVsFS` only
OTHER_PROVIDER_WRITE: FORBIDDEN
PLAYGROUND_WRITE: FORBIDDEN
PRODUCTION_WRITE: FORBIDDEN
MAIN_WRITE: FORBIDDEN
BACKEND_SEMANTIC_CHANGE: FORBIDDEN
MIGRATION: FORBIDDEN
DEPLOYMENT: FORBIDDEN

## Intent

`DOCUMENT_OR_ARTIFACT + ARCHITECTURE`, with `FIGMA_RECONCILIATION`,
`FIGMA_MAKE_RECONCILIATION`, `DESIGN_SYSTEM_GOVERNANCE`, `FRONTEND_DOCUMENTATION`,
`WORKFLOW_ARCHITECTURE`, `CODE_REVIEW`, and `COMMUNICATION / HANDOFF`.

Remove design-authority drift before Codex implements again. R3 changed the
accepted public/staff workflow in the repository but left the live design
providers, the repository design mirrors, and the branch documentation still
describing the pre-R3 model. This amendment synchronizes them.

## This amendment is the explicit provider-write authority

At preparation time the branch's active records still asserted
`PROVIDER_WRITE: FORBIDDEN` and `FIGMA_WRITE: FORBIDDEN`, and the FVR-02 records
prohibited Figma/provider mutation. R3 separately authorized bounded frontend
design writes. This amendment is the owner's explicit resolution of that
conflict.

For this task only, and bounded to the two canonical HAU-USC design files named
above, the following older restrictions are superseded:

```text
FIGMA_WRITE: FORBIDDEN
PROVIDER_WRITE: FORBIDDEN
"Figma writes require separate authority"
"do not mutate either Figma file"
"provider/Figma write prohibited"
```

Historical receipts that record "no Figma write occurred" remain true of their
own historical task and are not rewritten. CURRENT documents must point at
R3-A1 as the newer authority. This exception does not propagate to any other
project, branch, provider, or environment.

## Objective

Synchronize the actual design authorities with the accepted R3 findings so that
Codex can read the frontend branch and reconstruct the new design and workflow
without guessing, reopening prior conversations, or following stale FVR/FI
design authority.

## Target

- Live Figma Design `hXJElH4p72KfgAaoUyfNOC` — current-authority documentation,
  visual references, and workflow references.
- Live Figma Make `rP9W9MQlZkyQrUx38TVsFS` — current code and prototype.
- Repository-preserved Figma/Make sources and registers on
  `frontend-design-integration` only.
- `DESIGN.md`, `docs/frontend/**`, `docs/design/**`, `.codex/**`,
  `.impeccable/**`.

## Authoritative sources

Earl's current explicit instruction (R3, then this R3-A1) → accepted R3 findings
recorded in `docs/frontend/WORKFLOW_ARCHITECTURE.md` §6 and
`.codex/R3_PUBLIC_STAFF_BOUNDARY_RECEIPT.md` → accepted backend/API/auth/data/
security contracts (functional truth) → live Figma Make (interactive frontend
prototype authority) → live Figma Design current-authority lane (design
documentation and visual-reference authority) → repository design mirrors and
registers → historical evidence, never authority.

## Authority model after R3-A1

- Repository backend/API/auth/data/security contracts remain authoritative for
  authorization, capabilities, request semantics, state transitions, inventory
  truth, privacy, data ownership, and provider behavior.
- Figma Make is the current interactive frontend prototype, route/flow, motion,
  and responsive prototype authority where it does not contradict functional
  contracts.
- The Figma Design current-authority lane is the current design documentation,
  visual reference, workflow reference, component/state, responsive/a11y/motion
  documentation, and traceability surface. Historical lanes remain historical.
- `frontend-design-integration` is the durable handoff and the only
  implementation branch for this phase.

## In scope

- Adopt this amendment and update `.codex` active authority to record the
  bounded provider-write permission before provider mutation.
- Reconcile the R3 public/staff workflow into the Figma Design current-authority
  documentation and affected visual references, with before/after readback.
- Reconcile the same workflow into the Figma Make code and prototype, save
  through the supported provider workflow, and verify the real saved version and
  a pending-edit count of zero after reload.
- Capture the saved Make source back into the existing repository adoption
  structure with byte/hash identity; update generators before generated files.
- Update `docs/design/FIGMA_MAKE_SOURCE_REGISTER.md` and
  `docs/design/FIGMA_BASELINE_REGISTER.md` with real new identities.
- Rewrite `DESIGN.md` to the post-R3-A1 authority model.
- Refresh `.impeccable/design.json` from the current design authority using the
  installed supported workflow, then rerun Impeccable and Hallmark audits.
- Inventory and classify every tracked documentation file on the branch; update
  every current document affected; preserve historical evidence and mark
  superseded material unambiguously.
- Produce design-to-code traceability, the Codex adoption handoff, the R3-A1
  synchronization receipt, and the documentation reconciliation manifest.

## Out of scope

- Implementing the reconciled design into `src/frontend/` — that is the next
  Codex step, not this amendment.
- Cloudflare provider changes, D1/R2 writes, Production, Playground, deployment,
  Main writes or merges, schema changes, migrations, backend semantic changes,
  auth-policy weakening, and branch cleanup outside this frontend branch.
- Any provider mutation other than the two canonical design files.

## Constraints

- Preserve unknown dirty work, untracked files, generated evidence, and
  worktrees. No `reset --hard`, `clean`, force-push, history rewrite, branch
  switch, or discard. `.ai-bridge/` is preserved untouched.
- One writer at a time. Do not race another writer.
- Make may prototype frontend behavior; it may not become a second backend
  specification. Do not invent statuses, capabilities, provider behavior,
  routing semantics, data fields, inventory mutations, or auth rules. Where the
  desired UX needs data the accepted contract does not define, design to the
  accepted contract and record the unresolved product question.
- Do not fabricate protected operational data in visual references; use safe
  fixtures, structural placeholders, or clearly labeled example states.
- Preserve HAU-USC visual identity: oxblood/maroon structure, disciplined gold,
  warm paper, restrained contextual Institutional Glass, Bricolage Grotesque,
  IBM Plex Sans/Mono, Newsreader where currently accepted, purposeful asymmetry,
  operational hierarchy. Do not converge on a generic SaaS dashboard.
- No claim without readback. A write tool returning success is not evidence.

## Deliverables

1. This accepted amendment, referenced by `.codex` active authority.
2. Live Figma Design current-authority documentation and visual references
   reconciled to the R3 model, with readback evidence.
3. Live Figma Make code/prototype reconciled and saved, with the real new
   version identity recorded.
4. Repository Make source mirror matching the live saved source by hash.
5. `docs/design/FIGMA_MAKE_SOURCE_REGISTER.md` and
   `docs/design/FIGMA_BASELINE_REGISTER.md` updated to real identities.
6. `DESIGN.md` rewritten to the post-R3-A1 authority model.
7. `.impeccable/design.json` refreshed; Impeccable and Hallmark audits rerun and
   recorded.
8. `docs/frontend/R3_A1_DOCUMENTATION_RECONCILIATION_MANIFEST.md`.
9. `.codex/R3_A1_FIGMA_MAKE_DESIGN_SYNC_RECEIPT.md`.
10. `.codex/CURRENT.md`, `.codex/CURRENT_TASK.md`, `.codex/CURRENT_HANDOFF.md`
    naming Codex as the next implementation consumer, with an explicit resume
    block.

## Mandatory design agreement

`DESIGN.md`, the Figma Design current lane, Figma Make, the repository Make
mirror, `docs/frontend/WORKFLOW_ARCHITECTURE.md`, and the CURRENT/HANDOFF
records must all describe:

```text
Start a logistics request  ->  PUBLIC REQUEST CENTER  (no staff login)
Staff Sign In              ->  authenticated staff entry
                           ->  capability-gated internal workspaces
```

No current layer may describe the public Request CTA as a staff-authenticated
destination unless clearly marked historical evidence.

## Verification

- Figma Design: re-read affected nodes after write; verify labels, layout, and
  the public/staff distinction; capture after-evidence; confirm no unrelated
  mutation.
- Figma Make: reload the project; verify the new version identity and
  `PENDING_EDITS = 0`; re-read and re-hash changed files; exercise the public
  request path and confirm it reaches the public Request Center and that Staff
  Sign In remains separate.
- Repository: `npm run check:agents`, `npm run check:continuation`,
  `npm run handoff:verify`, applicable `design:*` checks, `git diff --check`,
  full diff review, and remote readback of the pushed HEAD at 0 ahead / 0 behind.
- Documentation: branch-wide search for stale current claims, each match
  classified rather than mechanically removed.

## Stop conditions

Stop writes when: another writer appears; unknown Make pending edits cannot be
preserved; provider auth requires human-only MFA/CAPTCHA that cannot be safely
completed; Figma or Make file identity cannot be resolved safely; a requested
design change would invent backend or product policy; the repository contains
unknown unique work at risk; or a required change would cross into Playground,
Production, or Main.

Do not stop merely because an older `.codex` record, FVR receipt, or `DESIGN.md`
sentence says Figma or provider writes are forbidden. R3-A1 is the newer owner
authority for these two bounded files.

## Rollback

Git revert the R3-A1 documentation, register, and mirror commits. Figma Design
rolls back through native Figma version history captured before mutation. Figma
Make rolls back through its provider version history from the recorded
pre-change version. No Production, Playground, D1, R2, or deployment rollback is
needed because no such write is authorized.

## Completion

R3-A1 is complete when the completion gate in the owner instruction reports all
PASS, the Codex handoff is executable without the originating chat, and the
branch records:

```text
R3_A1_DESIGN_SYNC_COMPLETE__CODEX_PREVIEW_ADOPTION_READY
```

Claude then stops. Codex performs the local-preview adoption as a separate step.
