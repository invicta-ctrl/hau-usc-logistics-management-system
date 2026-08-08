# Phase 14 Advanced Access Management

## Summary

Extend the existing governed account lifecycle with durable workspace and
scope assignment, effective-access preview, bounded presets/overrides, and
server-enforced route and action projections. Preserve one-time credential,
session revocation, audit, last-owner, and last-Administrator protections.

## Source

`.codex/specs/v0.7.0-production-master.md`, Phase 14.

## Vertical slices

1. Add the D1 access-policy model, canonical presets, server-side validation,
   effective-access preview/update APIs, session revocation, append-only audit,
   and canonical authorization projection.
2. Complete the Owner/Administrator UI for create/edit, governed workspace and
   committee/location/event assignment, default workspace, collapsed advanced
   overrides, conflict warnings, and one-time credential controls.
3. Prove direct-route, workspace-switcher, operational-scope, capability,
   last-owner/last-Administrator, privacy, desktop/mobile, local D1, staging,
   and exact-head CI acceptance.

## Safety

- `SYSTEM_OWNER` cannot be created, granted, or edited through normal Access
  Management.
- Sensitive capability grants require an authenticated System Owner; ordinary
  Administrators may not self-escalate or grant owner-equivalent authority.
- Material changes revoke sessions and increment credential version.
- Passwords remain non-recoverable and temporary plaintext is returned once.
- No unrestricted permission matrix and no permanent deletion of real users.
- No production action.

## Validation

- [x] Policy normalization/effective-access unit coverage
- [x] D1 migration and Access Management API coverage
- [x] Direct-route and server-action fail-closed coverage
- [x] Owner/Administrator responsive UI coverage
- [x] Credential one-time/copy/download coverage
- [x] `npm run check`
- [x] Full Playwright and local Worker/D1 acceptance
- [x] Exact staging health/readiness and live Phase 14 smoke
- [x] Exact-head PR checks
- [x] Production remains untouched
