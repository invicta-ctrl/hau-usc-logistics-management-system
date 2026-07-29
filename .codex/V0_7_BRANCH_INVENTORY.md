# v0.7.0 Branch and Pull Request Inventory

Final consolidation candidate: `chore/v0.6-codex-continuity-bootstrap` at
Phase 26 documentation SHA `ab0e6fb5069ff198c40b75bf727f23a55c2618fd`.

Preservation: the Phase 0 all-ref bundle remains retained. A fresh Phase 27
all-ref bundle was verified outside Git at 16,488,539 bytes with SHA-256
`d902494d9f8050334523288b6534f7d4d1b137bc9b6d2d0d7bed7b55a18bd956`.
The old canonical `main` commit `91a30ee2de015bce1471a2d4fd71d9325af3e936`
is preserved by annotated tag `archive/pre-v0.7.0-main-91a30ee`.

| PR | Head | Classification | Evidence / disposition |
| --- | --- | --- | --- |
| #10 | `chore/codex-workflow-tooling` | UNKNOWN_REQUIRES_REVIEW | One clean unique commit adds only CodeQL, Renovate, and a developer-tooling handoff. It is a separate draft, has no v0.7.0 launch acceptance, and is excluded from the frozen product. Preserve it open and unmodified. |
| #9 | `chore/v0.6-codex-continuity-bootstrap` | UNIQUE_ACCEPTED | Primary v0.7.0 consolidation candidate; exact frozen product plus durable Phase 26 evidence; merge to `main` only after exact-head checks pass. |
| #8 | `docs/compatibility-policy` | UNIQUE_ACCEPTED | One six-line policy patch was not an ancestor; integrated verbatim into the candidate `AGENTS.md`. Close only after final `main` containment is proved. |
| #7 | `integration/v0.5-baseline` | CONTAINED | Exact head `12cdfd4` is an ancestor of the candidate. |
| #6 | `feat/live-sync-lending-search-catalog-controls` | CONTAINED | Exact head `0a3236a` is an ancestor of the candidate. |
| #5 | `feat/qr-inventory-scanning` | HISTORICAL_ONLY | Preserved accepted QR specification/prototype belongs to the post-launch roadmap; its Apps Script-era stack conflicts with the accepted Cloudflare/D1 launch architecture and QR is not launch-critical v0.7 scope. |
| #4 | `docs/adopt-spec-driven-development` | SUPERSEDED | Its governance intent is represented by the active `.codex/specs` and repository `AGENTS.md`; merging its old Apps Script/V1 candidate would reintroduce superseded architecture. |
| #3 | `feat/v1-one-shot-demo-and-deployment` | SUPERSEDED | Large Apps Script one-shot candidate conflicts with the accepted Worker/D1 architecture; retained in history/bundle for reference only. |
| #2 | `feat/apps-script-backend-and-launch-readiness` | CONTAINED | Exact head `81efe82` is an ancestor of the candidate. |
| #1 | `agent/restore-authoritative-visual-layer` | CONTAINED | Exact head `1b3d1ab` is an ancestor of the candidate. |

Active remote branches at Phase 27: `main`, `integration/v0.5-baseline`,
`docs/compatibility-policy`, `chore/v0.6-codex-continuity-bootstrap`, and
`chore/codex-workflow-tooling`. Local branches are the candidate, tooling,
integration baseline, and `main`. The two clean detached Phase 18 worktrees
are contained by the candidate; the separate tooling worktree is clean.

No branch, PR, detached worktree, or untracked `.codegraph/` content is deleted
by this inventory. Final containment, eligible PR closure, and optional remote
cleanup occur only after the verified `main` release baseline and v0.7.0 tag
exist. PR #10 remains open until its separate review is resolved.
