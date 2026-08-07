# v0.7.2 Release-Candidate Handoff

Updated: 2026-08-07 (Asia/Manila)

## Status

`RV_01_REPAIRED - EXACT_SHA_REVIEW_AND_PREPRODUCTION_BLOCKED`

## RV-01 request-visibility repair (2026-08-07)

Owner-approved amendment `v0.7.2-RV-01` is recorded at
`.codex/specs/v0.7.2-rv-01-request-visibility-amendment.md`.

The audit was reclassified against exact head
`9e6181b9de9134a22e6cf8b61121988bbc56023c` before any change. Findings 1-4, 7
(partial), 8, 9, and 10 were confirmed in that head; findings 6, 13, 14, and 15
were already repaired and proven and were not redone.

Repairs, all migration-free:

- The `request` module's server projection and the strict client allowlist both
  omitted `requests` and `requestLines`. Both now carry the canonical review
  queue, scoped by the existing capability/effective-scope model, while a new
  containment guard keeps the public request-only contract free of internal
  collections.
- Every non-inventory module derived `total`/`hasMore` from a count of active
  inventory items. Request now owns its total, uses a deterministic
  `updated_at DESC, id DESC` order, and excludes archived requests.
- The scoped-revision poller was gated to the Apps Script runtime, so a
  REST-backed Main Hub never detected a public submission. It now runs for the
  REST/HTTP production backend, and public submission bumps `overview` in
  addition to `global` and `request`. Release, Procurement, and Restocking are
  intentionally not bumped at submission.
- Request review accepted one whole-request decision and implicitly routed
  every non-stock, non-restock line to procurement. It now requires one
  explicit server-validated decision per line, derives the parent status from
  the line outcomes, and bumps only the scopes whose objects changed.
- The Deliverables queue re-ran a whole-request review in REST mode, which
  could never succeed once the parent left `FOR_REVIEW`; it now transitions the
  deliverable it already owns.

Two pre-existing time-dependent fixtures with hardcoded lending pickup/due
dates were repaired. They made the previously recorded 39/39 Worker and 136
browser results non-reproducible on any date after 2026-08-03.

### RV-01 verification

- `npm run check`: 114 files / 782 tests passed, including governance, lint,
  two deterministic builds, Apps Script checks, dist verification, and the
  Cloudflare type/dry-run checks.
- Browser matrix: 136 passed / 356 intentional skips / 0 failed.
- Local Worker/D1: 40/40, including the mandatory two-context regression
  `public request becomes visible to an already-open authorized Main Hub and
  routes each line exactly once`, which proves atomic D1 effects, revision
  advance for an already-open session, downstream exclusion of fresh lines,
  fail-closed accept without line decisions, foreign/invalid route rejection,
  exactly one deliverable per procurement line, retry safety, and unrelated
  committee denial.
- No migration was added; schema target remains 30.

### Generated-artifact build-order hazard

`scripts/start-local-worker-acceptance.mjs` runs `vite build --mode staging`,
which overwrites `dist/index.html`. `npm run build` produces the preview
artifact that must be committed alongside the shareable and Apps Script bundles
generated in the same invocation.

Running the local Worker acceptance suite **after** `npm run check` therefore
leaves `dist/index.html` in the staging variant. Always re-run `npm run build`
(or `npm run check`) immediately before staging a commit, and confirm
`dist/index.html` matches a fresh preview build. The build itself is
deterministic: three consecutive `npm run build` invocations produce a
byte-identical file. `verify:dist` validates structure and does not compare the
committed file against a fresh build, so this class of drift is not caught by
CI.

### Independent review round 1 (2026-08-07) — findings and dispositions

Independent transaction/idempotency review of `c4df282` returned **FAIL**. Every
finding was verified against source before acting; one attribution in the report
was corrected.

| Sev | Finding | Verified? | Disposition |
|---|---|---|---|
| P0 | `reviewRequest` checked `outcomes[0].meta.changes` **after** `db.batch()`. D1 runs every batch statement before returning, so a zero-row parent UPDATE could not stop the `deliverables`/`restock_requests` INSERTs from committing. Two reviewers accepting concurrently produced a duplicate deliverable while the second caller received a 409. | **Confirmed.** The repository's own `runAtomicRevisionGuardedBatch` documents exactly this hazard. | **Fixed.** Review now runs through `runAtomicRevisionGuardedBatch` with the parent transition as the guarded statement; the post-batch check is removed. |
| P1 | A parent left `NEEDS_INFORMATION` by a mixed review could later be whole-request REJECTED, stranding already-routed lines and their live Deliverables item under a rejected parent. | **Confirmed** — reachable only via the new partial-derivation path. | **Fixed.** A whole-request REJECT/MISSING_INFORMATION is refused with `REQUEST_ALREADY_ROUTED` (409) when any line has left the reviewable set. Proven against real D1. |
| P1 | No shipped client path can issue `reviewRequest` with `lineDecisions`, so a reviewer cannot route anything in the deployed product. | **Confirmed as a gap, attribution corrected.** The report implied a working review UI was removed. It was not: `dist/index.html` at the pre-RV-01 head `9e6181b` also contains zero review-queue markers, and the shipped `request` view renders only `renderRequestSelectors()` + `renderRequestDraft()` — a submission form. The path RV-01 removed was the Deliverables ACCEPT shortcut, which was already dead in REST mode because deliverables are created `FOR_CANVASSING`, so its `FOR_REVIEW`-only buttons never rendered. | **Open — see RV-01 remaining gaps.** Pre-existing product gap, not an RV-01 regression. |
| P2 | The fallback idempotency key `review-${requestId}-${decision}` was not bound to the line payload, so a second legitimate review of a `NEEDS_INFORMATION` parent could be locked out by a permanent `IDEMPOTENCY_CONFLICT`. | **Confirmed.** | **Fixed.** The fallback key now includes a fingerprint of the line decisions, sorted by line id so reordering is the same mutation. |
| P2 | A page whose lines exceed the child-collection cap fails the strict contract closed with no client signal to shrink the page. | **Confirmed as intentional fail-closed.** | **Accepted as designed.** Recorded below as a known bound; graceful degradation deferred. |
| P3 | `request_lines.fulfillment_source` is not updated to the decided route. | **Confirmed** — traceability only; no server branch depends on it after review. | **Deferred to v0.7.3** and recorded. |
| P3 | Date and search filtering absent from the queue projection. | **Confirmed.** | **Fixed** — see the adjudication table below. |

Independent review 2 (security/authorization/privacy/target identity) was
terminated by an infrastructure limit before producing findings and **must be
re-run**. RV-01 does not carry a PASS until it is recorded.

### RV-01 criterion adjudication (2026-08-07)

Each item below was checked against the accepted amendment
`.codex/specs/v0.7.2-rv-01-request-visibility-amendment.md`. Nothing is waived
silently; every criterion is either implemented with coverage or recorded with
its reason and disposition.

| Criterion | Amendment basis | Mandatory? | Disposition |
|---|---|---|---|
| Director authorization coverage | RV-01.3 table: "Director with verified central capability — Yes / Yes" | **Yes** | **Implemented.** `LOCAL.DIRECTOR` now proves read access to unassigned central review work in `tests/cloudflare-e2e/rv01-request-visibility.spec.js`. |
| Explicit-deny coverage | RV-01.3 table: "Explicit deny, disabled, archived — No / No" | **Yes** | **Defect found and repaired.** Auditing this criterion instead of waiving it exposed that `'DENY'` was never handled anywhere in `src/server/d1/operational-service.js`. `scopedWhere`, `multiScopeWhere`, and `assertEntityScope` all treated DENY as "not ALL, not SELF" and fell through to the committee branch. Because `scopeMode` and `committeeIds` are independent fields, a revoked account that still carried committee grants would have received **committee-scoped read and command access instead of denial** — a direct breach of RV-01.3 and of the "UI hiding is not authorization" invariant. All three helpers now short-circuit DENY (`1 = 0` for the two query builders, `OUT_OF_SCOPE` 403 for the command guard) ahead of the ALL and committee branches, with regression coverage in `tests/unit/d1-operational-p1-regressions.test.js`. The unauthenticated case is separately proven (401/403 with the request id absent from the body). |
| Disabled-account coverage | RV-01.3 table, same row | **Yes, as behaviour** | **Covered upstream of the queue.** A disabled account cannot hold a session: login fails, so `/api/requests` is never reached. This is already proven by `Administrator Access Management governs the staging account lifecycle and safe audit history` in `tests/cloudflare-e2e/local-worker.spec.js`. Not duplicated in the RV-01 spec. |
| Archived-account coverage | RV-01.3 table, same row | **Yes, as behaviour** | **Same mechanism as disabled** — archived accounts fail authentication before any module read. Covered by the same Access-lifecycle test. |
| Request-owned search | RV-01.5: "active/archive/date/**search**/scope filtering" | **Yes** | **Implemented.** The client already normalised and sent `query`/`filter`, but the server ignored both for every module — the contract advertised filtering it did not honour. The Request queue now applies escaped `LIKE` search across request id, purpose, and requester name, plus `from`/`to` date boundaries and an active/archive/all selector, with the identical predicate driving `total` and `hasMore`. Proven by `the Request module owns its search, date, archive, and scope filtering`. |
| Saved-filter metadata beyond total/page/`hasMore`/order/archive | **Not present in the amendment.** RV-01.5 enumerates total, page/page-size or cursor, `hasMore`, stable ordering with tie-breaker, and active/archive/date/search/scope filtering. "Saved filters" appears only in the execution prompt's RV1.5 verification checklist. | **No** | **Not required, and not implemented.** No saved-filter feature exists anywhere in the product, so there is no persisted filter state to expose metadata for. Building one would add a new product capability, which the amendment explicitly forbids ("It does not authorize a new product domain or broad redesign"). Deferred to v0.7.3+ if the owner wants saved views. |

### Requester-only and Lending-only separation

Both remain proven by the existing `requester portals keep request and lending
records self-scoped` local-worker test, which provisions a department requester
through the Access API. `LOCAL.REQUESTER` is not a seeded fixture, so the RV-01
spec cites that coverage rather than duplicating account provisioning.

### RV-01 remaining gaps

- **RV-01.6 reviewer UI is absent from the shipped Main Hub.** `src/index.html`
  loads only `/visual/runtime.js`, whose `request` view renders the submission
  form. There is no review queue and no per-line decision control, so the
  amendment's "The UI exposes only permitted decisions" is unmet end to end even
  though the server contract, projection, and routing are complete and proven.
  This is pre-existing — the pre-RV-01 artifact has the same gap — but it blocks
  the RV-01 deliverable ("routes every accepted line exactly once") for a human
  operator. `src/features/requests/view.js` does contain a review queue, but it
  belongs to the modular app reached through `src/main.js`, which the shipped
  shell does not load. **This is the one remaining RV-01 blocker.**
- A page whose request lines exceed the 500-row child-collection cap fails the
  strict contract closed rather than degrading, with no client signal to reduce
  the page size. Bounded and intentional; graceful degradation deferred.
- `request_lines.fulfillment_source` still reports the submission-time value
  after review rather than the decided route. Traceability only; no server
  branch depends on it post-review. Deferred to v0.7.3.
- Independent security/authorization review of the repair head must still be
  recorded before RV-01 can carry a PASS.

The v0.7.2 product, schema, generated artifacts, and local verification are
complete at the R2-repaired release-branch working tree prepared for candidate
freeze. The exact repair SHA is recorded by the freeze commit that contains
this handoff and must receive a fresh exact-SHA review and PR CI before any
external release step.

The owner supplied `AUTHORIZE V0.7.2 PRODUCTION` and explicitly waived another
confirmation wait. That authorization is retained. It does not bypass the
mandatory exact-target, provider, pre-production, backup, recovery, or
reconciliation gates.

## Repository truth

- Branch: `release/v0.7.2-production-access-operations`.
- Starting clean `main` SHA: `589970d31d0dab4fe876107276d9b808eb44b9c3`.
- Draft PR: `#15`.
- Release identity: `0.7.2` in package, runtime, Wrangler, private-config
  generator, and release workflows.
- Migration: additive `0030_production_access_and_operations.sql`.
- Local schema rehearsal: migrations 0001 through 0030 applied to a fresh
  isolated D1; `PRAGMA integrity_check=ok`, zero foreign-key findings,
  operational schema version 30.
- Production remains on the accepted v0.7.1 baseline. No v0.7.2 provider,
  staging, production, D1, R2, Google, domain, merge, tag, or release write has
  occurred.

## Delivered scope

- Public staff application: email-start/confirm contracts, private status
  receipt, identity/affiliation and credential submission, private status,
  withdrawal, safe conflict handling, and corrected resubmission from
  `CHANGES_REQUESTED`.
- Review and activation: Administrator queue/detail/decision, distinct
  Director decision, audited owner override, starter-account handoff, and
  activation reconciliation before authenticated session issuance.
- Access separation: new account-application capabilities are server-owned,
  bootstrap-allowlisted, and role-specific; applicant and requester state does
  not grant internal access.
- Profile: protected self-profile read, contact update, username change,
  password change, identity-correction request, and accessible My Profile UI.
- Operations: accepted Request purpose branches, strict integer rules,
  explicit low-stock controls, private public-Lending tracking, and preserved
  Inventory/Release/Lending invariants.
- Administration: canonical Link Registry remains additive to the existing
  second-review Routing domain; announcement lifecycle remains revision
  guarded.
- Release safety: version 0.7.2 identity, privacy-preserving login limiter
  reset on authorized unlock, deterministic artifacts, and fail-closed
  non-development readiness.

## Complete-candidate R2 repair cycles

The first R2 review rejected the prior candidate before push. It identified a
verification-purpose/nullability schema mismatch, activation reconciliation
that could be bypassed by a later login, split profile/access/announcement
transactions, a raceable last-Administrator check, and incomplete limiter
cleanup for username/email aliases.

The repair tree aligns schema and runtime purpose, permits an unsent challenge
to truthfully retain a null send time, exercises migrations 0001-0030 through
the real repository, keeps login fail closed until activation reconciliation
succeeds, and atomically couples authoritative mutations with history, audit,
idempotency, and session revocation. The last active unlocked Administrator is
protected in the guarded SQL write, and authorized unlock clears digested
account-code, username, and verified-email limiter aliases. A fresh exact-SHA
R2 review remains mandatory; no prior review acceptance is reused.

The second fresh R2 review rejected that repaired SHA before push. It found
that the last-active-unlocked Administrator invariant still needed guarded SQL
coverage on every relevant account path; Access mutations needed an opaque
account ID plus expected-revision contract; verified-email login needed to be
bound to the approved application identity fingerprint; public Lending replay
needed to bind its private tracking response to the full original submission;
identifier collision checks needed to span Access IDs, usernames, and pending
applications; and access-policy idempotency needed actor, target, operation,
and request-fingerprint binding.

The current repair tree closes those findings with atomic D1 guards, stable
opaque account revisions, complete collision checks, approved-identity email
qualification, fingerprint-bound idempotency, and payload-bound Lending
replay. A final Worker integration failure also exposed that successful Access
mutations returned the prior explicit revision even though D1 committed the
next revision; the revision helper now derives from the authoritative
credential version and update timestamp, with unit and real Worker regression
coverage.

The third exact-SHA audit rejected `84859cc8fe5685b1af3616309cbd4b88ca320dea`
before push after identifying two remaining retry-safety gaps. Account-
application replays were bound to application and target state but not to the
actor and full canonical request; Access account-status mutations had no
idempotency contract. The current repair binds initial application,
resubmission, review, approval, activation, withdrawal, expiration, archive,
and owner-override replays to canonical actor/request fingerprints while
verifying replayed passwords against the persisted KDF credential. Access
status mutations now require a client request ID, reject changed-payload reuse,
and commit the idempotency record atomically with status, session, and audit
writes. A new independent review of the eventual freeze SHA is still required;
no acceptance from a superseded SHA is reused.

The fourth fresh exact-SHA review rejected
`d7ab28711bfaf06592d8d9a9cc76212fbc159013` before push with one P2. An account-
status command that was already satisfied returned a no-op without reserving
its retry key, so the same delayed command could become a later mutation after
an intervening state change. The replacement repair records the no-op result
in `idempotency_keys` through a revision-and-status-guarded atomic batch. Exact
retries now replay the original no-op, changed-payload/key reuse conflicts, and
a stale account snapshot rolls back without a receipt. The changed-status path
also reconciles a raced identical commit through the durable receipt. A fresh
exact-SHA review remains mandatory.

The fifth fresh exact-SHA review rejected
`36a27cc635d762e233bff2c27b10e8a8ec2e263b` before push with one P2. Owner-
override handling compared the caller's confirmed current state with the
already-advanced application before checking the durable replay receipt, so an
exact retry failed. The same current-state/action confirmation was absent from
the request fingerprint. The replacement repair binds both fields into forward,
request-changes, reject, and approve fingerprints; performs exact replay before
current-state validation; and retains fail-closed validation for new writes.
Focused proof covers exact forwarding and approval replays plus changed-state
key conflicts. A fresh exact-SHA review remains mandatory.

## Verification evidence

- Focused identity/access: 14 files / 73 tests passed; focused lint passed.
- Focused final regressions: 2 files / 12 tests and 14 browser tests passed
  with 8 intentional skips.
- Release identity: 3 files / 15 tests and 10/10 focused browser tests passed.
- Final `npm run check`: 113 files / 774 tests passed; lint, two deterministic
  builds, 34 Apps Script sources / 57 required functions, generated parity,
  Cloudflare type/dry-run checks, and all standalone artifacts passed.
- Full browser matrix: 136 passed / 356 intentionally scoped skips / 0 failed.
- Local Worker/D1 matrix: 39/39 passed against schema 30.
- Focused third-cycle regressions: 4 files / 40 tests, focused lint, 2/2 Access
  Worker tests, and 1/1 department Worker test passed.
- Focused fourth-cycle no-op idempotency regressions: 2 files / 32 tests and
  focused lint passed, including real D1 success and stale rollback proof.
- Focused fifth-cycle owner-override replay regressions: 1 file / 8 tests and
  focused lint passed, including forward and approval exact-retry proof.
- Explicit migration 0030 rehearsal: 1/1 passed against migrations 0001-0030.
- `git diff --check`: passed before freeze.

Primary capped logs are under `.codex/runtime/logs/` and remain ignored local
evidence:

- `2026-08-03T13-09-54-765Z-full-repository-check-v072-candidate.log`
- `2026-08-03T13-16-49-695Z-full-playwright-v072-candidate-green.log`
- `2026-08-03T13-08-25-131Z-local-worker-d1-v072-final-green.log`
- `2026-08-03T13-38-48-746Z-full-repository-check-v072-r2-repairs.log`
- `2026-08-03T13-39-37-953Z-full-playwright-v072-r2-repairs.log`
- `2026-08-03T13-41-49-325Z-local-worker-d1-v072-r2-repairs.log`
- `2026-08-03T13-43-48-825Z-migration-0030-rehearsal-r2-repairs-2.log`
- `2026-08-03T14-32-28-073Z-full-repository-check-v072-r2-round2-final.log`
- `2026-08-03T14-33-28-681Z-full-playwright-v072-r2-round2-final.log`
- `2026-08-03T14-30-38-821Z-local-worker-d1-v072-r2-round2-fixed.log`
- `2026-08-03T14-36-03-563Z-migration-0030-rehearsal-r2-round2-final.log`
- `2026-08-03T15-03-11-454Z-r2-final-replay-lint-2.log`
- `2026-08-03T15-04-21-954Z-r2-final-replay-focused-unit-2.log`
- `2026-08-03T15-01-03-766Z-r2-final-replay-worker-access.log`
- `2026-08-03T15-01-45-294Z-r2-final-replay-worker-departments.log`
- `2026-08-03T15-05-00-676Z-full-repository-check-v072-r2-final-replay-repair.log`
- `2026-08-03T15-06-14-420Z-local-worker-d1-v072-r2-final-replay-repair.log`
- `2026-08-03T15-07-56-008Z-full-playwright-v072-r2-final-replay-repair.log`
- `2026-08-03T15-11-11-376Z-migration-0030-rehearsal-r2-final-replay-repair.log`
- `2026-08-03T15-26-02-400Z-r2-noop-idempotency-focused.log`
- `2026-08-03T15-26-24-794Z-r2-noop-idempotency-lint.log`
- `2026-08-03T15-26-46-169Z-full-repository-check-v072-r2-noop-idempotency-2.log`
- `2026-08-03T15-28-09-243Z-local-worker-d1-v072-r2-noop-idempotency.log`
- `2026-08-03T15-30-00-211Z-full-playwright-v072-r2-noop-idempotency.log`
- `2026-08-03T15-33-00-867Z-migration-0030-rehearsal-r2-noop-idempotency.log`
- `2026-08-03T15-41-18-212Z-r2-owner-override-replay-focused.log`
- `2026-08-03T15-41-19-699Z-r2-owner-override-replay-lint.log`
- `2026-08-03T15-41-27-267Z-full-repository-check-v072-r2-owner-override.log`
- `2026-08-03T15-42-28-713Z-local-worker-d1-v072-r2-owner-override.log`
- `2026-08-03T15-44-04-635Z-full-playwright-v072-r2-owner-override.log`
- `2026-08-03T15-47-06-474Z-focused-browser-v072-owner-override-announcement-retry.log`
- `2026-08-03T15-47-18-979Z-full-playwright-v072-r2-owner-override-retry.log`
- `2026-08-03T15-50-11-296Z-migration-0030-rehearsal-r2-owner-override.log`

## Blocking pre-production gate

Pre-production is fail-closed because this mandatory private input is absent:

1. an owner-approved and implemented live email-delivery provider.

The identity-qualification policy is decided. On 2026-08-07 the owner selected
Option A: automatic qualification requires an exact normalized verified-email
match against the protected active USC Officer and Staff Directory projection,
and unmatched applicants remain fail closed for governed manual review. No
private identity classes are required for Option A, and no domain is invented
or hardcoded.

The Worker intentionally reports
`ACCOUNT_APPLICATION_EMAIL_PROVIDER_NOT_CONFIGURED` and, when absent,
`ACCOUNT_APPLICATION_IDENTITY_CLASSES_MISSING`. Do not weaken these checks,
invent values, or hardcode private configuration. Because live delivery and
redemption cannot be proven, Stage 9 pre-production, production deployment,
tag/release, staging rebaseline, and DOL rollout are not started.

## Recovery and rollback

- Migration 0030 is forward-only and additive. Before any external migration,
  capture the exact target, D1 export/Time Travel bookmark, migration list,
  current immutable Worker/static rollback, and required R2/Google recovery
  metadata.
- Follow `docs/D1_MIGRATION_AND_ROLLBACK.md` and
  `docs/PRODUCTION_INCIDENT_GUIDE.md`.
- On any identity, authorization, privacy, migration, readiness, version, or
  reconciliation mismatch: contain, preserve evidence, restore the prior
  Worker/static target, recover D1 from the captured point when required, and
  rerun affected staging gates. Never rewrite append-only history.

## Next exact action

Run a fresh independent exact-SHA security/authorization and
transaction/idempotency review of the RV-01 repair head and verify exact-head
PR CI. Then the owner/operator selects and authorizes one live email-provider
implementation. Implement and test that provider in the repository, rerun the
complete exact-SHA gates, execute isolated pre-production acceptance with no
mandatory `UNRUN`, and only then use the already-recorded production
authorization for the verified exact target.

Identity policy no longer blocks: Option A is decided and requires no private
identity-class configuration.
