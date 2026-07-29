# Shared Token-Efficiency and Continuity Contract

## Minimum cold start

Read only:

1. `AGENTS.md`
2. `.codex/CURRENT.md`
3. `.codex/CURRENT_TASK.md`, when present
4. `.codex/PHASE_AND_CONTEXT_POLICY.md`
5. `.codex/PHASE_3_STAGING_CANDIDATE_HANDOFF.md`
6. `.codex/PRODUCTION_LAUNCH_HANDOFF.md`, when present
7. `.codex/LAUNCH_EVIDENCE_INDEX.md`, when present
8. the current task prompt

Do not automatically read:

- the full README;
- all historical continuation records;
- the whole docs tree;
- the whole source tree;
- the whole tests tree;
- generated artifacts;
- large design HTML references.

Use targeted paths, diffs, hashes, manifests, and the design digest.

## Git handshake

```powershell
git status --short --branch
git branch --show-current
git rev-parse HEAD
git remote -v
git fetch origin --prune
git rev-list --left-right --count HEAD...@{upstream}
git branch -vv
git worktree list
```

Preserve unknown work.

Never automatically reset, clean, discard, force-push, rewrite shared history, or delete branches.

## Token budget policy

### Subagents

Do not maximize subagent count.

Default:

- zero subagents for startup and browser work;
- one targeted subagent for a bounded review;
- two concurrent subagents only when their work is independent and high-value;
- never more than two concurrent subagents in Sol High or Terra High tasks;
- Sol Ultra may use at most two independent reviewers for the highest-risk domains.

Subagents are read-only.

The primary agent is the only writer, browser operator, credential handler, migration executor, deployer, merger, and rollback operator.

### Reads

- Read each large file once per unchanged hash.
- Record hashes in `.codex/LAUNCH_EVIDENCE_INDEX.md`.
- Reuse a verified digest instead of rereading sources.
- Use `git diff --stat`, `git diff --name-only`, and targeted diffs.
- Do not ask multiple agents to review the same low-risk file.
- Do not reopen provider pages already inventoried unless state could have changed.

### Tests

During repairs:

- run focused tests only;
- run affected browser cases only;
- do not run the full suite after every small change.

Before freezing a candidate:

- run one complete required repository gate;
- run one complete deployed acceptance gate.

Reuse results only when SHA, artifacts, configuration, migrations, and provider state are unchanged.

### Logs

- cap command output;
- save full logs privately when needed;
- record only relevant excerpts and hashes;
- never paste secrets, tokens, private IDs, or personal data.

## Interruption-resilient checkpointing

Update `.codex/PRODUCTION_LAUNCH_HANDOFF.md` and `.codex/LAUNCH_EVIDENCE_INDEX.md` immediately after each milestone:

1. Git/PR/CI verified
2. private configs created
3. Cloudflare resources verified/created
4. Google source and Drive mappings verified
5. backup created
6. migrations applied
7. import reconciled
8. deployment verified
9. acceptance completed
10. rollback verified
11. release merged/tagged
12. production deployed
13. production smoke completed

Create and push a small documentation checkpoint after any milestone involving external state, unless doing so would interfere with an active migration or rollback.

This ensures a usage-limit interruption can resume from the last completed external milestone.

## Private files

Use a private directory outside Git:

```powershell
$PrivateRoot = Join-Path $env:USERPROFILE ".hau-usc-private\v0.6-launch"
```

Expected files:

```text
phase3-authorization.json
production-authorization.json
wrangler.staging.private.jsonc
wrangler.production.private.jsonc
google.staging.private.json
google.production.private.json
```

Never print or commit their contents.

## Browser actions

Use the authenticated browser only through the primary agent.

For MFA, login, consent, CAPTCHA, or security-key prompts:

```text
ACTION NEEDED IN BROWSER:
Complete the indicated step in the open tab, then reply “done.”
```

After the reply, verify the active account and resume the same step.

## Safety invariants

Preserve:

- append-only ledger truth;
- separate on-hand, reserved, and available-to-promise;
- request submission never deducting physical stock;
- cumulative receiving;
- idempotency;
- duplicate handoff, return, release, and receiving prevention;
- server-side authorization;
- request-only privacy;
- fail-closed evidence mappings;
- backup and reconciliation before consequential writes;
- private values outside Git.

## Repair loop

```text
Reproduce
→ identify root cause
→ add regression coverage
→ repair
→ run focused verification
→ rerun the failed gate
→ continue
```

Ordinary failures are not handoff points.

## Model-switch boundary

At each completed task:

1. update the durable handoff;
2. commit and push the safe checkpoint;
3. verify remote SHA and CI when applicable;
4. print the exact next-model message;
5. stop;
6. start a fresh task with only the shared contract and next prompt.


