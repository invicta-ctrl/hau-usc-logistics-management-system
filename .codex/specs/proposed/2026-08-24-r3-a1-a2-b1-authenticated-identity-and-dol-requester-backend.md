# R3-A1-A2-B1 — Authenticated identity recovery and DOL requester mode (backend)

STATUS: **PROPOSED — NOT ACCEPTED, NOT EXECUTED**
OWNER: Earl
DATE: 2026-08-24
PARENT: `.codex/specs/accepted/2026-08-23-r3-a1-a2-owner-routing-identity-three-context.md`
BRANCH: to be decided at acceptance — **not** `frontend-design-integration`
RISK: HIGH — authentication, credential lifecycle, email delivery, authorization

> This document exists because R3-A1-A2 §20 forbids inventing a frontend-only
> security boundary and forbids silently changing backend semantics inside a
> design/provider task. The frontend and prototype are finished against the
> contract below and report the gaps truthfully. **Nothing here has been
> implemented. Do not execute this until it is separately accepted.**

---

## 1. Why this is needed

R3-A1-A2 delivered the three-context model. Two of its requirements have no
server contract behind them, and the frontend correctly refuses to fake either.

### Gap A — `BACKEND_CONTRACT_GAP_DOL_REQUESTER_MODE`

Amendment §8 and §34: *"DOL staff may act as requesters without losing their
operational identity."*

`assertRequesterPortalAccount` (`src/server/d1/operational-service.js:712-724`)
requires **`authorization.roleId === 'REQUESTER'`** in addition to the
`request.create` capability:

```js
function assertRequesterPortalAccount(account) {
  const authorization = assertCapability(account, CAPABILITIES.REQUEST_CREATE);
  if (
    authorization.roleId !== 'REQUESTER' ||
    !requesterDepartmentId(account) ||
    !account.departmentDisplayName
  ) {
    throw new ApiError('REQUESTER_PORTAL_REQUIRED', '…', { status: 403 });
  }
  return authorization;
}
```

`ROLES.DOL_STAFF` holds `request.create` but its `roleId` is `DOL_STAFF`, so
`/api/portal/request` answers `403 REQUESTER_PORTAL_REQUIRED`. The owner-approved
routing sends DOL staff to the External Request Center in requester mode; the
server then refuses them.

### Gap B — `BACKEND_CONTRACT_GAP_SELF_SERVICE_IDENTITY`

Amendment §17 (activate an existing account) and §18 (forgot password), both via
an 8-digit emailed code.

`src/auth/http-contract.js` declares only:

```js
session, login, activate, logout, reset/complete
```

There is **no** `activate/start`, `activate/verify`, `reset/start` or
`reset/verify`. `completePasswordReset` (`src/server/auth/service.js:441`)
consumes an **admin-issued** `resetToken` produced by
`/api/admin/access/reset-password`. `/api/auth/activate` is *starter-credential*
activation — the account signs in with a starter credential and completes a
profile — not identity-proofed activation by emailed code.

The only 8-digit email flow in the product belongs to `account-applications`,
which is the separate *"apply for staff access"* operation and must not be
conflated with activation (§31).

---

## 2. Required contract

### 2.1 Start — identity-proofing challenge

```
POST /api/auth/activate/start
POST /api/auth/reset/start

body    { identifier }                       // username, account code, or email
answer  { ok: true, accepted: true, resendAvailableInSeconds }
```

**Rules**

| Rule | Requirement |
|---|---|
| Non-enumeration | The response is **byte-identical** whether or not the account exists, is locked, is already active, or is ineligible. Same status, same shape, same timing envelope. |
| Timing | Constant-time envelope — do the same work (or a deliberate delay) on the miss path so response time does not leak existence. |
| Code | 8 digits, cryptographically random, **leading zeros preserved and significant**. |
| Storage | Store only a hash of the code, never the code. |
| Expiry | Short — 10 minutes is the proposed default. |
| Single use | Consumed on success; invalidated on a resend. |
| Rate limit | Per identifier **and** per client. Proposed: 3 starts / 15 min / identifier, plus a global per-IP ceiling. |
| Delivery | Only to the **registered** email on the eligible identity. Never to an address supplied in the request. |
| Eligibility | `activate/start` only issues for an existing identity that is eligible and has no password. `reset/start` only for an existing active account. Neither difference is observable in the response. |
| Audit | Record issue, delivery attempt, and outcome. Never record the code. |

### 2.2 Verify — exchange code for a single-use token

```
POST /api/auth/activate/verify
POST /api/auth/reset/verify

body    { identifier, code }
answer  { ok: true, token, expiresAt }
errors  VERIFICATION_INVALID | VERIFICATION_EXPIRED | VERIFICATION_ATTEMPTS_EXCEEDED
```

**Rules**

- Attempt-limited: proposed 5 attempts per issued code, then the code is dead and
  `VERIFICATION_ATTEMPTS_EXCEEDED` is returned until a new one is requested.
- The returned token is short-lived (proposed 10 minutes), single-use, bound to
  the identity **and** to the flow (`activate` tokens must not complete a reset).
- Constant-time comparison on the code hash.

### 2.3 Complete

```
POST /api/auth/activate/complete
body    { activationToken, password, confirmPassword }

POST /api/auth/reset/complete            // EXISTS — extend to accept a verify token
body    { resetToken, password, confirmPassword }
```

**Rules**

- Reuse the existing `validateNewPassword` policy and `passwordKdf.hash`.
- Reuse `commitPasswordReset`'s `expectedCredentialVersion` optimistic check.
- **Activation establishes credentials only.** It must never create an identity,
  never grant capability, and never change `roleId`. Capability stays wherever it
  already is decided.
- Revoke existing sessions on completion.
- Audit `ACCOUNT_ACTIVATED` / `PASSWORD_RESET_COMPLETED` with actor, time, and
  correlation id.

### 2.4 DOL requester mode

Relax `assertRequesterPortalAccount` so authorization rests on **capability plus
a resolvable requester department**, not on `roleId`:

```js
function assertRequesterPortalAccount(account) {
  const authorization = assertCapability(account, CAPABILITIES.REQUEST_CREATE);
  if (!requesterDepartmentId(account) || !account.departmentDisplayName) {
    throw new ApiError('REQUESTER_PORTAL_REQUIRED', '…', { status: 403 });
  }
  return authorization;
}
```

And record provenance on the canonical record:

```
REQUESTED_BY   = acting account            (already the case)
REQUEST_SOURCE = EXTERNAL_REQUEST_CENTER | INTERNAL_SELF_SERVICE
APPROVED_BY    = acting account            (only where policy permits self-approval)
```

**Constraints**

- One canonical record type. No parallel "internal request" entity.
- `REQUEST_SOURCE` is server-derived from the authenticated route, never accepted
  from the client.
- Self-approval is **never hidden**. Audit history must show requester and
  approver even when they are the same account.
- Leave a seam for a second-approver rule on restricted categories rather than
  hard-coding unrestricted global self-approval.

---

## 3. Data changes

`REQUEST_SOURCE` needs a home on `requests`. Two options for the owner to choose:

| Option | Shape | Trade-off |
|---|---|---|
| **A — new column** | `ALTER TABLE requests ADD COLUMN request_source TEXT NOT NULL DEFAULT 'EXTERNAL_REQUEST_CENTER'` | Queryable and explicit. Needs a migration. |
| **B — reuse `notes`/metadata** | encode in existing free text | No migration, but not queryable and easy to corrupt. **Not recommended.** |

Option A is recommended. The verification-code store also needs a table
(`auth_identity_verification`: id, account_id, flow, code_hash, expires_at,
attempts, consumed_at, created_at) unless the existing reset-token table is
extended.

**No migration may be written or run under this proposal.** Migrations require
their own accepted authority and a rollback plan.

---

## 4. Tests required before this can be called done

| ID | Assertion |
|---|---|
| IDV-01 | `start` returns an identical response for existing, non-existent, locked and ineligible identifiers |
| IDV-02 | Response timing for a hit and a miss stays inside one envelope |
| IDV-03 | A leading-zero code (`00123456`) verifies correctly |
| IDV-04 | Code expires exactly at the boundary |
| IDV-05 | Sixth attempt returns `VERIFICATION_ATTEMPTS_EXCEEDED` and the code is dead |
| IDV-06 | A resend invalidates the previous code |
| IDV-07 | A consumed code cannot be reused |
| IDV-08 | An `activate` token cannot complete a `reset`, and vice versa |
| IDV-09 | Rate limit trips per identifier and per client |
| IDV-10 | Only the registered address is ever mailed; a request-supplied address is ignored |
| IDV-11 | Activation grants **no** capability and does not change `roleId` |
| IDV-12 | Completion revokes existing sessions |
| DOL-01 | A `DOL_STAFF` account with `request.create` can open and submit through `/api/portal/request` |
| DOL-02 | An account without `request.create` still gets 403 |
| DOL-03 | `REQUEST_SOURCE` is server-derived and a client-supplied value is ignored |
| DOL-04 | Self-approval records both `REQUESTED_BY` and `APPROVED_BY` and appears in audit history |
| DOL-05 | A requester still sees only their own records after the `roleId` check is relaxed — scope must not widen |

**DOL-05 is the one to be most careful about.** Removing the `roleId` guard must
not accidentally widen `requesterRequestPortal`'s scope; that query filters on
`requester_account_id` **and** `requester_department_id`, and both must remain.

---

## 5. Security review points

- Removing a `roleId` check is a **widening** change. It must be reviewed against
  every other use of `assertRequesterPortalAccount` — currently
  `requesterRequestPortal`, `submitRequesterRequest`, `cancelRequesterRequest`.
- Verification codes are a credential. They must never appear in logs, audit
  details, error messages, or telemetry.
- The generic confirmation copy must survive translation and future edits; a
  well-meaning "we couldn't find that account" would reintroduce enumeration.
- Email delivery failures must not change the response.

---

## 6. Rollback

| Change | Rollback |
|---|---|
| New auth routes | Feature-flag off, or revert the route registrations. Additive, so no data is stranded. |
| Verification table | Drop is safe — it holds only short-lived challenge state. |
| `assertRequesterPortalAccount` relaxation | Revert the guard. Records already created by DOL accounts remain valid; they are ordinary canonical requests. |
| `request_source` column | Additive with a default; leaving it in place after a revert is harmless. |

No irreversible step is proposed. The riskiest item is the authorization
relaxation, and it is a two-line revert.

---

## 7. Explicitly out of scope

- Any Production, Playground, D1 or R2 mutation.
- Running a migration.
- Changing the frontend, which is already finished against this contract.
- FI-04 staff workspaces.
- Open staff registration. Activation stays activation (§31).

---

## 8. Acceptance checklist

```
OWNER_ACCEPTED                     NO
BRANCH_ASSIGNED                    NO
MIGRATION_AUTHORITY                NOT GRANTED
SECURITY_REVIEW                    NOT DONE
TESTS_WRITTEN                      NO
IMPLEMENTED                        NO
```
