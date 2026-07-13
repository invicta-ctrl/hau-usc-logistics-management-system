# Codex Full-Stack Execution Plan

---
plan_version: 1
status: active
last_reviewed: 2026-07-13
owner: Codex implementer, with user approval at external-write gates
repository: invicta-ctrl/hau-usc-logistics-management-system
---

## 1. Mission

Build a maintainable full-stack evolution of the HAU-USC Logistics Management
System without breaking the existing V1 pilot, without adding technology for
appearance, and without requiring paid infrastructure until the system has a
verified need for it.

The final result must provide:

- a tested responsive web frontend;
- a backend-neutral service contract;
- server-enforced authentication, authorization, validation, idempotency,
  locking or transactional protection, revisions, auditability, and safe
  errors;
- a relational PostgreSQL target with versioned migrations;
- controlled file storage and evidence access;
- reproducible CI, deployment, backup, restore, and rollback procedures;
- a free sandbox path using fictional or sanitized data;
- an explicit decision about whether real institutional operations remain on
  Apps Script/Sheets/Drive or move to an approved paid/managed platform.

The plan is complete only when every phase has passed its exit gate and the
remaining limitations are documented. A passing build alone is not completion.

## 2. Authority and safety contract

Codex must apply this authority order:

1. The user's current explicit instruction.
2. `AGENTS.md` and project security/launch instructions.
3. The current project source, tests, schemas, and status documents.
4. This execution plan.
5. The shared Context Vault governance.
6. Historical handoffs and summaries.

The project repository is authoritative for technical facts. The Context Vault
provides reusable governance, not current runtime state.

### Mandatory boundaries

- Only one writer may modify a repository at a time.
- Never use `git reset --hard`, `git checkout --`, force-push, or destructive
  cleanup to resolve uncertainty.
- Never edit generated `dist/`, shareable, or Apps Script bundle artifacts by
  hand. Regenerate them with the repository build commands.
- Never expose service-role keys, secrets, private Drive links, student IDs,
  supplier TINs, borrower histories, or raw evidence files.
- Never treat UI hiding as authorization.
- Never grant public/requester clients ledgers, exact balances, internal users,
  supplier internals, audit data, or administrative controls.
- Never dual-write Sheets and PostgreSQL as independent transactional sources
  of truth.
- Never run Apps Script push, deployment, migration application, access
  seeding, Drive/Sheet operational writes, production smoke tests, PR merge, or
  destructive data work without a separate explicit approval in the task.
- A free hosted plan is not automatically production-grade. If backups,
  privacy ownership, or availability are insufficient, stop and keep real
  operations on the current approved system.

## 3. Codex execution protocol

Every milestone is a bounded task. Codex must not start the next milestone
until the previous milestone's exit gate is recorded.

### Start-of-milestone handshake

From the repository root, report:

```powershell
git status --short --branch
git branch --show-current
git rev-parse HEAD
git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}'
git fetch origin --prune
git rev-list --left-right --count HEAD...@{upstream}
```

If the tree is dirty, divergent, on the wrong branch, missing the expected
starting commit, or missing an upstream when synchronization is required,
stop and report it. Do not discard work.

### Routing preflight

Use the project router for implementation work:

```powershell
.\scripts\codex-route.ps1 -Instruction "<bounded milestone>" -Assess
Get-Content .codex\runtime\current-task-brief.md
Get-Content .codex\runtime\current-route.json
```

Use `-Execute` only after the brief and route are inspected. Rough or partial
instructions must be refined. Complete prompts and precise named-file commands
must remain proportional. Use `-AllowDirty` only for assessment/refinement;
execution must run from a clean tree.

The launcher is authoritative for refinement, allowlisted models, reasoning
effort, sandbox selection, verification profiles, and safe stops. Hooks are
best-effort guardrails and do not replace the launcher.

### Required milestone handoff

Each completed milestone must record:

```text
Milestone:
Branch:
Starting commit:
Ending commit:
Files changed:
Behavior completed:
Tests and exact results:
Build/artifact result:
Security/privacy result:
External actions performed:
External actions not performed:
Known limitations:
Exit gate:
Recommended next milestone:
```

Commit only the milestone's intended files. Push only when the current task
explicitly authorizes pushing. Never claim a remote update without verifying
the remote commit.

## 4. Scope and non-goals

### In scope

- Vite/vanilla frontend preservation and backend adapter evolution;
- stable API/service contracts;
- PostgreSQL schema and migration design;
- Supabase sandbox evaluation and implementation using fictional data;
- authentication, RLS, requester isolation, evidence handling, and audit;
- Cloudflare Pages static hosting and GitHub Actions automation;
- reconciliation from Sheets to relational storage;
- tests, accessibility, performance, backup, restore, deployment, rollback,
  training, and canonical documentation.

### Explicit non-goals unless separately approved

- rewriting the frontend in React, Vue, Angular, Next.js, or another framework;
- creating native Android or iOS applications;
- deploying to Apps Script or production;
- applying a production migration;
- creating or changing real Google Sheets/Drive data;
- processing real student or supplier evidence in a free sandbox;
- adding Docker, Kubernetes, Kafka, RabbitMQ, Redis, or microservices without
  measured need;
- adding paid domains, paid email, paid observability, or paid hosting before
  a documented decision gate.

## 5. Target architecture and technology decisions

### Operational transition

The existing Apps Script/Sheets/Drive system remains the real V1 operational
system until a separately approved cutover. The browser already has mock,
Apps Script, and HTTP adapter boundaries; preserve those boundaries.

The future free sandbox is:

```text
Existing Vite/vanilla browser
        |
        +--> Cloudflare Pages static hosting
        +--> Supabase Auth for staff identity
        +--> Supabase Edge Functions / database functions for commands
                    |
                    +--> PostgreSQL with RLS, constraints, transactions
                    +--> Supabase Storage for sanitized demo files

Institutional Google Drive remains the controlled evidence store for real V1.
GitHub Actions runs tests, builds, migration checks, and deployment checks.
```

### Decision matrix

| Area | Decision | Reason | Revisit when |
|---|---|---|---|
| Frontend | Keep current Vite/vanilla JS and visual modules | Lowest migration risk; existing tests and adapters already work | Proven accessibility or feature limits require a change |
| Static hosting | Cloudflare Pages | Free static delivery and preview-friendly deployment | Domain, privacy, or institutional hosting requires another host |
| Database | Supabase PostgreSQL for sanitized sandbox | Matches the documented relational target and keeps auth/storage together | Free limits, privacy review, or availability requirements fail |
| API | Existing adapter contract; Edge Functions/RPC for hosted commands | Keeps Apps Script and hosted backends swappable | Measured workload requires a dedicated API service |
| Auth | Google OAuth for staff; scoped expiring requester tokens | Matches institutional identity and preserves requester isolation | Institution mandates another identity provider |
| Evidence | Drive for real operations; Supabase Storage for sanitized demo data | Keeps sensitive files under existing institutional control | Approved managed object storage and backup plan exist |
| CI/CD | GitHub Actions plus npm and Supabase CLI checks | Existing repository tooling; no new paid build system | Repository policy or private-runner limits require change |
| Mobile | Responsive web/PWA later | Avoids native-app maintenance until a real device/offline need exists | Offline scanning, push, or device integration is proven necessary |

Current free-plan constraints must be treated as design inputs, not footnotes:

- Supabase Free currently includes 500 MB database storage, 1 GB file storage,
  50,000 monthly active users, 500,000 Edge Function invocations, and two
  active projects, but free projects pause after one week of inactivity and
  do not include automatic database backups. See the [Supabase pricing](https://supabase.com/pricing)
  and [backup documentation](https://supabase.com/docs/guides/platform/backups).
- Cloudflare static asset requests are free; Pages Functions count toward the
  Workers Free plan, currently 100,000 requests per day and 10 ms CPU per
  invocation. See [Pages pricing](https://developers.cloudflare.com/pages/functions/pricing/)
  and [Workers limits](https://developers.cloudflare.com/workers/platform/limits/).
- Apps Script has execution, concurrency, and daily service quotas that vary by
  account type and may change. See Google's [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas).
- GitHub-hosted Actions runners are free for public repositories; private
  repositories consume the account's included quota. See [GitHub Actions billing](https://docs.github.com/en/actions/concepts/billing-and-usage).

## 6. Phase roadmap and exit gates

### Phase 0 — Baseline and governance

**Objective:** establish a verified starting point and prevent accidental
scope expansion.

Tasks:

- confirm current branch, remote, commit, status, and launch blockers;
- read `AGENTS.md`, `PROJECT_STATUS.md`, `docs/WORK_CONTINUATION.md`,
  architecture, security, domain, testing, migration, and launch documents;
- verify routing policy with `npm run codex:validate`;
- record the current Apps Script/Sheets/Drive operational boundary;
- confirm no production, migration, access-seeding, or Drive/Sheet write is
  authorized;
- register this plan as the current full-stack execution plan.

Exit gate:

- clean starting state recorded;
- current product behavior and generated-file rules understood;
- no unresolved authority conflict;
- exact next milestone selected.

### Phase 1 — Canonical documentation and contracts

**Objective:** make the system understandable before adding infrastructure.

Use existing canonical files where possible. Avoid duplicate documents. Update
or consolidate toward:

- `README.md` as the map;
- `docs/ARCHITECTURE.md` for current and future containers;
- `docs/API_AND_SERVICE_CONTRACTS.md` for every callable operation;
- `docs/DATA_DICTIONARY.md` for Sheets and future relational fields;
- `docs/SECURITY_AND_ACCESS.md` for identity, roles, privacy, and redaction;
- `docs/BACKUP_AND_RECOVERY.md` for current and future recovery;
- `docs/FUTURE_HOSTING_AND_DATABASE.md` for options and decision gates;
- `docs/WORK_CONTINUATION.md` for verified milestones.

For each service operation document purpose, caller, permission, input/output
schema, mutation, lock/transaction rule, idempotency key, revision behavior,
audit event, stable errors, and tests.

Exit gate:

- no operation has an undocumented authorization boundary;
- no future component is described as live;
- README links to every canonical full-stack document;
- a new maintainer can identify the next safe command.

### Phase 2 — Backend-neutral service contract

**Objective:** make the UI independent of Apps Script versus PostgreSQL.

Tasks:

- preserve `src/services/launch-service-contract.js` as the required client
  surface;
- define versioned request/response schemas for the existing `api_*` methods;
- standardize `correlationId`, `clientRequestId`, `idempotencyKey`, and
  expected revision fields;
- standardize safe error codes and retryability;
- add contract fixtures shared by mock, Apps Script, and HTTP adapters;
- add `backendMode=rest` only behind configuration and fictional tests;
- keep requester DTOs separate from staff/admin DTOs;
- never let a browser call Sheets or Drive directly.

Exit gate:

- mock and Apps Script adapters pass the same contract tests;
- HTTP adapter has a tested boundary without requiring a live hosted service;
- public bootstrap contains no internal balances, audit, user, supplier, or
  borrower data;
- generated artifacts still pass the existing checks.

### Phase 3 — Relational schema and migration foundation

**Objective:** create a PostgreSQL model that preserves existing business rules.

Create migrations for these logical areas:

1. `schema_versions`, configuration, and environments;
2. `users`, `roles`, `user_roles`, and capabilities;
3. `event_series` and `events`;
4. `items` and `item_aliases`;
5. `requests` and `request_lines`;
6. `reservations`;
7. immutable `ledger_transactions`;
8. `lending_tickets`;
9. `releases` and `release_lines`;
10. `restock_receipts`;
11. `deliverables` and `deliverable_receipts`;
12. `suppliers` and `canvass_references`;
13. `evidence` metadata;
14. `status_history` and `audit_logs`;
15. `idempotency_records`, `outbox_events`, and `migration_mappings`.

Rules:

- use UUID primary keys plus stable human-readable display IDs;
- use foreign keys, unique constraints, positive-quantity checks, status
  checks, and date/timestamp rules;
- derive availability from ledger movements and active reservations;
- never update or delete posted ledger entries;
- store evidence metadata and hashes, not raw evidence bytes in PostgreSQL;
- index active reservations, ledger item/time, request lines, due lending,
  evidence entity/digest, audit correlation, and idempotency scope/key;
- use migration files in Git; do not make untracked remote schema edits.

Exit gate:

- local database reset succeeds from zero;
- migration tests cover constraints and rollback expectations;
- every current Sheet/table has a mapping and sensitivity classification;
- ledger, idempotency, audit, and requester isolation tests pass.

### Phase 4 — Free Supabase sandbox

**Objective:** prove the future backend with fictional or sanitized data.

Tasks:

- create a separate sandbox project, never the operational project;
- configure environment variables and secrets outside Git;
- apply migrations through the reviewed CLI/CI path;
- seed only fictional or explicitly sanitized records;
- enable RLS on every exposed table;
- create staff, requester, auditor, and admin policy tests;
- keep service-role keys server-side;
- add health and migration-version checks;
- measure database, file, API, and function usage;
- document the free-plan pause and backup limitations.

Exit gate:

- the sandbox can be deleted and recreated from Git;
- all RLS tests pass for allow and deny cases;
- no real institutional record or evidence file exists in the sandbox;
- free-plan limits are visible to the maintainer;
- a manual export and restore has been demonstrated.

### Phase 5 — Identity and security hardening

**Objective:** make authorization server-enforced before workflow expansion.

Staff authentication:

- Google OAuth through Supabase Auth;
- allow only approved institutional domains and active access records;
- map identity to role/capabilities in PostgreSQL;
- reject inactive, unknown, or unapproved users;
- log login, authorization failure, and privileged actions safely.

Requester access:

- preserve request-only sanitized bootstrap;
- use opaque, expiring, non-enumerable tokens when a requester needs to
  retrieve a scoped record;
- store only a token hash and expiry server-side;
- never use student ID alone as authorization;
- never expose exact inventory, supplier TIN, borrower history, audit, or
  internal user data.

Files:

- validate MIME, extension, size, checksum, and relationship;
- generate safe filenames and keep original names as protected metadata;
- use private buckets/folders and signed access where applicable;
- quarantine rejected files;
- log upload, access, replacement, and deletion decisions.

Exit gate:

- all protected commands fail closed;
- requester cross-record access tests fail as expected;
- service-role secrets are absent from browser bundles;
- security review finds no public path to operational data.

### Phase 6 — First hosted vertical slice

**Objective:** implement the smallest end-to-end hosted workflow.

Implement only:

```text
Request Center
  → submit request and request lines
  → staff review
  → full/partial/procurement decision
  → reservation or controlled ledger action
  → status history and audit event
  → requester-safe response
```

Required behavior:

- every mutation is validated server-side;
- every retry is protected by idempotency;
- every concurrent decision uses a transaction/lock or revision check;
- stock is never reduced at requester submission;
- partial fulfillment creates explicit line-level outcomes;
- errors return stable codes and correlation IDs;
- frontend remains compatible with mock and Apps Script modes.

Exit gate:

- unit, contract, integration, browser, RLS, and negative-authorization tests
  pass;
- a clean sandbox can reproduce the slice from migrations and seed data;
- no public endpoint exposes internal records;
- a rollback to mock or Apps Script mode remains possible.

### Phase 7 — Expand workflows in dependency order

Do not implement every module in parallel. Use this order:

1. inventory search, item aliases, and availability projection;
2. lending ticket, approval, handoff, return, overdue, and exceptions;
3. release desk and recipient confirmation;
4. restock receipt and ledger posting;
5. event deliverables and cumulative receipt/release;
6. suppliers, canvass, preferred quote, and price history;
7. evidence upload and controlled access;
8. admin configuration, content, reports, exports, and health checks.

Every workflow must add its own contract fixtures, authorization matrix,
idempotency tests, audit assertions, browser acceptance, and rollback note.

### Phase 8 — Static hosting and CI/CD

**Objective:** make delivery repeatable without paid infrastructure.

Tasks:

- deploy the existing Vite output to Cloudflare Pages;
- configure preview builds for branches and protected production builds;
- keep runtime configuration environment-specific;
- add GitHub Actions jobs for lint, unit, contract, migration reset, build,
  artifact verification, and browser tests;
- add a migration-check job that never targets production automatically;
- preserve generated-file parity checks;
- retain concise failure diagnostics without secrets;
- require review before a deployment environment is changed.

Exit gate:

- a clean commit produces the same verified artifacts;
- preview deployment contains only sandbox data;
- CI blocks failed migrations, contract drift, lint, tests, or artifact checks;
- secrets are configured through environment settings, not committed files.

### Phase 9 — Sheets-to-PostgreSQL reconciliation

**Objective:** prove data fidelity without unsafe dual-write.

Tasks:

- freeze a timestamped Sheets baseline;
- export only approved fields through a reviewed tool;
- preserve legacy sheet, row, block, exact name, quantity, and unit;
- map each imported record to a stable relational ID;
- flag duplicates, VERIFY items, date anomalies, and missing units;
- compare item counts, ledger totals, reservations, requests, lending, and
  evidence metadata;
- perform a read-only reconciliation report;
- obtain DOL owner sign-off before any operational cutover.

Exit gate:

- reconciliation differences are zero or explicitly accepted;
- all VERIFY records remain blocked from unsafe transactions;
- backup and rollback references are recorded;
- no production Sheet/Drive mutation occurred during dry-run work.

### Phase 10 — Pilot and operations

**Objective:** validate maintainability with actual operators before scale.

Tasks:

- train requester, staff, committee head, director, auditor, and admin roles;
- record common support procedures;
- run controlled acceptance scenarios for every workflow;
- test slow network, duplicate clicks, timeout, retry, expired token, denied
  access, missing evidence, quota error, and partial failure;
- review audit/status/error records;
- perform a restore drill;
- measure response time, errors, storage, database size, and free-plan usage;
- review accessibility at 320, 390, 768, 1024, 1366, and 1440 px;
- record unresolved limitations and operator workarounds.

Exit gate:

- operators can complete core workflows without developer intervention;
- recovery and rollback have been rehearsed;
- no critical privacy, authorization, integrity, or data-loss finding remains;
- the free sandbox is either accepted as demo/training-only or rejected for a
  documented reason.

### Phase 11 — Production decision and controlled cutover

This phase requires explicit user and institutional authorization. Codex must
stop before any production action unless that authorization is present.

Choose one:

**Remain on Apps Script/Sheets/Drive:**

- keep the current system as the real operational source;
- continue quota monitoring, backups, reconciliation, and controlled staging;
- use the hosted PostgreSQL system only for development/training if useful.

**Move to hosted PostgreSQL:**

- approve the provider, data-processing responsibility, retention, and access;
- obtain a backup/PITR plan stronger than the Free plan;
- freeze the source system;
- import and reconcile one final baseline;
- deploy the approved version;
- run read-only diagnostics first;
- run a bounded operational smoke test;
- monitor and keep the prior system as rollback reference;
- record deployment version, commit, owner, timestamp, result, and rollback.

No production cutover is complete without an explicit rollback reference.

## 7. Testing and verification matrix

Every milestone must run the smallest relevant checks and the full suite before
its exit gate.

### Local repository checks

```powershell
npm run codex:validate
npm run lint
npm test
npm run build
npm run check:apps-script
npm run verify:dist
npm run check
npm run test:e2e
```

### Hosted-backend checks

- migration reset from an empty database;
- schema constraint and foreign-key tests;
- RLS allow/deny matrix;
- contract tests against mock and hosted adapters;
- idempotent retry tests;
- concurrent reservation/release tests;
- revision conflict tests;
- audit before/after tests;
- requester redaction and cross-requester denial;
- signed/private file access tests;
- restore-from-export test;
- free-plan quota and pause behavior documented.

### Accessibility and browser checks

- keyboard-only navigation;
- focus trap and restoration;
- labels, announcements, errors, and contrast;
- responsive layout at the approved viewport matrix;
- no horizontal page overflow;
- loading, empty, retry, success, and failure states;
- public/requester route contains no internal workspace controls.

## 8. Definition of done

The full-stack program is done only when all of the following are true:

- the current V1 operational boundary is documented and safe;
- the frontend uses a tested backend-neutral contract;
- the hosted sandbox can be recreated from Git;
- PostgreSQL migrations, constraints, indexes, and RLS are reviewed;
- staff and requester identity paths are tested;
- ledger, reservations, idempotency, revisions, audit, and status history are
  transactionally covered;
- evidence handling is private, validated, auditable, and recoverable;
- CI produces deterministic build artifacts;
- deployment and rollback are executable by a new maintainer;
- backups and restore have been rehearsed;
- operators have guides and acceptance records;
- free-plan limits and upgrade triggers are documented;
- no critical privacy, authorization, integrity, or data-loss issue remains;
- the final system choice—Apps Script or hosted PostgreSQL—is explicit;
- all unrun checks, external actions, limitations, and approvals are recorded;
- the exact final commit and deployment reference are verified.

## 9. Stop conditions

Codex must stop and report rather than improvise when:

- the task conflicts with `AGENTS.md`, launch runbook, or user authority;
- a required identity, database, Drive, or deployment value is missing;
- a free-tier limit makes the workflow unsafe or unreliable;
- the branch is dirty, divergent, or not the expected starting point;
- a migration would alter real data without approval;
- reconciliation finds unexplained differences;
- an RLS or requester-isolation test fails;
- a generated artifact changes unexpectedly;
- a test, build, browser, migration, or restore check fails;
- a production or external write is needed but not explicitly approved;
- the next action would require inventing a requirement or silently widening
  scope.

## 10. First execution milestone

The next Codex milestone after this plan is not a production deployment. It is
the documentation and contract foundation:

1. verify the branch and clean starting commit;
2. validate the routing policy;
3. inspect existing canonical docs for duplication;
4. create or consolidate the API/service contract document;
5. map current `api_*` operations to inputs, outputs, permissions, mutations,
   idempotency, revisions, audit events, and tests;
6. add contract fixtures without connecting to live Sheets, Drive, or a hosted
   database;
7. run focused checks and the full repository check;
8. update `docs/WORK_CONTINUATION.md`;
9. commit the bounded milestone;
10. stop for review before starting schema or hosted-infrastructure work.

This sequence keeps the project free, reversible, and understandable while
turning the existing V1 into a controlled path toward a real full-stack system.
