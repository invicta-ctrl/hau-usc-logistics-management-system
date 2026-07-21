# Current Codex Work Pointer

Program: HAU-USC Logistics v0.6
Phase: Phase 1 — SOL High
Mode: READ / VERIFY / RECONCILE before implementation

Active branch:
`chore/v0.6-codex-continuity-bootstrap`

Verified preserved predecessor:
`81efe82618048b79a821f93bd95a0be00eaeff43`

Preserved predecessor relationship to `main` at continuity setup:
- 63 commits ahead
- 0 commits behind
- merge base / `main`: `91a30ee2de015bce1471a2d4fd71d9325af3e936`

Historical state requiring reconciliation:
- historical branch `feat/apps-script-backend-and-launch-readiness` was no longer present as a remote branch when continuity setup began;
- closed PR #2 was not merged;
- the preserved predecessor commit still exists and was used as the base of this continuity branch;
- repository status/continuation files inherited from that predecessor contain stale text saying PR #2 is open/draft.

Active specification:
`.codex/specs/v0.6-phase-1-sol-high.md`

Later specifications:
- `.codex/specs/v0.6-phase-2-terra.md`
- `.codex/specs/v0.6-phase-3-sol-high.md`

Current bounded milestone:
Perform a read-only Phase 1 baseline reconciliation. Verify the local checkout, current remote branch, actual HEAD, upstream, working tree, current CI, the preserved 63-commit launch-readiness history, and the stale PR/status references. Determine the safe v0.5/v0.6 baseline integration path before any feature implementation.

Verified remote evidence before this pointer was created:
- commit `81efe82618048b79a821f93bd95a0be00eaeff43` exists;
- compared with `main`, it is 63 ahead / 0 behind;
- GitHub workflow runs associated with that checkpoint completed successfully for both `CI` and `Apps Script static check`;
- PR #2 is closed and unmerged;
- the old feature branch ref was not found when continuity setup began.

Next action:
1. Start a fresh Codex task at the Git root.
2. Read repository `AGENTS.md` first.
3. Read this file.
4. Read the active Phase 1 specification.
5. Run the required Git handshake and fetch.
6. Read only the minimum status/continuation/architecture files required by `AGENTS.md`.
7. Report the reconciliation result before editing application code.

Hard stops:
- do not start from stale `main` in a way that discards the preserved launch-readiness history;
- do not reset, clean, force-push, or discard unknown work;
- do not deploy Apps Script, modify production/staging data, apply migrations, seed access, or perform Drive/Sheet writes from this pointer;
- do not begin Phase 2 until Phase 1 has produced a verified handoff and this pointer has been advanced.

Continuity rule:
The repository is the durable context bridge. A different Codex/ChatGPT account or machine must reconstruct state from Git + `AGENTS.md` + this pointer + the active specification + targeted status/source/tests, not from prior chat memory.
