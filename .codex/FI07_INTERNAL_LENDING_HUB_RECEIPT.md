# FI-07 Internal Lending Hub — Writer Receipt

STATUS: ACCEPTED__CHECKPOINT_APPROVED
DATE: 2026-08-24
WRITER: TERRA_MAX:/root/fi07_lending_hub_writer
LOCK: RELEASED — independent Sol accepted this exact FI-07 candidate with no findings; the completed writer lock is no longer active.

## Authority and boundary

- Accepted packet: `.codex/specs/accepted/2026-08-24-fi07-internal-lending-hub-frontend-integration.md`.
- Source design role: Make provider export v44 `output/design/figma-make-source/src/app/LendingHubRoute.tsx`.
- Runtime contract: existing authenticated `GET /api/bootstrap/lending` bootstrap-module v2 and existing approval, handoff, evidence-upload, and return commands.
- No backend, Worker, auth, permission, schema, migration, provider, Figma, Playground, Production, deployment, D1, or R2 mutation was made.
- The preexisting untracked `.ai-bridge/` residue was neither inspected nor modified.

## Final independent acceptance

- Independent Sol review: **ACCEPTED — no findings** for the exact repaired FI-07 logical diff.
- Root recorded independent acceptance evidence for the same candidate, including the focused units, authenticated width matrix, exact trusted 4173 Preview Index evidence, and deterministic artifact identity.
- Final deterministic artifact identity: SHA-256 `707A00FDF4DC4BC6EB2C2053007B21F9997A9D51ADDF65F7EE1B65CAA091F738` for both `dist/index.html` and `HAU-USC_Logistics-Frontend-Shareable.html`.
- No source, artifact, contract, capability, or runtime change was made after the accepted evidence was produced.

## Delivered FI-07 scope

- Added strict lending bootstrap-v2 projection with exact module/version/request-only checks, malformed-row rejection, explicit nullable text validation, and redaction-safe optional availability/storage projection.
- Added presentation-only gates for `lending.approve`, `lending.handoff`, `lending.return`, and `evidence.upload`; server authorization remains authoritative.
- Added the DOL-only `InternalLendingHub`: authoritative loaded-page queue, mobile cards, responsive inspector, derived display-only overdue, full status history, custody/eligibility/asset context, stale/refresh/denied/error states, accessible focus/escape/scroll behavior, and no inaccurate global ticket total.
- Added review, handoff/issue, and governed return flows with client idempotency IDs, disabled in-flight controls, correlation receipts, 409/403 recovery refetch, and evidence selection/upload before return confirmation.
- Registered the fixture-only A4 Preview Index version. It uses deterministic lending data and local action simulation, with no session/capability/protected bootstrap/mutation/evidence traffic.
- Regenerated the deterministic shareable frontend artifacts through the approved build pipeline.

## Sol + Luna audit repair pass

- Corrected `assetOptions` interpretation: they are global available review candidates, never projected custody assignments. Only matching FOR_REVIEW candidates are shown, under explicit not-yet-assigned language; READY_TO_CLAIM, ON_LOAN, and RETURNED state now truthfully state that assigned custody asset identities are absent from this contract.
- Added page state and bounded Previous/Next traversal. Ticket reachability uses only loaded-page occupancy, never inventory-derived `total` or `hasMore`; an empty later page retains Previous navigation.
- Hardened reload safety: every submit requires `loadState === 'ready'`; stale/refreshing modals disable their primary action; disappearance clears selection/dialog/drafts and restores the queue-search fallback; lifecycle changes close no-longer-applicable dialogs with a notice.
- Added canonical traceable-review validation using target-inventory `traceableAssets` plus matching AVAILABLE candidates. Redaction and insufficient candidates fail closed; zero traceability sends no asset IDs; traceable approvals require an exact valid set.
- Made evidence idempotency content-aware with a SHA-256 file-byte digest used only during upload-command construction; no digest or file bytes are recorded in state receipts.
- Strictly validate lending pagination fields, enforce return-condition/outcome consistency, accept schema-valid blank borrowers with a truthful fallback, suspend inspector modal semantics while a child modal is open, and normalize authenticated navigation vocabulary to Internal Lending Hub / Internal Request Hub.
- Extended A4 exact-4173 coverage to local review, consumable issue, and governed-return demonstrations, each proving zero protected session/bootstrap/mutation/evidence traffic.
- Independent Sol rereview found that a multi-unit traceable reusable return could mix returned and lost/damaged outcomes even though the server applies one lifecycle condition to every assigned asset. Return reconciliation now receives the canonical selected inventory item and treats reusable items with positive, redacted, invalid, or unknown traceability as traceable: exactly one nonzero outcome bucket is required. A missing canonical item blocks the return; only a canonical reusable item with `traceableAssets === 0` retains aggregate mixed-outcome behavior, while consumables retain their governed aggregate semantics.

## Verification evidence

- `npm.cmd test -- tests/unit/fi07-lending-hub.test.js tests/unit/frontend-backend-adapter.test.js` — PASS, 30 tests across 2 files, including mixed traceable return, aggregate, unknown-traceability, and missing-item regressions.
- `npx.cmd playwright test --config playwright.frontend.config.js tests/e2e/fi07-lending-hub.spec.js` — PASS, 30 authenticated cases at 320/390/768/1024/1440; 5 intentional exact-4173-only A4 skips. The new traceable mixed-return case proves no evidence upload or return request is sent.
- `$env:HAU_FRONTEND_E2E_PORT='4173'; npx.cmd playwright test --config playwright.frontend.config.js fi07-lending-hub.spec.js --grep "A4 Preview"` — PASS, 5 exact local inspection cases at 320/390/768/1024/1440, covering review, issue, and return; each asserts zero protected API traffic.
- `npx.cmd playwright test --config playwright.frontend.config.js preview-index.spec.js --project=frontend-1440 --grep "renders exactly"` — PASS after the registry's preview-only count was truthfully updated to six.
- `npx.cmd prettier --check` over the changed FI-07 source, preview, navigation, and test files — PASS.
- `npm.cmd run build` — PASS; Vite transformed 1667 modules and regenerated the deterministic shareable.
- `npm.cmd run verify:dist` — PASS; deterministic SHA-256 `707A00FDF4DC4BC6EB2C2053007B21F9997A9D51ADDF65F7EE1B65CAA091F738` for both `dist/index.html` and `HAU-USC_Logistics-Frontend-Shareable.html`.
- `npm.cmd run check:agents` — PASS (12 project files).
- `npm.cmd run check:continuation` — PASS after this repair receipt/current-state update.
- `npm.cmd run handoff:verify` — PASS after this repair receipt/current-state update.
- `npx.cmd tsc --noEmit` is not available because this repository has no installed TypeScript compiler; no dependency installation was performed. Vite build and Vitest transforms passed.

## Checkpoint and next intake

- The accepted FI-07 source, tests, artifacts, accepted packet, and continuity evidence are approved for the normal `frontend-design-integration` checkpoint commit and push in this finalization.
- After that checkpoint, the durable pointer advances only to **FI-08 Release Desk intake and repository handshake**. FI-08 has no accepted implementation packet yet.
- Next exact action: bounded FI-08 contract, design-source, and repository-source inspection under the accepted R1 one-shot, R1-A2/A3/A4 amendments, and project policy, followed by accepted-packet creation only. Do not implement FI-08 in this handoff.
