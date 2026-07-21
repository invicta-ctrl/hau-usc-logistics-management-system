# Current Codex Work Pointer

Program: HAU-USC Logistics v0.6
Phase: Phase 2 — TERRA
Required model: GPT-5.6 Terra
Status: READY FOR MANUAL MODEL SWITCH

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

Phase 2 first bounded task:
1. Start a new Codex task with GPT-5.6 Terra.
2. Read `AGENTS.md`, this file, `.codex/PHASE_AND_CONTEXT_POLICY.md`, and the active Phase 2 specification.
3. Perform the Git handshake and verify PR #9 at the actual remote head.
4. Read the S0003 design-direction preview in full and create `.codex/DESIGN_REFERENCE_DIGEST.md`.
5. Begin only the shared-shell/design-system work authorized by the Phase 2 specification. Read a role HTML reference only when implementing that role.

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
