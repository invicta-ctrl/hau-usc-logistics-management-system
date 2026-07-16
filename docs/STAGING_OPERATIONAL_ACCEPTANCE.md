# Slice 13 Staging Operational Acceptance

## Current disposition

`BLOCKED_BEFORE_EXTERNAL_PREFLIGHT`

Repository readiness work is complete through Slice 12, but the live Slice 13
gate cannot start safely from a blanket continuation instruction. The accepted
plan requires a named staging owner, an explicitly authorized private resource
set, an approved synthetic/redacted fixture, named testers, a rollback target,
and a signed acceptance matrix. These inputs identify who and what may be
changed; none may be inferred from an old configuration file or deployment
report.

No `clasp` command, remote source read, Apps Script execution, Sheet/Drive
access, backup, migration, trigger change, deployment, or operational mutation
was performed during this readiness audit.

## Exact repository candidate

- Branch: `integration/v0.5-baseline`.
- Slice 12 implementation:
  `a563f2f179b710ac7c0d46a8af05a4349a5e625b`.
- Slice 12 evidence checkpoint:
  `569d2a787585dbdf68d68c1da1d5440a18a2540a`.
- Draft PR: #7, open, mergeable, and unmerged.
- Implementation CI: runs `29477031867` and `29477031799` passed
  `validate`, `verify`, and `browser-smoke`.
- Evidence CI: runs `29477246636` and `29477246392` passed the same three
  checks.
- Local package: 36 Vitest files / 303 tests; 67 Playwright passes / 119
  intentional skips / 0 failures; 33 Apps Script sources / 55 required
  functions; two 411,048-byte standalone artifacts.

This identifies the repository candidate only. It does not identify or
authorize a Google Workspace target.

## Readiness inventory

| Dependency                            | Current evidence                                                                                                      | Status                  | Required closure                                                                                                                             |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Reviewed release-scope implementation | Slices 4-12 are committed, pushed, and exact-SHA CI green                                                             | READY                   | Preserve the exact candidate; no opportunistic code changes during acceptance                                                                |
| Active checkout hygiene               | One authoritative checkout; no tracked or active `.clasp.json`                                                        | READY                   | Keep private configuration outside Git                                                                                                       |
| Staging clasp candidate               | Private candidate files exist outside Git, including `private-config/staging/deployment-worktree-20260715.clasp.json` | PRESENT, NOT AUTHORIZED | Owner must name the one exact config path and confirm it targets the approved staging script                                                 |
| Staging owner/account                 | Historical reports mention an owner-only deployment but do not constitute current authorization                       | MISSING                 | Name the accountable owner and signed-in operator account privately                                                                          |
| Operational and backup Sheets         | Historical identifiers/backups exist only in private/stale evidence                                                   | UNVERIFIED              | Privately identify the staging operational and distinct backup workbook; authorize read/preflight and later backup/setup actions             |
| Drive folders                         | Current source requires seven keys: root, receipts, canvass, release, deliverable, lending, and archive               | UNVERIFIED              | Confirm all seven private folder mappings, ownership, parentage, and restricted sharing                                                      |
| Deployment and rollback               | Historical Version 18/Version 13 records predate Slices 4-12                                                          | STALE                   | Privately identify the current deployment ID/version and immutable rollback version immediately before the run                               |
| Synthetic/redacted fixture            | Repository mocks are synthetic, but no owner-approved staging fixture or records are designated                       | MISSING                 | Approve a non-personal fixture, record namespace, cleanup/retention rule, and allowed mutations                                              |
| Named testers and role seeds          | No current tester roster or approval record was found                                                                 | MISSING                 | Name internal, committee, requester-only, unauthorized, accessibility, data, and deployment testers; approve least-privilege seed/revocation |
| Acceptance matrix/sign-off            | No current signed Slice 13 matrix was found                                                                           | MISSING                 | Assign business, data/privacy, security/access, accessibility, and deployment signatories                                                    |
| Test window/support                   | No current maintenance/support window or incident contacts were found                                                 | MISSING                 | Set the window, stop authority, communication channel, and recovery contacts                                                                 |
| Evidence handling                     | Repository policy is redacted/synthetic only; retention owner/date remain unset                                       | PARTIAL                 | Approve private evidence location, redaction rule, retention date, and who may view it                                                       |
| Secret handling                       | Private configs are outside Git and no values were exposed in this audit                                              | PARTIAL                 | Name the current custodian/operator, confirm local file permissions and credential session, and prohibit value capture in evidence           |
| Storage/capacity                      | Historical evidence reported low Google storage headroom; current capacity was not read                               | UNVERIFIED              | Owner confirms safe storage headroom before backup or evidence upload                                                                        |

Historical release packages and private configuration are preservation evidence,
not current authority. Their identifiers and values must not be copied into Git,
chat, screenshots, logs, or a public acceptance report.

## Owner authorization record

Complete this record privately before any external preflight. Repository
evidence may record only safe labels and approval timestamps, never IDs or
credentials.

| Field                                    | Required value                                                      |
| ---------------------------------------- | ------------------------------------------------------------------- |
| Staging owner                            | Named accountable person                                            |
| Operator account                         | Named institutional account authorized to use staging               |
| Exact private clasp config               | One approved absolute path outside Git                              |
| Staging project label                    | Safe human label; Script ID stays private                           |
| Operational workbook label               | Safe human label; ID stays private                                  |
| Backup workbook/folder labels            | Safe labels; IDs stay private                                       |
| Seven Drive-folder mappings              | Privately verified complete and restricted                          |
| Existing deployment and rollback version | Privately verified immutable identifiers                            |
| Approved fixture                         | Versioned synthetic/redacted dataset and allowed mutation namespace |
| Testers                                  | Named people mapped to the required roles                           |
| Signatories                              | Business, data/privacy, security/access, accessibility, deployment  |
| Window and stop authority                | Start/end, incident contact, and person who can halt writes         |
| Evidence retention                       | Private location, viewers, redaction rule, disposal date            |

Authorization must explicitly permit each external action category needed by
the run: remote source/status reads, backup creation, additive schema setup,
trigger setup, fixture/access seeding, migration dry run, test deployment,
synthetic workflow writes, evidence uploads, rollback rehearsal, and cleanup or
retention. Approval of one category does not imply another.

### Deterministic private handoff

The repository includes a fail-closed helper that creates and validates the
authorization record without printing its private values. The JSON record must
remain outside the repository and outside any public evidence directory.

```powershell
npm run staging:authorization:init -- D:\private-approved-location\slice-13-authorization.json
npm run staging:authorization:check -- D:\private-approved-location\slice-13-authorization.json
```

The initializer refuses an in-repository destination and will not overwrite an
existing file. The validator binds the record to the reviewed Slice 12 commits
and artifact hashes, checks the seven Drive mapping confirmations, owner,
operator, fixture, tester/signatory, window, evidence, capacity, and secret
handling fields, verifies that the named private clasp-config path exists, and
reports the highest consecutively authorized gate. It emits field names and
action-category decisions only, never the supplied values. A valid structure
does not itself prove acceptance or authorize a later gate; `DENIED` or
`PENDING` stops the reported sequence before that gate.

## Execution gates

### Gate A - Identity, target, and evidence boundary

- Record the exact candidate commit and green CI.
- Confirm a clean authoritative checkout and private config outside Git.
- Privately resolve the staging project, operational/backup workbooks, seven
  Drive mappings, current deployment, and rollback version.
- Confirm owner/operator/tester/signatory identities and the acceptance window.
- Approve the fixture and evidence retention/redaction rules.

Stop if any identity, resource, sharing, audience, or authority is ambiguous.

### Gate B - Read-only remote preflight

- Run `clasp status` only from the authorized staging configuration.
- Pull remote source into a separate temporary location; do not overwrite the
  reviewed checkout.
- Compare complete source/manifest inventory, preserve the reviewed web-app
  audience, and record safe hashes/counts.
- Verify current deployment/rollback labels privately and confirm sufficient
  storage headroom.

Stop on target mismatch, source drift, audience drift, missing rollback, or
insufficient capacity. `clasp status` is not deployment evidence.

### Gate C - Backup, setup, and reconciliation

- Create and verify the approved staging backup before any setup or write.
- Run additive schema setup and validation only against the named staging
  workbook.
- Validate all seven Drive mappings and least-privilege access.
- Run migration dry-run and reconciliation; do not apply a migration unless the
  separately approved report says it is required.
- Install or verify each approved trigger idempotently.

Stop on any privacy, authorization, schema, inventory, ledger, evidence, or
reconciliation failure.

### Gate D - Exact test deployment and safe seed

- Push only the reviewed package using the manifest safeguard, pull it back,
  and require exact source/hash parity.
- Use an explicitly approved staging test deployment without changing the
  existing accepted deployment pointer until all test gates pass.
- Seed only the approved synthetic namespace and least-privilege test roles.
- Verify revocation before functional writes begin.

### Gate E - Operational acceptance matrix

| ID        | Must-pass evidence                                                                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TRACE-01  | Commit, generated hashes, pulled source, Apps Script version, deployment, manifest, and audience all match                                                                                                                |
| AUTH-01   | Internal, committee-scoped, requester-only, unauthorized, administrator, and read-only identities receive exactly their allowed capabilities                                                                              |
| PRIV-01   | Request-only responses/screens contain no internal navigation, revision tokens, private contacts, IDs, roster, audit, supplier, evidence, Drive, or exact protected balance fields                                        |
| FUNC-01   | Full-stock, partial split, no-stock procurement, cumulative receipts, partial/full release, lending approval/handoff/overdue/return, line-level restock, and reference administration pass with expected server decisions |
| DATA-01   | Ledger, reservations, status history, audit, errors, evidence metadata, optimistic revisions, and parent/child status reconcile after every workflow                                                                      |
| IDEM-01   | Duplicate/retry returns the original result; competing writes do not double-allocate, double-receive, replay, or overwrite a newer revision                                                                               |
| EVID-01   | Approved synthetic upload validates type/size/name/digest/folder/private sharing; duplicate and failure/quarantine behavior pass without real data                                                                        |
| SYNC-01   | Two internal sessions: clean eligible visibility p95 is at most 25 seconds; no routine sample exceeds 35 seconds; unchanged checks fetch no module; changed checks fetch only the active module                           |
| SYNC-02   | Dirty form, active modal, focus/reconnect/manual refresh, hidden/offline/inactive pause, direct edit invalidation, and remote disable preserve data and never replay a write                                              |
| PERF-01   | Shell at most 2 seconds; warm essential bootstrap p95 at most 5 seconds; cold p95 at most 8 seconds; slow state at 8 seconds; no routine success over 10 seconds under the approved fixture                               |
| LOAD-01   | Approved expected/peak sessions remain inside documented Apps Script/page concurrency and request/read safety margins                                                                                                     |
| COMPAT-01 | Supported institutional browsers and all six target viewports (320, 390, 768, 1024, 1366, and 1440 px) pass the applicable matrix                                                                                         |
| A11Y-01   | Keyboard, focus, manual screen-reader smoke, high contrast, 200% and applicable 400% zoom, mobile, and slow/error paths have named tester evidence; no WCAG claim without a full audit                                    |
| REC-01    | Backup restore/reconciliation and code-version rollback rehearsal meet approved recovery objectives without deleting ledger/audit/history/evidence records                                                                |
| TRAIN-01  | Pilot operators acknowledge workflow, privacy, error/correlation, retry, incident, and rollback procedures                                                                                                                |

### Gate F - Closure

- Zero open P0/P1 issues.
- Every must-pass row is signed by its named owner/tester.
- Any lower issue has an owner, due date, workaround, and explicit acceptance.
- Record exact staged commit/version/hash, privacy/access review, performance
  sample, accessibility report, rollback record, training acknowledgment, and
  open-risk register.
- Business owner signs the matrix before Slice 14 can begin.

Screenshots alone are never acceptance. An unrun row remains `UNRUN`; it must
not be inferred from repository tests or historical deployment evidence.

## Stop and rollback rules

Immediately stop new staging writes and preserve correlation/version evidence
on any target mismatch, P0/P1, privacy leak, unauthorized capability, inventory
or ledger divergence, idempotency failure, partial migration, evidence-sharing
failure, unavailable rollback, or unsafe capacity signal. Repoint only the
authorized existing staging deployment to the recorded immutable rollback
version, reconcile all completed test writes, retain append-only history, and
open an incident record. Never repair by deleting ledger, audit, history, or
evidence rows.

## Current unblock request

Provide or privately confirm all of the following as one bounded authorization
package:

1. named staging owner and operator account;
2. the exact approved private clasp-config path and safe staging label;
3. permission for read-only remote preflight, followed by the specific write
   categories authorized for this run;
4. approved synthetic/redacted fixture and allowed record namespace;
5. named tester-role matrix and five signatories;
6. current deployment/rollback labels, window, stop authority, evidence
   location/retention, and storage-headroom confirmation.

Until that package exists, Slice 13 remains correctly blocked before any
external resource is accessed. Slice 14 production promotion, Slice 15 hosted
architecture decision, and Slice 16 future database specification remain
dependency-gated and must not be represented as started or accepted.
