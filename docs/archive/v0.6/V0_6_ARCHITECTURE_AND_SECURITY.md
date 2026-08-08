# v0.6 Architecture and Security Foundation

Status: Phase 1 locked contract. Phase 2 may build against it but may not change authentication, authorization, ledger, atomicity, or migration semantics without a Sol escalation.

## Decision summary

v0.6 remains one product with three public surfaces:

| Surface            | Audience                                                       | Authentication boundary                                                            |
| ------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Internal Logistics | Administrator, Director, Food, Inventory and Pantry, Materials | Server-owned Access ID, password, session, role, committee scope, and capabilities |
| Request Center     | Event and catalog requesters                                   | Sanitized public/requester contract; internal data never enters its bootstrap      |
| Lending Hub        | Eligible borrowers and DOL operators                           | Public submission contract plus authenticated DOL approval/handoff operations      |

Phase 1 establishes portable server-domain contracts and the HTTP-mode login/onboarding client. Phase 3 supplies the Cloudflare Worker transport and D1 repositories. The existing Apps Script runtime and Google-identity authorization remain the v0.5 rollback path until migration acceptance.

## Rejected options

- Client-selected roles or committees: rejected because UI state cannot grant authority.
- Browser-stored passwords or bearer sessions: rejected because secrets and durable sessions belong on the server.
- Reusing the Apps Script access sheet as the long-term credential store: rejected because Phase 3 moves operational identity/session authority to the Worker/D1 boundary.
- Performing D1 migration in Phase 1: rejected because the accepted program reserves migration, reconciliation, and cutover for Phase 3.
- Replacing the v0.5 authorization registry: rejected because its role, committee, capability, and separation-of-duties rules are already tested and remain authoritative.

## Identity, role, and experience model

Authentication proves an account. Authorization resolves role, committee scope, and capabilities on the server. Experience routing is a presentation decision derived from that server result.

Canonical roles remain:

- `ADMINISTRATOR`
- `DIRECTOR`
- `DOL_STAFF`
- `COMMITTEE_HEAD`
- `REQUESTER`
- `READ_ONLY_AUDITOR`

Canonical committees remain:

- `COM_FOOD`
- `COM_INVENTORY_PANTRY`
- `COM_MATERIALS`

The five internal experiences resolve as follows:

| Experience           | Server resolution                                           | Scope                                                                                    |
| -------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Administrator        | `ADMINISTRATOR`                                             | System/reference/access capabilities only; operational capabilities are not implied      |
| Director             | `DIRECTOR`                                                  | All-committee leadership and operational oversight; system administration is not implied |
| Food                 | `DOL_STAFF` or `COMMITTEE_HEAD` with `COM_FOOD`             | Food-scoped entities and capabilities                                                    |
| Inventory and Pantry | `DOL_STAFF` or `COMMITTEE_HEAD` with `COM_INVENTORY_PANTRY` | Inventory/Pantry-scoped entities and capabilities                                        |
| Materials            | `DOL_STAFF` or `COMMITTEE_HEAD` with `COM_MATERIALS`        | Materials-scoped entities and capabilities                                               |

For a multi-committee account, the server chooses the default experience from its server-managed default committee and returns only experiences backed by active scope. Switching an allowed view never adds a role, scope, or capability. Login and onboarding contain no role or committee selector.

## Account lifecycle

Account statuses are fail-closed:

- `STARTER`: server-created Access ID, temporary password credential, predetermined role/scope, onboarding incomplete.
- `ACTIVE`: onboarding complete and normal credential active.
- `DISABLED`: authentication denied and all sessions invalidated.
- `REVOKED`: authentication denied, all sessions invalidated, and reactivation requires a separately authorized access workflow.

Temporary passwords expire, are single-use, and never become normal credentials. First-login activation requires full name, mobile number, email, new password, and confirmation. The service validates these fields, preserves server-managed role/scope, hashes the new password, invalidates the temporary credential, increments the credential version, records audit history, invalidates pre-activation sessions, creates a new session, and returns the server-resolved experience/capability DTO.

Password reset uses a short-lived, one-time, server-stored token hash. Completing a reset increments credential version and invalidates every existing session. Disabled or revoked accounts do not become active through reset.

## Password and session cryptography

- Passwords use PBKDF2-HMAC-SHA-256 with a per-credential random 128-bit salt, a configurable work factor, and a 256-bit derived value.
- Production accepts credentials only at or above the configured minimum work factor. Synthetic tests may explicitly lower that bound.
- The Cloudflare Worker adapter uses the runtime-supported PBKDF2 maximum of 100,000 iterations; increasing it requires a verified platform capability change or a reviewed replacement KDF adapter.
- Verification derives the candidate value and uses an injected timing-safe comparator. The Cloudflare runtime supplies `crypto.subtle.timingSafeEqual`; tests use the platform crypto adapter.
- Raw passwords, temporary passwords, reset tokens, session tokens, and CSRF tokens are never logged or stored.
- Session and reset tokens use at least 256 bits of cryptographic randomness. Only SHA-256 token digests are stored.
- Session cookies are `HttpOnly`, `Secure` outside local development, `SameSite=Lax`, path `/`, and use the `__Host-` prefix in production. Activation and normal sessions use separate cookie names.
- Normal sessions carry a credential version and fail closed when an account is disabled, revoked, remapped incompatibly, or reset.
- Mutating authenticated HTTP calls require both the session cookie and a timing-safe validated CSRF token. Capability and entity scope are rechecked after session validation.

Cloudflare Workers documents PBKDF2 derivation and its non-standard timing-safe comparison on the Worker Web Crypto surface. Phase 3 must preserve that runtime requirement or provide an equally strong reviewed adapter.

## Service and persistence boundaries

The Phase 1 service depends on explicit interfaces:

- `AccountRepository`: normalized Access ID lookup and atomic account update.
- `SessionRepository`: hashed-token lookup, creation, revocation, and account-wide invalidation.
- `ResetTokenRepository`: one-time hashed reset token storage and consumption.
- `LoginRateLimiter`: bounded attempts keyed by normalized Access ID plus trusted network key.
- `AuditSink`: append-only security events containing safe IDs/codes, never secrets.
- `PasswordKdf`, `TokenCrypto`, `Clock`, and `IdFactory`: runtime adapters.

The in-memory repository is synthetic test/demo infrastructure only. Phase 3 maps the same contracts to D1 transactions and Cloudflare rate-limiting primitives. Authentication tables do not replace inventory ledger, reservation, receiving, release, or lending invariants.

## Session user DTO

The browser receives only:

- contract/version;
- account ID and display name;
- account status and onboarding state;
- canonical role ID/label;
- scope mode and committee IDs/labels;
- canonical capabilities;
- resolved experience ID;
- session expiry;
- CSRF token for the current in-memory page session.

The DTO excludes password metadata, salts, hashes, temporary/reset values, mobile number, email, private roster fields, supplier data, evidence links, and operational records.

## Protected-action contract

Every protected action performs, in order:

1. hashed session-token lookup;
2. expiry and revocation check;
3. active account and credential-version check;
4. CSRF verification for mutations;
5. fresh server capability resolution;
6. committee/entity-scope validation;
7. the existing lock, idempotency, domain validation, ledger/history, and audit workflow.

UI visibility is never part of this decision. A direct API call without the required capability receives a generic safe denial and performs no domain read or write.

## Threat model and controls

| Threat                                 | Required control                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Credential stuffing / brute force      | Rate-limit by normalized Access ID and trusted network key; generic failures; audit safe codes |
| Access-ID enumeration                  | Dummy credential derivation for unknown IDs; generic login response                            |
| Temporary-password replay              | Expiry, one-time consumption, activation-only session, credential-version increment            |
| Privilege escalation during onboarding | Ignore client role/scope fields; preserve server account assignment                            |
| Session theft                          | Random opaque tokens, digest-only storage, HttpOnly/Secure/SameSite cookie, expiry, revocation |
| CSRF                                   | SameSite cookie plus per-session CSRF token on mutations                                       |
| Direct unauthorized API call           | Fresh server capability and entity-scope recheck                                               |
| Disabled/revoked account               | Fail closed and invalidate account sessions                                                    |
| Duplicate activation/reset             | Atomic account/token consumption and credential-version check                                  |
| Sensitive-data leakage                 | Allowlisted DTOs and safe error/audit fields only                                              |
| Session fixation                       | Rotate from activation grant to a new normal session after activation                          |
| Stale authorization                    | Resolve capabilities from the current account on every protected action                        |

## Migration and rollback

Phase 2 consumes the contracts without migrating data. Phase 3 performs additive D1 schema creation, synthetic verification, controlled identity/account migration, reconciliation, and cutover. Google Drive remains the evidence-byte sidecar and Google Sheets becomes reporting/export or a narrowly bounded bridge where accepted.

Rollback before D1 cutover is the v0.5 Apps Script application and its immutable accepted deployment. Rollback after cutover changes routing to the last accepted immutable application/API version while preserving authentication audit, operational ledger, reservation, history, migration, and reconciliation evidence. Rollback never deletes appended history or re-enables revoked credentials.

## Phase boundaries

Phase 2 may implement shared shell, role experiences, responsive behavior, and ordinary workflows against these contracts. It must escalate before materially changing authentication/session architecture, role/capability semantics, security boundaries, or domain transaction guarantees. Phase 3 owns Worker/D1 infrastructure, migration, reconciliation, hardening, and final repository acceptance. Production promotion remains separately gated.
