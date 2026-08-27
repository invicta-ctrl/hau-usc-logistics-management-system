# Accepted Owner Amendment — Playground Audit, Frontend Repair, and Data Reset

STATUS: ACCEPTED
ACCEPTED_BY: Earl, through the explicit instruction to execute the supplied 2026-08-28 plan
ACCEPTED_ON: 2026-08-28 Asia/Manila
SOURCE_PROMPT: `D:/Download/HAU_USC_Logistics_Playground_Audit_Frontend_Repair_Data_Reset_Plan_2026-08-28.md`
PROGRAM: HAU-USC Logistics isolated Playground repair and reset
TARGET: `https://playground.hausc.org/` and its isolated staging Worker/D1/R2 resources
PRODUCTION: READ-ONLY ISOLATION REFERENCE; MUTATION FORBIDDEN

## Intent and objective

Execute a live-evidence-first recovery of the isolated Playground. Reconcile the final accepted FI-17 frontend into the Playground candidate, remove normal-runtime fixture behavior, make all named routes truthful and functional against the real isolated backend, establish a resettable privacy-filtered D1/R2 baseline, prove two repeat resets, run Hallmark followed by Impeccable, deploy only the Playground, and close with live acceptance evidence.

## Authoritative sources

1. Earl's current explicit adoption of the supplied plan.
2. This accepted amendment.
3. The project governance and `.agents/PROJECT_POLICY.md`.
4. The final FI-17 local completion authority:
   - source commit `d5ae172b8e012a1ad61d60da6fb54510d1677762`
   - source tree `3c68dddab37daeb2b4253256641acce989443466`
   - frontend artifact SHA-256 `1ACE0B30D595EF8C963458B002F7E0176052B3FE1BEB45F23D32A64529049786`
   - package-lock SHA-256 `C84EE33BEAD67DB1C3A620462191727A9040E197D9F6A9767B54F4CADCECC183`
5. Live Playground evidence, which overrides historical acceptance receipts when the two conflict.
6. The previously sealed privacy-filtered baseline and private provider manifests, used only after current-state reconciliation.

## Starting state to preserve and verify

- Historical Playground deployment before this amendment:
  - source `50c5cab77b7fe251cf1a11c284fe791e6c2af127`
  - tree `5a985e623e8a234bf1d4cfac52ab5afb86fd8257`
  - artifact `a9d2d162a3085cf0e60fdc809943c41f7ed23c59be5f53b1587be31fe3d64e54`
  - schema 32 / migration `0032_staff_account_activity_history.sql`
- Existing rollback resources remain preserved until replacement rollback evidence is accepted.
- Unknown `.ai-bridge/` and `.local/` residue in the FI worktree is protected and must not be changed.
- The active checkout's unrelated governance working-tree edits are outside this task and must remain untouched.

## Required slices

### FM-R00 — adoption and fresh handshake

- Record this amendment as accepted.
- Prove the candidate worktree, branch, HEAD, upstream parity, governance, single-writer state, deployed identity, provider identity, Playground/Production isolation, rollback availability, schema, migration, safe counts, R2 evidence linkage, custom-domain protection, and Production non-mutation.
- Keep raw provider identifiers and evidence outside Git.

### FM-R01 — live read-only audit

- Audit the custom-domain entry, Cloudflare Access boundary, signed-out state, authenticated Playground entry, route rendering, console/network/API behavior, responsive layouts, and the reported blank or placeholder states.
- Reproduce and classify each reported defect before code changes.
- Preserve screenshots and sensitive browser evidence outside Git.

### FM-R02 through FM-R07 — frontend and module reconciliation

- Reconcile the accepted FI-17 frontend without changing its product intent.
- Remove normal-runtime fake fixtures, mock labels, and fixture fallback behavior.
- Ensure Overview, Requests, Lending, Releases, Inventory, Restocking, Procurement, Receiving, Reference, Events, and Admin use real isolated backend contracts and expose truthful loading, empty, success, and failure states.
- Repair the reported stuck Request flow, unavailable Lending flow, broken Events/Admin flows, and any root rendering failure confirmed by FM-R01.
- Add or update focused regression tests before or with each repair.
- Do not create FI-18 or expand product scope.

### FM-R04 / FM-R08 / FM-R09 — resettable baseline

- Define the accepted privacy-filtered D1/R2 baseline and generation marker.
- Extend the existing reset tooling instead of replacing it.
- Reset only the isolated Playground working D1/R2 resources.
- Invalidate existing Playground sessions and other reset-scoped transient auth artifacts.
- Never re-read Production as part of routine reset; any Production-derived source is one-way, privacy-filtered, and sealed before reset use.
- Prove restored counts, foreign keys, D1-to-R2 linkage, generation change, old-session rejection, and two consecutive repeat resets with equivalent accepted results.

### FM-R10 — design audits

- Run Hallmark first and repair all material findings.
- Run Impeccable second and repair remaining material findings.
- Preserve WCAG AA semantics even when they override literal low-contrast visual values.

### FM-R11 — verification, Playground-only deployment, and closeout

- Run focused tests, the complete repository-required candidate gate, deterministic build and artifact checks, Cloudflare validation/dry-run, and privacy/isolation checks.
- Verify exact source commit, source tree, built artifact, bindings, hostname, and rollback before deployment.
- Deploy only the isolated Playground.
- Repeat live signed-out and authenticated acceptance over all required routes and responsive widths.
- Reconcile D1/R2 after deployment and confirm Production Worker, bindings, routes, and data were not mutated.
- Record final receipt, update the durable pointer/handoff, commit, push, and verify upstream parity.

## Invariants

- Production mutation is zero.
- Playground Worker, D1, and R2 remain distinct from Production.
- Email/provider delivery and schedules remain disabled in Playground.
- No reverse synchronization to Production.
- No passwords, tokens, session material, private provider identifiers, or raw private data enter Git, logs, screenshots, prompts, or reports.
- Normal UI runtime does not depend on mock fixtures.
- Reset affects only the identified isolated working resources and retains a demonstrated recovery path.
- One writer owns this candidate worktree.

## Acceptance evidence

- Exact Git and artifact identities.
- Provider identity and binding classifications with raw details kept private.
- Live defect matrix with reproduction and resolution evidence.
- Focused regressions and full candidate-gate output.
- Safe D1 counts, schema/migration, foreign keys, D1/R2 linkage, and generation marker.
- Two repeat reset receipts and old-session invalidation evidence.
- Hallmark and Impeccable results.
- Signed-out and authenticated route acceptance at 320, 390, 768, 1024, and 1440 widths.
- Direct confirmation that Production is unchanged.

## Stop conditions

Stop the affected operation on missing or contradictory authority, unexpected candidate dirt, another writer, resource/hostname ambiguity, Playground/Production binding overlap, unavailable rollback, privacy leakage, unknown destructive scope, failed verification, or any evidence of Production mutation. Preserve evidence and report the exact blocker; do not silently retry consequential writes.
