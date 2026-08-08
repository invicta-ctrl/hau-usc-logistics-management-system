# v0.7.1 Slice 2 — Client/Runtime Contract Handoff

Status: ACCEPTED

Base: `dfd2b5c88b795747dfbb83838ae57a718508e457`

Implementation: `8cec8fc6a39e697dcf4c1b5e1cc8f336597d69e2`

Production/external writes: none

## Confirmed cause

The active Cloudflare browser runtime constructs `HttpApiAdapter` through
`createLegacyRuntimeAdapter`. The Worker routes for protected Access Policy and
identity-roster operations existed, but the HTTP adapter omitted the three
policy paths and the legacy runtime surface omitted all nine protected methods.
Production therefore received undefined client methods and failed closed before
any unsupported D1 write.

The similarly named services in `runtime-extensions.js` are mock-preview only.
They are guarded by `backendMode === 'mock'`, did not cause or conceal the
production failure, and remain unchanged.

## Repaired contract

| Client method                  | HTTP/Worker path                       | Runtime behavior              |
| ------------------------------ | -------------------------------------- | ----------------------------- |
| `getAccessPolicyOptions`       | `/api/admin/access/options`            | read forwarding               |
| `previewAccessPolicy`          | `/api/admin/access/preview-policy`     | read-only preview forwarding  |
| `updateAccessPolicy`           | `/api/admin/access/update-policy`      | retry-stable tracked mutation |
| `getIdentityRosterStatus`      | `/api/owner/identity-roster/status`    | read forwarding               |
| `listIdentityRoster`           | `/api/owner/identity-roster/directory` | read forwarding               |
| `previewIdentityRosterSync`    | `/api/owner/identity-roster/preview`   | read-only preview forwarding  |
| `applyIdentityRosterSync`      | `/api/owner/identity-roster/apply`     | retry-stable tracked mutation |
| `rollbackIdentityRosterSync`   | `/api/owner/identity-roster/rollback`  | retry-stable tracked mutation |
| `getIdentityRosterSelfProfile` | `/api/identity-roster/self`            | read forwarding               |

The explicit protected-runtime contract is asserted against both the remote
HTTP adapter and the legacy runtime surface in HTTP/REST modes. It deliberately
does not assert these Cloudflare-only operations in Apps Script legacy mode,
which has no corresponding server functions. Existing CSRF, included
credentials, server-owned authorization, safe `AppError` fields, correlation
references, and mutation idempotency are preserved.

## Verification

- Focused Vitest: 2 files / 10 tests passed.
- Full `npm run check`: governance, ESLint, 77 Vitest files / 502 tests,
  preview build, deterministic shareables and Apps Script bundle,
  Apps Script/dist verification, Cloudflare types, staging build, and Wrangler
  local-binding dry-run passed.
- Focused local-Worker Playwright: 2 / 2 passed for the System Owner Staff
  Directory and Administrator Access Management UI journeys.
- `git diff --check`: passed.
- Fresh R2 review task `/root/v071_r2_contract_review`: PASS for exact range
  `dfd2b5c88b795747dfbb83838ae57a718508e457..8cec8fc6a39e697dcf4c1b5e1cc8f336597d69e2`;
  no P0–P3 findings. Route identity was requested/platform-accepted/not
  agent-attestable.

## Boundaries and next slice

No migration, database write, provider mutation, staging upload, production
deployment, domain change, Google action, GitHub push, or pull-request action
occurred. Production remains on v0.7.0.

Global unexpected-error presentation and the separate authentication
correlation/security-header gap are not upgraded to complete by this slice.
The next bounded slice is the login/session and public-navigation audit and
repair, including safe correlation behavior.
