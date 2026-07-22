# v0.7.0 Branch and Pull Request Inventory

Baseline candidate: `chore/v0.6-codex-continuity-bootstrap` at Phase 0 SHA `a3059a8264aa74bc1f5ec0113cc59826a62cf2ff`.

Preservation: verified all-ref bundle outside Git, SHA-256 `39b5dff168b705fb68b71d7dd822e02077ed0e58c9401119e716d0738c735b93`.

| PR | Head | Classification | Evidence / disposition |
| --- | --- | --- | --- |
| #9 | `chore/v0.6-codex-continuity-bootstrap` | UNIQUE_ACCEPTED | Primary v0.7.0 consolidation candidate; open draft against `main`. |
| #8 | `docs/compatibility-policy` | UNIQUE_ACCEPTED | One six-line policy patch was not an ancestor; integrated verbatim into the candidate `AGENTS.md`. Close only after final `main` containment is proved. |
| #7 | `integration/v0.5-baseline` | CONTAINED | Exact head `12cdfd4` is an ancestor of the candidate. |
| #6 | `feat/live-sync-lending-search-catalog-controls` | CONTAINED | Exact head `0a3236a` is an ancestor of the candidate. |
| #5 | `feat/qr-inventory-scanning` | HISTORICAL_ONLY | Preserved accepted QR specification/prototype belongs to the post-launch roadmap; its Apps Script-era stack conflicts with the accepted Cloudflare/D1 launch architecture and QR is not launch-critical v0.7 scope. |
| #4 | `docs/adopt-spec-driven-development` | SUPERSEDED | Its governance intent is represented by the active `.codex/specs` and repository `AGENTS.md`; merging its old Apps Script/V1 candidate would reintroduce superseded architecture. |
| #3 | `feat/v1-one-shot-demo-and-deployment` | SUPERSEDED | Large Apps Script one-shot candidate conflicts with the accepted Worker/D1 architecture; retained in history/bundle for reference only. |
| #2 | `feat/apps-script-backend-and-launch-readiness` | CONTAINED | Exact head `81efe82` is an ancestor of the candidate. |
| #1 | `agent/restore-authoritative-visual-layer` | CONTAINED | Exact head `1b3d1ab` is an ancestor of the candidate. |

Active remote branches at Phase 0: `main`, `integration/v0.5-baseline`, `docs/compatibility-policy`, and `chore/v0.6-codex-continuity-bootstrap`. Local branches/worktrees: candidate, integration baseline, and `main`; only the candidate worktree is open.

No branch or PR is deleted by this inventory. Final containment, classification, PR closure, and optional remote cleanup occur only after the verified `main` release baseline exists.
