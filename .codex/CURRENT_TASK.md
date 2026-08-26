# Current Bounded Task — FI-14 Isolated Playground Deployment + Acceptance

INTENT: RELEASE_PREPARATION + TESTING + ISOLATED_PLAYGROUND_DEPLOYMENT
MODE: EXECUTE
OBJECTIVE: Run the full exact-candidate/isolation/rollback preflight for the A8/candidate-gate-refrozen FI-13 application candidate, then deploy and accept only that exact candidate through the existing isolated Playground workflow if every gate remains green. Production remains untouched.
TARGET: .codex/specs/accepted/2026-08-26-fi14-isolated-playground-deployment-acceptance.md; .github/workflows/release-candidate.yml; tests/unit/release-pipeline.test.js; FI-13 receipt; new FI-14 receipt and current-chain records after verified deployment.
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-26-fi14-isolated-playground-deployment-acceptance.md
START_HEAD: e1c90fda32bc62566807ce4ebc8d747a034ea740
UPSTREAM_AT_HANDSHAKE: origin/frontend-design-integration @ e1c90fda32bc62566807ce4ebc8d747a034ea740 (+0/-0)
AUTHORITY: Earl FI09-FI17-SOL-COGNEE-2026-08-26 sections 16 and 20; Sol FI-14 route decision; TOKEN-OPT-001-A8; project policy; accepted FI-13 freeze; accepted isolated Playground governance; current repository contracts.
REQUIRED_MODEL: GPT-5.6 Terra / Max is the sole canonical frontend writer; Sol remains read-only planner, integrator, reviewer, and final acceptance authority.
TASK_STATUS: FI14_ACCEPTED__CANDIDATE_GATE_REFROZEN__SOL_REVIEW_PENDING__NO_REF_UPDATE_OR_DISPATCH
ACTIVE_WRITER: /root/fi14_terra_writer__GPT-5.6_TERRA_MAX
WRITER_LOCK: ACQUIRED__FI14__frontend-design-integration
RISK: HIGH
SCOPE: Only the retired workflow artifact path/direct assertion, native private-manifest rollback-target guard/direct tests, and the A8 validator/candidate-only lint gate correction; required source/config freezes with explicit unchanged application artifact proof; exact temporary candidate branch/ref; the existing GitHub isolated Playground workflow; bounded live acceptance/evidence; required records/commits/pushes.
OUT_OF_SCOPE: Frontend application behavior/visual redesign; Make/Figma; backend/API/Worker/auth/authorization/session/schema/migration/D1/R2/data/provider configuration; Production/main; resource creation/crossover; unapproved local preview restart; `.ai-bridge/`; FI-15+.
INVARIANTS: The pre-repair FI-13 application artifact hash is `B1B1F51E7C5DB3B96F7EB55A9CFE3C6E7F36B9D741807219BB6BEA2FB1B20556`; no app artifact byte may change. Candidate ref must exactly equal its new refrozen source/config commit and satisfy the temporary-branch pattern. Playground remains isolated with provider/email disabled, no routes/triggers, no Production bindings, and no secret/private-value disclosure.
VERIFICATION: Focused release-pipeline/governance checks; build; verify:dist; deterministic artifact hash; continuation/handoff/diff checks; GitHub candidate workflow exact-SHA validation and isolated deployment; bounded live readiness/version/route/auth/privacy/role/responsive/console/network evidence; upstream parity.
STOP_CONDITIONS: Missing/ambiguous GitHub/Cloudflare authorization, private manifest/secret availability, branch identity, rollback/redeploy target, Worker/API/D1/R2/provider isolation, exact app artifact equivalence, or any Production crossover/private-value exposure; any required backend/data/migration/provider change; actual frontend defect beyond accepted scope.
DELEGATION_LEDGER:

- writer=/root/fi14_terra_writer | model=gpt-5.6-terra | reasoning=max | role=sole canonical FI-14 frontend/release-preparation writer | mode=execute | scope=smallest workflow artifact-path repair and rollback-target guard, refreeze, exact temporary candidate ref, isolated Playground deployment/acceptance/evidence | owned=FI-14 packet/current-chain/receipt,release-candidate workflow,Playground guard/direct tests,required deterministic artifacts | excluded=frontend application behavior/backend/Worker/auth/authorization/schema/migration/D1/R2/data/provider configuration/Figma/Make/Production/main/.ai-bridge/FI-15+ | status=ACTIVE__LOCK_ACQUIRED | evidence=handshake 0/0 with preserved .ai-bridge; Cloudflare/GitHub preflight without private values; canonical A3 preview recovery through a runtime-only private manifest.

PREVIEW_TARGET: http://127.0.0.1:4173/
PREVIEW_STATUS: RUNNING__HEALTHY__A3_RECOVERED__RUNTIME_MANIFEST_PRIVATE
NEXT_EXACT_ACTION: Await Sol review of exact source/config commit `a377f079ce39f6c8b8e5e76f80f59b62e932d80e` / tree `4177693026d0b239dff6255d5a4cbaa52cf26d86`. Only after explicit authorization re-run full FI-14 preflight, update the preserved temporary release ref to that exact commit, and dispatch the existing isolated workflow only if identity, authorization, isolation, and rollback gates are green.
