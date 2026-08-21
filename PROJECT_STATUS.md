# Project Status

## Current state

### v0.8.3 owner-fast-close release state

- **Milestone:** `V83_PRODUCTION_RELEASED_OWNER_FAST_CLOSE_OVERRIDE_S17_PASS` is complete under Earl's explicit fast-close authority; protected-main acceptance, recovery rotation, lossless temporary-state hygiene, writer-lock release, and final v0.8.3 handoff are complete.
- **Production identity:** direct read-only reconciliation proves v0.8.3 at frozen f8 with 100% Worker traffic, schema32/migrations 0031+0032/single 0032 ledger/FK0/three Activity History tables, roster configuration/protected-secret presence, private recovery evidence, and no Playground crossover.
- **Smoke:** `HTTP_SMOKE_EXPECTED_NONCANONICAL_HOST_PERIMETER_DENY_STATUS_UNRETAINED` is the owner-accepted minimal fallback; `HTTP_PASS` is not claimed and no retry is authorized.
- **Playground gates:** the candidate-bound source gate is historical `COMPLETED_NONPASS_OWNER_ACCEPTED_FOR_V083_FAST_CLOSE`, never PASS; live ID-H delivery and manual/browser gates are `OWNER_WAIVED_OR_UNRUN`, never PASS.
- **Git/recovery:** PR #25 merged normally to accepted main `07aa2d2dfcee12fb1ec26fc5a3658ca9ca9be34e` with f8 application-path parity and passing required CI. Tag `v0.8.3` resolves there; the recovery ladder is rotated/read back, and outgoing r3 remains preserved by ancestry and existing immutable tags. The f8 candidate and application artifact remain frozen.
- **Future boundaries:** preserve/refresh v0.8.4 without implementation; retain frontend-design integration for documented adoption preparation only. Backend/API/auth/data contracts remain authoritative.
- **Writer:** `ACTIVE_WRITER: NONE`; the v0.8.3 writer lock is released and the handoff is ready. Any v0.8.4/frontend preparation uses a separate branch-local lock.
- **Release hygiene:** PASS_WITH_PRESERVATION_EXCEPTION. Temporary v0.8.3 refs were closed only after unique-history/byte-equivalence proof; the historical Gate-A audit package is retained by immutable archive tag; the v082 product-dirty worktree remains untouched. An unregistered generated-only node_modules residual is a tooling-blocked P3 with no Git history or ref loss.
- **Next action:** do not reopen v0.8.3. A separately locked v0.8.4 preservation refresh may proceed without implementation or rewrite.

### Historical baseline

- **Milestone:** V0.8.1 Design DNA Research Gate, initial governance commit `4825f02dfa96b9e5e6fe018d1bfd252d7720f47d`, and the bounded post-commit closure-truth repair are complete; Luna's pre-commit final content audit PASS occurred before this closure commit, and an independent read-only exact-SHA audit follows normal closure commit/push before Sol's owner handoff; implementation remains unauthorized pending Earl's design-direction decision.
- **Design research:** eight independent live-reference studies, a reference matrix, one coherent USC Design DNA, proposed design/component/motion/3D/accessibility/performance systems, a module rollout plan, and an owner-facing gate handoff are complete under `docs/design/`.
- **Proposed direction:** “Institutional Logistics Ledger” — a calm operational workbench with unequal overview hierarchy, evidence-led records, scarce gold focus, restrained continuity motion, and a 2D-authoritative optional spatial strategy.
- **Design authority:** incumbent `DESIGN.md`, V5 source, and runtime fingerprint remain authoritative until Earl explicitly accepts a bounded implementation slice.
- **Orchestration governance:** GPT-5.6 Sol is the sole read-only orchestrator with zero Sol children; Terra MAX is the sole writer class with one canonical integration writer and a 16-child cap; Luna MAX is read-only with a 16-child cap; only Sol may spawn at depth one.
- **Production identity:** protected production remains `v0.8.0` at `3059098ff2a2935fec59df52748ccae420aadba7`; no production deployment, migration, or business-data mutation occurred.
- **Playground:** exact frozen branch-tip candidate deploys only by explicit workflow dispatch to distinct working D1/R2 bindings; readiness, safe status, module switcher, real-login path, session protection, dirty/reset reconciliation, and CLEAN state pass.
- **Parity:** the one-way production-derived D1/R2 baseline is verified with explicit privacy exceptions; credentials, sessions, private evidence, and protected roster identity are excluded or replaced deterministically.
- **Git:** permanent pointers are `main`, `backup/last-known-good`, and `regression/r1` through `regression/r3`; the only active temporary production-bound branch is `release/v0.8.1-isolated-staging-playground`. No staging, playground, production, or develop branch was created.
- **Migration:** `NONE_REQUIRED`; schema 30 and `0030_production_access_and_operations.sql` remain current.
- **Recovery:** prior staging Worker/D1/R2, fresh private exports, D1 reset bookmarks, R2 manifests, and rollback evidence remain outside Git.
- **External boundaries:** Google writes and provider/email sends are none. Production D1 and R2 read-only pre/post fingerprints are unchanged.
- **Writer:** `ACTIVE_WRITER: NONE`; the canonical governance-only lock is released after `TERRA_MAX:terra_governance_writer` completed the closure-truth repair; no product/runtime file was in scope.
- **Next action:** Earl reviews the Design Gate and explicitly approves, rejects, or amends the proposed Institutional Logistics Ledger direction and bounded `admin.overview` first slice; do not implement or deploy before that decision.

## Verification

- Direct Production reconciliation is green for exact f8/runtime/traffic, schema/migration/ledger/FK/history, protected roster configuration/secret-name presence, private recovery receipt, and isolation. The one helper smoke reached an expected noncanonical host perimeter outcome; its status is not retained and it is not HTTP PASS.
- Focused governance validation passed before the initial normal commit/push: pre-final Sol review and Luna review/recheck; `tests/unit/codex-governance.test.js` (14 tests); `check:agents` (12 project files); `check:continuation`; and `handoff:verify`. Markdown/JavaScript formatting, `git diff --check`, the complete logical-diff review, and the targeted active-governance contradiction scan passed; TOML is validated by the repository's restricted-TOML governance check. The completed post-commit closure-truth repair reran focused Prettier, `git diff --check`, `check:governance`, `handoff:verify`, ledger/record coherence, targeted contradiction/no-disallowed-path checks, and complete-diff review successfully; Luna's pre-commit final content audit PASS occurred before this closure commit, and an independent read-only exact-SHA audit follows normal closure commit/push before Sol's owner handoff.
- Research documentation and the completed governance amendment passed their applicable link/path, formatting, governance, handoff, focused validation, and complete-diff reviews; neither changed application, build, generated artifact, migration, or provider configuration.
- Live public-reference research covered search/filter/command/component-preview/3D-orbit states. The managed browser was fixed at 1280 × 720, so implementation-phase responsive testing remains required.
- Canonical `npm run check`: governance/handoff, lint (zero errors; one existing warning), deterministic build, 133 files / 891 tests, Apps Script, dist parity, Cloudflare types, and dry-run pass.
- Playground suite: 8 files / 23 tests pass, including production-denial, branch-governance, baseline, reset, read-only R2 fingerprint, and session-guard coverage.
- Live privileged playground probe and deliberate D1/R2 dirty/reset rehearsal pass.
- Production D1 export integrity/FK/schema/migration and exact pre/post fingerprint pass; safe R2 pre/post fingerprint evidence is retained privately.
