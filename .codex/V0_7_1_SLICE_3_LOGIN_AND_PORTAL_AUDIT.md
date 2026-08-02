# v0.7.1 Slice 3 — Login, Session, and Portal Audit

Status: IMPLEMENTED; INDEPENDENT REVIEW PENDING

Base: `fbaf7700561be5d369e66d81fc962597d2a7b88f`

Production/external writes: none

## Confirmed defects

1. Authentication responses did not consistently inherit the standard API
   security headers or expose the Worker correlation reference through both the
   header and safe error body.
2. The authentication client preferred only the response body correlation
   value and could expose a transport exception through downstream UI code.
3. Staff login and activation used no authoritative runtime identity. The REST
   bundle's build-time environment can differ from the Worker that serves it.
4. Request, Lending, and staff entry points had inconsistent navigation and no
   truthful portal-selection route.
5. The accepted recovery text described an eight-character minimum even though
   the current accepted implementation already enforces the stronger 12–128
   character, three-category policy.

## Accepted repair

- `/api/session` and `/api/auth/*` now use the standard API headers, preserve
  every `Set-Cookie`, and return the same safe request reference in the
  `x-correlation-id` header and error body.
- Browser transport failures normalize to `AUTH_SERVICE_UNAVAILABLE`. The UI
  displays only safe `AppError` messages and a validated `REQ_…` or `INC-…`
  support reference.
- REST entry screens fetch same-origin `/api/version`. Environment, version,
  and candidate SHA are validated before presentation; invalid or incomplete
  identity fails closed as `Environment unavailable · release not verified`.
- `/portals` is the non-authenticating portal selector. Request, Lending, staff
  sign-in, and portal-selection navigation is consistent, keyboard reachable,
  responsive, and marks the current page.
- Staff sign-in remains the canonical
  `https://logistics.hausc.org/login`. Host routing itself remains a later
  owner-gated slice.
- The password policy is not weakened: 12–128 characters and three character
  categories remain authoritative.

## Lifecycle matrix

| Flow | Expected invariant | Evidence | Result |
| --- | --- | --- | --- |
| Unknown credentials | Fixed denial, no account enumeration, safe correlation | auth service, HTTP handler, client, and local Worker tests | PASS |
| Starter activation | Token only in HttpOnly cookie; activation rotates to normal session | auth handler, browser, and local Worker tests | PASS |
| Password policy | Existing 12–128 / three-category policy; sub-eight rejected | auth crypto and activation browser tests | PASS |
| Normal login | Credentialed request; server-owned role/scope; no role selector | auth client, service, browser, and local Worker tests | PASS |
| Session refresh | Cookie-backed session; expired/disabled/revoked/locked state fails closed | auth client and service tests | PASS |
| Logout | CSRF-protected logout clears cookie and revokes server session | handler and local Worker browser/API proof | PASS |
| Browser back after logout | Protected workspace is not restored; root returns to login | focused local Worker Playwright proof | PASS |
| Password reset completion | Safe correlated HTTP boundary; stale sessions revoked by service | handler and auth service tests | PASS |
| Unauthorized deep link | Server authorization remains authoritative and fail closed | local Worker role/route suites | PASS |
| Auth service failure | Generic retryable error; raw transport text not surfaced | auth client and browser tests | PASS |
| Release identity | Same-origin Worker identity overrides bundle build mode; invalid identity fails closed | release identity unit and responsive browser tests | PASS |
| Portal navigation | Request, Lending, staff, and selector links remain consistent without widening authorization | responsive browser and requester/lending journey tests | PASS |
| Cookie scope | Secure/HttpOnly/SameSite=Lax/Path=/; no shared Domain | auth handler tests and unchanged serializer contract | PASS |

## Verification evidence

- Focused authentication and release-identity Vitest: 6 files / 30 tests
  passed.
- Full auth-gateway Playwright: 11 executed / 11 passed; 49 intentional
  project skips.
- Focused local Worker Playwright: 2 / 2 passed for safe unknown-credential
  correlation and activation/logout/back-button behavior.
- Full `npm run check`: governance, ESLint, 78 Vitest files / 509 tests,
  preview build, deterministic shareables and Apps Script bundle, Apps Script
  and dist verification, Cloudflare types, staging build, and Wrangler local
  binding dry-run passed.
- `git diff --check`: passed.

## Boundaries

No database migration, provider mutation, staging upload, production deploy,
domain change, Google action, GitHub push, or pull-request action occurred.
Production remains on immutable v0.7.0. The dead public requester portal was
not enabled because its Worker submission route intentionally remains
unsupported. Host activation and production release identity remain gated to
the later accepted deployment slices.
