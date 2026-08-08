# v0.7.2 — Codex Resume Prompt (copy/paste)

**DO NOT START FROM MAIN.**
Continue from `release/v0.7.2-production-access-operations` at exact SHA
`6d371e826c8dd921ad53699ad06b6ba9aa1c218b`. PR #15 is OPEN and NOT merged.

---

## INTENT

`BUG_FIX + DEPLOYMENT + RELEASE_CLOSEOUT`

## OBJECTIVE

Close one remaining P1, freeze a candidate that passes a fresh exact-SHA review,
then take v0.7.2 to staging and production.

## TARGET

```text
Repo:     invicta-ctrl/hau-usc-logistics-management-system
Worktree: D:/Documents/Codex/HAU-USC Logistics/active/hau-usc-logistics-management-system
Branch:   release/v0.7.2-production-access-operations
HEAD:     6d371e826c8dd921ad53699ad06b6ba9aa1c218b
Tree:     CLEAN
PR:       #15 (OPEN, DRAFT, base main)
```

## AUTHORITATIVE SOURCES

Read these and nothing else up front:

1. `.codex/V0_7_2_CODEX_CONTINUATION_HANDOFF.md`  ← full state, read first
2. `AGENTS.md`
3. `.codex/CURRENT.md`
4. `.codex/specs/v0.7.2-production-access-operations.md`
5. `.codex/specs/v0.7.2-rv-01-request-visibility-amendment.md`

Live Git + provider truth overrides any stale continuation file.

## CURRENT STATE

```text
Staging:     0.7.1 / e49311f7 / schema 29 / migration 0029   (NOT v0.7.2)
Production:  0.7.1 / e49311f7 / schema 29 / migration 0029   (NOT v0.7.2, LIVE TRAFFIC)
Migration 0030: applied NOWHERE
Backups:     NONE taken
Resend:      adapter done; staging secret ACCOUNT_APPLICATION_RESEND_API_KEY PRESENT;
             production secret NOT installed; real delivery NOT yet proven
Identity classes: NOT configured (blocked — owner must supply the domain)
Latest valid review PASS: NONE
```

## IN SCOPE

- Fix the open P1 in `reserveStock` (handoff section N-1).
- Freeze a candidate; run full gates once; run fresh security + transaction
  exact-SHA reviews; require zero P0/P1.
- Staging backup → migration 0030 → guarded deploy → acceptance.
- Merge PR #15, tag `v0.7.2`, publish Release.
- Production backup → migration 0030 → guarded deploy → smoke/reconcile.
- Rebaseline staging; regenerate the access-code TXT.

## OUT OF SCOPE

v0.8 Inventory redesign, v0.9 whole-site redesign, broad refactors, a new
authorization engine, QR release, SSO/MFA, speculative cleanup, and the deferred
P2/P3 items listed in the handoff (record them for v0.7.3+, do not fix now).

## CONSTRAINTS

- No force-push, no history rewrite, no discarding unknown work.
- Preserve the `design/impeccable-whole-site-preview` worktree and the other
  worktrees listed in handoff section C.
- No secrets in Git; the Resend key lives only as a Worker secret.
- No migration without a fresh backup captured immediately beforehand.
- Deploy only via `scripts/deploy-environment.mjs` with an absolute private
  config. The committed `wrangler.jsonc` holds placeholders and is refused.
- Rebuild `dist` with `npm run build` before committing — the Worker/D1 suite
  leaves a **staging-mode** artifact behind, and it must not be committed.
- Do not invent an identity domain.
- Do not overwrite credential hashes directly in D1.
- Merge to `main` only through PR #15.

## THE ONE BLOCKER

`reserveStock` became once-per-line in `4c423a6`. Its compare-and-swap accepts
only `READY_TO_RESERVE`, so (a) a PROCUREMENT line advanced to
`READY_TO_RELEASE` can never be reserved and therefore never released, and (b) a
partially reserved line cannot be topped up after a restock. Both end
permanently unfinishable.

Fix by guarding on remaining unreserved quantity instead of line status. Full
detail, including the statement-ordering caveat, is in handoff section N-1.

## DELIVERABLES

1. P1 fixed, with two new behavioral tests that fail against `6d371e8`.
2. A frozen SHA with security + transaction reviews both PASS.
3. Staging on v0.7.2 / schema 30, accepted.
4. PR #15 merged; `v0.7.2` tag; GitHub Release.
5. Production on v0.7.2 / schema 30, reconciled.
6. Staging rebaselined; access-code TXT regenerated.
7. Updated `.codex/CURRENT.md`, `docs/WORK_CONTINUATION.md`, `PROJECT_STATUS.md`,
   `CHANGELOG.md`.

## VERIFICATION

```bash
npm run check                        # expect 117+ files / 810+ tests
npm run test:e2e:cloudflare:local    # expect 56+ passed
npx playwright test --workers=2      # expect 138 passed / 0 failed
node scripts/verify-deploy-artifact.mjs staging   # must FAIL for the tracked dist
```

Browser matrix at default parallelism intermittently times out on this hardware
on specs unrelated to the release; `--workers=2` is clean. Confirm on CI.

## STOP CONDITIONS

Stop the affected mutation for: unresolved P0/P1; missing backup; migration
integrity or foreign-key failure; wrong deployed SHA/version/schema/environment;
preview or staging-mode artifact; target ambiguity; staging/production binding
collision; duplicate route or reservation ownership; secret exposure; missing
rollback path.

## FIRST STEP

Re-handshake before editing:

```bash
git rev-parse HEAD
git status --short
gh pr view 15 --json state,isDraft,mergeable,headRefOid
gh run list --commit $(git rev-parse HEAD) --limit 5
```

Then read `.codex/V0_7_2_CODEX_CONTINUATION_HANDOFF.md` and execute its
section O, Action 1.

## DO NOT REPEAT

Cloudflare inventory discovery; staging Resend secret installation; provider and
key-rotation decisions; review rounds 1–4; and everything in handoff section D.
Any change under `src/` invalidates the browser, Worker/D1, and review evidence.
