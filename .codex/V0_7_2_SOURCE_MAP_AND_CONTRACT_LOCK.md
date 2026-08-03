# v0.7.2 Source Map and Contract Lock

Status: `LOCKED_FOR_FIRST_READ_ONLY_MAPPING_WAVE`

Date: 2026-08-03 (Asia/Manila)

Specification checkpoint SHA: `39ea6a285c3d52fd0da3fbabadf52f66c66481bc`

Integration branch: `release/v0.7.2-production-access-operations`

## 1. Mapping method

The parent used the existing `.codegraph/` index before targeted repository
searches and reads. The read set was limited to the accepted v0.7.2 domains:

- authentication, session, access, and protected identity;
- Request, Lending, Inventory, Release, integer, and low-stock behavior;
- reference administration, Link Registry, and USC Announcements;
- Worker routing, migrations, generated adapters, tests, and release tooling.

The highest migration is `0029_reusable_asset_reassignment.sql`; the active
schema baseline is 29. The next additive migration may therefore be assigned
`0030` after this confirmed inspection.

## 2. Current repository truth

### 2.1 Authentication and access

- `src/server/auth/service.js` owns login, starter-account activation,
  authenticated sessions, CSRF, logout, password reset, and status controls.
- `src/server/auth/contracts.js` owns account/session/authorization DTOs,
  identifier normalization, verified-email normalization, and workspace
  resolution.
- `src/server/d1/auth-repository.js` resolves a login identifier and persists
  canonical accounts, sessions, reset tokens, audit, and rate limits.
- `src/server/access/policy.js`, `src/domain/permissions.js`, and the persisted
  `account_access_profiles` model form the one accepted capability engine.
- `src/server/access/service.js` and
  `src/server/d1/access-management-repository.js` own Accounts & Access.
- `src/server/identity-roster/*` and
  `src/server/d1/identity-roster-repository.js` own protected roster projection,
  encryption, preview/apply/rollback, and self projection.
- `src/visual/auth-gateway.js` and `src/services/auth-api-client.js` own the
  current login/activation gateway.
- Current login supports the accepted login-identifier repository boundary but
  has no distinct username profile/history contract.
- Current Accounts & Access exposes ordinary Access ID change. v0.7.2 must hide
  that normal control and restrict any retained legacy correction path to a
  separately protected owner-only operation.
- No account-application service, repository, review queue, or self-profile
  mutation service currently exists.

### 2.2 Request, integer, low stock, and core operations

- `src/domain/request-center.js` defines current detailed Venue, Logistics,
  Equipment, and Other choices. v0.7.2 adds a higher-level purpose decision;
  it does not discard the accepted detailed reference choices.
- `src/domain/validators.js` and `src/domain/quantity-units.js` currently allow
  fractional quantities for some unit classes. v0.7.2 needs a separate shared
  strict integer contract for the enumerated operational fields.
- `src/domain/composite-requests.js`, `src/server/d1/operational-service.js`,
  `src/visual/requester-portal.js`, `src/visual/runtime-extensions.js`, and the
  REST/legacy adapters own authenticated request submission and internal work.
- Public and internal Lending, Release Desk, return, and inventory ledger paths
  already exist and must be verified/repaired rather than duplicated.
- No accepted low-stock enable/threshold storage was found. It must be an
  additive inventory-item control and attention signal only.

### 2.3 Link Registry

- `src/visual/views/reference-admin.html` labels the existing `ROUTING` domain
  as “Link Registry.” That domain manages operational ownership and approval
  routes, not useful HTTPS links.
- The generic reference administration client and Apps Script adapters exist,
  but the production Worker/D1 operational service has no complete Link
  Registry implementation for list/search/versioned URL records.
- A canonical D1 Link Registry is therefore required. It extends the current
  reference-administration destination and `REFERENCE_MANAGE` capability; it
  does not replace or reinterpret internal code-owned application routes.

### 2.4 USC Announcements

- `public_advertisements` is the current canonical D1 source and already stores
  stable ID, title, description, alt text, call to action, image asset key,
  HTTPS destination, state, integer display order, publish/end time, actors,
  and timestamps.
- `src/server/advertisement-admin-service.js`,
  `src/server/public-advertisement-service.js`, Worker routes, R2 media, REST
  adapters, and the reference-admin visual destination form a real reusable
  stack.
- v0.7.2 will present this stack as USC Announcements and add only missing
  audience, revision, pause/resume, preview, and safe-state details. It will not
  create another announcement store.

### 2.5 Provider and environment gate

No approved email-provider adapter or approved identity-class/domain values are
stored in the repository. That is correct for private configuration, but it is
an unresolved pre-production gate. Implementation must provide a fail-closed
provider interface and unit-test fake. No real address, domain, sender,
credential, or provider choice is hardcoded. Before deployed verification, the
private approved configuration and a safe provider smoke must be proven.

## 3. Locked account-application contracts

### 3.1 Public token boundary

- Email start always returns a generic accepted response and non-enumerating
  timing/error shape.
- Confirmation returns a single-use opaque verification receipt. Only its
  digest is stored.
- Successful application submission consumes that receipt atomically and
  returns the application code plus a revocable opaque status token once.
- The private status route keeps the token in the URL fragment, never a query
  parameter. The browser sends it in an authorization header; it is excluded
  from logs, errors, analytics, and history.
- Status and withdrawal may operate only on the one application bound to the
  token. Withdrawal requires expected revision and retry key.

### 3.2 HTTP/DTO lock

The paths are those in the accepted specification. All JSON responses include
`ok` and a safe `correlationId` when authenticated/authorized. Public failures
do not reveal existence or match details.

`POST /api/account-applications/email/start`

```text
request:  { email }
response: { ok, accepted, nextAttemptAt }
```

`POST /api/account-applications/email/confirm`

```text
request:  { email, code }
response: { ok, verificationReceipt, expiresAt }
```

`POST /api/account-applications`

```text
request:  { verificationReceipt, legalName, contactNumber, departmentId,
            courseId, yearLevel, requestedUsername, requestedAccountType,
            requestedRoleId, requestedCommitteeIds, requestedWorkspaceIds,
            lendingSelfService, internalLendingOperations, requestCenterAccess,
            password, confirmPassword, clientRequestId }
response: { ok, applicationCode, state, revision, statusToken, nextStep }
```

The password is hashed before persistence and never returned, logged, audited,
or placed in a history DTO. If account activation uses a newly generated
temporary credential instead, the application stores only a pending-account
reference and no reusable plaintext.

`GET /api/account-applications/status`

```text
authorization: opaque applicant status token
response: { ok, applicationCode, state, revision, submittedAt, updatedAt,
            nextStep, changeRequestSummary?, accountCode?, activationReady? }
```

The status DTO excludes reviewer identity, internal duplicate/roster evidence,
protected profile envelopes, reason internals, and any credential.

`POST /api/account-applications/withdraw`

```text
authorization: opaque applicant status token
request:  { expectedRevision, reason, clientRequestId }
response: { ok, applicationCode, state: WITHDRAWN, revision }
```

Administrator and Director list/detail DTOs expose only fields explicitly
authorized by the specification. Every mutation request contains
`expectedRevision`, `reason` where consequential, and `clientRequestId`.
Forwarding records the Administrator actor. Director approval rejects the same
account as prior Administrator and creates the canonical account atomically.

### 3.3 Activation lock

Approval reuses the current starter-account/activation mechanism:

- create a `STARTER` canonical account with the generated/preserved immutable
  account code and approved effective access;
- create a one-time temporary credential through the existing server KDF;
- return that plaintext only once to the authorized approving/handoff actor;
- show only account code plus activation guidance on applicant status;
- deliver the credential through an approved private handoff until the optional
  P1 lifecycle email is proven;
- login creates the existing activation session, and `/api/auth/activate`
  completes profile/password and transitions the application to `ACTIVE` in an
  idempotent, correlated follow-up transaction.

No pending/rejected application can authenticate or enter a staff workspace.

## 4. Locked data contract

Migration `0030` is additive and will contain the smallest set confirmed by
implementation review:

### 4.1 Existing account extensions

```text
accounts.username_normalized                nullable, unique when present
accounts.verified_email_fingerprint         nullable, unique when active/verified
accounts.profile_course_id                  nullable
accounts.profile_year_level                 nullable integer with bounded check
accounts.avatar_asset_key                   nullable metadata only (P1)
accounts.avatar_updated_at                  nullable (P1)
```

Existing `profile_email` is not bulk rewritten by SQL. Deterministic fingerprint
backfill requires the private accepted key and a separately rehearsed command.

### 4.2 Verification challenges

```text
email_verification_challenges
  id, email_fingerprint, protected_email_envelope, secret_digest, purpose,
  status, expires_at, attempt_count, resend_count, created_at, last_sent_at,
  verified_at, consumed_at
```

Allowed states are `PENDING`, `VERIFIED`, `CONSUMED`, `EXPIRED`, and `REVOKED`.
Counters are non-negative integers. Indexes support current fingerprint/status
and expiry queries without exposing the email.

### 4.3 Applications and history

```text
account_applications
  id, application_code, email_fingerprint, protected_email_envelope,
  protected_profile_envelope, department_id, course_id, year_level,
  requested_username_normalized, pending_password_credential_json,
  requested_access_json, state, revision, status_token_digest,
  status_token_expires_at, administrator_reviewer_id,
  administrator_reviewed_at, director_reviewer_id, director_reviewed_at,
  approved_account_id, expires_at, created_at, updated_at, archived_at

account_application_history
  id, application_id, from_state, to_state, actor_account_id,
  applicant_authority_fingerprint, reason, before_json, after_json,
  expected_revision, resulting_revision, idempotency_key, correlation_id,
  created_at
```

Application history is append only. The application current-state row is
optimistically updated with `WHERE revision = expectedRevision`. Application
code and history idempotency keys are unique. The state checks match the
accepted specification exactly.

### 4.4 Username and identity correction

```text
username_history
  id, account_id, old_username_normalized, new_username_normalized,
  changed_by_account_id, reason, idempotency_key, correlation_id, changed_at

identity_correction_requests
  id, account_id, protected_request_envelope, state, revision, created_at,
  updated_at, resolved_at, resolved_by_account_id, correlation_id
```

Username history is append only and distinct from immutable account-code
history. Identity correction stores protected requested values and cannot
silently update the protected roster or canonical legal identity.

### 4.5 Link Registry

```text
reference_links
  id, label, url, link_type, audience, status, revision, sync_state,
  created_by_account_id, updated_by_account_id, created_at, updated_at,
  archived_at

reference_link_versions
  id, link_id, revision, before_json, after_json, action,
  actor_account_id, reason, idempotency_key, correlation_id, created_at
```

Only `https:` external URLs without embedded credentials are accepted.
Code-owned internal routes use approved route IDs and cannot be converted into
arbitrary external URLs. Allowed sync display states are `SYNCED`,
`SYNC_PENDING`, `SYNC_FAILED`, and `NOT_CONFIGURED`; no Google synchronization
is claimed without proof. Versions are append only.

### 4.6 Low stock and announcements

```text
inventory_items.low_stock_alert_enabled     integer boolean, default 0
inventory_items.low_stock_threshold         nullable non-negative integer

public_advertisements.audience               controlled text, default PUBLIC
public_advertisements.revision               integer >= 1, default 1
```

The low-stock constraint requires a threshold only when enabled. Existing
fractional values are not silently rounded. Announcement `display_order` is
validated through the shared integer contract; existing rows remain valid.

## 5. Locked capability model

Add these capabilities to the existing registry and role mapping:

```text
account_application.admin_review
account_application.director_decide
account_application.owner_override
```

- Administrator receives `admin_review`.
- Director receives `director_decide`.
- System Owner receives all three through the existing owner policy.
- Custom grants/denies remain subject to the accepted sensitive-capability
  policy; applicant review capabilities are sensitive and cannot be granted by
  the same approval they control.
- Self-profile endpoints require an authenticated active account and matching
  account ID, not a new broad capability.
- Link Registry reuses `reference.manage`; Announcements reuse
  `advertisement.manage`.

Every direct route uses the same server authorization. Same-reviewer denial is
checked against immutable account IDs, not display values.

## 6. Locked operational contracts

- Request purpose enum:
  `EVENT_ACTIVITY_SUPPORT | OFFICE_INVENTORY_PANTRY`.
- The Event branch may use the existing detailed Venue/Logistics/Equipment/
  Other selections and composite request domain.
- The Office Inventory/Pantry branch uses the accepted inventory/catalog
  presentation and performs no stock reservation or movement on submission.
- Contradictory hidden-branch fields are rejected by the server.
- New shared validators:
  `operationalInteger(value, { field, min, max })` and
  `optionalOperationalInteger(...)`; no `Number()` coercion of ambiguous
  strings is accepted.
- Low stock is `available <= threshold` only when enabled and relevant; it is a
  warning/attention result, never a transactional block.
- Announcements reuse `public_advertisements`; future, expired, inactive, and
  archived records remain absent from public results.

## 7. File ownership lock

The parent owns all writes to the release branch and all shared integration
files. The first child wave is read only, so its read scopes may overlap without
creating write conflicts.

Reserved parent/integration files:

```text
migrations/*
src/worker/index.js
src/domain/permissions.js
src/server/auth/contracts.js
src/services/rest-service.js
src/services/legacy-runtime-adapter.js
src/services/launch-service-contract.js
src/visual/runtime-extensions.js
src/visual/views/reference-admin.html
package.json and generated artifacts
.codex/* and .plans/*
```

Proposed new bounded modules:

```text
src/server/account-application/contracts.js
src/server/account-application/service.js
src/server/account-application/email-provider.js
src/server/d1/account-application-repository.js
src/server/profile/service.js
src/server/d1/profile-repository.js
src/server/reference-link-service.js
src/server/d1/reference-link-repository.js
src/domain/operational-integers.js
src/domain/request-purpose.js
```

Exact names may be adjusted only when a read-only mapper proves a better fit;
the API/state/data/capability contracts above remain locked.

## 8. Dependency graph

```text
mapping verification
  -> migration 0030 + capability seed
  -> application repository + provider interface
  -> application service/state machine
  -> Worker routes + REST/auth clients
  -> Admin/Director/owner integration
  -> login/register/status/profile UI
  -> operational integer/request/low-stock repairs
  -> Link Registry + Announcement repairs
  -> generated parity + R1
  -> full gate + R2
  -> isolated pre-production + rollback
  -> exact production GO package
```

Provider activation, private identity-class values, remote migration, and
production remain sequential external gates.

## 9. Required mapper output

Each first-wave child must return exact current symbols/files/tests, confirmed
gaps, contract risks, and a recommended non-overlapping implementation slice.
It must not edit files, spawn another agent, expose private data, or broaden
scope. Parent acceptance requires evidence against exact SHA
`39ea6a285c3d52fd0da3fbabadf52f66c66481bc`.
