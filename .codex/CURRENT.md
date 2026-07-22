# Current Codex Work Pointer

Program: HAU-USC Logistics v0.6
Phase: Phase 2 — TERRA
Required model: GPT-5.6 Terra
Status: ACTIVE

Active branch:
`chore/v0.6-codex-continuity-bootstrap`

Latest verified Phase 1 implementation checkpoint:
`c07e6e6ad5777710a68bef4d1d2aa553b964c108`

The next Codex task must fetch and verify the actual branch HEAD, upstream parity, working tree, and PR #9 checks. The checkpoint above identifies the verified Phase 1 implementation; the Phase 1 handoff commit follows it.

Preserved rollback checkpoints:
- v0.6 pre-authentication merge: `aeb05c71937b8479f66d08a9a64800b005343784`
- exact integrated v0.5 candidate: `12cdfd4de73120bfeedf49582c83e1861ae36b99`
- preserved launch-readiness predecessor: `81efe82618048b79a821f93bd95a0be00eaeff43`

Mandatory workflow/context policy:
`.codex/PHASE_AND_CONTEXT_POLICY.md`

Active specification:
`.codex/specs/v0.6-phase-2-terra.md`

Later specification:
- `.codex/specs/v0.6-phase-3-sol-high.md`

Phase 1 result:
- reconciled and merged the exact v0.5 baseline without changing `main` or merging PR #7;
- locked the v0.6 architecture, identity, role/scope, experience-routing, threat-model, migration, and rollback contracts;
- implemented portable authentication, activation, session, CSRF, password-reset, account-status, authorization, HTTP, cookie, and repository/service foundations;
- added the HTTP-mode Access ID login and first-login onboarding gate with no client role selector;
- verified governance, lint, 44 Vitest files / 340 tests, deterministic builds and generated parity, sensitive-file/token scans, and full Playwright with 73 passes / 143 intentional skips / 0 failures;
- pushed implementation checkpoint `c07e6e6` to draft PR #9; remote `validate`, `verify`, and `browser-smoke` checks all pass.

Phase 2 shared-shell milestone (verified for checkpoint):
- Verified the Phase 1 handoff at `d8af7bb4a5e986fc4dfd166ae664f5758c46a1fd`, clean and synchronized with `origin`; draft PR #9 remains open and its `validate`, `verify`, and `browser-smoke` checks are successful.
- Read S0003 once and created `.codex/DESIGN_REFERENCE_DIGEST.md` with its SHA-256, source hierarchy, shared tokens, role accents, interaction grammar, mobile rules, prohibitions, and role placeholders.
- Implemented the S0003 shared shell through the non-generated runtime extension: role-scoped accents, a compact mobile header, five primary mobile destinations, and an overflow panel for all remaining existing destinations. The mobile controls delegate to existing navigation and do not change authorization.
- Preserved the immutable generated visual baseline and Phase 1 authentication, authorization, ledger, transaction, and rollback contracts. Rebuilt all derived artifacts through `npm run build`.
- Verification: `npm run check` passed with 45 Vitest files / 341 tests; the complete `npx playwright test --reporter=dot` gate completed with `status: passed` (216 tests scheduled, no failed tests); `git diff --check` passed.
- Administrator checkpoint: code milestone `658410b24b6556131d11901551911d553a1832b7` is pushed to the active branch. It read only `ADMIN.html` (SHA-256 `88e13f1e34cb9175d943f362444655f0f10d4bc6179f9e4af2be825ef2e6c5a3`), appended its durable decisions to the digest, and added the Administrator control desk to the existing server-authorized Reference Administration workspace. Its four control areas only select existing domains; no authorization, service, transaction, or ledger contract changed. Focused reference-admin proof passed 6 / 24 intentional skips, and `npm run check` passed with 45 Vitest files / 341 tests.
- Director checkpoint: code milestone `c54d68af372865be272eda0331f8258b7d84858f` implements the S0002 decision-first leadership view inside the shared shell. It reads current server-derived state for event-series readiness, leadership decisions, cross-workflow blockers, and release readiness; its action map delegates to the existing request, procurement, release, lending, and inventory workspaces. The bounded Management & Access explanation creates no access or configuration path. Focused role proof passed at 390px and 1366px, and `npm run check` passed with 46 Vitest files / 342 tests.
- Food checkpoint: code milestone `a6bcd7e3be934479496ce6fc05e43903989420a0` implements the S0002 deadline-first Food view in the shared role layer. It derives food-line, sourcing/budget, cumulative receiving, and release-readiness signals from current state and delegates to existing shared workspaces. The Food capability boundary leaves procurement, receiving, evidence, and release authority server-owned. Focused Food proof passed at 390px and 1366px, and `npm run check` passed with 46 Vitest files / 343 tests.
- Inventory & Pantry checkpoint: code milestone `bf350fe1f1bbd06c547cdcf8bbf71fa66b5035c6` implements the S0002 exception-first stock view in the shared role layer. It keeps on-hand, reserved, and available-to-promise semantics separate; derives catalog-attention, circulation, and release-readiness signals from current state; and delegates to the existing Inventory, Lending, Restocking, and Release workspaces. The inventory authority boundary leaves every stock-moving action capability-bound and ledger-aware. Focused Inventory proof passed at 390px and 1366px, and `npm run check` passed with 46 Vitest files / 344 tests.
- Materials & Documentation checkpoint: code milestone `67c542263431c813cb5ae6488cbdacf38e74fbae` implements the S0002 traceable fulfillment view in the shared role layer. It derives canvassing, budget, procurement, and release-readiness signals from current state and delegates to the existing Request Center, Procurement & Deliverables, Release Desk, and Inventory workspaces. Exact specifications, quote freshness, evidence, cumulative receiving, and provenance stay connected; purchasing, receiving, transfer, and release authority remain server-owned. Focused Materials proof passed at 390px and 1366px, and `npm run check` passed with 46 Vitest files / 345 tests.
- Gate 5 Request Center and Office Lending Hub checkpoint: code milestone `09315fbb68119aa55e16bba26b4926b60b3dfba9` preserves Event Logistics and Catalog Restock, exposes Food, Materials, and Venue & Equipment together in Event Step 4, filters additional requests to the selected event, retains combined dates and predictive routing, and proves submission creates no stock or reservation movement. Lending now enforces one-to-eight digit Student IDs at client and server boundaries and requires a capability-authorized reviewer to attest the borrower-specific approved source before approval; the source and reviewer are retained in append-only history/audit metadata. Existing lifecycle, stock revalidation, idempotency, handoff, return, authentication, authorization, and ledger protections remain unchanged.
- Gate 5 verification passes: `npm run check` completed with 46 Vitest files / 348 tests, deterministic build/parity, Apps Script validation, and standalone verification; the focused Request/Lending/composite browser suite passed 29 / 31 intentional skips across configured viewports. Gate 5 is complete and checkpointed locally; the next bounded slice is Gate 6 operational workflow acceptance after this checkpoint is pushed and PR #9 CI is verified.

Smallest safe next action:
- Push and verify the Gate 5 checkpoint and PR #9 CI, then audit and complete only Gate 6 Release Desk, Inventory, Restocking, Canvass, and Procurement acceptance against the active Phase 2 specification.

Reference bundle verified present on 2026-07-21:
- `ADMIN.html`
- `DIRECTOR.html`
- `Food.html`
- `INVENTORY.html`
- `MATERIALS.html` (the supplied filename differs from an older `MATERIALS(2).html` reference)
- `HAU-USC_Logistics-BASELINE.html`
- `HAU-USC_Logistics_S0003_Design_Direction_Preview.html`

Hard boundaries:
- do not resume this completed Phase 1 task;
- do not begin Phase 3, Cloudflare/D1 migration, production promotion, Apps Script deployment, operational institutional-data writes, or PR merge;
- do not alter authentication/session architecture, canonical role/capability semantics, ledger/atomicity invariants, or rollback rules without the escalation required by the Phase 2 specification;
- do not reset, clean, force-push, or discard unknown work.

Continuity rule:
The repository is the durable context bridge. A different Codex/ChatGPT account or machine must reconstruct state from Git + `AGENTS.md` + this pointer + the phase/context policy + active specification + targeted context, not prior chat memory.
