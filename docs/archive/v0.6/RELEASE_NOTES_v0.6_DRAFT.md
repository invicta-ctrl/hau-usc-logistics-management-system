# HAU-USC Logistics v0.6 Release Notes — Draft

Status: staging candidate only; not approved for production release.

## Authentication and account access

- Restores Cloudflare Worker/D1 login so invalid credentials return a safe error instead of a service failure.
- Keeps the login form stable after errors, with standard password-manager semantics and no application-driven autofocus loop.
- Adds secure sessions, first-login activation, logout revocation, server-assigned workspace routing, CSRF protection, and distributed rate limiting.

## Administrator Access Management

- Adds an Administrator-only searchable account directory with role, committee scope, status, first-login state, last login, creation time, and last Access ID change.
- Adds governed staging account creation, temporary-password reset, enable/disable, unlock, and session revocation.
- Adds confirmed Access ID changes that preserve immutable identity and historical authorship, revoke sessions, reserve prior identifiers, and append auditable history.

## Cloudflare and D1

- Adds the Cloudflare Worker/Static Assets runtime and protected operational APIs.
- Adds ordered D1 migrations through schema 8, including append-only Access ID history/reservations and normalization collision enforcement.
- Retains Google Sheets as a reporting/import sidecar and Google Drive as an evidence sidecar under explicit mappings.

## Verification snapshot

- Repository gate: 55 Vitest files / 382 tests passed.
- Full browser matrix: 91 passed / 209 intentional skips / 0 failures.
- Fresh local workerd/D1: 14 / 14 passed.
- Deployed staging auth and Access Management: 1 / 1 passed.

## Not yet accepted

- Full Gate E staging workflows and evidence uploads.
- Live accessibility/performance/capacity acceptance.
- Staging rollback rehearsal and restoration.
- Two final independent reviews.
- Production authorization, migration, deployment, smoke, promotion, and PR merge.

Production remains NO-GO. These notes must not be published as a production release announcement until all launch blockers close.
