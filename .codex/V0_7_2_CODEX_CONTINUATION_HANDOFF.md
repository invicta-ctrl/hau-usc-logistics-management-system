# v0.7.2 — Claude Code → Codex Continuation Handoff

Prepared: 2026-08-08 by Claude Code. This file is the primary durable resume
source. Nothing important is left only in chat context.

---

## A. EXECUTIVE STATUS

```text
Release:              v0.7.2
Status:               INCOMPLETE
Current phase:        Phase 1 — final RV-01 review/repair loop
Current blocker:      One UNFIXED P1 in reserveStock (see N-1)
Branch:               release/v0.7.2-production-access-operations
HEAD:                 6d371e826c8dd921ad53699ad06b6ba9aa1c218b
Working tree:         CLEAN
PR:                   #15 (OPEN, DRAFT, base main)
Production version:   0.7.1 (candidateSha e49311f7a712b56da3d5d2913e3c8bf2d0fe4f90)
Staging version:      0.7.1 (candidateSha e49311f7a712b56da3d5d2913e3c8bf2d0fe4f90)
Schema staging:       29
Schema production:    29
Migration staging:    0029_reusable_asset_reassignment.sql (0030 NOT applied)
Migration production: 0029_reusable_asset_reassignment.sql (0030 NOT applied)
```

**Neither environment has been deployed. No migration has been applied anywhere.
No production mutation of any kind has occurred.**

---

## B. AUTHORITY

Active:

- `.codex/specs/v0.7.2-production-access-operations.md`
- `.codex/specs/v0.7.2-rv-01-request-visibility-amendment.md` (incl. RV-01.9
  reviewer-UI addendum authorising the minimal shipped reviewer UI)

Owner decisions already made — **do not re-ask**:

1. ADMINISTRATOR holds `REQUEST_REVIEW` (implemented).
2. No self-approval; server-authoritative actor-vs-requester guard (implemented,
   behavioral regression exists).
3. Provider locked: Resend, `auth.hausc.org`,
   `HAU-USC Logistics <no-reply@auth.hausc.org>`.
4. Owner accepts the supplied Resend key without rotation.
5. Production promotion authorised; no further ceremonial approval needed.

---

## C. EXACT GIT STATE

```text
Repo root:      D:/Documents/Codex/HAU-USC Logistics/active/hau-usc-logistics-management-system
Branch:         release/v0.7.2-production-access-operations
HEAD:           6d371e826c8dd921ad53699ad06b6ba9aa1c218b
Upstream:       in sync (0/0) at time of writing
Working tree:   clean
```

Recent commits (newest first):

```text
6d371e8  fix: restore the deterministic default build artifact
7a31216  fix: stop disclosing storage location to authenticated requesters
4c423a6  fix: guard concurrent reservations, close bound bypass, make paging truthful
07af508  fix: restore conjunctive event bounds, keep location filtering, add Resend
8501f0e  fix: close review-round P1s in scope bounds, reserve gate, and status derivation
8945631  feat: administrator review, self-approval guard, scoped queue SQL, guarded deploy
```

**Preserve these worktrees untouched** (unrelated work):

```text
design/impeccable-whole-site-preview
chore/codex-workflow-tooling
task/v072-identity-core
task/v072-operations-domain
task/v072-reference-link-server
.tmp/phase18-exact-d54e733, .tmp/phase18-final-exact-41e2ead (detached)
```

---

## D. COMPLETED WORK — DO NOT REDO

| Area | State |
|---|---|
| Administrator central review (`REQUEST_REVIEW`) | DONE + VERIFIED |
| Self-approval guard (`SELF_REVIEW_FORBIDDEN`) | DONE + VERIFIED (behavioral) |
| Request visibility / queue projection | DONE + VERIFIED |
| Shipped reviewer UI (`src/visual/runtime.js`) | DONE + VERIFIED |
| Per-line routing, one downstream owner | DONE + VERIFIED |
| Reject-stranding probe (owner tables) | DONE + VERIFIED |
| Scope-in-SQL for queue rows + `COUNT(*)` | DONE + VERIFIED |
| Event/series bounds, conjunctive + fail-closed | DONE + VERIFIED (unit matrix) |
| Location bound on `reserveStock` (both branches) | DONE + NEEDS FINAL REVIEW |
| Availability + storage-location redaction | DONE + VERIFIED |
| `RESERVABLE_PARENT_STATUSES` vocabulary fix | DONE + VERIFIED (behavioral) |
| `COMPLETED` derivation excl. REJECTED/CANCELLED | DONE + VERIFIED (behavioral) |
| Resend adapter + registry + Worker wiring | DONE + NEEDS FINAL REVIEW |
| Readiness fail-closed via provider registry | DONE + VERIFIED |
| Migration 0030 `provider_message_ref` column | DONE (unapplied anywhere) |
| Guarded deploy path + artifact preflight | DONE + VERIFIED |
| Staging Resend secret installed | DONE (see I) |
| Staging access-code TXT | DONE (see K) |
| Identity classes config | **NOT STARTED — blocked, see N-2** |
| Staging deploy / acceptance | NOT STARTED |
| PR merge / tag / Release | NOT STARTED |
| Production backup / migration / deploy | NOT STARTED |
| Staging rebaseline / canaries | NOT STARTED |

---

## E. CURRENT IN-PROGRESS SLICE

```text
Intent:        Close the final RV-01 review round with zero P0/P1.
Files:         src/server/d1/operational-service.js  (reserveStock, ~line 4234-4300)
Committed:     Yes — HEAD 6d371e8, working tree clean.
Next edit:     Repair the reserveStock once-per-line regression (N-1).
```

---

## F. REVIEW / AUDIT LEDGER

| Round | SHA | Focus | Result | Findings |
|---|---|---|---|---|
| 1 | `8945631` | Security/authz | FAIL | 2×P1 (event/location bounds), 3×P2, 3×P3 |
| 1 | `8945631` | Transactions | FAIL | 1×P1 (`PARTIALLY_FULFILLED`), 3×P2, 5×P3 |
| 2 | `8501f0e` | Transactions | FAIL | 1×P1 (bounds became disjunctive — regression) |
| 3 | `07af508` | Security/authz | PASS | 0 P0/P1; 10 P2/P3 |
| 4 | `4c423a6` | Security/authz | FAIL | 1×P1 (storage location → requester) |
| 4 | `4c423a6` | Transactions | FAIL | **1×P1 (reserveStock once-per-line) — UNFIXED** |

```text
THE LATEST SHA THAT HAS A VALID REVIEW PASS IS: NONE
```

`07af508` passed security only; it was superseded by material changes in
`4c423a6`. Round-4 security P1 was fixed in `7a31216`. Round-4 transaction P1 is
still open. **A fresh security + transaction review is required on the SHA that
fixes N-1.**

---

## G. TEST / CI EVIDENCE

All observed on `6d371e8` unless noted.

```text
npm run check                     117 files / 810 tests   PASS
npm run test:e2e:cloudflare:local 56 passed / 0 failed    PASS
npm run test:e2e (browser)        138 passed / 0 failed    PASS  (at --workers=2)
Exact-head CI                     SUCCESS  (last verified at 4c423a6)
Apps Script static check          SUCCESS  (last verified at 4c423a6)
Migration 0030 rehearsal          NOT RUN
Artifact preflight                default (preview) build restored and verified
Secret scan on staged diff        clean (only synthetic `re_test_key_...` fixture)
```

**Browser-matrix caveat:** at default parallelism this machine intermittently
fails 2–5 specs with `Test timeout of 30000ms exceeded`. Those specs are
unmodified by this release, pass individually in ~5s, and pass 138/0 at
`--workers=2`. No timeout was raised and no assertion weakened. Treat default-
parallelism timeouts on this hardware as load, but re-confirm on CI.

CI has **not** yet run on `7a31216` or `6d371e8` — verify before relying on it.

---

## H. EXTERNAL ENVIRONMENT STATE (safe labels only)

### Staging

```text
Worker:            hau-usc-logistics-staging
Host:              hau-usc-logistics-staging.earllawrence-adriano-ce.workers.dev
App version:       0.7.1
Deployed SHA:      e49311f7a712b56da3d5d2913e3c8bf2d0fe4f90
Schema / migration: 29 / 0029_reusable_asset_reassignment.sql
D1:                hau-usc-logistics-staging  (75 tables, ~4.25 MB)
R2:                hau-usc-logistics-staging-assets, hau-usc-logistics-staging-evidence
Health:            ok, all bindings present
Resend secret:     ACCOUNT_APPLICATION_RESEND_API_KEY  PRESENT (15 secrets total)
Identity config:   NO
v0.7.2 deployed:   NO
Backup captured:   NO
```

### Production

```text
Worker:            hau-usc-logistics-production
Host:              logistics.hausc.org
App version:       0.7.1
Deployed SHA:      e49311f7a712b56da3d5d2913e3c8bf2d0fe4f90
Schema / migration: 29 / 0029_reusable_asset_reassignment.sql
D1:                hau-usc-logistics-production  (75 tables, ~1.98 MB, LIVE TRAFFIC)
R2:                hau-usc-logistics-production-assets, hau-usc-logistics-production-evidence
Health:            ok, all bindings present
Resend secret:     NOT INSTALLED
Identity config:   NO
v0.7.2 deployed:   NO
Backup captured:   NO
```

Production had ~73 rows written / ~75k read in 24h at time of inspection — it is
in real use. Backup before any mutation is mandatory.

Environments are isolated: separate Workers, D1 databases, and R2 buckets.

---

## I. RESEND / EMAIL STATE

```text
Provider:                 Resend
Sending domain:           auth.hausc.org
Sender:                   HAU-USC Logistics <no-reply@auth.hausc.org>
Adapter:                  src/server/account-application/resend-email-provider.js
Registry/selection:       src/server/account-application/email-provider-registry.js
Worker wiring:            src/worker/index.js (createAccountApplicationEmailProvider(env))
Readiness:                src/server/environment.js — fails closed via registry
Secret binding NAME:      ACCOUNT_APPLICATION_RESEND_API_KEY
Staging secret:           PRESENT (by name)
Production secret:        NOT INSTALLED
Real staging email:       NOT PROVEN (staging not yet on v0.7.2)
Domain operationally proven: NO
```

Known provider notes:

- The owner-supplied key is **send-restricted**: `GET /domains` returns
  `restricted_api_key`. Domain verification therefore cannot be confirmed via
  API. This is **not** a release blocker — an unverified domain makes Resend
  reject the send, so the first real staging delivery proves it.
- Still to configure per environment (non-secret vars, belong in the private
  config): `ACCOUNT_APPLICATION_EMAIL_PROVIDER=resend`,
  `ACCOUNT_APPLICATION_EMAIL_FROM=HAU-USC Logistics <no-reply@auth.hausc.org>`,
  and `ACCOUNT_APPLICATION_IDENTITY_CLASSES_JSON` (blocked, see N-2).
- Sender format is validated with balanced angle brackets. A bare
  `<addr>` without a display name is rejected; use `Name <addr>` or bare `addr`.

**Never record the key value anywhere.**

---

## J. PRIVATE CONFIG / LOCAL POINTERS

```text
Private handoff dir:    %USERPROFILE%\Documents\HAU-USC Logistics Private\v0.7.2-codex-handoff\
Private manifest:       ...\v0.7.2-codex-handoff\PRIVATE_HANDOFF_MANIFEST.txt
Staging access-code TXT: %USERPROFILE%\Documents\HAU-USC Logistics Private\HAU_USC_Logistics_v0.7.2_STAGING_ACCESS_CODES_PRIVATE.txt
D1 inventory (private):  D:\Documents\Codex\.private\hau-usc-logistics\d1-inventory.json
Private Cloudflare configs: NOT YET GENERATED
Staging backup dir:      NOT YET CREATED
Production backup dir:   NOT YET CREATED
Uncommitted patch:       NONE (working tree clean)
```

Private Cloudflare configs are generated by
`scripts/create-private-cloudflare-configs.mjs <staging-base> <d1-inventory.json> <output-dir>`.
It writes with `flag:'wx'` (fails if present) at mode `0600` and pins
`CANDIDATE_SHA` to HEAD — so it **must be regenerated at candidate freeze**, or
`scripts/deploy-environment.mjs` will refuse the deploy on a SHA mismatch.

---

## K. STAGING ACCESS / OWNER LOGIN

```text
Access-code TXT exists:   YES
Path:                     %USERPROFILE%\Documents\HAU-USC Logistics Private\HAU_USC_Logistics_v0.7.2_STAGING_ACCESS_CODES_PRIVATE.txt
Generated from staging D1: YES (86 accounts)
Generated:                BEFORE v0.7.2 deploy — regenerate after deploy
Owner login works:        NO (owner reported "I can't login")
```

Diagnosis — **the account state is not the cause**:

```text
auth_rate_limits            0 rows      -> no lockout
locked_at                   null on all -> no locked accounts
Only ACTIVE SYSTEM_OWNER    S3.ADMIN    -> ACTIVE, unlocked, activated, password set
Owner-named account         INVICTA     -> ADMINISTRATOR (not owner), ACTIVE, password set
Starter admin               ADMINACESS  -> STARTER, temp credential active, NO password
Staging endpoint            healthy, 0.7.1 / schema 29
```

So the blocker is the password itself, not account state. Note `INVICTA` is an
**ADMINISTRATOR**, not a System Owner; the only ACTIVE System Owner is
`S3.ADMIN`.

Next recovery action: the only reset path is `/api/admin/access/reset-password`,
which **requires an already-authenticated admin session**, and direct credential
overwrite in D1 is prohibited by owner instruction. There is no offline recovery
script in `scripts/`. Therefore the owner must sign in once with `S3.ADMIN`,
`INVICTA`, or `ADMINACESS` (temporary password); from there the sanctioned reset
workflow can rotate the rest. Deliver any generated temporary password in a
separate owner-only local file — never in the access-code inventory.

---

## L. MIGRATION / BACKUP / ROLLBACK

```text
Schema target:                30
Migration:                    migrations/0030_production_access_and_operations.sql
Rehearsal:                    NOT RUN
Applied staging:              NO
Applied production:           NO
Staging backup captured:      NO
Production backup captured:   NO
Staging rollback identity:    Worker hau-usc-logistics-staging @ 0.7.1 / e49311f7
Production rollback identity: Worker hau-usc-logistics-production @ 0.7.1 / e49311f7
Runbook:                      docs/BACKUP_AND_RECOVERY.md
```

`0030` is unapplied in both environments, so it is still safe to edit in place.
This release already added `provider_message_ref` to it for that reason.

---

## M. DEPLOYMENT / RELEASE STATE

```text
Staging deployed v0.7.2:  NO
Staging accepted:         NO
PR #15 draft:             YES
PR #15 merged:            NO
Merge SHA:                N/A
v0.7.2 tag:               NO
GitHub Release:           NO
Production deployed:      NO
Production reconciled:    NO
Staging rebaselined:      NO
Canaries/rollout:         NOT STARTED
```

---

## N. OPEN BLOCKERS

### BLOCKING v0.7.2

**N-1 — P1: `reserveStock` is once-per-line; two reachable states become
permanently unfinishable.**

- File: `src/server/d1/operational-service.js`, `reserveStock` guarded batch
  (CAS ≈ line 4289).
- Introduced by `4c423a6` while fixing a real concurrent-double-reservation P2.
  Routing the line transition through `runAtomicRevisionGuardedBatch` made a
  zero-row CAS abort the whole batch. Previously a zero-row CAS still committed
  the reservation.
- The CAS accepts only `status IN ('READY_TO_RESERVE','ACCEPTED')`, and
  `'ACCEPTED'` is never written to `request_lines` by any command — so
  effectively only `READY_TO_RESERVE`.
- Failure A: a PROCUREMENT line advanced by `transitionDeliverable` to
  `READY_TO_RELEASE` can no longer be reserved (409), and `confirmRelease`
  requires ACTIVE-reservation coverage for every line → the line can never be
  released. No command returns a line to `READY_TO_RESERVE`.
- Failure B: a partially reserved stock line (reserved 4 of 10 because ATP was
  short) cannot be topped up after a restock → parent pinned at
  `PARTIALLY_RELEASED` forever.
- Why gates stayed green: the new partial-release e2e uses two separate lines,
  each reserved once; no test drives a deliverable to `READY_TO_RELEASE` and
  then releases it; and the shipped UI only calls `reserveStock` in the mock
  backend branch, so no browser test covers it.
- **Smallest next action:** guard on remaining *unreserved quantity* rather than
  line status. Widen the CAS to also accept `READY_TO_RELEASE` /
  `PARTIALLY_RELEASED`, and add a guarded predicate that the requested quantity
  fits `requested_quantity - released_quantity - SUM(active reservations)`.
  Note `inserted` currently sits in `beforeGuardStatements`; if the capacity
  subquery must exclude the new row, move `inserted` into
  `dependentStatements` so the guard evaluates before the INSERT.
- **Verification to close:** keep the existing concurrency e2e green (one 200,
  one 409, one inventory effect) AND add a behavioral test that a procurement
  line at `READY_TO_RELEASE` reserves and releases successfully, plus a
  top-up-after-restock test. Both must fail against the current HEAD.

**N-2 — Identity classes are unconfigured and cannot be derived from the repo.**

- `ACCOUNT_APPLICATION_IDENTITY_CLASSES_JSON` is required for readiness
  (`environment.js` pushes `ACCOUNT_APPLICATION_IDENTITY_CLASSES_MISSING`).
- The repository deliberately records **no** institutional domain
  (`.codex/V0_7_2_RELEASE_CANDIDATE_HANDOFF.md`: "no domain is invented";
  `v0.7.0-production-master.md:789` forbids implying ownership of an HAU
  domain).
- Option A is already implemented correctly in
  `src/server/account-application/adapters.js`: a domain class match is
  necessary but **not sufficient** — the address must also exactly reconcile
  against an active, `VERIFIED` protected roster entry. Domain alone grants
  nothing.
- **Needs the owner to supply the coarse domain class.** Put it in the private
  config, never in Git.

**N-3 — Owner cannot sign in to staging.** See section K. Blocks the staging
acceptance step that requires owner login; does not block backup/migration/deploy.

### NON-BLOCKING — DEFERRED TO v0.7.3+

- `request.reject` / `request.missing_information` capabilities are declared and
  role-assigned but never asserted; `REQUEST_REVIEW` alone confers reject
  authority. Matches the RV-01.3 matrix, which grants the review command as a
  unit — model hygiene, not a boundary gap.
- OFFICE operational scope: `total`/`hasMore` can disagree with rows (the
  post-filter has no `sqlScoped` exemption and `queueWhere` has no OFFICE
  predicate). Same class as the LOCATION/EVENT_SERIES bug that was fixed.
- EVENT scope: child lines with NULL `event_id` can be dropped while their
  parent row and its `total` remain.
- `listInventoryClassifications` / `catalogItemSnapshot` return full stock
  numbers under `INVENTORY_CLASSIFY` / `REFERENCE_CATALOG_MANAGE`, bypassing a
  `view.inventory` deny. Not currently exploited (only `lending.usage.view` is
  denied anywhere).
- `transitionDeliverable` / `transitionRestock` lost updates write a false
  `status_history` + `audit_log` row and cache the false result. Confined to
  observability tables; escalate if the audit trail is a compliance artifact.
- Bound coverage: event context reaches 8/16 `assertEntityScope` sites and
  location 2/16. All misses fail **closed**, so no admission hole — the cost is
  availability for a bounded actor. Lending tickets carry no event columns and
  cannot be fixed by threading.
- Concurrent-reservation loser can surface `INSUFFICIENT_STOCK` instead of
  `REQUEST_STATE_CONFLICT` when ATP is tight — both safe 409s, wrong remedy text.
- A lending reservation with a NULL `lending_ticket_id` can hold ATP forever
  (pre-existing).
- `scope.mode === 'DENY'` is unreachable dead code; the real deny mechanism is
  `capabilityDenies`. Its "coverage" in
  `tests/unit/d1-operational-p1-regressions.test.js` is a source-text grep.
- `tests/unit/d1-operational-p1-regressions.test.js` is almost entirely
  `readFileSync` + `toContain`. Treat its assertions as documentation, not proof.

---

## O. EXACT NEXT ACTIONS FOR CODEX

### Action 1 — Fix N-1 (release blocker)

```text
OBJECTIVE  Make reserveStock idempotent-safe under concurrency WITHOUT making it
           once-per-line. Guard on remaining unreserved quantity, not status.
FILES      src/server/d1/operational-service.js (reserveStock)
           tests/cloudflare-e2e/rv01-request-visibility.spec.js (add 2 tests)
COMMANDS   npx vitest run tests/unit/request-visibility-rv01.test.js
           npx playwright test --config playwright.cloudflare.config.js -g "concurrent reservations"
           npx playwright test --config playwright.cloudflare.config.js -g "partly released"
EXPECTED   Concurrency test still one 200 / one 409 / one inventory effect;
           new procurement-line and top-up tests pass; both new tests fail
           against current HEAD before the fix.
STOP IF    The capacity predicate cannot be expressed in-batch — then do NOT
           revert to a plain batch silently; record it and ask.
DO NOT     Re-derive the whole review history; it is in section F.
```

### Action 2 — Freeze and re-review

```text
OBJECTIVE  One frozen candidate with a valid PASS on the SAME SHA.
COMMANDS   npm run check
           npm run test:e2e:cloudflare:local
           npx playwright test --workers=2
           npm run build            # restore default artifact BEFORE commit
           git status --short       # dist/index.html must NOT be staged as staging build
           node scripts/verify-deploy-artifact.mjs staging   # must FAIL for tracked dist
EXPECTED   117+ files / 810+ tests; Worker/D1 56+; browser 138/0.
           Then run BOTH exact-SHA reviews (security + transactions) on the new
           SHA. Zero P0/P1 required.
STOP IF    Either review returns P0/P1.
DO NOT     Reuse the 07af508 security PASS — it is superseded.
```

### Action 3 — Staging backup → migration 0030 → guarded deploy

```text
OBJECTIVE  Get staging onto v0.7.2.
PRECONDITION  Action 2 complete; owner has supplied the identity-class domain
              (N-2), or accept that readiness will report
              ACCOUNT_APPLICATION_IDENTITY_CLASSES_MISSING.
COMMANDS   node scripts/create-private-cloudflare-configs.mjs <staging-base> \
             D:\Documents\Codex\.private\hau-usc-logistics\d1-inventory.json <out-dir>
           # D1 export + Time Travel bookmark FIRST — see docs/BACKUP_AND_RECOVERY.md
           npx wrangler d1 migrations apply hau-usc-logistics-staging --remote
           npm run deploy:staging -- --config <absolute-private-config>
EXPECTED   health: STAGING, 0.7.2, exact SHA, schema 30, migration 0030,
           readiness true, preview/mock false.
STOP IF    Backup missing, integrity_check != ok, or identity/version mismatch.
DO NOT     Deploy with the committed wrangler.jsonc — it holds placeholders and
           the guarded path refuses it.
```

---

## P. DO-NOT-REPEAT LEDGER

Reuse unless the stated invalidator occurred:

```text
Cloudflare read-only inventory (Workers/D1/R2/versions)  — reuse; re-verify only versions
Staging Resend secret installation                        — DONE, do not reinstall
Provider selection + key rotation decision                — owner-decided, closed
Staging access-code TXT (86 accounts)                     — regenerate only AFTER deploy
Review rounds 1-4 (section F)                             — do not re-run on old SHAs
Full browser matrix on 6d371e8                            — invalidated by any src/ change
Worker/D1 matrix on 6d371e8                               — invalidated by any src/ change
D1 backups                                                — NONE taken yet; must be done
Migration 0030 rehearsal                                  — never run; must be done
```

Invalidator: **any change under `src/`** invalidates the browser, Worker/D1, and
review evidence above. Documentation-only changes do not.

---

## Q. PROHIBITED / PRESERVE

- No force-push, no history rewrite, no `reset`/`clean`/`stash` over unknown work.
- Do not delete the `design/impeccable-whole-site-preview` worktree or any
  worktree listed in section C.
- No secrets into Git. The Resend key must exist only as a Worker secret.
- No migration without a fresh backup captured immediately beforehand.
- Never deploy a preview/mock or staging-mode artifact to production. Rebuild via
  the guarded path and let its preflight verify the mode.
- Do not invent an identity domain (N-2).
- Do not direct-push release contents to `main`; merge through PR #15.
- Do not overwrite credential hashes directly in D1 (N-3).
- Do not re-implement anything in section D.
