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

### Independent review round 2 (2026-08-07) — security/authorization/privacy

Independent security review of `a0a4ee8` returned **FAIL**. It explicitly
cleared the public/internal boundary, scope correctness (including
`operationalScope` escalation), SQL/LIKE/date query safety and placeholder
arithmetic, PII and search enumeration, review-command authorization ordering,
and poller authentication. Material findings and dispositions:

| Sev | Finding | Verified? | Disposition |
|---|---|---|---|
| P1 | The `REQUEST_ALREADY_ROUTED` guard ran only when `nextStatus !== 'ACCEPTED'`, but an ACCEPT whose remaining decisions are all REJECT derives a REJECTED parent — reproducing the exact stranding the round-1 fix claimed to close. | **Confirmed.** | **Fixed.** The guard now keys off the derived outcome, so any path that yields a REJECTED parent while a routed line exists is refused. Proven against real D1. |
| P1-equivalent | `/api/getScopedRevision` hardcoded `enabled: false`, so `createRevisionPoller` permanently disables itself after the first check and then refuses route return, focus, and reconnect. The RV-01.4 near-live refresh therefore did not exist at the client, even though the server revisions advanced. | **Confirmed** — the round-1 e2e only proved server-side token advance and never drove the poller. | **Fixed.** REST now reports the mechanism enabled, and every scoped-revision assertion in the RV-01 spec checks the flag. |
| P2 | The DENY short-circuits are unreachable, and the supporting test is a source-text grep. | **Confirmed.** | **Handoff corrected** — see the adjudication row above. Branches retained as defence in depth, no longer described as a live repair. |
| P2 | An `ALL`-scope Director/Administrator who also holds a committee assignment is demoted to COMMITTEE scope by `resolveOperationalContext` and then cannot see or command unassigned requests. | **Not reproduced here** — seeded fixtures have no committee on ALL roles, and production account shapes were not inspected. | **Open, recorded below.** Reachable by configuration; needs an owner check of real account shapes before promotion. |
| P2 | `filterOperationalData` runs after `moduleTotal`, so under LOCATION/EVENT scope `total`/`hasMore` describe pre-filter rows and lines are dropped from surviving parents. | **Confirmed by inspection.** | **Open, recorded below.** |
| P2 | The effective default page size is 50 parents, not the advertised 10, so the 500-line child cap is far easier to hit than the earlier "rare edge case" disposition assumed. | **Confirmed.** | **Open, recorded below** with the disposition corrected. |
| P2 | `wrangler.jsonc` serves `./dist`, which holds the preview/mock artifact; a deploy without `build:cloudflare` would publish a mock-backend hub against live D1. | **Confirmed.** | **Open, recorded below** — a real RV-01.8 target-identity hazard for RV-03 preflight. |
| P3 | `REQUEST_ALREADY_ROUTED` also triggered on merely REJECTED lines that own nothing. | **Confirmed.** | **Fixed** — the probe now counts only `FOR_CANVASSING`/`READY_TO_RESERVE`. |
| P3 | Queue fixture emits fields the server never produces; unbounded server-side `query` length; requester-only accounts receive full inventory availability via `/api/requests` (pre-existing). | **Confirmed.** | **Open, recorded below.** |

### RV-01 criterion adjudication (2026-08-07)

Each item below was checked against the accepted amendment
`.codex/specs/v0.7.2-rv-01-request-visibility-amendment.md`. Nothing is waived
silently; every criterion is either implemented with coverage or recorded with
its reason and disposition.

| Criterion | Amendment basis | Mandatory? | Disposition |
|---|---|---|---|
| Director authorization coverage | RV-01.3 table: "Director with verified central capability — Yes / Yes" | **Yes** | **Implemented.** `LOCAL.DIRECTOR` now proves read access to unassigned central review work in `tests/cloudflare-e2e/rv01-request-visibility.spec.js`. |
| Explicit-deny coverage | RV-01.3 table: "Explicit deny, disabled, archived — No / No" | **Yes** | **Satisfied by capability denial, not by scope mode. Earlier claim in this handoff was overstated and is corrected here.** Explicit deny is modelled as a capability deny in `src/server/access/policy.js` and enforced by `assertCapability`, which refuses the module before any scope predicate runs. `accountAuthorization` in `src/server/auth/contracts.js` only ever emits `COMMITTEE`, `SELF`, or `ALL`, so a `'DENY'` scope mode is **not currently reachable** server-side. DENY short-circuits were added to `scopedWhere`, `multiScopeWhere`, and `assertEntityScope` and are retained as defence in depth against a future producer, but they are **latent, not a live repair** — an earlier revision of this handoff wrongly described them as closing an exploitable hole. Their test is a source-structure assertion and proves textual presence and ordering only. Note also that `entityScope`'s operational-context COMMITTEE override precedes the DENY branch, so if a DENY producer is ever introduced the branch must be hoisted above that override. The unauthenticated case is proven directly (401/403 with the request id absent from the body). |
| Disabled-account coverage | RV-01.3 table, same row | **Yes, as behaviour** | **Covered upstream of the queue.** A disabled account cannot hold a session: login fails, so `/api/requests` is never reached. This is already proven by `Administrator Access Management governs the staging account lifecycle and safe audit history` in `tests/cloudflare-e2e/local-worker.spec.js`. Not duplicated in the RV-01 spec. |
| Archived-account coverage | RV-01.3 table, same row | **Yes, as behaviour** | **Same mechanism as disabled** — archived accounts fail authentication before any module read. Covered by the same Access-lifecycle test. |
| Request-owned search | RV-01.5: "active/archive/date/**search**/scope filtering" | **Yes** | **Implemented.** The client already normalised and sent `query`/`filter`, but the server ignored both for every module — the contract advertised filtering it did not honour. The Request queue now applies escaped `LIKE` search across request id, purpose, and requester name, plus `from`/`to` date boundaries and an active/archive/all selector, with the identical predicate driving `total` and `hasMore`. Proven by `the Request module owns its search, date, archive, and scope filtering`. |
| Saved-filter metadata beyond total/page/`hasMore`/order/archive | **Not present in the amendment.** RV-01.5 enumerates total, page/page-size or cursor, `hasMore`, stable ordering with tie-breaker, and active/archive/date/search/scope filtering. "Saved filters" appears only in the execution prompt's RV1.5 verification checklist. | **No** | **Not required, and not implemented.** No saved-filter feature exists anywhere in the product, so there is no persisted filter state to expose metadata for. Building one would add a new product capability, which the amendment explicitly forbids ("It does not authorize a new product domain or broad redesign"). Deferred to v0.7.3+ if the owner wants saved views. |

### Requester-only and Lending-only separation

Both remain proven by the existing `requester portals keep request and lending
records self-scoped` local-worker test, which provisions a department requester
through the Access API. `LOCAL.REQUESTER` is not a seeded fixture, so the RV-01
spec cites that coverage rather than duplicating account provisioning.

### Release Unit 1 completion (2026-08-07)

Owner authorization to complete the shipped reviewer surface is recorded as
addendum RV-01.9 in the accepted amendment. Implemented and proven:

- **Shipped reviewer UI.** `src/visual/runtime.js` now renders a Request review
  queue for actors holding `request.review`, sourced only from the Request-owned
  projection, with a per-line decision control that offers only server-permitted
  routes. It submits through the existing `reviewRequest` command with explicit
  `lineDecisions`, keeps errors recoverable without claiming a decision was
  recorded, and refreshes canonical server state on success. The view markup is
  injected by the runtime rather than hand-edited into the generated
  `src/visual/views/request.html`. The public portal never renders it.
- **Gap A — ALL-scope demotion.** `committeeRestricted` was removed from
  `boundedScope`, so an ALL-scope Director/Administrator holding a committee
  keeps the `ALL` operational option and retains unassigned-queue visibility and
  review authority. Event and location bounds still apply.
- **Gap B — scope filtering vs pagination.** Search, date, archive, and scope
  predicates are in the authoritative SQL, so page and total share one predicate.
  `filterOperationalData` still post-filters LOCATION/EVENT scopes; that residue
  is recorded below.
- **Gap C — parent page vs child cap.** The Request page is clamped to
  `MAX_REQUEST_LINE_ROWS / MAX_REQUEST_LINES_PER_PARENT` parents, so a page can
  never carry more lines than the contract allows, and `pageSize`/`hasMore`
  report the clamped value.
- **Gap D — query bound.** Search is bounded server-side at 80 characters, and
  substring matching moved from `LIKE` to `instr()`. An over-long term returned
  D1 `LIKE or GLOB pattern too complex` as a 500; `instr()` has no pattern
  limit and treats `%`/`_` literally rather than as silent wildcards.
- **Gap E — requester-only containment.** `/api/requests` is reachable by any
  `VIEW_REQUEST` holder, including requester-only accounts, which received full
  `onHand`/`reserved`/`availableToPromise`/`storageLocation`/`reorderThreshold`.
  Availability is now redacted by `VIEW_INVENTORY` capability rather than by
  `requestOnly`. Staff inventory visibility is unchanged.
- **Gap F — deploy artifact hazard.** `scripts/verify-deploy-artifact.mjs` is a
  fail-closed preflight that reads the Vite build mode inlined in
  `dist/index.html` and refuses any preview/mock artifact. Proven both ways:
  exit 1 on the preview build, exit 0 on the Cloudflare build. Wired into new
  `deploy:staging` / `deploy:production` scripts so a deploy cannot skip it.

Verification at this head: `npm run check` 114 files / 786 tests, exit 0;
browser 136 passed / 356 intentional skips / 0 failed; local Worker/D1 **48/48**,
including the shipped-UI two-context proof, the RV-01.3 authorization matrix,
page-bound, search-bound, and partially-routed reject guards. No migration added.

### Independent review round 5 (2026-08-07) — both reviewers, SHA 67eef18

Both fresh reviews returned **FAIL**. Repairs landed at `18edbdc`.

| Sev | Finding | Disposition |
|---|---|---|
| **P0** | The reject guard probed `request_lines` for a status literal, but `transitionDeliverable`/`transitionRestock` advance the line status in lockstep with their downstream item. Once procurement moved a deliverable past `FOR_CANVASSING` the probe counted zero, a whole-request REJECT succeeded, and the deliverable stayed live through receiving to `confirmRelease` — which resolves the parent without checking its status. **Physical stock could be issued against a REJECTED request.** | **Fixed.** The guard now tests the owner tables directly (unclosed deliverable, unclosed restock, ACTIVE reservation). Probing line statuses was the wrong shape. |
| P1 | The `READY_TO_RESERVE` sweep lived only in the non-accept branch, so a derived-REJECTED accept left a stock-ready line reservable. | **Fixed** — sweep keyed off the derived outcome. |
| P1 | `reserveStock` never checked the parent request status, so a stock-ready line could consume availability under a `NEEDS_INFORMATION` or `REJECTED` parent. | **Fixed** — requires an accepted parent. |
| P1 | The shipped queue rendered its own row count with no pager while the server clamps to ten parents, so the eleventh pending request onward was invisible to every reviewer. | **Fixed** — true server total plus prev/next paging. |
| P1 | `eventScopeIds`/`eventSeriesScopeIds` were consulted only for operational-context options, leaving the command path open. | **Fixed for the review command**; other commands recorded below. |
| P2/P3 | `filterOperationalData` post-filter vs total under LOCATION/EVENT scope; `deploy:*` scripts resolve committed placeholder `wrangler.jsonc` rather than the private config; tracked `dist/` artifact; SELF-scope self-approval if `request.review` is granted to a requester; `/api/getScopedRevision` scope not capability-checked; ADMINISTRATOR lacks `REQUEST_REVIEW` by default. | **Recorded below.** |

Also split `tests/e2e/inventory-workspace.spec.js:200` at the release boundary. It ran 36 sequential navigations and used 17.7s of a 30s budget in isolation, exceeding it under load. No assertion weakened; the browser matrix is green at 138 passed / 0 failed.

### RV-01 remaining gaps

- **Operational-scope filtering vs pagination.** `filterOperationalData` runs
  after the Request total is computed, so under LOCATION/EVENT scope
  `total`/`hasMore` describe the pre-filter set and lines are dropped from
  parents that survive. The scope predicate belongs in SQL.
- `filterOperationalData` still post-filters LOCATION/EVENT operational scopes
  after the Request total is computed, so under those scopes `total`/`hasMore`
  can describe more rows than are rendered. Search, date, archive, and committee
  scope are all in SQL and unaffected.
- The RV-01 unit fixture emits parent/line fields the server never produces
  (`requesterGroup`, `dateStart`, `dateEnd`, `requestedQuantity`), so the
  renderer's real production date fallback is not exercised by unit tests.
- `request_lines.fulfillment_source` still reports the submission-time value
  after review rather than the decided route. Traceability only; no server
  branch depends on it post-review. Deferred to v0.7.3.
- **RV-01 still has no PASS.** Five review rounds have run; every one found real
  defects, round 5 including a P0. The repairs at `18edbdc` postdate both round-5
  reviews, so a fresh round on `18edbdc` is required before RV-01 can close.
- **Deploy scripts resolve the committed placeholder `wrangler.jsonc`.**
  `deploy:staging`/`deploy:production` run `wrangler deploy --env <env>` with no
  `-c`, so they target `REPLACE_PRIVATELY_*_D1` and the all-zero `database_id`.
  The only command that reaches a real target uses a private config and skips the
  artifact preflight. Must be reconciled before any environment write.
- `dist/` is tracked and currently holds a Cloudflare-mode artifact, so a bare
  `wrangler deploy` bypassing the npm scripts uploads it with no preflight.
- Event/series scope is enforced on the review command only; `reserveStock`,
  `confirmRelease`, and other commands still ignore those bounds (pre-existing).
- A SELF-scope account granted `request.review` could approve its own request;
  there is no actor-vs-requester separation-of-duties check.
- `ADMINISTRATOR` does not hold `REQUEST_REVIEW` in the role registry, so the
  reviewer surface is hidden for Administrators unless explicitly granted.
  Owner confirmation needed on whether that is intended.

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
