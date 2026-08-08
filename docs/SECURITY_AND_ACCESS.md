# Security and Access

Security authority is server-side. The browser may hide unavailable controls for usability, but every protected read and mutation is re-authorized by the Worker against the authenticated account, role, capability set, operational scope, and current data state.

## Identity and authorization

- Access IDs and opaque account IDs are canonical operational identities.
- Email suffixes, UI roles, client claims, and display names never authorize access.
- Protected roster matches are exact, verified, encrypted/fingerprinted, and never exposed through public DTOs.
- Session cookies, CSRF, password/temporary-credential lifecycle, rate limits, and capability checks fail closed.
- Account application review preserves separation of duties; owner override remains exceptional, reasoned, and audited.

## Privacy and provider containment

Secrets, private configuration, protected roster values, provider identifiers, recipient addresses, credentials, recovery artifacts, and PII stay outside Git, public UI, logs, and handoffs. Staging email requires a private non-empty exact normalized recipient allowlist. Wildcards and domain-only rules are rejected, readiness fails closed, and disallowed recipients are rejected before any provider call. Production recipient behavior remains separately configured.

## Data integrity

- Migrations and schema metadata are never rewritten or renumbered.
- Ledger, audit, status, access-ID, policy, identity, release, event, brand, account-application, evidence, and other history records are never hard-deleted or rewritten.
- Retryable writes use idempotency keys and server transaction guards.
- Backups and recovery evidence are retained outside Git; restoration is proved in isolation before promotion.
- Staging reset may operate only on recognized synthetic state after exact target proof and a fresh verified recovery point.

## Environment boundary

Production and staging must have distinct Worker, D1, R2, secrets, routes, Google/provider configuration, and writable bindings. Any crossover, identity mismatch, missing allowlist, unclassified staging row, integrity failure, or privacy uncertainty stops the affected action before mutation.

See [AUTHORIZATION_CONTRACT.md](AUTHORIZATION_CONTRACT.md), [BACKUP_AND_RECOVERY.md](BACKUP_AND_RECOVERY.md), [PRODUCTION_INCIDENT_GUIDE.md](PRODUCTION_INCIDENT_GUIDE.md), and [STAGING_SANDBOX.md](STAGING_SANDBOX.md).

The superseded Apps Script-era security narrative is retained at `docs/archive/legacy/SECURITY_AND_ACCESS-pre-v0721.md` for historical reference only.
