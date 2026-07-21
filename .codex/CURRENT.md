# Current Codex Work Pointer

Program: HAU-USC Logistics v0.6
Phase: Phase 1 — SOL High
Required model: GPT-5.6 Sol — High
Status: READ / VERIFY / RECONCILE

Active branch:
`chore/v0.6-codex-continuity-bootstrap`

Verified continuity checkpoint at policy update:
`d44bebeacf8ca56bdb8230dabeccc73087f1f17e`

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
- inherited historical records may still contain stale open/draft PR wording.

Mandatory workflow/context policy:
`.codex/PHASE_AND_CONTEXT_POLICY.md`

Active specification:
`.codex/specs/v0.6-phase-1-sol-high.md`

Later specifications:
- `.codex/specs/v0.6-phase-2-terra.md`
- `.codex/specs/v0.6-phase-3-sol-high.md`

Current bounded milestone:
Perform a read-only Phase 1 baseline reconciliation. Verify the local checkout, current remote branch, actual HEAD, upstream, working tree, current CI, preserved launch-readiness history, and stale PR/status references. Determine the safe v0.5/v0.6 baseline integration path before application-code implementation.

Minimum cold-start read set:
1. `AGENTS.md`
2. this file
3. `.codex/PHASE_AND_CONTEXT_POLICY.md`
4. active Phase 1 specification

After that, perform the Git handshake. Read other files only when the current milestone requires a specific fact. Do not reread unchanged long documents or broad-scan the repository.

Verified remote evidence inherited from continuity setup:
- commit `81efe82618048b79a821f93bd95a0be00eaeff43` exists;
- compared with `main`, it was 63 ahead / 0 behind;
- associated GitHub workflow runs completed successfully for both `CI` and `Apps Script static check`;
- PR #2 was closed and unmerged;
- the old feature branch ref was not found when continuity setup began.

Next action:
1. Start a fresh Codex task at the Git root using GPT-5.6 Sol — High.
2. Read only the minimum cold-start set above.
3. Run the required Git handshake and fetch.
4. Read only targeted status/continuation/architecture sections required to reconcile the baseline.
5. Report the reconciliation result before editing application code.

Phase 1 completion boundary:
When all Phase 1 acceptance criteria are verified, advance this pointer to:
- Phase: `Phase 2 — TERRA`
- Required model: `GPT-5.6 Terra`
- Status: `READY FOR MANUAL MODEL SWITCH`
- Active specification: `.codex/specs/v0.6-phase-2-terra.md`

Then commit/push the verified Phase 1 handoff when authorized, print the mandatory Phase 1 completion message from `.codex/PHASE_AND_CONTEXT_POLICY.md`, and **STOP THE CURRENT CODEX TASK**. Do not begin Phase 2 in the Sol task.

Hard stops:
- do not start from stale `main` in a way that discards preserved launch-readiness history;
- do not reset, clean, force-push, or discard unknown work;
- do not deploy Apps Script, modify production/staging data, apply migrations, seed access, or perform Drive/Sheet writes from this pointer;
- do not begin Phase 2 until Phase 1 has a verified handoff and this pointer has been advanced;
- do not continue past a completed phase boundary without a manual model switch.

Continuity rule:
The repository is the durable context bridge. A different Codex/ChatGPT account or machine must reconstruct state from Git + `AGENTS.md` + this pointer + the phase/context policy + active specification + targeted context, not prior chat memory.