# HAU-USC V1.0 Planning and Recommendation Package

> **PROPOSED — NOT YET ACCEPTED**
>
> Planning, specification, and release analysis only. This document does not authorize implementation, migration, deployment, access changes, Google Sheet or Drive writes, or production activity.

## Summary

The requested product direction is feasible, but it is not a single safe milestone. The first priority is to establish what code and deployment produced the reported startup failure, add bounded observability and recoverable client loading states, and then replace the current all-modules bootstrap with a small versioned session bootstrap plus lazy module reads. Committee workspaces, private-roster synchronization, composite event requests, managed reference catalogs, restock action safety, and near-live refresh must follow as separately reviewed vertical slices.

The repository already has strong ledger, idempotency, audit, privacy, staging, and generated-package foundations. It also contains material conflicts that must be resolved before V1.0: the current branch has no PR/CI evidence, the prompt calls an issue “production” while repository records say production is untouched, role names and committee permissions disagree across browser and server code, the internal bootstrap is overbroad, and current restock queue status controls do not have a corresponding server transition API.

## Type

Enhancement and release-stabilization program, beginning with a P0 fix.

## Source task

- Local brief: D:\Download\HAU_USC_Codex_Sol_Ultra_Planning_Prompt.md
- Repository instructions and accepted documentation at commit 5a3b1248569b9a5f9148b95bcd4d2bc829639c9f
- No complete “Full Project Report” was included after the prompt placeholder.
- No paper venue/equipment form image was supplied in this task.

## Status

Todo. Rename to a .done.md document only after every approved implementation slice and acceptance gate is complete. This proposal itself requires owner and manager review before any implementation begins.

## Repository handshake and expected checkpoint

| Item | Verified value |
|---|---|
| Repository root | D:/Documents/DOL Website GitHub |
| Branch | feat/live-sync-lending-search-catalog-controls |
| HEAD | 5a3b1248569b9a5f9148b95bcd4d2bc829639c9f |
| Upstream | origin/feat/live-sync-lending-search-catalog-controls |
| Working tree before this document | Clean |
| Fetch | git fetch origin --prune succeeded |
| Ahead / behind | 0 / 0 |
| Documented 0.5.0 starting commit | 81efe82618048b79a821f93bd95a0be00eaeff43 |
| Relationship | The documented start is an ancestor; current HEAD is exactly one commit later |
| Expected review checkpoint | Current fetched handoff commit 5a3b1248569b9a5f9148b95bcd4d2bc829639c9f |

No pull was needed. The state was clean, attached, correctly tracked, and non-divergent.

## Original requirements and coverage

Every requirement group in the supplied planning brief is mapped below. “Slice” refers to the roadmap in Section 9.

| ID | Requirement group | Covered by |
|---|---|---|
| R01 | Perform and report the Git handshake, fetch, compare upstream, confirm the expected commit, and stop on unsafe state. | Handshake; Sections 1–2 |
| R02 | Keep this task analysis/planning-only; do not implement, deploy, mutate external systems, expose secrets, merge, tag, or publish. | Status; global slice constraints; Section 9 |
| R03 | Reconcile the full report and paper-form evidence against the repository. | Evidence gaps; Sections 2, 8, 12 |
| R04 | Treat the reported stuck startup as a P0 and assess every proposed server, transport, contract, rendering, duplicate-call, lock, and startup-work cause without claiming an unproved root cause. | Section 3; Slices 1–2 |
| R05 | Require backend/client stage timing, success/failure handling, timeout/retry UX, payload validation, JSON-safe DTOs, small bootstrap, lazy modules, duplicate prevention, and measurable startup targets. | Section 3; Slices 1–2; Section 10 |
| R06 | Support exactly three permanent committees using a private approved roster and one specialized Main Hub. | Sections 4, 5, 7; Slices 3–5 |
| R07 | Give the Director oversight and committee heads approved visibility/action without equating visibility with destructive/admin authority. | Sections 4, 7, 12; Slices 3–5 |
| R08 | Provide committee dashboard queues, deadlines, blockers, evidence gaps, staff, updates, completions, escalations, links, and audit-derived logs. | Sections 4 and 8; Slice 5 |
| R09 | Provide Food Committee workflow specialization. | Section 4; Slice 7 |
| R10 | Provide Inventory and Pantry specialization, including Lending Hub and inventory/pantry workflows. | Section 4; Slice 5 |
| R11 | Provide Materials Committee specialization. | Section 4; Slice 8 |
| R12 | Do not invent a fourth permanent committee; make venue/equipment ownership configurable and seek approval. | Sections 4, 5, 12; Slice 9 |
| R13 | Make Food, Materials, and Venue & Equipment optional and support every non-empty combination. | Sections 4, 6, 8; Slice 6 |
| R14 | Create one parent and one independent child per completed section, with no child for a blank section. | Sections 4–6; Slice 6 |
| R15 | Define parent derivation for drafts, review, rejection, partial completion, completion, partial/parent cancellation, reopen, additions, duplicates, and amendments; never complete from one child. | Section 6; Slice 6; Section 10 |
| R16 | Provide pre-submit combined review, required-value validation, return-to-section flow, optional labels, duplicate consolidation, and a visible resulting hierarchy. | Section 8; Slice 6 |
| R17 | Provide admin-managed venue/facility and equipment/logistics catalogs; examples are not source-of-truth values. | Sections 4–5, 8; Slices 9–10 |
| R18 | Use responsive searchable/grouped selection, predictive add-item flow, quantities, summaries, “Other,” routing, lead-time, office, authority, and controlled inputs. | Sections 4 and 8; Slice 9 |
| R19 | Let authorized admins manage the complete organization, staff/committee structures, venue/equipment references, routing, availability, lifecycle, instructions, and aliases without raw-sheet editing. | Sections 4–5 and 8; Slice 10 |
| R20 | Use fixed enums, comboboxes, autocomplete, date/numeric controls, and limited free text. | Section 8; Slices 6, 9–10 |
| R21 | Enforce server authorization, validation, history, audit, revision checks, idempotency, archive, dependency warnings, and confirmations for admin changes. | Sections 4, 5, 7; Slice 10 |
| R22 | Keep the private roster identifier/data out of git, logs, fixtures, screenshots, issues, generated assets, and output; commit only the property key, schema, validation, redacted setup, and safe failure behavior. | Sections 5 and 7; Slice 4 |
| R23 | Authorize by exact normalized roster/access match, active status, approved role/committee, and explicit server permissions; never send the full roster to the client. | Sections 4, 5, 7; Slices 3–4 |
| R24 | Avoid roster reads during normal startup; evaluate validated sync, admin sync, cache/index, revisions, freshness, and fail-closed behavior. | Sections 3, 5, 7; Slice 4 |
| R25 | Replace prominent restock status buttons with a detail/review surface, allowed-action explanations, consequences, confirmation, idempotency, replay protection, server transition validation, and resulting audit/status. | Sections 4, 6, 8; Slice 11 |
| R26 | Provide visible-tab, non-overlapping, focus-aware, backoff polling; refresh after local mutation; show last update/stale/manual controls; avoid full bootstrap polling; analyze quotas and define acceptance. | Sections 3–4, 9–11; Slice 12 |
| R27 | Separate Apps Script stabilization, possible hosted frontend migration, and future database work; cover authentication, authorization, sessions, CORS, CSRF, replay, idempotency, errors, environments, secrets, diagnostics, rollback, and data continuity. | Sections 4, 7, 9, 11, 13; Slices 15–16 |
| R28 | Keep future PostgreSQL/Supabase work out of current implementation while preserving ledger/audit, outbox, retry/dead-letter, reporting projection, reversal, and rollback principles. | Sections 4–5, 9, 13; Slice 16 |
| R29 | Critically assess architecture/domain conflicts, ambiguity, roles, security/privacy/performance/quotas, schema/migration, authorization, workflows, concurrency, rollback, accessibility/mobile/training/storage/testing/release risks. | Sections 2–11 |
| R30 | Present the 18 required owner decisions and every additional decision discovered. | Section 12 |
| R31 | Deliver all 14 requested package sections, including the proposed amendment and a first-slice-only implementation prompt. | Sections 1–14 |
| R32 | Preserve working modules, additive schema, IDs/provenance, immutable records, VERIFY blocking, sanitized bootstraps, small startup data, private configuration, reversible migration, and bounded slices. | Global constraints; Sections 4–10 |

**Coverage check: 32 of 32 requirement groups mapped (100%).** Missing source artifacts are recorded as unresolved inputs rather than silently invented.

# Section 1 — Executive assessment

## Current project state

- Version 0.5.0 is a repository-only, undeployed working revision on the current branch.
- Repository records say immutable staging Version 9 passed HTML diagnostic, internal rendering, loading-overlay clearance, and request-only privacy checks.
- Repository records also say Version 0.5.0 has not been pushed to Apps Script, has not changed staging, and has not touched production.
- The current branch is fetched and aligned, but it has no pull request and no GitHub Actions runs. Draft PR #2 remains open against feat/apps-script-backend-and-launch-readiness at 81efe826…, not the current 5a3b124… branch.
- The current commit contains recorded local results for npm ci, 93 Vitest tests, npm run check, npm run verify, and the six-viewport Playwright matrix. Those are committed handoff claims, not current-branch GitHub CI evidence.

## Release readiness

**Not ready for production or broad pilot.** The strongest existing foundations are server authorization, lock/idempotency patterns, immutable ledger rules, request-only sanitization, generated Apps Script packaging, evidence routing, additive schema setup, and rollback runbooks. The principal blockers are:

1. Provenance of the reported “production” startup failure is unknown and conflicts with repository deployment records.
2. The current commit lacks PR review and CI evidence.
3. The current internal bootstrap reads and returns nearly every operational table and the browser renders every module before clearing the overlay.
4. Post-response client normalization/rendering is not enclosed in a recovery boundary; a JavaScript exception can leave the overlay indefinitely visible.
5. Internal DTOs are not least-privilege scoped and include requester email, borrower contact, supplier TIN, audit, evidence, ledger, and history for every internal bootstrap user.
6. Browser and server role/permission definitions disagree.
7. Composite section children, normalized committee memberships, roster synchronization, managed venue/equipment references, and assignment scopes do not yet exist.
8. The live Apps Script bootstrap returns restockRecords but explicitly sets restockRequests to an empty array, while the visual restock queue contains local-only status changes with no server transition endpoint.
9. Five-second polling currently reloads the complete bootstrap after any revision change, increasing Sheet reads and payload work.
10. Complete staging operational acceptance, manual accessibility validation, access seeding, retention decisions, and owner sign-off remain open.

## Feasibility

The proposal is feasible as a low-volume controlled pilot if work remains on Apps Script/Sheets initially, data reads become modular, permissions become scope-aware, and each feature is released separately. It is not feasible or safe as one “full release” change.

## Immediate next action

Before implementation, the manager/owner should:

1. identify the exact URL environment, Apps Script deployment/version, approximate timestamps, affected account type, browser console evidence, and execution correlation for the reported startup incident;
2. provide the omitted full report and paper-form image, or explicitly accept that they remain outside this amendment;
3. review current commit 5a3b124… in a dedicated PR and obtain CI evidence;
4. approve only Slice 1, P0 Bootstrap Observability and Recovery, with no deployment or operational writes.

# Section 2 — Repository and evidence reconciliation

## Authoritative evidence read

The analysis used AGENTS.md, README.md, PROJECT_STATUS.md, CHANGELOG.md, docs/WORK_CONTINUATION.md, docs/AI_COLLABORATION.md, docs/ARCHITECTURE.md, docs/DOMAIN_RULES.md, docs/SECURITY_AND_ACCESS.md, docs/LAUNCH_RUNBOOK.md, and the repository’s schema, migration, testing, accessibility, incident, hosting, backup, evidence, and roadmap documents. No CLAUDE.md files exist in the repository.

## Conflicts, stale claims, and uncertainties

| Topic | Evidence | Assessment |
|---|---|---|
| “Current production defect” | Prompt says production has slow bootstrap and a stuck overlay; accepted repo records say production is untouched. | Treat as a reported P0, not a proven production incident. Exact environment/version must be supplied. |
| Current branch CI | Current branch has no PR and no Actions runs. PR #2 checks passed, but PR #2 points to the prior branch/head. | PR #2 cannot be cited as verification of 5a3b124…. |
| Staging loading behavior | Version 9 reportedly cleared the loading overlay. | This is useful evidence, but it does not disprove a different deployment/data-volume/client-path failure. |
| Failure handler | The current AppsScriptAdapter installs both success and failure handlers and has a 30-second timeout. | “Missing failure handler” is not true of current source; it remains possible in stale deployed code. |
| JSON-safe values | guardApi_ applies clientSafeValue_, including Date conversion and non-finite number normalization. | Unsupported Date returns are mitigated in current source, but the complete bootstrap contract lacks a realistic end-to-end DTO test. |
| Duplicate startup | Packaging tests assert one bootstrap call for an empty fixture. | Duplicate startup is not shown in current source, but tests do not cover re-entry, retry, focus races, malformed payloads, or real-volume rendering. |
| Administrative startup work | No setupDatabase, Drive setup, migration, or health call occurs in the ordinary bootstrap path. | This proposed cause is unsupported by current source and should be checked only against the actual deployed version. |
| Near-live design | Version 0.5.0 already polls every five seconds and reloads the full bootstrap on a revision change. | This conflicts with the proposal’s 10–15-second range and “active module only” rule. |
| Committee permissions | Apps Script/docs deny Committee Head release by role default; src/domain/permissions.js grants it. Role names also differ (DOL_DIRECTOR/ADMIN versus DIRECTOR/ADMINISTRATOR). | Canonicalize before committee workspaces. Browser matrices cannot be security authority. |
| Committee names | Current code uses Inventory Committee; proposal says Inventory and Pantry Committee. Seed data also names a Venues & Equipment Committee. | Use stable committee IDs and owner-approved display names; do not treat seed strings as organizational truth. |
| Parent relationship | Parent_Request_ID currently means an additional request’s original request, not a section child. | Do not silently reuse it for composite components without a relationship discriminator or a new component entity. |
| Restock queue | Server bootstrap emits restockRequests: []; client queue status changes mutate local state and call no transition API. | The proposed safety redesign must also add a real server workflow or remove misleading actions. |
| Full report/form | The prompt contains placeholders only; no form image was attached. | Requirements depending on those artifacts remain provisional. |
| Incident document | The incident record describes Version 8 and says a repair is pending, while later continuation/status records confirm Version 9 acceptance. | Treat the incident file as historical, not current deployment status. |

## Sensitive-data concerns

- Do not record the private roster spreadsheet ID or any roster rows in this document, code, logs, fixtures, screenshots, or generated output.
- One existing recovery document contains a fixed Google spreadsheet identifier. Its sensitivity and continued need in git should be reviewed separately; this plan does not repeat it.
- The full internal bootstrap currently sends requester email, borrower name/contact/student ID, supplier TIN, Drive links, audits, and ledgers to every active non-requester role. Future module DTOs must apply permission and committee scope, not merely “internal versus public.”
- Existing preview names and example.com addresses must remain fictional preview fixtures and must never be promoted as production roster data.

# Section 3 — P0 production startup defect

## Evidence-based root-cause tree

No single root cause is proven. The following tree orders hypotheses by current-source evidence.

### A. Deployment/version mismatch — high priority to disprove

- The repository has a documented history where clasp printed “Skipping push,” a new immutable version was created from stale remote source, and the visible behavior did not match the reviewed package.
- The prompt’s “production” label conflicts with repository records.
- Required evidence: deployment ID/version recorded privately, deployment timestamp, git commit/package hashes, remote source parity, environment Script Property, and whether the failing page is the internal or request-only route.

### B. Client exception after a successful server response — strongly plausible

Current init performs these operations after loadBootstrapData resolves:

1. normalizeStateRecords();
2. request-only DOM changes;
3. environment-label changes;
4. populateStaticOptions();
5. create/install runtime extensions;
6. bind all module events and uploaders;
7. renderAll() for every module;
8. afterRender();
9. finally hide the loading overlay.

Only the server-await statement is inside the current try/catch. A missing collection, stale DTO field, unexpected DOM element, or render/binding exception after the response can bypass the final overlay removal. Global error handlers only write to console. Required evidence: browser console stack, last client stage, payload schema/version, and a realistic captured/redacted fixture.

### C. Excessive server reads and payload assembly — strongly supported

The internal getBootstrapData_ path:

- resolves identity by scanning the access table;
- reads events and all items;
- computes inventory indexes by reading ledger and reservations;
- reads revision/config several times;
- reads canvass and status history;
- then reads requests, lines, reservations again, ledger again, lending, releases, restock, deliverables, evidence, and audit;
- attaches history arrays and returns every module in one object.

readObjects_ obtains headers and a full data range for each table. This is contrary to Apps Script guidance to minimize service calls and batch work, and it scales with all historical rows, not only active data. See [Apps Script best practices](https://developers.google.com/apps-script/guides/support/best-practices).

Required evidence: per-stage elapsed time, per-sheet row counts, duplicate read counts, serialized response size, warm/cold samples, and concurrency samples.

### D. Main-thread rendering delay — strongly plausible

The browser normalizes all inventory, derives balances, creates all selectors, and renders overview, request, lending, release, restocking, procurement, and inventory before hiding the overlay. Large history/audit/ledger collections amplify DOM work. Required evidence: browser performance marks, long-task entries where available, DOM node counts, and stage duration from response received to first usable view.

### E. Transport/serialization failure — possible but partly mitigated

- google.script.run only accepts/returns primitive JSON-like graphs and rejects Date, Function, DOM, circular, or nested prohibited values. The current server’s clientSafeValue_ recursively converts Date objects and removes undefined/functions, reducing this risk. See [google.script.run restrictions](https://developers.google.com/apps-script/guides/html/reference/run).
- The current adapter has explicit success/failure handlers and a 30-second timeout.
- Remaining gaps: no full DTO contract test with realistic Dates and volumes, no size ceiling, no circular-object assertion before return, and no stage/correlation shown to the user.

### F. Duplicate or follow-up request — lower support in current source

- The package test sees one initial api_getBootstrapData call.
- Polling is scheduled after initialization and does not immediately rerun bootstrap.
- A focus event after polling starts can request a revision check, and changed revision causes another full bootstrap.
- Required evidence: attempt IDs and a client call ledger. Do not infer duplicates only from multiple Apps Script executions without matching client timestamps.

### G. Lock contention or administrative setup — lower support in current source

- Bootstrap does not explicitly acquire a script lock and does not run schema, Drive, migration, setup, or health functions.
- It can still compete for Sheets service capacity with writes. Error logging acquires a lock after a failure.
- Required evidence: execution overlap, lock-timeout logs for writes, and stage timing. Do not add setup calls to ordinary startup.

## Instrumentation plan

### Backend

1. Pass guardApi_’s correlation ID into the bootstrap implementation.
2. Add a non-sensitive stage timer that records operation name, environment, request mode, stage, elapsed milliseconds, row count, cache hit/miss, and total elapsed time. Never log row contents, emails, names, resource IDs, TINs, or Drive URLs.
3. Time identity lookup, config/revision, essential references, each module read, DTO assembly, JSON-safe normalization, and optional serialized byte count.
4. Log a single structured summary to Apps Script execution logs; log detailed stages only for slow/failing attempts or a staging-only diagnostic switch.
5. Include a bounded bootstrapMeta object in internal responses: contract version, correlation ID, server duration, generated timestamp, safe collection counts, and response byte estimate. Request-only metadata must reveal no internal counts.
6. Add tests that clientSafeValue_ converts nested Dates/non-finite values and that the final fixture is JSON-stringifiable.

### Client

1. Introduce an explicit loader state machine: SHELL_READY, REQUEST_SENT, RESPONSE_RECEIVED, VALIDATING, RENDERING_ACTIVE_VIEW, READY, SLOW, and FAILED.
2. Generate one startup attempt ID and use a single-flight promise. Ignore late results from abandoned attempts.
3. Mark stages with performance.now() and structured console events containing only attempt/correlation/stage/duration.
4. Catch the entire initialization pipeline, not only the server await.
5. Replace the indefinite overlay with an accessible status region, a soft “taking longer” state, a hard failure state, and a read-only Retry action.
6. Make retry behavior explicit: never retry writes; a manual bootstrap retry is read-only. Prevent accidental double-click and ordinary overlapping calls. Because google.script.run cannot cancel a timed-out server execution, record a timed-out attempt and ignore any late response.
7. Add a copyable safe diagnostic summary containing app version, environment label, stage, error code, correlation ID, and timing—never payload data.

## Recommended fix sequence

1. Reconcile the failing deployment/version before changing code.
2. Reproduce with a redacted, shape-accurate fixture and the deployed package.
3. Add server/client stage instrumentation and full-pipeline error recovery.
4. Add a versioned payload validator and realistic browser contract tests.
5. Eliminate duplicate Sheet reads inside the existing endpoint.
6. Introduce a small essential bootstrap and load only the default/active module.
7. Paginate/detail-load history, audit, ledger, evidence, supplier, and borrower data according to permission.
8. Re-run cold/warm staging performance and failure-mode acceptance.
9. Promote only after manager/owner review and a documented immutable rollback target.

## Rollback

- No production operation belongs to Slice 1.
- For a later staging deployment, retain the preceding immutable Version 9 pointer and its compatible additive schema.
- On startup, privacy, authorization, or data-integrity failure: stop operational acceptance, capture correlation/stage/version evidence, and repoint the existing deployment ID to the prior immutable version.
- Never delete appended columns, revision rows, ledger/audit/history records, or diagnostic evidence.
- Keep the legacy api_getBootstrapData endpoint while Version 9 remains the approved rollback target; remove it only after the rollback window is formally closed.

## P0 acceptance criteria

| Criterion | Target |
|---|---|
| Static shell/status visible | Within 2 seconds on supported production network/device profile |
| Warm essential bootstrap | p95 at or below 5 seconds; target median below 3 seconds |
| Cold essential bootstrap | p95 at or below 8 seconds |
| Normal startup | No routine sample above 10 seconds; every outlier has stage/correlation evidence |
| Overlay | Never indefinite; slow state by 8 seconds and recoverable failure by the approved hard timeout |
| Startup calls | One ordinary essential-bootstrap call; no overlapping automatic duplicate |
| Payload | Versioned, JSON-safe, validated, bounded; target essential payload at or below 100 KB compressed-equivalent/serialized size subject to measured baseline |
| Rendering | Only shell and default active module before READY; other modules lazy |
| Privacy | Request-only and lending-only/session-specific DTOs contain only approved fields |
| Admin work | No schema, Drive, migration, backup, health, or roster-source scan during ordinary load |
| Errors | User sees safe error code/correlation/retry guidance; no stack, resource ID, or personal data |

The exact payload ceiling and hard timeout require staging baseline approval, but “indefinite” is never acceptable.

## P0 tests required

- Adapter: success, structured server failure, transport failure, soft timeout, hard timeout, late success, and single-flight retry tests.
- DTO: nested Date/non-finite conversion, missing/extra field behavior, contract-version mismatch, circular graph rejection, and response-size threshold.
- Browser: realistic populated fixture, missing collection, malformed item, render exception, slow response, server failure, late response, retry, request-only path, and exactly-one ordinary call.
- Apps Script: stage timer unit tests, duplicate-read counters in a fake repository, permission-scoped essential DTO, and no setup/Drive calls.
- Performance: staging cold/warm samples with recorded row counts and p50/p95, plus slow-network/mobile main-thread measurements.
- Packaging: retain one script/style, request-only marker, environment marker, no visible source, and generated parity.
- Rollback: immutable-version pointer drill with no schema or record deletion.

# Section 4 — Improved product specification

## 4.1 Product and architecture principles

1. The system remains one Main Hub with permission-scoped committee workspaces, not separate applications.
2. The three permanent committees are Food, Inventory and Pantry, and Materials. Stable Committee IDs—not display-name strings—are authoritative.
3. Venue and Equipment is a request component and configurable assignment target, not a fourth permanent committee.
4. Visibility, action authority, administrative authority, and destructive/consequential authority are separate capabilities.
5. Every browser command goes through the service contract. Only src/services/apps-script-adapter.js may use google.script.run.
6. Every state change is server-authorized, validated, lock-protected where state may race, idempotent, assigned server IDs, added to status history, audited, and followed by an authoritative read.
7. Parent/composite status is derived. A client or ordinary endpoint cannot directly mark a parent complete.
8. Posted ledger, status history, audit, evidence history, and command replay records are immutable. Corrections are forward adjustments, reversals, or amendments.
9. Initial startup is session-only. Operational data is lazy, paginated, permission-scoped, and cached only as an optimization.
10. Reference values are effective-dated or snapshotted onto tickets so a later rename/archive never changes historical meaning.

## 4.2 Identity, roles, permissions, and scopes

The existing role string must not be the complete authorization model. Use a canonical server capability plus scope decision:

| Capability family | Examples | Typical scope |
|---|---|---|
| View | internal shell, own committee, all committees, audit summary, sensitive supplier/borrower detail | SELF, COMMITTEE, ALL, or explicit entity |
| Intake/review | review request/component, request missing information, reject, reopen | Assigned committee/component |
| Assignment | assign committee, assign staff, escalate | Committee Head for own committee; Director/Admin by approval |
| Fulfillment | canvass, procure, receive, release, lend, return | Workflow and committee scoped |
| Reference management | organization, venue, equipment, routing, catalog | Explicit permission; not implied by committee head |
| Access administration | sync roster, manage permissions, deactivate access | Small named group only |
| System administration | setup, health, backup, migration, deployment diagnostics | Admin only |

Recommended default pending owner approval:

- **Requester:** create and view only their approved request surface; no internal data.
- **DOL Staff:** view and act only within assigned committee/workflow permissions.
- **Committee Head:** view all internal dashboard summaries, act within their own committee, assign own-committee staff, and escalate; no system admin, access admin, destructive reference action, or cross-committee mutation by default.
- **DOL Director:** view all and perform approved cross-committee operational actions; access/reference/system admin remain separately granted.
- **Admin:** system/reference/access administration; operational action permissions remain explicit so admin is not accidentally a business approver.
- **Read-only auditor:** approved audit/read DTOs only, no broad operational bootstrap and no mutation.

Multiple committee memberships should be represented as rows, not a delimited field. A user’s default committee affects landing context only; it does not grant permission.

## 4.3 Committee-aware Main Hub

The session bootstrap returns the current user’s allowed committee contexts and default landing context. The committee dashboard endpoint then returns:

- newly assigned and unassigned tickets;
- awaiting review and needs-information tickets;
- due soon, overdue, blocked, missing-evidence, and escalated work;
- upcoming needed dates;
- recent status changes derived from 15_STATUS_HISTORY and 16_AUDIT_LOG;
- completed work in a bounded recent window with paginated history;
- assigned staff using safe display name and stable User ID only;
- counts and links to the relevant workflow/detail endpoint.

No separate writable “activity log” is created. Dashboard activity is a projection of authoritative history and audit records.

Committee specialization:

- **Food:** food components, schedule/quantity summaries, supplier/canvass references permitted to the viewer, distribution preparation, fulfillment, evidence, and exceptions.
- **Inventory and Pantry:** inventory/pantry demand, restock, lending review/claim/handoff/return/overdue, stock exceptions, and inventory history according to permissions.
- **Materials:** materials components, canvass, procurement, receiving, material handoff, release readiness, supplier/quote references, and exceptions.
- **Venue & Equipment:** appears through assigned event owner, temporary assignment group, designated administrative owner, or approved Materials/Inventory owner. There is no permanent fourth committee record.

Dashboard queries must return summaries first and paginated lists second. They must not ship the global ledger, global audit log, full roster, or supplier TIN library.

## 4.4 Composite Event Logistics request

The requester sees three optional sections: Food, Materials, and Venue & Equipment. At least one section must contain valid data before submission.

One successful command atomically creates:

- one Event Logistics parent header;
- exactly one component child for every non-empty section;
- zero children for blank sections;
- request lines belonging to exactly one child;
- initial status history/audit for parent, children, and lines;
- server IDs and a stored idempotent result.

The three children have independent owner, committee, staff assignment, due date, lifecycle status, attention flags, notes, evidence links, progress, and transition history. Existing procurement, inventory, release, and evidence records link to the child as well as parent/line where appropriate.

The parent contains requester/event context and a derived summary only. It cannot own fulfillment progress independently of its children.

Submission UX:

1. enter requester/event context;
2. complete any combination of sections;
3. validate each section locally without implying server acceptance;
4. review one combined summary grouped by section;
5. show the parent/child hierarchy that will be created;
6. consolidate exact duplicate lines or require an explicit distinction;
7. submit once with one client request ID;
8. display the returned parent and child IDs.

“Additional request” and “amendment” are distinct from component children. The existing Parent_Request_ID meaning must not be silently overloaded.

## 4.5 Venue and Equipment references

The paper form is an unresolved input. Until reviewed, V1 should implement a request-and-routing catalog, not claim to be the institution’s authoritative room-booking calendar.

- Venue records cover a controlled facility, category, campus/location, active/requestable state, instructions, lead time, responsible office, approving authority, contact role, aliases, and effective dates.
- Equipment/logistics references cover category, unit, optional inventory Item ID, requestable state, instructions, lead time, responsible office, approving authority, aliases, and effective dates.
- An “Other — specify” line creates an unclassified request line requiring review; it never silently creates a catalog record.
- A displayed availability label means “available for request” unless an approved upstream scheduling integration exists. It must not promise a time slot.
- Routing rules are data, not regular-expression category guesses in code.
- The request snapshots the selected name/routing revision for historical readability while retaining the stable reference ID.

## 4.6 Admin-managed reference data

The Admin workspace provides searchable lists, detail drawers, safe forms, dependency summaries, revision-conflict handling, preview of consequences, and archive/restore. It does not expose the spreadsheet as the primary editor.

Managed domains include organization units, departments/offices, committees, positions, memberships/heads, role grants, venues, venue categories, equipment/logistics references, availability/requestability, routing, approving authority, lead time, contact role, instructions, aliases, and active/archive state.

Every update carries an expected record revision. A stale update receives CONFLICT with the current safe record and is never last-write-wins. Consequential changes require confirmation. Referenced records are archived for future selection while historical tickets retain their snapshot and link.

## 4.7 Private roster synchronization

Recommended current-platform design:

1. Store only the property key HAU_ROSTER_SPREADSHEET_ID in code/documentation; configure its value privately in Script Properties.
2. Read the private source only in a scheduled or explicit admin sync, never during ordinary bootstrap.
3. Read a complete candidate snapshot under a sync lock.
4. Validate required headers, exact normalized emails, unique source keys, active markers, allowed positions/roles, approved committee IDs, and row-count sanity before applying anything.
5. If validation fails, preserve the last-known-good access projection and record a safe failed sync with counts/error codes but no roster rows.
6. On success, update the dedicated access projection/membership rows, mark removed users inactive according to approved policy, bump ACCESS_REVISION, and audit summary counts.
7. Resolve normal logins by exact normalized email against the projection, active state, permission grants, and committee scope. Cache lookup results only as an optimization keyed by access revision.
8. Return only current-user identity and approved assignment display fields to clients—never the full roster, emails, contacts, or source metadata.

Apps Script CacheService may evict values before the requested expiration and limits each cached value to 100 KB, so cache cannot be authorization authority. See [Apps Script Cache reference](https://developers.google.com/apps-script/reference/cache/cache).

## 4.8 Restock action safety

The queue row provides one primary Review/Details action. The detail surface shows prerequisites, status history, quotes/evidence, quantities, dependencies, and only server-reported allowed actions. Each action includes:

- server-calculated allowed/disabled state and explanation;
- consequences and required fields;
- confirmation for budget, reject, cancel, receive, and completion;
- a client request ID retained across retry;
- in-flight disable and stale-revision check;
- server transition validation under lock;
- authoritative refresh showing resulting status, history, and audit correlation.

The current local updateRestockRequestStatus path must not remain in Apps Script mode. Either a real transition API is implemented or the control is absent.

## 4.9 Near-live updates

Near-live behavior is a change signal, not realtime transactional consistency:

- poll only for authenticated internal sessions while visible and online;
- default recommendation: 15 seconds plus small client jitter, pending measured load and owner approval;
- one revision request at a time; focus/reconnect/manual refresh may request an immediate check but must coalesce;
- bounded exponential backoff and stale indicator after an approved threshold;
- after a local mutation, consume the returned revision and refresh only affected data;
- on a remote revision, reload the active module plus globally visible summary counts, not the complete application;
- preserve dirty forms/modals and offer Refresh now / Continue editing;
- show last successfully updated time, checking state, stale warning, and manual refresh;
- paginate histories and details.

The present five-second interval and full-bootstrap refresh are not accepted as the final design. Google documents a six-minute execution limit, 30 simultaneous executions per user, and 1,000 per script, while google.script.run allows 10 concurrent browser calls; quotas can change and do not remove the need to minimize Sheet reads. See [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas) and [HTML-service communication](https://developers.google.com/apps-script/guides/html/communication).

## 4.10 Hosting boundaries

### Phase A — current approved direction

Stabilize Apps Script HTML Service, reduce startup data, lazy-load modules, make updates revision-based, complete access/privacy/accessibility/operational staging acceptance, and retain immutable-version rollback.

### Phase B — later architecture decision

Cloudflare Pages remains the leading static-host candidate for this Vite repository: static requests are free/unlimited, the Free plan currently permits 500 builds per month and 20,000 files, and built production deployments can be rolled back. Pages Functions consume Workers quotas, currently 100,000 requests/day on the Free plan. See [Pages limits](https://developers.cloudflare.com/pages/platform/limits/), [Pages Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/), and [Pages rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/).

Firebase Hosting is the strongest Google-aligned alternative and currently includes 10 GB hosting storage and 10 GB/month data transfer at no cost, with preview/deploy/rollback tooling. Dynamic Cloud Functions require the billing-enabled plan, so free static hosting alone does not solve the authenticated backend. See [Firebase Hosting quotas](https://firebase.google.com/docs/hosting/usage-quotas-pricing).

Do not let a hosted browser call an anonymous Apps Script write endpoint directly. A reviewed server-side BFF must authenticate institutional Google identity, verify exact roster access, create a secure server session, enforce CORS/CSRF/replay/idempotency, and call a bounded backend channel. Apps Script API execution requires a shared standard Cloud project, OAuth credentials/scopes, and basic parameter types; it is not a drop-in CORS bridge. See [Apps Script API execution](https://developers.google.com/apps-script/api/how-tos/execute).

Recommended Phase B deliverable is a no-production-data architecture spike comparing:

- Cloudflare Pages + Worker BFF + Google Identity/Workspace policy;
- Firebase Hosting + reviewed Google backend;
- continued Apps Script hosting.

The spike must decide identity/session ownership and backend channel before any migration.

### Phase C — future only

Specify PostgreSQL/Supabase as transactional authority, realtime events for dashboards, Sheets as reporting/export projection, append-only ledger/audit, transactional outbox, idempotent projection consumers, retries/dead letters, reconciliation, and reversal/rollback. Do not dual-write live Sheets and PostgreSQL. Supabase’s current Free plan is an evaluation tier with a 500 MB database and no automatic backups; production suitability and institutional procurement require a separate decision. See [Supabase pricing](https://supabase.com/pricing).

# Section 5 — Data-model and schema proposal

## Existing structures to reuse

This is a vanilla JavaScript/Apps Script project, so “types” are represented by constants, DTO builders, service contracts, header maps, validators, and tests rather than TypeScript declarations.

- HAU_HEADERS and HAU_SHEETS in apps-script/Config.gs: retain exact existing columns and append only approved fields/tabs.
- requestDto_, lineDto_, itemDto_, eventDto_, historyDto_, auditDto_: evolve into explicit versioned DTO allowlists.
- STATUS and TRANSITIONS in src/domain: reuse concepts after canonical server/browser reconciliation.
- launch-service-contract.js: add final endpoint names once each slice is approved.
- stable ID allocators and prefixes: reuse server allocation; never use row numbers.
- 15_STATUS_HISTORY and 16_AUDIT_LOG: authoritative activity sources for every new entity.
- 17_CONFIG revision pattern: reuse but optimize reads and consider domain revisions.
- 19_MIGRATION_MAP: preserve legacy provenance decisions; do not use it as the roster/reference store.
- service lock, idempotency, safe errors, evidence metadata, and mutation refresh coordinator: reuse.

## Logical entities

Field names below are provisional until owner decisions and a staging schema review. They describe contracts, not final headers.

| Entity | Likely identity and fields | Relationships | Invariants |
|---|---|---|---|
| User access projection | User ID, normalized email, display name, active, position, default committee, access revision, sync source key | memberships, role grants | exact unique normalized email; no pattern authorization |
| Roster sync run | Sync ID, source revision, started/completed, status, counts, schema version, safe error code | access projection | invalid candidate never partially applies |
| Organization unit | Org Unit ID, type, name, parent, active/archive, revision | users, routing | stable ID; hierarchy cannot cycle |
| Department | An Organization Unit whose controlled type is DEPARTMENT; approved name, parent, lifecycle/effective dates | people, committees, routing | use the organization-unit identity rather than a duplicate department table unless owner rules require distinct fields |
| Committee | Committee ID, approved name, active, head assignment policy, revision | memberships, components | exactly three permanent active committees unless owner approves change |
| Committee membership | Membership ID, user, committee, position, start/end, active, isHead | user + committee | one active duplicate forbidden; multi-committee allowed only if approved |
| Role | Role ID, approved display name, active, description | capabilities and grants | stable canonical ID; legacy labels map explicitly |
| Permission/capability | Capability ID, resource, action, constraints, active | roles and server endpoints | action is server-owned and deny-by-default |
| Role/permission grant | Grant ID, user/role/capability, scope, start/end, active | user, role/capability, committee/entity | deny by default; expiration and scope required where applicable |
| Reference category | Category ID, reference type, name, aliases, active/archive | venue/equipment | normalized alias uniqueness within type |
| Venue | Venue ID, category, name, location, requestable state, instructions, office, authority, lead time, contact role, aliases, revision | routing, component lines | requestable is not time-slot availability |
| Equipment/logistics reference | Reference ID, category, name, unit, optional Item ID, requestable state, instructions, office, authority, lead time, aliases, revision | routing, component lines | reference quantity is not inventory quantity unless linked and server-validated |
| Reference availability/policy | Policy ID, venue/equipment reference, requestable state, effective start/end, source revision, optional approved schedule reference | selection and routing | a static policy never claims a confirmed booking; add time-slot rows only after an authoritative schedule integration is approved |
| Routing rule | Route ID, reference/category/component, responsible office, approving authority, default committee/owner, lead time, effective dates, revision | references/components | one deterministic effective route or explicit conflict |
| Event Logistics parent | Existing Request ID, event/requester context, derived status, flags, created/submitted, revision | components | status derived only; one idempotent creation result |
| Request component | Component ID, parent Request ID, component type, owner committee/user, due, lifecycle status, attention flags, progress, revision | lines, assignments, evidence/history | one initial child per non-empty section; no blank child |
| Food component detail | Component ID, controlled service/meal category, headcount/servings, service dates/times, location reference, minimal dietary/allergen summary, budget/source and lead-time fields | Food component, sourcing/canvass, evidence | collect only approved operational data; one detail per Food component |
| Materials component detail | Component ID, controlled category/source strategy, required-by and approved substitution policy | Materials component and request lines | exact line quantity/unit; no `VERIFY` transaction or silent substitution |
| Venue & Equipment component detail | Component ID, purpose/schedule, routing revision, requestability snapshot, “Other” triage state | Venue & Equipment component and selection lines | requestability is not a booking; one detail per component |
| Request line / component selection | Existing/new Line ID, Component ID, line kind, reference or item ID, submitted label/snapshot, quantity, unit, specification | component, catalog/item, deliverable/fulfillment/handoff | exactly one component for new composite requests; positive controlled quantity; reference revisions preserve historical meaning |
| Assignment | Assignment ID, component, committee/user, assignment type, active dates, reason | component, membership | server validates assignee scope and active membership |
| Amendment | Amendment ID, parent/component, sequence, reason, proposed change, disposition | immutable prior version | submitted records are not silently overwritten |
| Status history | Existing History ID and generic entity link | all entities | append-only |
| Audit log | Existing Audit ID, actor, correlation, before/after summary | all entities | append-only; sensitive values redacted |
| Data revision | Aggregate and/or domain revision, updated time | module endpoints | successful non-replay mutation increments affected revision once |

## Provisional additive persistence layout

One safe mapping for staging design review is:

- retain 03_REQUESTS as the parent request header;
- append Request_Component_ID to 04_REQUEST_LINES;
- add 20_ORG_UNITS;
- add 21_COMMITTEES;
- add 22_COMMITTEE_MEMBERSHIPS;
- add 23_REFERENCE_CATEGORIES;
- add 24_VENUES;
- add 25_EQUIPMENT_CATALOG;
- add 26_ROUTING_RULES;
- add 27_REQUEST_COMPONENTS;
- add 28_REQUEST_ASSIGNMENTS;
- add 29_ROSTER_SYNC;
- add 30_ROLE_PERMISSIONS.

The exact tab split must be tested against Apps Script read performance. A generic polymorphic reference table would use fewer tabs but risks sparse fields and weaker validation; separate venue/equipment tables are preferred unless measurements show a material issue.

14_USERS_ACCESS remains the normal-login access projection during the Apps Script phase. Its legacy Committee column remains for rollback compatibility but is not the long-term membership authority.

## Data invariants

1. Stable IDs and source provenance never change.
2. A submitted composite parent has at least one component.
3. A new request line belongs to exactly one component; legacy lines remain readable and are classified only by an approved migration.
4. A parent cannot be directly completed.
5. A child cannot complete while required lines, evidence, or handoff remain open.
6. A reference rename/archive does not rewrite historical request text.
7. Archive removes future selection but preserves links/history.
8. Every consequential reference/access update supplies expected revision and receives a conflict rather than overwriting a newer edit.
9. Raw roster rows are not copied wholesale; only the approved access/assignment projection is stored.
10. Ledger quantities remain derived from immutable movements; equipment reference quantity never bypasses inventory authority.
11. VERIFY items remain non-transactable and preserve exact legacy source/name/quantity/unit.
12. Evidence bytes remain in configured Drive folders; metadata links are permission scoped.

## Migration approach

- Add new tabs/columns only after a staging backup and schema review.
- Do not infer component type from existing description/category without explicit mapping approval. Existing requests can remain LEGACY_UNCLASSIFIED and continue through their current workflow.
- Seed exactly three committee records with owner-approved names/IDs, not personal head assignments.
- Import reference catalogs from an approved redacted/admin source; do not promote prompt examples as institutional truth.
- Populate access/membership only through a validated roster sync or approved staging fixtures.
- Preserve old columns/endpoints needed by immutable Version 9 rollback.
- Reconciliation must compare counts, IDs, orphan links, duplicate normalized emails/aliases, invalid routes, component/line links, permissions, and history/audit creation.

## Files likely affected across the program

### Existing files to modify

- apps-script/Config.gs, Setup.gs, Router.gs, Auth.gs, InventoryService.gs, RequestService.gs, ProcurementService.gs, RestockService.gs, DataRevisionService.gs, Validation.gs
- src/services/apps-script-adapter.js, launch-service-contract.js, legacy-runtime-adapter.js
- src/app/revision-sync.js
- src/domain/constants.js, permissions.js, requests.js, transitions.js
- src/visual/runtime.js, runtime-extensions.js, approved feature/view integration points
- scripts/extract-visual-baseline.mjs, check-apps-script.mjs, Apps Script bundle checks
- relevant unit/integration/e2e tests and accepted documentation

### Final-name files likely to create

- apps-script/BootstrapService.gs
- apps-script/CommitteeService.gs
- apps-script/RosterSyncService.gs
- apps-script/ReferenceDataService.gs
- apps-script/CompositeRequestService.gs
- src/app/bootstrap-contract.js
- src/app/module-data-controller.js
- src/domain/committee-permissions.js
- src/domain/composite-requests.js
- src/domain/reference-data.js
- dedicated feature controllers/views and tests using existing directory naming patterns

No file with v2, new, enhanced, temp, or simple naming is planned. Generated artifacts are regenerated, never hand-edited.

# Section 6 — Workflow and status rules

## Component lifecycle

Use a generic component lifecycle plus separate attention flags:

- Lifecycle: DRAFT, FOR_REVIEW, ACCEPTED, IN_PROGRESS, PARTIALLY_FULFILLED, READY_FOR_HANDOFF, COMPLETED, REJECTED, CANCELLED.
- Attention flags: NEEDS_INFORMATION, MISSING_EVIDENCE, BLOCKED, OVERDUE, ESCALATED, HAS_REJECTED_SECTION, HAS_CANCELLED_SECTION.

Food, Materials, and Venue & Equipment may have different allowed transitions and prerequisites, but they report through these common buckets. Existing line/procurement/lending statuses remain more specific.

## Provisional parent derivation

This recommendation requires owner approval for mixed rejection:

| Children | Derived parent |
|---|---|
| All DRAFT | DRAFT |
| Submitted children only in FOR_REVIEW/needs-information, no progress | FOR_REVIEW |
| Any active child progressed, none fulfilled | ACCEPTED |
| Any child partial/complete while another non-terminal remains | PARTIALLY_FULFILLED |
| All non-cancelled children complete and none rejected | COMPLETED; add HAS_CANCELLED_SECTION if applicable |
| Every child cancelled | CANCELLED |
| Every non-cancelled child rejected and none fulfilled | REJECTED |
| Mixed rejected plus active/fulfilled child | PARTIALLY_FULFILLED + HAS_REJECTED_SECTION; never auto-complete until an approved disposition resolves the rejected scope |
| Reopened or newly added child after terminal parent | Recompute immediately; append REOPENED/SECTION_ADDED history and remove terminal display |

One completed child can never complete the parent.

## Cancellation

- Section cancellation is allowed only through a server transition with reason, actor, idempotency, dependency preflight, history, and audit.
- Active reservations are cleared by the approved cancellation command. Posted ledger/receipt/release rows are never deleted.
- If irreversible activity exists, the server returns required reversal/adjustment steps; it does not pretend cancellation erased the activity.
- Parent cancellation preflights every child atomically. Completed children remain historical completions; the parent receives a cancellation outcome/flag according to owner-approved policy.
- A blank section before submission is removal from the draft, not cancellation.

## Rejection

- Rejection requires reason and permission.
- Rejecting one child does not reject or complete siblings.
- Parent behavior for mixed rejection follows the provisional table until the owner selects a final business rule.
- A rejected child may be corrected only by an approved reopen/amendment action; history is append-only.

## Amendments and added sections

- Drafts are editable.
- Submitted data is changed through an amendment record with sequence, reason, before/after summary, approval, and idempotency.
- Adding a new section after submission creates a new component and returns the parent to a non-terminal derived state.
- Quantity increases after reservation/receipt require full stock/procurement revalidation; they never overwrite posted receipts.
- Duplicate exact command IDs replay the original result. Similar business requests receive a warning and link; they are not automatically merged without user confirmation.

## Assignment

- Routing selects a default committee/owner from the effective routing rule.
- Server authorization validates the actor may assign that scope and the assignee has an active approved membership.
- Reassignment requires reason and records old/new assignment in history/audit.
- Temporary event groups are assignment labels/records, not permanent committees, unless the owner approves a formal model.
- Unassigned components appear in an escalation queue; they do not silently fall back to Materials or the Director.

## Completion and handoff

- Food completion requires approved fulfillment/distribution confirmation and required evidence.
- Materials completion requires every child line completed/cancelled/rejected with approved disposition and all handoffs recorded.
- Venue & Equipment completion requires approved routing/confirmation, equipment handoff/return obligations resolved, and required evidence.
- Parent completion is a transaction-side recomputation after the final child change.
- Invalid transitions return a safe error with allowed transitions, current revision, and correlation ID; no partial write occurs.

## Audit expectations

Every parent/child creation, review, assignment, transition, amendment, cancel/reject/reopen, reference change, access sync, and consequential confirmation writes:

- status history where lifecycle changes;
- audit action with actor, entity, correlation, safe before/after summary, and reason;
- exactly one relevant data revision on successful non-replay;
- an idempotent stored result for commands.

# Section 7 — Security and privacy design

## Private configuration

- HAU_ROSTER_SPREADSHEET_ID is the only roster-source property key proposed in git.
- Actual roster, operational/backup Sheet, Script, deployment, Drive, OAuth, and BFF secret values remain private configuration.
- Missing or malformed configuration fails closed before opening a resource.
- Public errors expose property key names only where safe, never values.

## Authorization

1. Normalize email with trim/lowercase and require exact match.
2. Require active projection, approved role, active committee membership where scoped, explicit capability, and entity scope.
3. Treat browser visibility as convenience only.
4. Revalidate permission and current record revision inside every command after lock acquisition.
5. Deny unknown role/capability/scope values.
6. Keep access sync/admin/system permissions separate from operational oversight.

## DTO minimization

- Define named allowlists per endpoint and role/scope.
- Essential bootstrap contains no ledger, global audit, borrower contact, requester email, supplier TIN, Drive IDs, or roster list.
- Committee summaries contain stable IDs, safe labels, statuses, assignments, and counts only.
- Sensitive detail is fetched only when the viewer has the specific permission and entity scope.
- Request-only mode remains server-forced for PUBLIC/REQUESTER identities even if the client asks for internal mode.

## Roster freshness and failure

Cache is never authority. The access projection includes last successful sync and source revision. Recommended default pending owner approval:

- continue using the last-known-good projection within a bounded 24-hour freshness window;
- deny newly unknown users immediately;
- after the stale threshold, deny privileged mutations and show an admin-visible stale-access alert;
- decide separately whether scoped read-only access remains available for incident recovery.

An invalid/incomplete source snapshot never deactivates everyone. Only a fully validated snapshot can update active access.

## Threat scenarios and controls

| Threat | Control |
|---|---|
| Email resembles USC naming pattern | Exact normalized projection match; no regex/domain-name grant |
| Client changes role/committee fields | Ignore client grants; resolve user/scope server-side |
| Cross-committee ID guessing | Entity-scope authorization on every read and write |
| Replay/double click | Stable client request ID, in-flight disable, server idempotency, stored result |
| Concurrent admin edits | Expected revision + lock + conflict response |
| Stale roster removes/overgrants users | Full candidate validation, last-known-good projection, access revision, sync audit |
| Overbroad bootstrap | Per-endpoint DTO allowlists and permission-scoped module reads |
| Reference archive breaks active tickets | Dependency preflight, future-selection archive, historical snapshot |
| Malicious reference/free text | length/enum validation, HTML escaping, URL allowlist, no raw HTML |
| Evidence malware/privacy | existing MIME/extension/size/digest/folder controls plus signature/dimension checks before broad launch |
| Log leakage | safe structured metadata only; no roster rows, payloads, IDs, TINs, contacts, or secrets |
| Hosted API CSRF/replay | secure SameSite/HttpOnly session, CSRF token, strict origin/CORS, nonce/timestamp/body digest, idempotency |
| Hosted identity assertion forgery | verify Google/Access token server-side; never trust browser email |
| BFF compromise | least-privilege secret, rotation, environment separation, signed backend channel, audit, kill switch |

## Hosted frontend security boundary

Cloudflare Access can integrate with Google Workspace, but it requires an institutional Google Cloud OAuth client, Admin SDK enablement, client secret handling, and Workspace administrator approval. See [Cloudflare Google Workspace IdP setup](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/google-workspace/). This is an institutional architecture decision, not a frontend-only deployment.

The BFF must:

- verify identity token/session and exact roster projection;
- issue a short-lived server session;
- enforce origin, CSRF, replay, idempotency, rate limits, payload schemas, and permission scopes;
- hold secrets server-side;
- call an approved backend channel and normalize errors;
- separate staging/production keys, URLs, data, logs, and audiences;
- support revocation and rollback to Apps Script-hosted frontend.

Do not expose a doPost/ContentService endpoint to the browser as an unrestricted proxy. ContentService responses also redirect to one-time script.googleusercontent.com URLs, adding a server-client integration constraint. See [Apps Script Content Service](https://developers.google.com/apps-script/guides/content).

## Retention

Owner policy is required for roster sync logs, access history, requester/borrower contact data, supplier TINs, evidence, audit/error logs, backups, and legal holds. Archive is not deletion. Any approved deletion process must preserve immutable business/audit obligations and record the authorization.

# Section 8 — UX recommendations

## Committee dashboard information architecture

- Header: active committee context, role/scope label, last updated, stale/refresh control.
- First row: New, Awaiting review, Due soon, Overdue, Blocked, Missing evidence, Escalated.
- Work queue: filterable by owner/status/date/event with mobile cards and desktop table.
- Upcoming needs: chronological component deadlines.
- Assigned staff: safe names and workload counts, no email/contact.
- Recent activity: read-only projection of history/audit.
- Completed: bounded recent window with “View history” pagination.
- Quick links: only actions the server says the user may perform.

Director/head visibility should show scope explicitly. Switching committee context changes the query; it never changes the user’s permissions.

## Responsive composite request

- Use a stepper on small screens and three accessible tabs/sections on wider screens.
- Each section shows Optional until data is entered, then In progress/Complete/error count.
- Preserve draft values when moving sections.
- Keep the combined review as the final step, not a sticky desktop-only sidebar on narrow screens.
- Show parent and child cards before submit.
- On validation, move focus to the section tab and first invalid field; announce a summary.
- Consolidate exact duplicate selected references; for free text, prompt before merging potentially different specifications.

## Venue/equipment selection

- Searchable venue combobox grouped by category/location.
- Equipment catalog with predictive search, category filters, add action, then quantity/unit.
- Selected-item summary with remove/edit.
- Routing card shows responsible office, authority, instructions, and lead time from the selected revision.
- “Other — specify” is clearly pending classification.
- Availability language says requestable/not requestable unless a real schedule source is integrated.

## Admin workspace

- Domain tabs: Organization, People & Memberships, Venues, Equipment, Routing, Permissions, Sync health.
- Search/filter list plus detail drawer; no giant raw spreadsheet grid.
- Save shows changed fields and consequences.
- Stale revision opens a comparison instead of overwriting.
- Archive/restore and dependency warning are explicit.
- Roster-owned fields are visibly read-only with a link/instruction to the authoritative source.

## Restock action design

- Queue has Review/Details only as the primary action.
- Detail drawer contains prerequisites, status timeline, quotes, quantities, evidence, disabled action explanations, and an allowed-action panel.
- Consequential action opens a summary confirmation.
- Completion is never a row-level one-click control.

## Loading, empty, stale, and error states

- Shell renders immediately with skeletons for the active dashboard.
- Loader reports stage in plain language and exposes a slow state.
- Failure hides the blocking spinner and shows Retry plus safe diagnostics.
- Empty means “no matching work” and distinguishes permission scope from no data.
- Stale state keeps existing data visible, timestamps it, and disables unsafe actions if freshness is required.

## Accessibility and mobile

- Preserve semantic landmarks, heading hierarchy, skip link, visible focus, focus trap/restoration, reduced motion, forced colors, and live regions.
- Tabs implement the ARIA tab pattern; comboboxes implement keyboard selection and active-descendant correctly.
- Do not use color alone for committee/status/attention.
- Maintain 44 CSS pixel primary targets, readable 14–16 px mobile body text, 200% zoom support, and mobile cards for wide tables.
- Test long institutional names and Filipino/English mixed content.
- Do not claim WCAG conformance without manual assistive-technology review.

## Training and operations

- Provide one-page role-specific quick starts for requester, staff, head, director, and admin.
- Train that “available for request” is not confirmed booking, UI hiding is not authorization, and refresh never resubmits a write.
- Include procedures for missing information, rejection, amendment, cancellation after activity, stale roster, conflict response, evidence failure, and rollback escalation.

# Section 9 — Phased implementation roadmap

## Roadmap controls that apply to every slice

Each slice is a separate manager-approved milestone. Before any slice starts, repeat the repository handshake, confirm the manager-provided starting commit, and stop on a dirty, detached, divergent, wrong, or untracked branch. Only one agent writes at a time. Unless a slice explicitly says otherwise:

- preserve the legacy visual baseline and regenerate visual modules with `npm run extract:visual`;
- do not hand-edit generated HTML or generated visual fragments;
- preserve server-generated IDs, source provenance, immutable ledger/history/audit/command-journal records, `VERIFY` blocking, request-only and lending-only sanitization, and fail-closed Drive configuration;
- add or version contracts before removing an existing one;
- make schema changes additive, restartable, reconciled, and reversible;
- never use production data for fixtures, logs, screenshots, issues, or committed evidence;
- run `npm run check` and the slice-specific tests; run Playwright where Chromium is installed;
- update `PROJECT_STATUS.md`, `CHANGELOG.md`, and `docs/WORK_CONTINUATION.md` before handoff;
- do not configure or push Apps Script, create deployments, seed live data, merge, tag, or publish without explicit authorization; and
- commit one logical unit and push only when the manager has authorized the push.

The order below is dependency order, not blanket approval. A slice may begin only after the preceding slice’s evidence has been reviewed, unless the manager explicitly reorders independent specification work.

## Slice 1 — P0 bootstrap observability and recovery

| Field | Plan |
|---|---|
| Goal | Make the startup defect diagnosable and ensure every startup outcome leaves the blocking overlay in a recoverable state. |
| Scope | Add a named client startup state machine; stage timings; a single completion/failure finalizer; guarded normalization, extension installation, binding, first render, and post-render work; slow-state messaging; Retry; correlation ID; safe client/server diagnostic codes; explicit one-at-a-time startup behavior. Add a realistic bootstrap-contract fixture and failure injection points. |
| Exclusions | No bootstrap data split, schema change, role redesign, committee feature, polling change, deployment, or production data inspection. Do not claim the root cause solely from static evidence. |
| Allowed files | Primarily `src/visual/runtime.js`, its source helper modules if extraction requires them, `apps-script/InventoryService.gs`, `apps-script/Validation.gs`, focused unit/Apps Script-contract/packaging tests, and required status/handoff docs. |
| Off-limits | Generated HTML, ledger semantics, live spreadsheet contents, deployment configuration, credentials, and unrelated UI redesign. |
| Dependencies | Manager accepts this plan; exact affected deployment/environment is identified; a redacted reproduction or safe staging reproduction is available; expected start commit is confirmed. |
| Main risks | Telemetry itself leaks data; multiple finalizers race; Retry duplicates startup calls; catching exceptions hides defects; stale deployed code differs from the repository. |
| Migration | None. Additive diagnostic fields and client states only; keep the current endpoint contract intact. |
| Rollback | Revert this slice and redeploy the last approved staging version if authorized. Keep immutable staging Version 9 as the recorded code rollback target until a new baseline is accepted. |
| Tests | Unit-test state transitions/finalization; inject server rejection, timeout, malformed response, normalization throw, bind throw, first-render throw, late success after timeout, double-click Retry, and duplicate callback; run realistic and empty bootstrap packaging tests; run all standard checks. |
| Acceptance | Shell visible in ≤2 seconds; overlay always clears to usable content or an actionable error; exactly one ordinary startup call and at most one active Retry call; no sensitive diagnostics; warm p95 ≤5 seconds, cold p95 ≤8 seconds, no routine success >10 seconds in the agreed staging sample; a safe stage identifies where every injected failure stopped. |
| Evidence | Commit SHA; file list; test output; redacted timing table with sample size/device/network; screenshots for loading, slow, error, Retry, and success; safe console/server trace keyed by correlation ID; rollback rehearsal result; unrun checks stated. |

## Slice 2 — Essential bootstrap and lazy module contracts

| Field | Plan |
|---|---|
| Goal | Bound startup work and payload size so the initial shell does not read or render every operational module. |
| Scope | Measure query/read/payload/render cost first; define a versioned essential-bootstrap DTO containing only identity, capability/scopes, environment, minimal navigation/config, counts or active-module summaries, and revision tokens; add paginated/filterable module loaders; load only the active module; cache only safe bounded reference projections; deduplicate repeated sheet reads within one request; preserve a compatibility endpoint during rollout. |
| Exclusions | No new committee workflows, data-model migration, database move, hosted frontend, or speculative caching of private full datasets. |
| Allowed files | Service/repository DTO code, the sole Apps Script adapter, visual runtime/module loaders, focused tests and fixtures, data-contract docs, status/handoff docs. |
| Off-limits | Direct `google.script.run` outside the adapter, production deployment, full roster delivery, evidence blobs, generated HTML edits, and deletion of the legacy bootstrap endpoint. |
| Dependencies | Slice 1 measurements and accepted performance baselines; owner agreement on essential navigation; sanitized role/capability contract. |
| Main risks | Missing data breaks a module; lazy calls form a request storm; cache staleness authorizes incorrectly; compatibility paths drift; payload cap is selected without evidence. |
| Migration | Introduce contract version 2 beside the current bootstrap. Route one module at a time behind a reversible flag; record revision semantics; do not remove version 1 until rollback and acceptance close. |
| Rollback | Switch the flag back to version 1 and keep the new read-only endpoints dormant; revert the slice if needed. |
| Tests | DTO allowlist/JSON-safety; permission filtering; pagination bounds; cache miss/stale/eviction; duplicate-read count; lazy-load cancellation/deduplication; module empty/error/stale states; realistic-volume Playwright; timing and payload profiling. |
| Acceptance | Essential DTO fields are allowlisted and documented; request-only and lending-only/session-specific contracts stay sanitized; no ordinary bootstrap loads full ledger, audit, evidence, roster, history, lending, procurement, or deliverable collections; active module alone loads after shell; no active user sees another scope; measured targets from Slice 1 hold; provisional serialized essential payload target ≤100 KB is either met or replaced by an evidence-based approved target. |
| Evidence | Before/after read-count, payload-byte, server-stage, network, parse, and render table; DTO snapshot; query-bound tests; cache policy; screenshots; full check logs; compatibility/rollback proof. |

## Slice 3 — Canonical roles, committee scopes, and authorization contract

| Field | Plan |
|---|---|
| Goal | Establish one server-owned capability model for exactly three permanent committees and reconcile current role-name/permission conflicts. |
| Scope | Approve canonical role IDs/names; define committee IDs and names; separate visibility scope from action capability; model Director oversight and committee-head scope; return sanitized capabilities from bootstrap; make client presentation consume server capabilities; add authorization-denial reasons safe for display; document migration from existing role/committee strings. |
| Exclusions | No roster import, dashboards, composite requests, admin UI, or permission grant merely because a control is visible. |
| Allowed files | Server auth/permission/domain modules, sanitized DTOs, client permission projection, seeds/schema docs/migration scripts, tests, status/handoff docs. |
| Off-limits | Client-only authorization, destructive changes to user records, automatic fourth committee, and silent reinterpretation of historical strings. |
| Dependencies | Owner decisions on canonical role names, Inventory and Pantry naming, venue/equipment ownership, committee-head release power, Director/admin separation, and legacy mapping. |
| Main risks | A mapping over-grants access; historical rows lose meaning; current `COMMITTEE_HEAD` behavior changes unexpectedly; duplicate client/server permission registries re-diverge. |
| Migration | Add canonical IDs and mapping metadata; dry-run/report unknown values; require explicit resolution; backfill IDs without rewriting immutable history; preserve original labels in provenance; activate only after reconciliation counts match. |
| Rollback | Keep prior permission evaluation behind a tightly controlled staging-only flag during reconciliation; revert activation, not audit/mapping records. Never use rollback to grant access after a failed authorization check. |
| Tests | Role × committee × resource × action matrix; inactive/unknown/ambiguous identity; director cross-committee reads; head scoped actions; administrator-only operations; client hiding plus server denial; legacy mapping/reconciliation. |
| Acceptance | One documented canonical registry; exactly three active permanent committee IDs; no role-name mismatch between client and server; every endpoint checks server capability and scope; Director/head behavior matches owner approval; no unknown mapping is auto-granted. |
| Evidence | Approved decision record; generated authorization matrix; migration dry-run and reconciliation counts; denial tests; sanitized bootstrap samples by role; commit/check logs. |

## Slice 4 — Private roster synchronization and access freshness

| Field | Plan |
|---|---|
| Goal | Synchronize the approved private roster into a validated local access index without reading or exposing the source during normal startup. |
| Scope | Store only a Script Property key for the private source identifier; define a minimum source schema; implement explicit admin-triggered or scheduled sync with lock, validation, normalized exact identifiers, duplicate/conflict report, revision/freshness metadata, audit, and last-known-good activation; define manual emergency disable and stale/failure policy; expose only safe sync health to authorized admins. |
| Exclusions | No source spreadsheet ID/value in git or output; no full roster sent to browser; no fuzzy email/name match; no silent grant from a failed or stale sync; no source writes. |
| Allowed files | Server roster-sync/auth/config code, additive schema/migration, redacted setup docs, safe admin health projection, tests, status/handoff docs. |
| Off-limits | Private source contents, screenshots, fixtures, logs, issues, generated assets, pre-rework backup spreadsheet, and ordinary-bootstrap source reads. |
| Dependencies | Slice 3 capability model; data owner approves source, minimum schema, sync operator, cadence, freshness threshold, revocation SLA, retention, and outage policy. |
| Main risks | Identifier leakage; partial sync revokes or grants incorrectly; race with authorization; stale access after roster revocation; quota-heavy source scans; source schema drift. |
| Migration | Add versioned sync snapshot/index and health/audit records; validate a redacted staging source; compare proposed vs active; require explicit activation; keep last-known-good revision and revocation override. |
| Rollback | Atomically restore the previous validated snapshot; preserve sync audit; emergency deny takes precedence over snapshot rollback. |
| Tests | Missing property, inaccessible source, wrong headers/types, duplicate normalized identifier, inactive member, unknown role/committee, partial read, timeout, concurrent sync, stale snapshot, revocation override, source-data non-disclosure, normal startup read-count. |
| Acceptance | Normal startup makes zero source-roster reads; authorization uses exact normalized identifier + active status + approved role/committee + endpoint capability; only a fully validated revision activates; stale/failure behavior matches owner policy and fails closed for new/changed grants; no secret/source row appears client-side or in committed/runtime diagnostic evidence. |
| Evidence | Redacted setup/runbook; schema contract; validation and diff summaries with counts only; safe sync-health screenshot; authorization/freshness tests; audit sample with opaque IDs; rollback exercise. |

## Slice 5 — Committee Main Hub and Inventory and Pantry vertical slice

| Field | Plan |
|---|---|
| Goal | Deliver one capability-aware Main Hub, proven first with the existing Inventory/Pantry and Lending workflows, without creating parallel application shells. |
| Scope | Add active committee context; scoped summary counts; new/awaiting/due/overdue/blocked/missing-evidence/escalated queues; upcoming needs; assigned staff workload; bounded recent activity/completions; safe quick links; last-updated/stale/manual-refresh states. Adapt current inventory, pantry/procurement, and Lending Hub projections to the canonical committee scope. |
| Exclusions | No Food/Materials specialization, composite submit, venue/equipment catalog, admin editor, or automatic action permission based on committee membership alone. |
| Allowed files | Versioned committee dashboard query/DTO, active-module visual components, existing inventory/procurement/lending modules, focused tests/fixtures, docs. |
| Off-limits | Full audit or roster delivery; client-side filtering of an unscoped server dataset; invented staffing assignments; destructive ledger edits; visual baseline redesign outside the affected module. |
| Dependencies | Slices 2–4; owner-approved queue definitions, due/escalation rules, committee name, head/director scope, and safe staff-display fields. |
| Main risks | Counts disagree with queues; N+1 reads; cross-committee leakage; overdue logic ignores timezone/status; dashboard becomes a second source of truth. |
| Migration | None for immutable records. Add normalized committee references/projections only where approved; derive dashboard facts from authoritative transactions/history rather than copying editable status. |
| Rollback | Hide the committee dashboard behind a server-controlled feature flag and return to existing module navigation; retain read-only projections harmlessly. |
| Tests | Query boundary and count/detail reconciliation; committee isolation; role matrix; Manila timezone boundaries; overdue/escalation; empty/high-volume queues; lending/pantry regressions; mobile cards, keyboard/focus, reduced motion, forced colors, 200% zoom. |
| Acceptance | Every count opens the same filtered record set; user sees only approved committee scope; Director and heads see precisely approved oversight; no dashboard call returns contact/TIN/evidence/audit internals; active module meets agreed performance target; existing inventory, procurement, lending, reservation, release, and immutable ledger rules still pass. |
| Evidence | Role-by-role screenshots; count/detail reconciliation export with synthetic IDs; query/read timing; accessibility results; existing module regression logs; feature-flag rollback proof. |

## Slice 6 — Composite Event Logistics request foundation

| Field | Plan |
|---|---|
| Goal | Create one parent request and one independent child for each non-empty Food, Materials, or Venue & Equipment section, supporting every non-empty combination. |
| Scope | Add draft/review/submit flow, section validation, optional labels, duplicate-reference consolidation, combined review, idempotent atomic parent/child creation, stable relationship model, visible hierarchy, independent child lifecycle, derived parent status, cancellation/reopen/amend/add-section rules, history and audit. Feature-flag the new flow. |
| Exclusions | No Food/Materials business-specific fields beyond a minimal approved child contract, no reference-catalog editor, no automatic availability promise, no overloading current `Parent_Request_ID` without an approved migration. |
| Allowed files | Additive parent/component schema and repository/service endpoints, request UI source, adapter methods, shared validation/status derivation, migrations/reconciliation, tests/docs. |
| Off-limits | Client-generated authoritative IDs; partial parent creation; editing posted ledger rows; child creation for blank sections; completing parent when only one of multiple children completes; direct generated-file edits. |
| Dependencies | Slice 3 permissions; owner decisions on relationship semantics, statuses, mixed rejection, cancellation after activity, duplicate definition, amendment/versioning, and child ownership; reference IDs may initially use approved bounded fixtures. |
| Main risks | Partial writes create orphan children; retries duplicate hierarchies; parent status masks rejected/blocked child; cancellation violates ledger activity; current “additional request” parent field conflicts with component hierarchy. |
| Migration | Add a distinct versioned relationship/entity model; migrate no historical row implicitly. Provide dry-run mapping for any history chosen for backfill, keep original relation fields, reconcile parent/child counts and IDs, then enable new submissions. |
| Rollback | Disable new composite submission, keep created records readable and serviceable, and return users to separate legacy request creation. Never delete created parents/children or their history. |
| Tests | All seven non-empty section combinations; all-blank rejection; section validation/focus return; exact retry/idempotency; concurrent submit; atomic failure; duplicate consolidation; each child transition; mixed rejection; partial/full cancellation; reopen; added section; amendment; parent derivation property tests; authorization and audit. |
| Acceptance | Exactly one parent per accepted idempotency key; exactly one child per completed section and none for blank sections; no orphan/duplicate; parent is never Complete while any required active child is nonterminal; mixed states remain visible; unauthorized transitions fail server-side; review mirrors persisted result; rollback leaves records operable. |
| Evidence | Entity/status diagrams; schema diff; dry-run/reconciliation; seven-combination test table; concurrency/idempotency output; role tests; parent/child UI screenshots; audit/history samples; rollback rehearsal. |

## Slice 7 — Food Committee specialization

| Field | Plan |
|---|---|
| Goal | Add the approved Food Committee request and work-queue fields/routing on top of the composite foundation. |
| Scope | Define controlled meal/service categories, headcount/servings, dates/times, service location reference, dietary/allergen summary policy, budget/source reference, sourcing/canvass prerequisites, lead-time and evidence attention flags, committee routing, assignment, and completion evidence. Reuse procurement/receipt patterns where domain-correct. |
| Exclusions | No storage of unnecessary medical detail, no supplier TIN exposure, no invented catering vendor catalog, no payment/accounting system, and no changes to Materials or Venue workflows. |
| Allowed files | Food child schema/validation/workflow, scoped DTO/query, composite section UI source, approved references, tests/docs. |
| Off-limits | Free-form sensitive dietary narratives by default; browser-only transition checks; ledger deletion/edit; vendor/private contact data in fixtures. |
| Dependencies | Slice 6; owner-approved Food data fields, classifications, review/release authority, dietary-data policy, lead-time rules, evidence and completion definition. |
| Main risks | Collecting special-category personal data; headcount/serving ambiguity; procurement and inventory quantities diverge; deadline timezone errors; approval scope overreach. |
| Migration | Add versioned Food child/detail fields and reference IDs; do not reinterpret legacy procurement records without an approved mapping/reconciliation. |
| Rollback | Disable Food section for new composite submissions; keep existing Food children readable and actionable through a safe fallback queue. |
| Tests | Required/conditional fields; numeric/date/time boundaries; allergen-summary minimization; scope and transition matrix; lead-time flags; evidence state; retry/concurrency; mobile/a11y; procurement regression. |
| Acceptance | A requester can submit a valid Food-only or combined request; Food Committee receives only its child and safe parent context; required sensitive fields are minimized; assignments/transitions/audit are authorized and durable; completion evidence and parent derivation are correct. |
| Evidence | Approved field dictionary; redacted sample journeys; authorization and validation matrices; queue/UI screenshots; audit/evidence tests; performance and regression logs. |

## Slice 8 — Materials Committee specialization

| Field | Plan |
|---|---|
| Goal | Add approved Materials Committee request, fulfillment, and evidence behavior on the composite foundation. |
| Scope | Define material category/reference or constrained “Other,” specifications, exact quantity/unit, required-by date, usage/purpose, sourcing/stock decision, assignment, fulfillment/receipt/issue evidence, blockers, and completion rules. Preserve exact source name/quantity/unit for any migrated legacy item and block `VERIFY`. |
| Exclusions | No automatic equivalence/substitution, no transaction of `VERIFY` items, no arbitrary unit conversion, no vendor master redesign, and no Venue/Equipment change. |
| Allowed files | Materials child detail/workflow, controlled references/units, scoped DTO/query, composite UI source, tests/docs. |
| Off-limits | Posted ledger edits/deletes, silent normalization of legacy source values, unrestricted client status mutation, private supplier identifiers. |
| Dependencies | Slice 6; approved material categories/units, substitution authority, review/release roles, sourcing-vs-stock rules, evidence/completion definitions. |
| Main risks | Ambiguous units cause wrong fulfillment; duplicate catalog names; stock and procurement both fulfill the same need; substitution breaks intent; migrated legacy provenance is lost. |
| Migration | Add versioned Materials detail records and canonical references; maintain source provenance; produce duplicate/unknown/`VERIFY` report; require explicit mapping before activation. |
| Rollback | Disable Materials section for new composite requests and retain existing children in a safe read/action fallback; preserve all transactions/history. |
| Tests | Quantity/unit validation; `VERIFY` blocking; exact legacy provenance; duplicate and substitution handling; stock/procurement exclusivity; permissions, idempotency, concurrency, evidence, parent derivation, mobile/a11y. |
| Acceptance | Materials-only and combined requests persist correctly; no `VERIFY` item transacts; exact quantity/unit and approved substitution are auditable; one authoritative fulfillment path applies; scoped queue and parent status reconcile. |
| Evidence | Approved dictionary and rule matrix; migration/reconciliation report; `VERIFY` and provenance tests; sample request/fulfillment screenshots; audit/status output; regression logs. |

## Slice 9 — Venue and Equipment reference and request vertical slice

| Field | Plan |
|---|---|
| Goal | Provide requestable, admin-managed venue/facility and equipment/logistics references with configurable routing, without inventing a fourth permanent committee. |
| Scope | Add stable reference IDs; categories/groups/aliases; searchable venue combobox; predictive equipment search/add; quantity/unit; selected summary; constrained “Other”; effective-dated requestability/availability wording, lead time, office, authority, instructions, and responsible committee/owner routing; persist a reference revision/snapshot on the child. |
| Exclusions | No claim of real-time booking availability without an authoritative schedule integration; no hardcoded example names as source truth; no fourth committee; no admin editor yet beyond controlled seed/migration. |
| Allowed files | Additive venue/equipment/routing reference schema/services, scoped lookup DTOs, Venue & Equipment composite child/UI source, migration/seeds with placeholder-safe values, tests/docs. |
| Off-limits | Unapproved institutional directory scraping; hardcoded ownership; client-authorized routing; private contacts; retroactive mutation of a submitted request’s reference meaning. |
| Dependencies | Slices 3 and 6; owner approves responsible office/committee model, categories, minimum initial references, “Other” triage, requestability semantics, lead times, authority/instructions, unit list, and revision behavior. |
| Main risks | “Available” misleads users; aliases create duplicates; archived reference breaks history; routing changes mid-request; Other bypasses classification; equipment quantity/unit mismatch. |
| Migration | Add versioned catalogs and routing rules; import only approved references; normalize aliases in dry run; record source/revision/effective dates; archive rather than delete; persist snapshot fields required for history. |
| Rollback | Disable new reference-based section, keep historical snapshot rendering and safe fallback triage; restore prior active reference revision. |
| Tests | Search/grouping/keyboard; alias/duplicate; archived/effective dates; “Other” triage; routing and permission; revision conflict; quantity/unit; every composite combination; history after catalog change; mobile/a11y/performance. |
| Acceptance | Users can find/add approved references responsively; “Other” is visibly pending classification; server selects approved routing; no fourth committee is created; requestability wording is truthful; archived/changed references do not corrupt history; parent/child rules hold. |
| Evidence | Owner-approved seed/reference list outside sensitive data; schema/revision report; role/routing tests; screenshots and keyboard recording; historical-snapshot test; performance logs; rollback proof. |

## Slice 10 — Authorized reference-data administration

| Field | Plan |
|---|---|
| Goal | Let explicitly authorized administrators manage organization, people/memberships, committees, venues, equipment, routing, lifecycle, permissions, and sync health without raw-sheet editing. |
| Scope | Domain-tab workspace; search/filter/detail; controlled inputs; add/update/archive/restore; optimistic revision checks; dependency warnings; change preview/confirmation; idempotency/lock; status history/audit; effective dating; aliases; read-only roster-owned fields; permission and routing editing with guardrails; conflict comparison. |
| Exclusions | No permanent deletion of referenced data; no raw spreadsheet grid; no roster-source editing; no production bulk import; no direct ledger/history edits; no self-escalation of privileges. |
| Allowed files | Admin reference services/endpoints/DTOs, visual admin source, additive schema/migrations, validation/audit, tests/runbooks/docs. |
| Off-limits | Request-only bootstrap expansion, client-only validation/authorization, secret display, destructive cascades, generated HTML edits, backup spreadsheet. |
| Dependencies | Slices 3, 4, and 9; approved admin role(s), two-person or review policy for permission/routing changes, field ownership, archive/dependency rules, retention/effective dating, emergency access procedure. |
| Main risks | Admin grants own authority; stale write overwrites newer revision; archive strands active requests; mass edit causes irreversible drift; sensitive fields leak through list DTOs. |
| Migration | Version reference records and membership/permission changes; introduce revision tokens; dry-run import; dependency graph and reconciliation; activate domain by domain. |
| Rollback | Disable writes per domain while retaining read-only admin visibility; restore prior active reference revision where safe; use compensating change records, never erase audit/history. |
| Tests | Full admin/non-admin endpoint matrix; self-escalation denial; stale revision conflict; idempotent replay; concurrent editors/lock; dependency warning; archive/restore; effective dates; DTO field allowlists; audit completeness; keyboard/mobile/a11y. |
| Acceptance | Every mutation is server-authorized, validated, locked where racing, idempotent, revision-checked, historically recorded, and audited; dependent/active data cannot be destructively removed; roster-owned fields are not editable; non-admins cannot read admin DTOs; conflicts do not overwrite. |
| Evidence | Permission matrix; mutation/audit samples; concurrent/stale-write logs; domain screenshots; archive/dependency tests; DTO privacy review; admin runbook and rollback exercise. |

## Slice 11 — Restock review and safe server actions

| Field | Plan |
|---|---|
| Goal | Replace misleading row-level restock status controls with a durable detail/review workflow whose actions are server-owned and auditable. |
| Scope | First hide or disable any control that only mutates browser state in live mode; add restock detail DTO/timeline; compute allowed actions and disabled explanations server-side; define transition/precondition matrix; confirmation summary; idempotency/replay protection; lock; revision conflict; status history; audit; safe post-mutation refresh. |
| Exclusions | No one-click completion, no client-only transition, no rewrite/delete of ledger entries, no unrelated procurement redesign, and no action if a durable restock entity is not approved. |
| Allowed files | Restock domain/repository/API, adapter, affected queue/detail visual source, tests/docs/migration if an entity is approved. |
| Off-limits | Existing immutable transaction rows, arbitrary status strings, production writes during development, and browser state as authoritative persistence. |
| Dependencies | Slices 2–3; owner approves whether restock is request/projection/entity, transition vocabulary, actors, prerequisites, relation to procurement/receipts/ledger, evidence requirements, cancellation/reversal. |
| Main risks | Duplicate action posts transaction twice; UI claims success for a local-only change; competing reviewers race; restock status diverges from procurement/ledger; legacy rows lack identity. |
| Migration | If needed, add stable restock request IDs and status-history records; map eligible legacy projections by dry run; mark ambiguous entries for review; do not create transactions during migration. |
| Rollback | Disable all consequential restock controls and retain a read-only queue/detail view; preserve created status/audit rows; revert only the action surface/service activation. |
| Tests | Allowed/forbidden action matrix; disabled reasons; missing prerequisite; confirmation cancel; exact replay; concurrent same/different actions; stale revision; server failure; late response; status/audit atomicity; ledger immutability; refresh without resubmit. |
| Acceptance | No live control can report success without a durable authorized server result; each action is validated, idempotent, locked, revision-aware, historically recorded, and audited; replay has no duplicate side effect; invalid action explains safely; resulting queue/detail agree. |
| Evidence | Before/after control inventory; transition matrix; concurrency/replay logs; status/audit sample; ledger hash/immutability check; UI screenshots; rollback-to-read-only proof. |

## Slice 12 — Bounded near-live active-module refresh

| Field | Plan |
|---|---|
| Goal | Provide understandable near-live updates without full-bootstrap polling or overlapping Apps Script calls. |
| Scope | Set a recommended 15-second active-module revision cadence (owner may approve 10–15 seconds); poll only while visible, online, focused or recently active, and not already in flight; exponential backoff/jitter; suspend on hidden/offline/dirty form as policy requires; refresh the active bounded query on revision change and after local mutation; last-updated/stale/manual controls; per-scope revision tokens; quota/read instrumentation. |
| Exclusions | No WebSocket claim, no background full bootstrap, no five-second default, no polling inactive modules, no automatic form overwrite, no new database/realtime service. |
| Allowed files | Revision service/DTO, sole adapter, runtime extensions/active module controller, metrics/tests/docs. |
| Off-limits | Concurrent `google.script.run` storms, configuration-sheet full scans per tick, permission decisions from cached client state, and refresh that replays a write. |
| Dependencies | Slice 2 bounded module queries; accepted expected concurrent-user/session counts and update-latency target; Apps Script performance/quota sample; dirty-form policy. |
| Main risks | Quota exhaustion; repeated sheet reads; synchronized clients create bursts; stale revision hides change; refresh loses local input; a late response overwrites newer data. |
| Migration | Introduce per-domain/scope revision tokens alongside the current global revision; switch one module at a time; retain manual refresh and current path as rollback until load tests pass. |
| Rollback | Disable polling remotely and preserve manual/on-mutation refresh; restore prior cadence only if it is demonstrably safe. |
| Tests | Fake-timer cadence; visible/hidden/focus/offline; non-overlap; jitter/backoff/recovery; dirty form; changed/unchanged revision; mutation refresh; out-of-order response; multi-tab/session load; quota/read-count model; stale/manual UX. |
| Acceptance | Default cadence is owner-approved within 10–15 seconds; one active revision call maximum per session; unchanged tick does not fetch module data; changed tick fetches only active scoped module; no overwrite of dirty input; p95 update visibility meets the approved target; modeled and staged load remain within a documented safety margin under current Apps Script limits. |
| Evidence | State diagram; fake-timer and multi-session logs; request/read counts per hour at expected and peak concurrency; quota calculation; network trace; stale/manual screenshots; remote-disable rollback proof. |

Apps Script limits are subject to change, so validate them immediately before this slice. Current official documentation lists a six-minute execution limit, 30 simultaneous executions per user, and 1,000 simultaneous executions per script, while `google.script.run` permits ten concurrent calls from a page; those ceilings are not a safe operating target. See [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas) and [`google.script.run`](https://developers.google.com/apps-script/guides/html/reference/run). The design follows Google’s guidance to minimize service calls and batch reads/writes: [Apps Script best practices](https://developers.google.com/apps-script/guides/support/best-practices).

## Slice 13 — Full staging operational acceptance

| Field | Plan |
|---|---|
| Goal | Prove the accepted V1 scope against a staging deployment and controlled synthetic/redacted operational dataset before any production decision. |
| Scope | Configure an authorized staging script and Drive folders; run setup/migration dry-run and authorized staging setup; seed safe role accounts/data; execute functional, authorization, privacy, accessibility, mobile, performance, concurrency, idempotency, failure/recovery, backup/reconciliation, and two-session sync acceptance; verify deployment/version/source/hash traceability; train pilot operators; rehearse rollback/incident response. |
| Exclusions | No production configuration/data/write, no public link, no real student/private supplier data in evidence, no acceptance by screenshots alone, no unresolved critical/high issue waiver without named owner. |
| Allowed files/systems | Repository test/docs plus explicitly authorized staging Apps Script/Sheets/Drive only. `clasp status` and `clasp push --dry-run` occur only after staging is configured and authorized. |
| Off-limits | Production deployment, pre-rework backup writes, personal evidence export, destructive data cleanup, merge/tag/release. |
| Dependencies | All release-scope implementation slices reviewed; staging owner/account/folders; approved synthetic/redacted dataset; named testers; acceptance matrix and rollback target; secret handling confirmed. |
| Main risks | Staging differs from production; test identities overstate access; evidence leaks PII; stale deployment tested; incomplete manual accessibility; migration not representative. |
| Migration | Execute only the approved staging migration plan with preflight, backup, dry run, row/count/hash reconciliation, issue report, activation gate, and rerun proof. |
| Rollback | Rehearse code-version rollback and data compensating/restoration procedure in staging; immutable ledger/audit remain preserved; document time, operator, and verification. |
| Tests | Entire Section 10 matrix; six target viewports; supported browsers; keyboard and manual screen-reader smoke; 200%/400% zoom where applicable; slow/offline/error paths; representative volume; multi-user races; backup/restore/reconciliation; deployment integrity. |
| Acceptance | Zero open P0/P1; all must-pass cases pass; any accepted lower issue has owner/date/workaround; exact staged commit/version/hash recorded; privacy review passes; performance/concurrency meet agreed targets; access seed and revocation verified; manual accessibility evidence complete; rollback meets recovery objectives; business owner signs the matrix. |
| Evidence | Signed acceptance matrix; exact commit/deployment/version/hash; redacted test logs/screenshots; migration/reconciliation report; access/privacy review; performance sample; accessibility report; incident/rollback record; training attendance/acknowledgment; open-risk register. |

## Slice 14 — Production approval and controlled promotion

| Field | Plan |
|---|---|
| Goal | Promote the exact accepted artifact only after an explicit production go/no-go, with monitoring and a rehearsed rollback. |
| Scope | Reconfirm repo/PR/CI; freeze artifact; compare staging/production configuration without exposing values; take approved backup; execute preflight; promote exact version; run safe smoke/authorization/privacy checks; monitor startup/error/performance/write health; communicate support/rollback contacts; record deployment evidence. |
| Exclusions | No feature coding, opportunistic fixes, schema improvisation, bulk cleanup, production seed data, merge/tag/publish beyond explicit authorization, or assumption that the reported “production” P0 refers to the current production deployment. |
| Allowed files/systems | No source edits during promotion except a separately reviewed emergency commit. Only explicitly approved production Apps Script/Sheets/Drive resources and repository/GitHub actions in the release authorization. |
| Off-limits | Pre-rework backup writes, unapproved Drive fallback, secret output, real-data screenshots, destructive rollback, and any deployment whose artifact hash differs from staging acceptance. |
| Dependencies | Slice 13 signed; exact environment/deployment URL/ID and current production version identified privately; business/data/security/deployment owners approve; maintenance/support window; backups; rollback target; CI/PR reviewed. |
| Main risks | Wrong deployment/version; environment config drift; authorization differs; migration partial; support unavailable; rollback loses post-release writes; smoke test creates unintended records. |
| Migration | Use the separately accepted production migration runbook: preflight, backup, dry-run report, approved execution, reconciliation, activation, and no destructive rewrite. If no migration is required, record that explicitly. |
| Rollback | Roll code to the recorded immutable deployment version; disable new writes/features if necessary; preserve and reconcile post-release writes; use compensating migration/restoration only per runbook; notify owners and open incident record. |
| Tests | Pre-promotion integrity/config checks; post-promotion safe read-only smoke; role denials; request-only privacy; one explicitly approved reversible synthetic transaction if policy permits; startup/performance monitoring; rollback trigger test. |
| Acceptance | Exact accepted hash deployed; all gates signed; no privacy/auth regression; startup target met; safe smoke passes; monitoring is live; rollback remains executable; release record contains operator/time/version/config comparison and any unrun check. |
| Evidence | Written go/no-go; PR/CI state; commit/deployment/version/hash; backup/reconciliation identifiers (not secrets); smoke/monitoring results; release communication; rollback decision log. |

## Slice 15 — Hosted-frontend architecture spike and decision record

| Field | Plan |
|---|---|
| Goal | Decide whether a separately hosted static frontend is worth adopting after Apps Script V1 is stable, without building or migrating production. |
| Scope | Time-boxed threat model and proof using synthetic data; compare continued Apps Script HTML Service, Cloudflare Pages, and Firebase Hosting; define a backend-for-frontend boundary; Google Workspace identity/session verification; capability authorization; CORS/CSRF/replay/idempotency; CSP; environment/secrets; diagnostics; cache rules; failure modes; deploy/rollback; data continuity; cost/limits; operator burden. Produce an ADR and migration/no-migration recommendation. |
| Exclusions | No production hosted site, DNS change, OAuth client creation, Cloudflare Access/Firebase project mutation, real Apps Script API credentials, or database migration. |
| Allowed files | Architecture ADR, threat model, interface spec, synthetic throwaway proof isolated from production code if separately approved, tests/docs. |
| Off-limits | Secrets in browser/git, direct public Apps Script write proxy, bearer token persistence in local storage, relaxed wildcard CORS, or assumption that hosting authenticates/authorizes backend requests. |
| Dependencies | Stable and measured Apps Script V1; named identity/security/deployment owners; expected users/traffic; institution Google Workspace controls; supported browser/domain requirements. |
| Main risks | Cross-origin/session complexity exceeds benefit; API-executable identity differs from web app; OAuth/admin approval unavailable; static host creates a public shell around a weak backend; split deployments complicate rollback. |
| Migration | None in the spike. If approved later, plan an additive dual-host canary with versioned API, feature parity, identical authorization, data continuity, and Apps Script-hosted rollback. |
| Rollback | Delete/disable the synthetic proof and retain Apps Script hosting. No user/domain/data migration occurs in this slice. |
| Tests | Threat cases; token/session expiry; CORS preflight; CSRF/replay; capability denial; error sanitization; environment isolation; CSP/static integrity; API timeout; host rollback; synthetic performance. |
| Acceptance | ADR states decision, assumptions, owner, total operational cost, security boundaries, unresolved approvals, measurable benefit, migration stages, and rollback. “Migrate” requires a safe authenticated server boundary—not direct unauthenticated browser writes—and material measured benefit. |
| Evidence | ADR and diagrams; threat/control matrix; synthetic test report; current official limit/pricing links with access date; owner decision checklist; no external-system mutation. |

Current official limits should be rechecked at decision time. As of this plan, Cloudflare Pages documents 500 free builds/month, 20,000 files/site, 25 MiB/file, static asset requests free/unlimited, Functions billed through Workers limits, and deployment rollback; Firebase Hosting documents 10 GB no-cost storage and 10 GB/month no-cost transfer. See [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/), [Pages Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/), [Pages rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/), and [Firebase Hosting usage, quotas, and pricing](https://firebase.google.com/docs/hosting/usage-quotas-pricing). These are operational inputs, not the deciding architecture criterion.

## Slice 16 — Future PostgreSQL/Supabase specification only

| Field | Plan |
|---|---|
| Goal | Specify a possible post-V1 transactional/reporting platform without implementing it or weakening current spreadsheet continuity. |
| Scope | Domain-boundary and workload analysis; canonical relational schema; identities/scopes; append-only ledger/audit/history; reversal/adjustment; optimistic concurrency; idempotency; outbox; retry/dead-letter; reporting projections; file/evidence references; migration waves; reconciliation; dual-read/write cautions; backup/restore; RPO/RTO; data classification/retention; Apps Script rollback/read-only continuity; Supabase-vs-managed PostgreSQL decision criteria. |
| Exclusions | No database/project creation, credentials, schema execution, data export, dual-write, production integration, or promise that Supabase free tier is production-sufficient. |
| Allowed files | Architecture/data-model ADRs, SQL-like illustrative schema clearly marked non-executable, migration/reconciliation/test plan, cost/operations analysis. |
| Off-limits | Live records/secrets, destructive spreadsheet migration, mutable ledger design, client direct database authority, or implementation code in a planning slice. |
| Dependencies | Stable V1 measurements; retention/legal requirements; transaction/report volumes; owners for database/security/backup/on-call; hosted-front decision if relevant. |
| Main risks | Dual-write inconsistency; lost provenance; identity mismatch; RLS mistaken for complete authorization; evidence links orphaned; backup tier insufficient; operational complexity exceeds value; rollback after new writes is undefined. |
| Migration | Specify phased snapshot + change capture/outbox, immutable source identifiers, checksums/counts/totals, quarantine, rehearsed cutover, read-only verification, and reverse synchronization/compensation. Never overwrite the pre-rework backup. |
| Rollback | Specify how new-system writes are drained/reconciled back to the authoritative system or how operations pause safely; retain spreadsheets and Apps Script as a tested read/rollback path until an explicit retirement gate. |
| Tests | Schema constraints; property-based status/ledger rules; authorization/RLS defense-in-depth; idempotency; concurrent transitions; outbox retry/dead-letter; reconciliation counts/totals/hashes; backup/restore; RPO/RTO; cutover/rollback game day. |
| Acceptance | Approved specification preserves every domain invariant and source ID; owns failure/recovery; quantifies costs/limits/operations; defines no-data-loss cutover/rollback; identifies why migration is better than optimized Apps Script; contains no implementation or external mutation. |
| Evidence | ADR, ERD, invariants catalog, migration state machine, reconciliation queries, threat model, cost model, recovery exercise design, owner decision. |

Supabase currently documents 500 MB database size for the Free plan and states that downloadable backups are not available on that plan; verify current terms and required recovery guarantees before any recommendation. See [Supabase pricing](https://supabase.com/pricing).

## Dependency and release gate summary

```text
P0 recovery (1) → bounded data loading (2) → canonical authorization (3)
                                      ├→ roster sync (4)
                                      ├→ committee hub (5)
                                      ├→ composite foundation (6) → Food (7)
                                      │                          ├→ Materials (8)
                                      │                          └→ Venue/Equipment (9) → Admin (10)
                                      ├→ safe restock actions (11)
                                      └→ bounded near-live refresh (12)

Accepted V1 slices → staging acceptance (13) → explicit production promotion (14)
Stable measured V1 → hosted-frontend decision only (15) → future database specification only (16)
```

The V1 release scope must be explicitly selected; this roadmap does not presume that all feature slices must ship together. The minimum stabilization release is Slices 1–2 plus regression and staging acceptance. Committee/composite V1 requires Slices 1–13 for whichever specializations the owner includes, followed by Slice 14 only after approval.

# Section 10 — Test strategy and acceptance matrix

## Test principles

- Use the repository’s deterministic build/verification chain and preserve generated-artifact hash checks.
- Prefer pure domain tests for status, permission, validation, and routing rules; then prove server adapters and UI consume the same contracts.
- Use only synthetic or explicitly approved redacted fixtures. Never copy production/private roster/student/supplier/evidence data into tests or output.
- Test denial, timeout, stale, conflict, replay, partial-failure, rollback, and recovery—not only success.
- Treat browser hiding as presentation only. Every consequential server endpoint must have direct authorization tests.
- Record exact command, commit, environment, sample size, time, and unrun conditions. “Pass” without traceable evidence is not acceptance.

## Must-pass matrix

| Area | What must be proved | Minimum methods | Release gate and evidence |
|---|---|---|---|
| Repository/build integrity | Generated artifacts derive only from approved sources; legacy baseline is preserved; forbidden files/secrets are absent. | `npm ci`, extract/build/verify/check, deterministic repeat hashes, secret/forbidden-file scan, git diff review. | All commands pass twice where determinism is claimed; artifact hashes and clean scoped diff recorded. |
| Bootstrap state machine | Every stage reaches success or a nonblocking recoverable error; no permanent overlay. | Unit/fake timers plus Playwright failure injection for reject, timeout, malformed DTO, normalize/bind/render/post-render throw, Retry, late/duplicate callback. | 100% named terminal-state cases pass; screenshot/trace for each user-visible state. |
| Bootstrap performance | Initial work and payload are bounded at representative volume. | Server stage timing, sheet read counts, serialized bytes, network/parse/render timing, CPU long-task review on agreed low/mid devices and networks. | Shell ≤2 s; warm p95 ≤5 s; cold p95 ≤8 s; no routine success >10 s, unless owner approves evidence-based replacements before release. |
| Apps Script contract/serialization | All parameters/results are supported, versioned, JSON-safe, finite, and allowlisted. | Contract snapshots; Date/nonfinite/undefined/function/circular/malformed cases; client/server version mismatch; payload caps. | No unsupported value escapes; incompatible versions fail safely; request-only/internal DTO tests pass. |
| Data query bounds | Startup and module reads do not scan/return unrelated domains or become N+1. | Repository spies/read counters, high-volume fixtures, pagination/filter bounds, duplicate-read assertions, cache miss/stale/eviction tests. | Essential bootstrap excludes full operational collections; active module alone loads; approved read/byte budgets hold. |
| Identity and authorization | Exact identity, active membership, role, committee scope, capability, and resource context are all enforced. | Generated role × scope × resource × action matrix; direct endpoint calls; inactive, revoked, stale, unknown, ambiguous, and multi-membership cases. | Every unspecified combination denies; server result—not UI—determines action; owner signs matrix. |
| Privacy/DTO minimization | Requesters and internal roles receive only fields necessary for their view. | Field-level allowlist assertions, synthetic canary fields, browser/network/storage inspection, logs/errors/screenshots review. | Zero roster rows, supplier TINs, private contacts, student IDs, unrestricted Drive links, full audit/ledger/history, or secret configuration outside explicitly authorized DTOs. |
| Roster synchronization | Only complete validated snapshots activate; stale/failure/revocation behavior is safe. | Source-schema faults, duplicate normalization, inaccessible source, concurrent sync, partial/timeout, revision/freshness, emergency revocation, startup read-count. | Zero source reads in ordinary bootstrap; no failed snapshot grants access; private ID/data absent from evidence. |
| Committee dashboards | Counts, filters, queues, scope, deadlines, blockers, evidence flags, assignments, and recent activity reconcile. | Query/domain tests, count-to-detail comparison, timezone boundaries, role matrix, volume test, UI empty/stale/error states. | Every tile equals its opened set; no cross-scope row; bounded load meets target. |
| Composite creation | All non-empty section combinations create exactly the intended hierarchy atomically and idempotently. | Seven-combination table, all-blank, validation/focus, retry, concurrent submit, injected mid-write failure, relationship reconciliation. | One parent; one child per non-empty section; no blank child, orphan, or duplicate; combined review equals persisted result. |
| Parent status derivation | Draft/review/rejection/partial completion/full completion/cancel/reopen/add-section/amendment are deterministic. | Table-driven plus property-based tests over child sets and transition sequences; mixed rejection and cancellation-after-activity cases. | Parent never completes from one of several children; every owner-approved mixed state has one documented result and attention flags. |
| Food workflow | Controlled fields, privacy, routing, deadlines, sourcing/evidence, and completion behave as approved. | Validation, role/transition, dietary-data minimization, lead-time, evidence and combined-request tests. | Food child is scoped and independently actionable; no unnecessary sensitive data or supplier identifiers exposed. |
| Materials workflow | Exact item/quantity/unit, sourcing/stock exclusivity, provenance, evidence, and `VERIFY` controls hold. | Unit/quantity boundaries, duplicates/substitution, migration provenance, `VERIFY`, ledger/reversal, combined-request tests. | No `VERIFY` transaction; no silent unit/source change; immutable ledger hashes remain stable. |
| Venue/equipment workflow | Search, reference revisions, quantities, truthful requestability, routing, “Other,” archive/history, and combinations work. | Lookup/alias/effective-date/routing/history tests; keyboard combobox; seven combinations; catalog-change replay. | No invented fourth committee; server routing approved; changed/archived references preserve submitted meaning. |
| Admin changes | Authorized, revision-safe, idempotent, non-destructive reference management with complete history/audit. | Endpoint matrix, self-escalation, stale/concurrent write, archive/dependency, effective date, replay, validation and DTO privacy tests. | No non-admin access; no silent overwrite/delete; every accepted mutation has before/after history and audit. |
| Restock actions | Detail review, prerequisites, allowed actions, confirmation, transition durability, replay and concurrency are safe. | Transition matrix; direct endpoint denial; confirmation; exact replay; competing reviewers; injected persistence/audit failure; ledger immutability. | UI cannot claim a local-only success; status/history/audit commit together; replay has one effect. |
| Near-live refresh | Polling is bounded, nonoverlapping, visibility-aware, mutation-aware, stale-safe, and does not overwrite forms. | Fake timers; focus/hidden/offline; jitter/backoff; out-of-order; dirty form; multi-tab/user load; quota/read model. | One active poll maximum/session; unchanged revision fetches no module; active module only refreshes; approved latency and safety margin hold. |
| Concurrency/idempotency | Racing writes cannot duplicate IDs, lose state, violate transitions, or split audit from business effects. | Parallel calls, lock timeout, same/different idempotency keys, stale revisions, replay after ambiguous timeout, failure at each persistence boundary. | One durable logical effect per key; deterministic conflict; complete history/audit; reconciliation has zero unexplained differences. |
| Migration/reconciliation | Additive migration is dry-runnable, restartable, idempotent, provenance-preserving, and reversible. | Empty/realistic/duplicate/unknown/partial fixtures; repeated dry run/apply; counts, IDs, totals, hashes; interruption/resume; rollback rehearsal. | No source loss or immutable rewrite; unknowns quarantined; before/after/reversal reconcile exactly; backup target verified read-only. |
| Drive/evidence safety | Configuration fails closed and file/evidence access follows approved scope, type, size, retention, and failure behavior. | Missing/wrong folder config, inaccessible folder, filename/type/size, upload retry/idempotency, permission/link DTO, orphan cleanup and retention tests. | Never falls back to owner My Drive; no unapproved public link; failed upload cannot falsely complete workflow. |
| Browser/regression | Supported workflows work in packaged Apps Script output and do not regress existing modules. | Existing Vitest/Playwright suites plus realistic bootstrap, role journeys, adapter packaging, navigation, overlays, visual baseline/hash comparison. | All required suites pass; intentional skips enumerated and justified; no critical console/page error. |
| Responsive/mobile | 360/390/412 mobile, tablet, laptop and desktop layouts preserve actions/content. | Six agreed viewports, portrait/landscape where relevant, touch-target/table-card/zoom/long-text tests. | No clipped/blocking control, horizontal page scroll, hidden validation, or pointer-only operation in must-pass flows. |
| Accessibility | Semantic/focus/name/state/error/live-region behavior supports keyboard and assistive technology. | Automated scan plus manual keyboard, focus order/trap/restore, screen-reader smoke, 200%/400% zoom where applicable, forced colors, reduced motion. | Zero critical automated issue; all must-pass flows usable manually; remaining issue has owner/date; no unsupported conformance claim. |
| Failure/incident/rollback | Operators can identify version, stop unsafe writes, recover service, reconcile, and communicate. | Server/client failure drills, stale deployment, config failure, code rollback, feature disable, data reconciliation/restore tabletop or staging rehearsal. | Recovery objectives and trigger/owner steps are met; no audit/ledger loss; exact rollback evidence recorded. |
| Staging acceptance | Exact artifact works for approved roles, data volumes, and simultaneous sessions. | Full matrix in staging with authorized synthetic/redacted fixtures and named business testers. | Signed must-pass matrix, zero P0/P1, exact commit/deployment/version/hash, accepted residual-risk list. |
| Production promotion | Only the accepted artifact/config reaches production and safe smoke/monitoring/rollback are ready. | Integrity/config comparison, approved backup, read-only smoke, denial/privacy checks, startup/error/write monitoring. | Explicit go/no-go; exact hash; no auth/privacy regression; support and rollback live. |

## Acceptance evidence bundle

The release evidence bundle should contain only safe metadata and redacted/synthetic artifacts:

1. exact branch, commit, PR, CI checks, build timestamp, and generated hashes;
2. test commands, versions, environments, pass/fail counts, intentional skips, and raw-log storage location;
3. signed requirement-to-test traceability and owner decision record;
4. deployment/version mapping and configuration-key presence comparison, never secret values;
5. migration dry-run/apply/reconciliation/rollback records;
6. performance distribution with sample size, fixture volume, device/network, and server/client stage timings;
7. authorization/privacy matrix and safe DTO field lists;
8. browser/mobile/accessibility/manual acceptance results;
9. known issues with severity, owner, due date, workaround, and release disposition; and
10. incident, monitoring, backup, recovery, and rollback proof.

Current repository claims (93 Vitest tests and 38 passing Playwright checks with 40 intentional skips at the recorded handoff) are useful historical evidence, but they are not a substitute for rerunning the accepted slice on its final commit and deployment.

# Section 11 — Risk matrix

Severity reflects impact if realized; likelihood reflects current evidence before the proposed controls. “Owner” is the accountable role to name before implementation.

| ID | Risk and present evidence | Severity | Likelihood | Required mitigation / release gate | Owner |
|---|---|---|---|---|---|
| K01 | The reported “production” stuck bootstrap may refer to a stale or different deployment. Repository records say current production is untouched and Version 0.5.0 is undeployed. Diagnosing the wrong artifact could create a new outage. | Critical | High | Privately identify URL, deployment ID, version, executing identity, commit/hash, timestamp, browser/network trace, and reproducibility before a fix/deploy. | Deployment owner |
| K02 | A post-response exception can leave the blocking overlay indefinitely because normalization, binding, full first render, and post-render are outside the current load catch/finalizer. | Critical | High | Slice 1 terminal-state state machine, failure injection, safe stage diagnostics, and Retry; no release until every stage clears the overlay. | Frontend lead |
| K03 | Ordinary internal bootstrap performs repeated full-sheet reads and returns all operational modules; realistic volume may exceed latency/execution/payload budgets. | Critical | High | Measure reads/bytes/stages, implement essential DTO and lazy bounded modules, enforce performance/load gates. | Backend lead |
| K04 | Internal bootstrap exposes broad requester/borrower contacts, student IDs, supplier TINs, Drive links, ledger/history/audit data to any active non-requester internal role. | Critical | High | Capability/scope-specific DTO allowlists, privacy canaries, field-level tests, and owner privacy review before internal pilot. | Security/data owner |
| K05 | Server and browser permission registries use conflicting role names/capabilities; committee-head release power currently differs. | Critical | High | Canonical server capability registry and exhaustive denial matrix; owner signs role/action table; client consumes sanitized server capabilities only. | Product/security owner |
| K06 | Current branch has no PR or Actions runs; draft PR #2 covers the older `81efe826...` head, not current `5a3b124...`. | High | High | Open/review the correct PR only when authorized, require final-commit CI, and record exact PR/check state before promotion. | Repository manager |
| K07 | Private roster integration can leak its identifier/data, read heavily at startup, or grant from a partial/stale sync. | Critical | Medium | Property-key-only config, validated snapshot activation, exact match, freshness/revocation policy, zero source startup reads, leak scan. | Identity/data owner |
| K08 | Current restock queue controls can mutate browser state and toast without a durable server transition in live mode. | Critical | High | Immediately remove/disable misleading live actions; implement server action matrix/idempotency/lock/history/audit or retain read-only detail. | Product/backend lead |
| K09 | Current five-second revision polling reloads the complete bootstrap after change and may create quota/load spikes or overwrite user context. | High | High | Default 15 seconds subject to approval, scoped revision/query, nonoverlap/backoff/visibility/dirty-form safety, concurrency/quota test, kill switch. | Backend/operations lead |
| K10 | Composite submit can create duplicate/orphan parent/children or derive a misleading parent status under retries, partial failure, mixed rejection, or cancellation. | Critical | Medium | Atomic locked idempotent creation, distinct relationship schema, property-based derivation tests, reconciliation, feature flag and fallback. | Domain/backend lead |
| K11 | Current `Parent_Request_ID` already means an additional request’s original request; overloading it for component children would corrupt semantics. | High | High | Approve a distinct relationship model, preserve original field/provenance, migrate only by explicit mapping and reconciliation. | Data architect |
| K12 | Committee names and role vocabulary conflict across code/docs/seeds (“Inventory Committee,” “Inventory and Pantry,” and “Venues & Equipment”). | High | High | Owner approves canonical IDs/names and legacy mappings; unknown values quarantine; exactly three permanent committees. | Product owner |
| K13 | Hardcoded text-based committee routing can misroute unfamiliar or renamed items and lacks effective-dated administrative governance. | High | High | Stable IDs and versioned routing references; no regex fallback for consequential routing; admin review and history. | Operations owner |
| K14 | Schema/backfill errors could rewrite source meaning, lose provenance, duplicate entities, or touch immutable ledger/history/backup data. | Critical | Medium | Additive restartable migration, dry run, quarantine, counts/IDs/totals/hashes, immutable checks, backup read-only verification, rollback rehearsal. | Data owner |
| K15 | `VERIFY` legacy inventory rows might be transacted or normalized before a human confirms exact source name/quantity/unit. | Critical | Medium | Server-level `VERIFY` block, provenance preservation, migration/report tests, no transaction path until explicit resolution. | Inventory owner |
| K16 | Misconfigured Drive folder could expose evidence or fall back to an owner’s root; upload failure could falsely advance status. | Critical | Medium | Preserve fail-closed folder resolution, permission/link DTO review, atomic evidence prerequisites, retention policy and failure tests. | Drive/data owner |
| K17 | Concurrent Apps Script writes, ambiguous timeouts, and replay may double-apply requests, releases, restocks, or admin changes. | Critical | Medium | Server IDs, idempotency keys, locks, revision checks, atomic history/audit, ambiguous-timeout replay and concurrency tests. | Backend lead |
| K18 | Missing full project report and paper-form image prevents exact field/layout reconciliation; invented fields could become institutional policy accidentally. | High | High | Obtain authoritative artifacts and provenance; run a documented delta review; mark all inferred fields/rules provisional until approved. | Product owner |
| K19 | Manual accessibility and real-device validation are pending; automated checks can miss focus, screen-reader, zoom, and touch failures. | High | High | Named manual testers, keyboard/screen-reader/zoom/forced-color/mobile matrix, zero critical issues before production. | Accessibility owner |
| K20 | Apps Script quotas/latency may degrade under many focused sessions despite successful single-user tests. | High | Medium | Measure realistic concurrency, model calls/read volume, use bounded cache/query design and polling kill switch, retain manual refresh. | Operations lead |
| K21 | Cache-based revision/reference optimization can return stale permissions or lose entries before nominal expiry; Apps Script cache is advisory. | High | Medium | Never authorize from client/cache alone; version cache values; validate against authoritative access where required; tolerate miss/eviction. | Backend/security lead |
| K22 | Venue/equipment “availability” may be presented as confirmed booking without a source schedule, causing operational conflict. | High | Medium | Use requestable/not-requestable language; require explicit schedule integration before availability guarantees; show routing/lead time. | Facilities owner |
| K23 | Admin reference tools can permit self-escalation, destructive archive, or lost updates. | Critical | Medium | Separate capability, optional two-person review, dependency guard, revision conflict, lock/idempotency, audit, no permanent delete. | Security/admin owner |
| K24 | Hosted frontend could weaken Google identity/session boundaries, expose an API proxy, or add CORS/CSRF/replay weaknesses. | Critical | Medium | Post-V1 ADR/threat model and synthetic proof only; secure backend-for-frontend; no migration without identity/security owner approval and rollback. | Security architect |
| K25 | Future database dual-write/migration could lose ledger/audit provenance and lack a usable rollback; free-tier backup limits may be inadequate. | Critical | Medium | Specification-only until justified; outbox/retry/dead-letter, reconciliation, backup/restore and cutover/rollback game day; paid recovery capability as needed. | Data/operations owner |
| K26 | Training gaps may cause staff to treat visibility as authority, requestability as booking, refresh as submit, or adjustment as ledger edit. | High | Medium | Role quick starts, operational scenarios, pilot acknowledgment, in-product explanations, escalation/support runbook. | Operations/training owner |
| K27 | Broad scope invites an unreviewable “big bang” release and makes attribution/rollback difficult. | Critical | High | One accepted vertical slice/commit at a time, explicit non-goals, feature flags, evidence review, and manager gate before the next slice. | Manager/product owner |

## Risk disposition rules

- No open Critical risk may be accepted implicitly. It must be mitigated and tested, or explicitly accepted in writing by the named institutional owner with scope, duration, workaround, and rollback trigger.
- P0/P1 findings block production. High residual risks require an owner and dated corrective milestone.
- A missing artifact, owner decision, environment identity, or external authorization remains an unresolved input—not a reason to invent a value.
- Re-score likelihood after each accepted slice and attach the updated matrix to staging and production go/no-go evidence.

# Section 12 — Owner decisions

These defaults are recommendations, not approvals. The owner can answer each item in ordinary language; the manager should record the approver, date, and chosen value before the dependent slice begins.

## Required decisions from the brief

1. **Permanent committee-head assignments** — Who is the approved head of Food, Inventory and Pantry, and Materials? **Recommended default:** one active primary head per committee, plus an explicitly recorded acting head with start/end dates; do not place personal names in public documentation.

2. **Default owner for Venue & Equipment subtickets** — Which existing committee, designated administrator, materials/inventory owner, or responsible office receives them? **Recommended default:** use an admin-managed routing rule by venue/equipment category and responsible office; no fourth permanent committee and no text-guessing fallback.

3. **Committee-head reach** — Do heads see everything only, or may they act outside their own committee? **Recommended default:** heads may view approved cross-committee event context but act only within their committee; Director oversight does not automatically grant destructive/admin actions.

4. **Permissions by role** — For Requester, Staff, Committee Head, Director, and Administrator, which actions are allowed? **Recommended default:** approve the explicit action matrix from Slice 3; anything not listed is denied.

5. **Multiple committee membership** — May one person belong to more than one committee? **Recommended default:** yes, through separate active memberships; the UI shows current committee context and the server checks the selected scope on every action.

6. **Temporary event subcommittees** — Are temporary groups supported? **Recommended default:** not as permanent authorization groups in V1; use event assignments within a permanent committee, with dated membership only if an approved need is demonstrated.

7. **Who changes committee assignments?** **Recommended default:** the authoritative roster owner changes roster-owned membership; a designated administrator triggers/monitors sync but cannot silently override source-owned identity. Emergency revocation is allowed to an approved security owner and is audited.

8. **Who may add venues and equipment?** **Recommended default:** designated administrators may draft/add/archive references; responsible facilities/inventory owners supply or validate the content.

9. **Who approves venue routing data?** **Recommended default:** the responsible institutional office owner approves; Administrator records it; Director or a second designated reviewer approves cross-office/permission-impacting changes.

10. **What happens when one child request is rejected?** **Recommended default:** that child is Rejected; unaffected children continue; the parent shows `Needs attention — partially rejected` and never appears wholly Completed. The requester sees the safe reason and amendment path.

11. **May a requester amend a submitted section?** **Recommended default:** yes, through a versioned amendment request before terminal completion; material changes after committee activity require committee review and never rewrite history.

12. **May sections be added after submission?** **Recommended default:** yes, as a new child linked to the same parent through an audited “add section” action; it receives its own routing and cannot silently change existing children.

13. **Polling interval** — How quickly should focused users see changes? **Recommended default:** 15 seconds for the visible active module, with manual/on-mutation refresh, non-overlap, backoff, and a remote kill switch. Approve a value within 10–15 seconds only after load evidence.

14. **Maximum startup time** — What is acceptable? **Recommended default:** shell ≤2 seconds, warm p95 ≤5 seconds, cold p95 ≤8 seconds, slow-state shown at 8 seconds, and no routine success >10 seconds under the agreed staging fixture. Approve any replacement from measured evidence.

15. **Hosted frontend timing** — Is it part of V1.0? **Recommended default:** later milestone. Stabilize, secure, measure, and accept Apps Script V1 first; then decide from Slice 15’s ADR.

16. **Hosted authentication model** — If later approved, how do users sign in? **Recommended default:** institution-controlled Google Workspace identity verified by a secure server boundary, short-lived server session, explicit server capability checks, and no unrestricted direct browser proxy. Institutional identity/security owner must approve.

17. **Evidence retention/storage** — How long are uploads kept, who may see them, and when may they be archived/deleted? **Recommended default:** data owner defines periods by evidence type and legal/audit need; least-privilege Drive folders, no public links, archive is distinct from approved deletion, and audit/ledger obligations are preserved.

18. **Acceptance fixtures and staging tests** — May the team configure staging and use an approved synthetic/redacted dataset and role accounts? **Recommended default:** yes, with a named staging owner, no production/private data in committed evidence, explicit authorization for any staging write/deploy, and cleanup/retention rules.

## Additional decisions discovered in the audit

19. **Which environment is actually failing?** Record privately the affected URL/deployment/version and whether it is production, staging, or an old test deployment. **Recommended default:** no deployment action until this is verified.

20. **What are the canonical committee names and IDs?** Current sources conflict. **Recommended default:** Food Committee, Inventory and Pantry Committee, and Materials Committee, each with an immutable ID; approve exact display names and legacy mappings.

21. **What are the canonical role names?** Client and server vocabulary differs. **Recommended default:** stable internal role IDs with owner-approved display labels; preserve legacy labels only as migration provenance.

22. **Are Director and Administrator separate roles?** **Recommended default:** yes. Director receives approved oversight/actions; Administrator manages references/access only where explicitly granted; neither role implies every capability.

23. **May committee heads review, receive, release, cancel, or reverse?** **Recommended default:** decide action by action. Preserve current server behavior (review/receive, not release) until an owner approves a change.

24. **What does venue/equipment “availability” mean?** **Recommended default:** “requestable” only until a trusted scheduling/stock source is integrated; never promise a booking from a static flag.

25. **What is the roster sync policy?** Approve source owner/schema, cadence, freshness threshold, last-known-good use, outage behavior, revocation deadline, emergency disable, and log retention. **Recommended default:** scheduled plus admin-triggered validated snapshots; new/changed grants fail closed; emergency revocation is immediate.

26. **How is the composite relationship stored?** **Recommended default:** a new relationship/entity field or table; do not reuse the existing `Parent_Request_ID` meaning without an explicit migration.

27. **What are the exact child and parent statuses?** Approve the Section 6 lifecycle, mixed-rejection label, attention flags, reopen conditions, and terminal states. **Recommended default:** derive parent state from all active children; never store a freely editable parent status.

28. **What happens on cancellation after work or ledger activity?** **Recommended default:** stop remaining work, preserve completed activity, and use documented reversal/adjustment where required; never delete or edit posted entries.

29. **What counts as a duplicate or allowed substitution?** **Recommended default:** automatically consolidate only identical stable reference ID + specification + unit; prompt on anything else; substitution requires an authorized recorded decision.

30. **What is a restock request?** Decide whether it is a durable entity, a projection from stock thresholds, or procurement work, and approve actors/transitions/evidence. **Recommended default:** keep the current surface read-only until a durable server workflow is approved.

31. **Which Food fields are appropriate?** Approve meal/service categories, quantity meaning, lead time, sourcing, completion, and dietary/allergen data policy. **Recommended default:** collect only operational summaries, never unnecessary medical details.

32. **Which Materials categories and units are valid?** Approve source/stock/procurement choice and substitution authority. **Recommended default:** fixed IDs/units, exact quantities, `VERIFY` blocked, no silent conversion.

33. **Which venue/equipment references seed V1?** The examples in the request are not authoritative. **Recommended default:** responsible owners approve a minimum versioned list, aliases, categories, routing, lead times, and effective dates before import.

34. **Which internal personal fields may each role see?** **Recommended default:** dashboard staff display is safe name/assignment/workload only; contacts, student IDs, supplier TINs, evidence links, ledger/audit details require explicit task need and capability.

35. **Which roadmap slices define V1?** **Recommended default:** ship stabilization first; then select a bounded committee/composite release. Do not assume every proposed feature belongs in the same launch.

36. **What are the supported devices/browsers and accessibility acceptance level?** **Recommended default:** current supported evergreen browsers, six recorded viewports, keyboard/manual screen-reader/zoom tests, and no conformance claim until manual review.

37. **Who owns staging and pilot sign-off?** Name business, data, privacy/security, accessibility, and deployment approvers plus role testers. **Recommended default:** no one person self-approves implementation, data, and release.

38. **What are the backup, recovery, and incident targets?** Approve RPO/RTO, rollback trigger, support hours, communication channel, and owner. **Recommended default:** rehearse in staging and record measured recovery time before production.

39. **How long are access snapshots, sync logs, safe error diagnostics, status history, audit, backups, and requester/borrower data retained?** **Recommended default:** approve a data-classification schedule; minimize diagnostic retention; preserve legal/immutable records; document authorized deletion.

40. **May existing historical requests be backfilled into composite parents?** **Recommended default:** no automatic backfill for V1. Keep history as-is unless an owner-approved mapping has zero ambiguity and full reconciliation.

41. **May reference/routing/permission changes require a second approver?** **Recommended default:** require review for permission escalation and cross-office routing; evaluate two-person approval for other high-impact changes.

42. **What expected concurrent usage and record volume must the system support?** **Recommended default:** provide peak focused sessions, active events, items, requests, lines, history, audit, and uploads; use that fixture for performance/quota acceptance.

43. **When may the old full-bootstrap contract be retired?** **Recommended default:** only after all modules use versioned bounded contracts, staging rollback is rehearsed, one accepted release has operated stably, and the manager approves removal.

44. **May the full report and paper form be shared for reconciliation?** **Recommended default:** provide approved copies with provenance and sensitive content redacted where possible; do not infer missing official fields from placeholders.

## Approval record template

For each decision record: `Decision number | chosen option/value | approver and role | date | effective version | affected slices | conditions/expiry | evidence location`. Do not place private roster identifiers, personal names that are not approved for repository publication, or secret configuration values in the committed record.

# Section 13 — Recommended specification amendment

## V1.0 Specification Amendment 01 —<br>
Committee Workspaces, Composite Event Requests,<br>
Reference Catalogs, Near-Live Updates,<br>
and Production Stabilization

**Status: PROPOSED — NOT YET ACCEPTED**

**Authority:** Requires approval by the designated HAU-USC product, data, security/privacy, and deployment owners.

**Relationship to existing specifications:** This amendment supplements the repository architecture, domain, security, migration, testing, and launch documents. Existing controls remain in force unless an accepted clause here explicitly and safely supersedes them.

**Interpretation:** “Shall” is mandatory after acceptance; bracketed owner decisions remain unresolved and block dependent implementation.

### 13.1 Purpose and priorities

V1.0 shall stabilize startup and preserve current operations before expanding the product. It shall provide a committee-aware Main Hub, optional composite event-logistics requests, controlled venue/equipment references, safe restock actions, private roster-backed access, and bounded near-live updates. It shall keep Google Sheets and Drive operational and recoverable during V1. Hosted-frontend and database migrations are separate later decisions.

Priority order shall be:

1. privacy, authorization, data integrity, and recovery;
2. P0 startup diagnosis and bounded performance;
3. preservation of working inventory, procurement, lending, request, evidence, and audit behavior;
4. owner-approved workflow expansion in reversible vertical slices; and
5. hosting/database evolution only after measured V1 stability.

### 13.2 Non-negotiable domain and repository controls

1. Posted ledger entries, status history, audit records, and command-journal/idempotency results shall not be edited or deleted. Corrections shall use an approved reversal, adjustment, or compensating record.
2. `VERIFY` items shall not transact. Their original sheet, row, block, exact name, quantity, and unit shall be preserved.
3. The pre-rework backup spreadsheet shall remain read-only.
4. Apps Script shall generate authoritative IDs. Consequential writes shall use authorization, server validation, an idempotency key, a lock when state may race, revision/transition checks, status history, and audit logging.
5. Drive configuration shall fail closed and shall never fall back to the script owner’s My Drive root.
6. UI visibility shall not grant authority. The server shall check identity, role, capability, committee/resource scope, record state, and relevant prerequisites for every operation.
7. Generated HTML and generated visual fragments shall not be hand-edited. The approved legacy visual baseline and extraction/build process shall be preserved.
8. Additive schema and stable IDs/provenance shall be preferred. Any migration shall be dry-runnable, restartable, idempotent, reconciled, reversible, and approved.

### 13.3 Production stabilization and startup contract

1. The affected failing environment, deployment, version, and artifact shall be identified before any deployment action. A report that “production is stuck” shall not override repository evidence that current production was untouched.
2. Startup shall be an explicit client state machine with named stages, safe correlation/diagnostic codes, and exactly one terminal finalizer.
3. Rejection, timeout, malformed data, normalization failure, binding failure, first-render failure, post-render failure, and late/duplicate callback shall all clear the blocking overlay and present a usable Retry/error state.
4. Ordinary startup shall make one nonoverlapping essential-bootstrap request. Retry shall not create overlapping calls.
5. The essential DTO shall be versioned, JSON-safe, field-allowlisted, and limited to identity/capability/scope, environment, navigation/config needed for the shell, revision tokens, and bounded summaries. Full roster, audit, ledger, history, evidence, lending, procurement, request, or deliverable collections shall not be included merely because the user is internal.
6. Operational modules shall load lazily with bounded, filtered, paginated, scope-checked contracts. Only the active module shall load after shell startup.
7. Recommended acceptance targets are shell visible within 2 seconds, warm p95 success within 5 seconds, cold p95 within 8 seconds, slow-state feedback at 8 seconds, and no routine success over 10 seconds under the approved fixture. Any replacement requires owner-approved measurement criteria.
8. The existing full-bootstrap contract shall remain as a temporary rollback/compatibility path until all consumers, staging acceptance, and rollback evidence permit explicit retirement.

### 13.4 Identity, roles, committees, and capabilities

1. V1 shall have exactly three permanent committees: **Food Committee**, **Inventory and Pantry Committee**, and **Materials Committee**, subject to approval of canonical display names and immutable IDs.
2. Venue & Equipment work shall route through an approved, configurable existing committee, designated administrative owner, inventory/materials owner, or responsible office. It shall not create a fourth permanent committee without a future specification amendment.
3. Canonical role IDs and display names shall be approved for Requester, Staff, Committee Head, Director, and Administrator. Legacy strings shall map explicitly or quarantine; unknown values shall never auto-grant.
4. Visibility scope and action capability shall be separate. Director oversight, committee-head visibility, and Administrator status shall not inherently grant release, reversal, destructive, cross-committee, or permission-administration actions.
5. A person may hold multiple explicit active committee memberships if Owner Decision 5 approves it. Each operation shall name and validate its committee/resource scope.
6. Temporary event assignments shall not become permanent authorization groups by implication.
7. The server shall return only safe capability and scope projections. The client shall use them for presentation while the server remains authoritative.

### 13.5 Private roster synchronization

1. The source identifier and contents of the approved roster shall remain private and outside git, fixtures, logs, screenshots, issues, generated assets, and client DTOs.
2. The repository may contain only the Script Property key name, minimum schema, validation logic, redacted setup instructions, and safe health/failure behavior.
3. Access shall require an exact normalized identifier match, active state, approved role and committee membership, and explicit server capability.
4. Ordinary startup shall not read the external source roster. An admin-triggered or scheduled sync shall build a validated, revisioned local access snapshot/index using a lock and audit.
5. A partial, invalid, ambiguous, duplicate, inaccessible, or failed source revision shall not activate. New/changed grants shall fail closed. Last-known-good use, maximum staleness, emergency revocation, cadence, and retention require owner approval.
6. Only safe freshness/health metadata shall be exposed to authorized administrators.

### 13.6 Committee Main Hub

1. One Main Hub shall adapt to the user’s active approved committee and capabilities; separate duplicated applications shall not be created.
2. Its scoped projections shall include new and awaiting-review work, due/overdue work, blockers, missing evidence, escalations, upcoming needs, assigned staff workload, bounded recent updates, bounded completed work, and safe quick links.
3. Counts and detail filters shall derive from the same authoritative query rules and reconcile exactly.
4. Deadline calculations shall use the approved institutional timezone and status exclusions.
5. Recent activity shall be a safe projection of immutable history/audit, not a second editable log.
6. Inventory and Pantry shall integrate current inventory, pantry/procurement, and Lending Hub behavior without weakening ledger, reservation, release, receipt, and evidence controls.
7. Food and Materials specialization shall add only owner-approved controlled fields, routing, deadlines, evidence, and completion rules.

### 13.7 Composite Event Logistics requests

1. Food, Materials, and Venue & Equipment sections shall each be optional. The system shall support all seven non-empty combinations and reject an all-blank request.
2. One accepted submission shall create one parent and exactly one independently actionable child for each non-empty valid section. Blank sections shall create no child.
3. Parent and children shall use server-generated stable IDs and a distinct approved relationship model. Existing fields with other meanings shall not be silently overloaded.
4. Creation shall be atomic, locked where necessary, and idempotent. Retry or ambiguous timeout shall not create duplicate parent/children; a failure shall not leave an orphan hierarchy.
5. Before submit, the requester shall see one combined review that mirrors the records to be persisted. Validation shall identify each invalid section, return focus to it, and preserve entered draft values.
6. Exact duplicates may consolidate only under an approved deterministic rule. Ambiguous specifications, units, or substitutions shall require user confirmation or authorized review.
7. Children shall have independent assignment, review, execution, evidence, rejection, cancellation, reopen, amendment, and completion behavior.
8. Parent status shall be derived from all active children and shall retain attention flags for mixed rejection, block, overdue, missing evidence, or partial cancellation. One completed child shall never complete a parent that has other nonterminal children.
9. Rejection shall preserve safe reason/history and leave unaffected children operational under Owner Decision 10.
10. Cancellation after committed activity shall preserve the activity and use approved reversal/adjustment where required. Partial cancellation shall remain visible in the parent summary.
11. Added sections and amendments shall create audited versioned changes; they shall not overwrite submitted child history.

### 13.8 Venue, facility, equipment, and routing references

1. Venue/facility, equipment/logistics, aliases, categories, units, lifecycle, requestability, lead time, responsible office, authority, routing, and instructions shall be controlled versioned reference data with stable IDs.
2. Prompt examples shall not become source-of-truth records without responsible-owner approval.
3. Request UI shall provide responsive searchable/grouped venue selection and predictive equipment search/add, followed by quantity/unit and an editable selected-item summary.
4. “Other — specify” shall be supported as a visibly unclassified item routed for review; it shall not bypass controlled routing.
5. The UI shall say requestable/not requestable unless a trusted scheduling/stock source makes confirmed availability possible.
6. Submitted children shall preserve the relevant reference ID, revision, and historical snapshot fields so later reference edits do not rewrite request meaning.
7. References shall archive/restore rather than destructively delete when used.

### 13.9 Administrative reference management

1. Only explicitly authorized administrators shall access the reference-data workspace.
2. It shall cover approved organization structure, people/membership projections, committees, venues, equipment, aliases, lifecycle, routing, availability/requestability, instructions, permissions, and roster sync health without exposing a raw spreadsheet editor.
3. Inputs shall use fixed enums, constrained comboboxes/autocomplete, dates, and numeric controls; free text shall be limited to fields that genuinely require it.
4. Every consequential change shall be server-authorized, validated, idempotent, revision-checked, locked where racing, historically recorded, and audited.
5. The UI shall preview changes/consequences, warn about dependencies, explain conflicts, and confirm archive, routing, permission, and other high-impact actions.
6. Roster-owned fields shall be visibly read-only. Self-escalation and destructive cascades shall be denied.
7. Effective dating and a second-review policy shall apply where owners approve them.

### 13.10 Restock action safety

1. Any current restock control that only mutates browser state shall be removed or disabled in live mode immediately when implementation is authorized.
2. The primary queue action shall open a detail/review surface showing prerequisites, quantities, quotes/evidence as permitted, status history, disabled-action explanations, and server-returned allowed actions.
3. A consequential action shall require an explicit summary confirmation and a server endpoint that enforces identity, capability/scope, current state, prerequisites, idempotency, replay handling, locking, revision, history, and audit.
4. Completion shall not be a row-level one-click operation. No UI success shall appear without a durable server result.
5. If owners do not approve a durable restock entity/workflow, V1 shall keep the queue read-only.

### 13.11 Near-live update behavior

1. Recommended default polling is every 15 seconds for the currently visible active module, subject to an owner-approved 10–15 second value and load evidence.
2. Only one revision request may be active per session. Polling shall pause or back off while hidden, offline, unfocused/inactive according to policy, or after failures.
3. An unchanged revision shall not fetch module data. A changed revision shall refresh only the active scoped module, not the full bootstrap.
4. Local successful mutation shall refresh the affected module without resubmitting the write.
5. Dirty form data shall not be silently overwritten. The UI shall show last update, stale status, manual refresh, and retry/error behavior.
6. Revision checks shall be cheap, scoped, observable, jittered/backed off as appropriate, and remotely disableable. Concurrency and Apps Script quota headroom shall be measured before release.

### 13.12 Security, privacy, and evidence

1. DTOs shall be explicit allowlists by endpoint/role/scope. Full-sheet objects shall not be sent and then hidden in the browser.
2. Request-only and lending-only/session-specific bootstraps shall remain sanitized. Internal access shall not automatically expose full requester/borrower contact, student IDs, supplier TINs, Drive links, evidence, ledger, status history, or audit.
3. Logs and error messages shall use safe codes, stage names, timings, opaque record/correlation IDs, and counts; they shall not contain secret properties or private field values.
4. Uploaded evidence shall use approved folders, least privilege, file/type/size controls, retention, failure handling, and safe link projections. No public sharing shall be introduced by default.
5. Authorization/cache/session behavior shall fail closed where authority cannot be established. Cached data shall not be the sole basis for permission.
6. Security/privacy acceptance shall include direct endpoint denial, field-level DTO tests, revocation/staleness, cross-committee access, replay/concurrency, and browser network/storage inspection.

### 13.13 Accessibility, responsive behavior, and training

1. Composite sections shall use an accessible responsive stepper/tabs pattern with section status, keyboard navigation, error summary/focus transfer, preserved input, and combined review.
2. Wide queues shall become usable mobile cards or responsive tables; primary controls shall meet approved touch-target and zoom requirements.
3. Semantic landmarks/headings, skip link, visible focus, modal focus containment/restoration, live regions, forced colors, reduced motion, and non-color status cues shall be preserved.
4. Automated results shall be supplemented by manual keyboard, screen-reader smoke, zoom, and real/representative mobile tests before any conformance claim.
5. Role-specific training shall explain authority vs visibility, requestability vs booking, refresh vs submit, amendment/cancellation, immutable ledger correction, stale roster, conflict, evidence failure, and escalation/rollback.

### 13.14 Migration, rollout, and recovery

1. Each accepted capability shall ship as a bounded vertical slice with an explicit non-goal list, dependency gate, migration, rollback, tests, acceptance criteria, and evidence.
2. Migrations shall add versioned structures, preserve source IDs/labels/locations, quarantine ambiguous values, and reconcile counts/IDs/totals/hashes. Historical records shall not be reinterpreted without an approved mapping.
3. Feature flags or contract versioning shall permit safe fallback; rollback shall preserve records created under the new feature and keep them operable/readable.
4. Staging shall use only authorized synthetic/redacted fixtures and named role testers. It shall prove privacy, authorization, performance, concurrency/idempotency, accessibility, multi-session updates, migration/reconciliation, backup/recovery, and code rollback.
5. Production promotion shall require a signed go/no-go, exact accepted commit/deployment/version/hash, configuration comparison without secret values, approved backup, safe smoke/monitoring, support owner, and rehearsed rollback.
6. P0/P1 issues block production. Residual risks require an owner, date, workaround, and written disposition.

### 13.15 Hosting and database boundaries

1. Apps Script stabilization is the V1 default. A hosted frontend is not part of V1 unless Owner Decision 15 explicitly changes scope after an ADR and threat model.
2. A later hosted frontend shall use an institution-approved identity and secure server boundary with server authorization, sessions/tokens, CORS, CSRF/replay/idempotency, CSP, environment/secret separation, diagnostics, deploy/rollback, and data continuity. Static hosting alone shall not be treated as authentication or backend security.
3. Future PostgreSQL/Supabase work is specification-only until separately accepted. It shall preserve append-only ledger/audit/history, reversal/adjustment, idempotency, optimistic concurrency, outbox/retry/dead-letter, reporting projections, backup/restore, reconciliation, and a tested rollback/data-continuity path.
4. No hosted site, OAuth identity configuration, DNS, database, production export, dual-write, or external project shall be created under this amendment’s planning approval.

### 13.16 Out of scope until separately approved

- a fourth permanent committee;
- real-time confirmed venue booking without an authoritative schedule source;
- direct editing of the private roster from this system;
- payment/accounting replacement, vendor master redesign, or arbitrary historical cleanup;
- destructive ledger/history/audit edits;
- production migration of the frontend or transactional database;
- public evidence links or storage-policy assumptions;
- automatic historical composite backfill; and
- any feature, deployment, merge, release, or external write not covered by one explicitly accepted roadmap slice.

### 13.17 Amendment acceptance record

This amendment becomes effective only when the following are recorded without secrets or unnecessary personal data:

- product owner approval and accepted V1 slice list;
- data owner approval of schema, migration, privacy fields, retention, and recovery;
- security/identity owner approval of roles, capabilities, roster policy, and any hosted-auth model;
- committee/operations owner approval of workflows, routing, statuses, deadlines, evidence, and training;
- accessibility acceptance owner and manual test commitment;
- deployment owner approval of staging/production gates and rollback; and
- resolution or explicit deferral of every dependent decision in Section 12.

# Section 14 — Improved implementation prompt for the first safe slice

The following prompt is intentionally limited to P0 startup diagnosis, observability, and recovery. It does not authorize implementation by itself; the manager must first accept the slice and confirm the starting checkpoint.

```text
# Manager task: P0 Production Bootstrap Diagnosis and Recovery

Role: You are the sole Codex implementer for one bounded milestone in the HAU-USC Logistics Management System repository.

Repository: D:\Documents\DOL Website GitHub

Expected checkpoint to reconfirm with the manager before starting:
- branch: feat/live-sync-lending-search-catalog-controls
- commit: 5a3b1248569b9a5f9148b95bcd4d2bc829639c9f
- upstream: origin/feat/live-sync-lending-search-catalog-controls

The checkpoint above describes the planning audit on 2026-07-13; it is not permission to start from a changed head. If the manager has reviewed a later commit, use only the exact replacement branch/SHA they provide and record it.

## Mandatory handshake

Before editing, read AGENTS.md, README.md, PROJECT_STATUS.md, docs/WORK_CONTINUATION.md, docs/AI_COLLABORATION.md, docs/ARCHITECTURE.md, docs/DOMAIN_RULES.md, docs/SECURITY_AND_ACCESS.md, docs/LAUNCH_RUNBOOK.md, and this accepted task packet.

Report repository root, branch, HEAD, upstream, and `git status --short`. Fetch `origin --prune`. Compare `HEAD...@{upstream}`. Pull with `--ff-only` only if the tree is clean and only behind. Stop if dirty, divergent, detached, on another branch, missing upstream, or not at the manager-approved checkpoint. Do not reset, discard, stash, switch, or overwrite work automatically.

Confirm that the current branch commit has been reviewed as the starting point. The audit found no PR or GitHub Actions runs for `5a3b124...`; draft PR #2 covered the older `81efe826...` commit. Stop and report if manager review of the actual start SHA is missing.

## Objective

Make the startup pipeline diagnosable and guarantee that every startup outcome clears the blocking overlay into either usable content or an actionable, accessible error/Retry state. Establish safe stage timing and realistic contract/failure tests. Do not split the bootstrap payload or implement any feature in this slice.

The reported symptom is a browser that remains stuck on “Connecting to inventory records…” after refresh. Treat it as P0. Do not claim it affects the current production deployment until the manager privately identifies the affected URL/deployment/version and source artifact.

## Current evidence to preserve and verify

Static audit found:

1. `src/services/apps-script-adapter.js` already registers success and failure callbacks and applies a default 30-second timeout. Verify it; do not describe the defect as a missing failure handler unless runtime evidence proves a deployed mismatch.
2. `apps-script/Validation.gs` already converts Dates to ISO strings, non-finite numbers to null, and removes unsupported values recursively. Verify realistic bootstrap JSON safety; do not claim Date serialization is the root cause without evidence.
3. In `src/visual/runtime.js`, only the awaited bootstrap call is inside the startup try/catch. Normalization, static options, extension creation/installation, event/uploader binding, full first render, post-render work, and overlay dismissal follow it. A throw in that path can leave the overlay indefinitely. This is a confirmed failure class, not yet proof of the observed deployment’s exact exception.
4. `getBootstrapData_` performs repeated broad reads and returns every operational module. That is a likely performance contributor, but payload splitting/lazy loading belongs to the next milestone.
5. Ordinary bootstrap does not invoke setupDatabase, Drive migration, migration, or health-check work in the audited source. Do not add fixes for those unsupported hypotheses.

## In-scope implementation

1. Define a small explicit startup state/attempt controller with named stages such as request, response validation, normalization, static options, extensions, bindings, first render, post-render, ready. Use an attempt token so a timed-out/older callback cannot overwrite a newer Retry result.
2. Route the complete post-response startup path through one error boundary and one idempotent terminal finalizer. The blocking overlay must leave “loading” on success and every failure. Never swallow the original safe diagnostic stage/code.
3. Add a slow-state message at the accepted threshold (recommended 8 seconds) without starting another call. On failure show plain-language error, Retry, and a safe support code/correlation ID. Retry must be keyboard-accessible, focus-managed, and limited to one active attempt.
4. Preserve the adapter’s explicit success/failure/timeout behavior. Change it only if a focused test demonstrates a gap. If `google.script.run` cannot cancel a late call, ignore obsolete results through the attempt token.
5. Add safe client stage durations and, if necessary, additive server stage durations around bootstrap phases. Diagnostics may contain stage names, elapsed milliseconds, counts/serialized bytes, contract version, opaque correlation ID, and safe error code only. They must never contain emails, names, student IDs, supplier TINs, item/request data, Drive URLs, evidence, configuration values, stack traces with data, or private roster identifiers.
6. Validate the bootstrap envelope before normalization. A malformed or unsupported contract must fail into the same recoverable UI.
7. Add a realistic-volume synthetic bootstrap fixture and targeted failure injection/test seams for the stages above. Keep fixtures entirely synthetic.
8. Ensure ordinary success makes exactly one bootstrap call. Slow state makes no extra call; one Retry starts one new call; double-click/rapid activation does not overlap attempts.
9. Preserve the current endpoint fields and behavior. This slice may add optional safe diagnostics/contract metadata but may not remove fields, change schema, or introduce lazy module endpoints.

## Allowed files

Primary scope:
- src/visual/runtime.js
- src/styles/visual/overlays.css, only for the loading/slow/error/Retry states
- src/services/apps-script-adapter.js, only if a focused failing test requires it
- apps-script/InventoryService.gs and apps-script/Validation.gs, only for safe additive timings/envelope validation
- focused existing or new tests under tests/unit and tests/e2e, especially tests/unit/apps-script-adapter.test.js and tests/e2e/apps-script-packaging.spec.js
- PROJECT_STATUS.md, CHANGELOG.md, docs/WORK_CONTINUATION.md, and a focused contract/incident doc if needed

If the architecture requires a small pure startup helper to make state transitions testable, add it only if the authoritative visual build actually includes it and the packaging test proves that inclusion. Do not edit `src/main.js` as a substitute for the actual current visual runtime.

## Off-limits and non-goals

- no production/staging deploy, `clasp push`, Apps Script execution, Sheet/Drive setup, seeding, migration, external-system write, merge, tag, release, or publish;
- no bootstrap data split, caching redesign, polling change, committee/role/roster/composite/reference/admin/restock feature, schema/tab change, or visual redesign;
- no edit to legacy/HAU-USC_Logistics-Prototype.original.html except through a separately approved visual-baseline change;
- no hand-edit of dist/index.html, HAU-USC_Logistics-Prototype-Shareable.html, apps-script/Index.html, or generated visual fragments;
- no secret, `.clasp.json`, private roster ID/data, institutional credential, personal/student/supplier/evidence data, or real-data screenshot/log/fixture;
- no ledger/history/audit mutation and no pre-rework backup access/write;
- no removal of the existing bootstrap endpoint or change to rollback deployment Version 9;
- no claim that the observed environment is fixed without testing the exact authorized deployment.

## Required tests

Add deterministic tests for:

1. normal realistic and empty bootstrap success;
2. server failure callback;
3. timeout followed by late success;
4. malformed/missing/wrong-version response;
5. JSON-safe Date and unsupported-value normalization contract;
6. throws during normalization, static options, extension creation/installation, event/uploader binding, first render, and post-render;
7. error finalizer itself remaining idempotent;
8. Retry success after failure;
9. rapid/double Retry and duplicate/late callback;
10. safe diagnostics field allowlist and sensitive canary exclusion;
11. exactly one ordinary startup call and at most one active attempt;
12. keyboard focus/live-region behavior for slow/error/Retry; and
13. packaged Apps Script output using the new runtime behavior, with deterministic generated hashes.

Run:
- npm ci
- npm run check
- the focused Vitest tests during iteration
- the relevant Playwright packaging test and the complete six-viewport Playwright suite where Chromium is installed

Do not run `clasp status` or `clasp push --dry-run` unless a staging script is separately configured and the manager explicitly authorizes those read-only checks. State every unrun check honestly.

## Acceptance criteria

All of the following must be evidenced on the implementation commit:

- shell/loading UI is visible within 2 seconds in the agreed local/synthetic measurement;
- every injected stage failure clears the blocking overlay and exposes accessible Retry plus a safe support code;
- successful startup clears the overlay only after the required first usable render succeeds;
- slow state appears at 8 seconds (or the owner-approved value) without a duplicate call;
- warm p95 ≤5 seconds, cold p95 ≤8 seconds, and no routine success >10 seconds are measured where an authorized representative staging environment exists; otherwise label those staging gates unrun, never fabricate them;
- exactly one call on normal startup and one nonoverlapping call per accepted Retry;
- obsolete callbacks cannot replace newer attempt state;
- diagnostics contain no sensitive/private/configuration values;
- current request-only privacy, role behavior, module navigation, overlays, and existing workflows regressions pass;
- no schema, deployment, or external state changed; and
- generated artifacts verify and are not hand-edited.

## Required handoff

Update PROJECT_STATUS.md, CHANGELOG.md, and docs/WORK_CONTINUATION.md with the exact scope, confirmed/ruled-out/unresolved hypotheses, tests and counts, measured environments/sample sizes, unrun staging/performance checks, remaining risks, and rollback behavior.

Report:
- starting and ending branch/SHA;
- scoped changed files and why;
- root-cause evidence separated into confirmed failure class, ruled-out source hypotheses, and environment-dependent unknowns;
- safe timing/payload/call-count table;
- exact commands and test results;
- generated-artifact verification;
- unrun checks and why;
- migration/schema/external-write statement (“none” expected);
- rollback procedure; and
- PR/CI state for the exact commit.

Commit one small logical unit only after all local gates pass. Push the feature branch only if the manager explicitly authorizes it. Never claim commit, push, PR, CI, deployment, or external write without verifying it.

## Stop conditions

Stop and report instead of improvising if:
- repository handshake is unsafe or the exact start commit is not manager-reviewed;
- fixing the accepted objective would require a schema change, endpoint removal, broad bootstrap refactor, production/staging mutation, credential, or private data;
- the only reproducible failure occurs in a different/stale deployment whose source cannot be identified;
- a generated file would need direct editing;
- required behavior conflicts with immutable ledger/privacy/authorization/Drive controls; or
- tests reveal a materially broader root cause that changes scope.

When stopped, preserve the working tree, provide evidence and the smallest next decision, and do not reset or discard work.
```

# Planning appendices

## Appendix A — Instruction, pattern, and impact audit

### Repository instruction compliance

- The root `AGENTS.md` and every required repository document named there were reviewed before this plan was written.
- No `CLAUDE.md` file exists in the audited repository, so there are no additional CLAUDE-specific naming, architecture, or type rules to apply. `AGENTS.md` is authoritative.
- The project is vanilla JavaScript and Apps Script rather than TypeScript. Existing “types” are service contracts, constants, header maps, DTO builders, validators, and fixture assertions; Section 5 identifies the structures to reuse and the few final-name modules that may be created.
- The plan skill’s generic advice against migrations, compatibility paths, feature flags, or rollback conflicts with this task’s explicit safety requirements and the repository’s immutable-data/deployment rules. This plan therefore requires additive migration, versioned compatibility, flags, and rollback where needed. Those mechanisms have named exit gates and shall not become indefinite duplicate implementations.
- No `v2`, `new`, `enhanced`, `temp`, or `simple` filename is proposed. Contract versions are data/API versions, not duplicate filenames.

### Program impact by layer

| Layer | Existing implementation affected | Planned effect | Main dependants to retest |
|---|---|---|---|
| Authoritative visual startup | `src/visual/runtime.js`, visual overlay styles, extraction/packaging | Terminal startup controller, essential contract, active-module loading | All views, bindings, uploaders, overlays, request-only mode, packaging hashes |
| Runtime synchronization | `src/visual/runtime-extensions.js`, `src/app/revision-sync.js` | Scoped revision and active-module refresh | dirty forms, mutation refresh, focus/offline states, catalog sync |
| Browser service boundary | `src/services/apps-script-adapter.js`, launch/legacy contracts | Versioned methods, safe errors/diagnostics, no direct Apps Script calls elsewhere | all remote reads/writes, timeout/idempotency behavior |
| Server bootstrap/read layer | `apps-script/InventoryService.gs`, `SheetRepository.gs`, likely final `BootstrapService.gs` | bounded DTOs, deduplicated/batched reads, stage timing | request-only/internal startup, every module loader, quota behavior |
| Authorization/access | `apps-script/Auth.gs`, `Config.gs`, `src/domain/permissions.js`, likely Committee/Roster services | canonical roles/capabilities/scopes and synced access projection | every endpoint, navigation/action visibility, seeds/migrations |
| Requests/workflows | `RequestService.gs`, domain request/transition modules, likely Composite service | parent/component/assignment/amendment model and derivation | request UI, procurement/release/evidence/history/audit |
| Reference/routing | current config/seed/catalog and hardcoded procurement routing, likely Reference service | stable versioned venue/equipment/routing records | composite sections, committee queues, admin, history snapshots |
| Restock | `RestockService.gs`, runtime queue/detail/actions | durable review/transition or read-only surface | procurement, receipts, inventory ledger, evidence, revision refresh |
| Schema/setup/migration | `Config.gs`, `Setup.gs`, `MigrationService.gs`, validation/check scripts | additive tabs/columns, dry-run/reconciliation, no immutable rewrite | staging setup, rollback, deterministic Apps Script bundle |
| Tests/docs/release | existing unit/integration/e2e and required handoff/runbook docs | contract, failure, role, concurrency, migration, UX and evidence gates | PR/CI review, staging acceptance, production promotion |

### Breaking-change policy

No external or deployed contract is intentionally broken in the first safe slice. Later endpoint/schema changes shall be additive and versioned until all consumers and rollback paths are accepted. A breaking removal requires its own manager-approved cleanup slice, grep/reference proof, final-commit CI, staging evidence, and rollback decision. Historical record meaning is never a “breaking change” target.

## Appendix B — REMOVAL SPECIFICATION

Removal is sequenced because repository policy explicitly requires recoverability. “Remove” means delete the obsolete source behavior and every source reference after its replacement is accepted; generated artifacts are rebuilt, not manually cleaned.

### Slice 1 removal

#### From `src/visual/runtime.js`

- Replace the narrow bootstrap-call-only `try/catch` and unconditional post-response initialization/overlay-dismiss sequence near the current startup block with the accepted terminal startup controller.
  - **Why:** the current boundary does not catch normalization, option, extension, binding, render, or post-render failures.
  - **Replacement:** Section 14’s state/attempt controller and idempotent finalizer.
  - **Dependencies:** runtime extension install/start, all global/view event bindings, uploader setup, first render, request-only mode, and packaging tests.

No complete file is deleted in Slice 1. The adapter’s existing success/failure/timeout handlers and the server JSON-safe normalizer are retained unless a focused failing test justifies a narrow change.

### Later accepted removals

#### From `src/visual/runtime.js`

- Remove the full `renderAll()` invocation from ordinary startup after active-module loaders are accepted in Slice 2; keep only render operations still needed by local preview or explicit compatibility until their own callers migrate.
- Remove full-bootstrap refresh from `acceptAuthoritativeState`/post-mutation paths once every affected module has a bounded refresh contract and tests.
- Remove `updateRestockRequestStatus` and consequential `[data-restock-action]` status-button branches in Slice 11.
  - **Replacement:** server-returned allowed actions and durable restock transition endpoint, or read-only detail if no workflow is approved.
  - **Dependencies:** restock table/detail, line-status projection, toast/commit, audit, receiving/procurement integration.

#### From `src/visual/runtime-extensions.js`

- Remove `refreshAuthoritative` use of `services.loadBootstrapData` for polling and the hardcoded five-second default after Slice 12 scoped revision/module refresh passes.
  - **Replacement:** scoped revision token plus active-module loader at the approved 10–15 second cadence.
  - **Dependencies:** manual refresh, focus/visibility/online handlers, dirty-state banner, post-mutation refresh, catalog-sync tests.

#### From `apps-script/ProcurementService.gs`

- Remove `defaultCommittee_` text/regex routing and every call to it after versioned routing references are active and reconciled in Slice 9.
  - **Replacement:** deterministic effective routing lookup by stable reference/category ID with explicit conflict/no-route behavior.
  - **Dependencies:** deliverable creation, seeds, legacy mapping, committee queues, routing/admin tests.

#### From permission projections

- Remove conflicting role-name fallbacks and browser-inferred action grants from `src/domain/permissions.js` and affected visual code after Slice 3 makes the canonical server capability projection available in Apps Script and synthetic preview modes.
  - **Replacement:** canonical registry and sanitized server capability/scope contract; preview derives from the same shared rules.
  - **Dependencies:** every action/nav/view guard and role fixture.

#### Compatibility endpoint retirement

- Remove the old all-modules bootstrap endpoint/method, its broad DTO builders, compatibility flag, tests, and unused adapter mapping only after all consumers use bounded contracts, rollback Version 9 is no longer an active requirement, staging rollback passes, one accepted release operates stably, and the manager approves a cleanup slice.
- Do not leave an undocumented alias or duplicate server path after retirement.

### Files explicitly not to delete

- `legacy/HAU-USC_Logistics-Prototype.original.html`;
- immutable ledger, status-history, audit, evidence metadata, and migration-map structures;
- source/provenance columns required to interpret legacy records;
- backup/recovery/runbook documentation; and
- the rollback-compatible endpoint before its retirement gate.

### Removal checklist for each applicable slice

- [ ] Replacement is accepted and all dependencies are migrated.
- [ ] Obsolete function/branch/callers/tests/config are removed in the same cleanup slice.
- [ ] `rg` finds no unintended source reference to `updateRestockRequestStatus`, `defaultCommittee_`, old full-bootstrap polling, or retired contract symbols.
- [ ] Generated artifacts are regenerated and deterministic verification passes.
- [ ] No historical data/provenance/rollback evidence was removed.
- [ ] Documentation, diagrams, runbooks, and contract lists no longer direct new callers to the old behavior.
- [ ] Final-commit tests and staging rollback evidence pass before compatibility retirement.

## Appendix C — Anti-patterns to avoid

- Do not patch an unidentified deployment or claim a static-code hypothesis is the observed production root cause.
- Do not wrap startup in a catch that hides the stage/error and leaves partially bound state; one idempotent finalizer shall own terminal UI.
- Do not launch a second startup request merely because the slow timer fired, or allow an obsolete callback to win after Retry.
- Do not return full sheets to the browser and rely on hidden controls or client filtering for privacy/scope.
- Do not put `google.script.run` anywhere except the sole adapter.
- Do not authorize from role labels, UI state, cached client claims, fuzzy roster matches, or committee visibility alone.
- Do not read the private roster source during ordinary startup or expose its identifier/data in diagnostics/evidence.
- Do not use full-bootstrap refresh for polling or after every mutation.
- Do not let a live button mutate only browser state and show success for a consequential action.
- Do not store an independently editable parent status or complete it from one child while others remain open.
- Do not overload an existing relationship field with a new meaning, infer historical classifications silently, or transact `VERIFY` values.
- Do not hardcode prompt examples, personal assignments, committee routing, or “availability” promises as institutional source truth.
- Do not permanently delete referenced catalog/access data or edit immutable ledger/history/audit; archive or compensate with history.
- Do not create parallel `*-v2`, `*-new`, temporary, or enhanced files. Use final names and remove obsolete source at its accepted exit gate.
- Do not hand-edit generated files, weaken fail-closed Drive behavior, or write to the pre-rework backup.
- Do not keep a compatibility path without a documented owner, purpose, telemetry, retirement criteria, and manager-reviewed cleanup slice.
- Do not let a hosted static site call an unrestricted write proxy or treat hosting login as complete backend authorization.
- Do not dual-write Sheets and a future database without a transactional outbox/reconciliation/rollback design and separate approval.

## Appendix D — Validation criteria

### Planning audit completed

- [x] Original brief requirements extracted and mapped 32/32.
- [x] Repository handshake/fetch/upstream comparison completed safely.
- [x] Required AGENTS/repository documents and relevant architecture/domain/test/migration/runbook references reviewed.
- [x] No CLAUDE.md file found; root AGENTS.md rules applied.
- [x] Actual authoritative visual build path, service boundary, server bootstrap, DTO sanitizer, revision polling, restock actions, roles/routing, schema, and tests audited.
- [x] Existing contracts/structures and likely affected/final-name files identified.
- [x] Current branch PR/CI state verified; older PR evidence not attributed to current HEAD.
- [x] Missing full report and paper form recorded rather than invented.
- [x] Current official platform constraints researched from primary sources.
- [x] Every roadmap slice has goal, scope, exclusions, allowed/off-limits areas, dependencies, risks, migration, rollback, tests, acceptance, and evidence.
- [x] Removal specification, anti-patterns, release gates, and first-slice prompt included.

### Before any implementation slice

- [ ] Manager has accepted one bounded slice and exact starting SHA.
- [ ] Handshake is repeated and safe; only one writer is active.
- [ ] All dependent owner decisions and missing artifacts are resolved or explicitly out of scope.
- [ ] Privacy/data owner approves fixture and evidence handling.
- [ ] Final field/status/permission/reference names follow existing conventions and do not use temporary/version suffix filenames.
- [ ] Affected callers, DTOs, generated artifacts, tests, docs, schema, deployment, migration, and rollback have been enumerated.
- [ ] Acceptance measurements define device/network, data volume, concurrency, sample size, environment, and owner.
- [ ] External writes/deployments are separately authorized, or explicitly prohibited for the slice.

### After each implementation slice

- [ ] In-scope behavior and every failure/denial/retry/concurrency path pass focused tests.
- [ ] Existing inventory, procurement, request, lending, release, evidence, ledger, history, audit, privacy, and request-only regressions pass as applicable.
- [ ] `npm run check` and deterministic generated-artifact verification pass; Playwright runs where Chromium is installed.
- [ ] No direct generated-file edit, secret/private data, `.clasp.json`, real evidence, or backup write appears in the diff/evidence.
- [ ] Server authorization, DTO allowlists, idempotency, locks/revisions, history/audit, and fail-closed paths are verified for every write.
- [ ] Migration dry run/reconciliation/restart/rollback pass where schema/data changes exist; otherwise “no migration” is recorded.
- [ ] Applicable removal checklist passes and no unintended dead/duplicate source remains.
- [ ] Performance/payload/read/concurrency metrics meet the accepted environment-specific targets.
- [ ] Browser/mobile/manual accessibility gates pass in proportion to the slice; every skip/unrun check is recorded.
- [ ] Required status/changelog/continuation/runbook documents match the exact implementation and remaining risks.
- [ ] Commit, push, PR, CI, staging, deployment, and external writes are reported only after direct verification.

### Before compatibility or legacy-path removal

- [ ] All consumers and supported rollback artifacts have migrated.
- [ ] One accepted stable release and the owner-defined observation period have completed.
- [ ] Staging cleanup and rollback rehearsal pass on the exact removal commit.
- [ ] Source grep, build, package, tests, docs, and incident runbook contain no accidental old dependency.
- [ ] Data owners confirm historical interpretation/provenance remain intact.
- [ ] Manager explicitly accepts the cleanup milestone.

## Appendix E — Final audit recommendations before implementation

1. Obtain the authoritative full project report and paper form image, record their owner/version/date, and reconcile every field/layout/routing instruction against Sections 4–8. Until then, reference-field and workflow details remain provisional.
2. Privately identify the exact environment showing the P0 and compare its deployed artifact/version to the repository before approving any deployment.
3. Have the manager review current commit `5a3b1248569b9a5f9148b95bcd4d2bc829639c9f`; it has no current-branch PR/CI evidence.
4. Accept and run only Slice 1 first. Review its pushed evidence before authorizing Slice 2 or any product feature.
5. Before Slices 3–4, perform a dedicated privacy/authorization review of every server endpoint and DTO field, not only navigation behavior.
6. Before Slice 6, run a domain workshop on parent/child relationships, mixed rejection, cancellation after activity, additions/amendments, and history; these choices determine schema and cannot be safely inferred.
7. Before Slices 9–10, obtain institutionally approved reference/routing owners and seed source; do not use prompt examples as records.
