# v0.7.1 Slice 3 — Login, Session, and Portal Handoff

Status: ACCEPTED

Base: `fbaf7700561be5d369e66d81fc962597d2a7b88f`

Initial implementation: `2fbab8a9e03e17abc28bc3dddbb3cd97dd7e5f78`

Accepted repair: `de7dfcf331a5e1fd512f13bdc8e97ea09dd05d79`

Production/external writes: none

## Accepted behavior

- Authentication errors now retain the Worker correlation reference across
  the response header, safe JSON body, client `AppError`, and UI support text.
- Auth routes inherit the standard API security headers without losing
  activation/session cookie rotation or clearing behavior.
- Malformed percent-encoded cookies fail closed as safe, correlated
  `SESSION_INVALID` responses inside the guarded handler boundary.
- Raw transport failures are normalized to a generic retryable authentication
  service error.
- REST entry screens use validated, same-origin `/api/version` identity rather
  than build-time environment labels. Invalid or incomplete identity fails
  closed.
- `/portals` provides a non-authenticating selector. Request, Lending, staff
  sign-in, and selector navigation are consistent, responsive, keyboard
  reachable, and do not change server authorization.
- The existing 12–128 character, three-category password policy remains
  authoritative and was not weakened.

The detailed lifecycle matrix is in
`.codex/V0_7_1_SLICE_3_LOGIN_AND_PORTAL_AUDIT.md`.

## Verification

- Focused authentication/release-identity Vitest: 6 files / 31 tests passed.
- Full auth-gateway Playwright: 11 / 11 executed tests passed; 49 intentional
  project skips.
- Focused real local-Worker proofs passed for safe auth correlation,
  activation/logout/back-button behavior, and malformed-cookie failure.
- Amended full `npm run check`: governance, ESLint, 78 Vitest files / 510
  tests, preview build, deterministic shareables and Apps Script bundle,
  Cloudflare types, staging build and Wrangler dry-run, then final preview
  rebuild plus Apps Script/dist parity verification passed.
- Exact-head `npm run verify:dist` and `git diff --check` passed.

## Independent review

The first fresh review of `fbaf770…2fbab8a` failed with:

- P1: the Cloudflare staging build left `dist/index.html` inconsistent with
  preview shareables at the committed head;
- P2: malformed cookie decoding occurred before the handler's guarded `try`.

Both findings were repaired at `de7dfcf331a5e1fd512f13bdc8e97ea09dd05d79`.
A second fresh Sol Max re-review of the complete
`fbaf770…de7dfcf` range passed with no remaining or new P0–P3 findings. The
requested route was platform-accepted; exact runtime model identity was not
agent-attestable.

## Boundaries and next slice

No migration, database write, provider mutation, staging upload, production
deployment, domain change, Google action, GitHub push, or pull-request action
occurred. Production remains on immutable v0.7.0. The next bounded slice is the
Staff Directory and Access Management workflow audit, retaining the accepted
Slice 2 contract and all server-owned authorization/privacy controls.
