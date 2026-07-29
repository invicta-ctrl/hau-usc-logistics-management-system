# Current Task

INTENT: DEPLOYMENT
SECONDARY INTENTS: CONSOLIDATION, TESTING, SECURITY, RELEASE
MODE: execute
TARGET: HAU-USC Logistics v0.7.0 Phase 27 Branch Consolidation
SKILLS: lean-ctx, github, cloudflare-deploy, browser
AUTHORITY: autonomous Phase 18–29 master prompt; `.codex/specs/v0.7.0-production-master.md`; accepted amendments; repository invariants
RISK: critical
DELIVERABLE: accepted work consolidated into the canonical branch with preserved refs, exact merge identity, rebound private launch package, and affected gates green
VERIFICATION: branch and pull-request inventory; preserved old-main reference; accepted tree containment; merge policy and commit; exact main CI; staging/runtime rebinding; private production authorization/preflight; zero unresolved P0/P1
STOP CONDITIONS: missing accepted work; unknown branch divergence; failed preservation; merge conflict; failed exact-main gate; stale private package; any production write before Phase 27 passes

## Active Phase 27 contract

- Inventory local and remote refs and prove no accepted launch work is omitted.
- Preserve the pre-consolidation canonical branch before merging.
- Consolidate through the accepted pull request using repository-approved
  history semantics; do not silently squash immutable implementation history.
- Verify the exact resulting canonical head, CI, tree identity, staging
  runtime, and rebound private production package.
- Production remains read-only throughout Phase 27.

## Current execution checkpoint

- Phase 26: accepted at frozen product/staging candidate
  `4cba9f09ebd88085f1f93f0c4d37fbb8c185c4c3`.
- Repository gate: 76 Vitest files / 495 tests and every required check pass.
- Controlled deployed browser gate: 15 / 15; exact-product-head CI: 6 / 6.
- Final reconciliation, hashes, schema/bindings, D1 export/bookmark, R2 safe
  inventory, Worker version, rollback, and private production package pass.
- Documentation-only Phase 26 acceptance commit must not replace the frozen
  product identity or trigger a staging deployment.
- Production: untouched and prohibited.
