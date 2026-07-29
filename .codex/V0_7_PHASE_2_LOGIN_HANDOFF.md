# v0.7.0 Phase 2 Staff Login Handoff

Decision: **PHASE 2 ACCEPTED ON STAGING — PRODUCTION NO-GO**

## Delivered

- HAU-inspired responsive `Staff sign in` card using institutional cream, oxblood, restrained gold, serif hierarchy, and a fixed governed R2 key: `brand/login-background`.
- Access ID or unique activated profile-email authentication.
- Accessible Show/Hide password buttons for login and activation, including visible focus, retained value/selection, and no-submit behavior.
- Administrator-governed forgot-password guidance, first-login activation, session-expired, locked/unavailable, throttled, and service-unavailable presentation.
- Request Center and Lending Center links without client-side role selection or authorization claims.
- Additive D1 migration `0010_verified_login_email.sql`; existing duplicate emails are intentionally not verified and cannot be used to sign in.

## Security and data reconciliation

- Pre-migration staging export is retained outside Git under the private v0.7 launch evidence directory.
- Staging schema advanced from 9 to 10 with all 12 pre-migration accounts preserved.
- Post-migration reconciliation found five verified unique emails, zero verified-email collision groups, and four ambiguous activated profiles intentionally left unverified.
- The deployed repeatable smoke created and disabled one synthetic staging account. Final aggregate: 13 accounts, six verified unique emails, zero verified-email collision groups, four ambiguous unverified profiles.
- No production Worker, production migration, production secret application, Google write, merge, tag, or release occurred.

## Verification

- `npm run check`: PASS — governance, lint, 57 Vitest files / 392 tests, build, Apps Script/parity, standalone artifacts, Cloudflare types, and dry-run.
- `npm run test:e2e`: PASS — 92 passed, 214 intentional skips, zero failures across 306 scheduled tests.
- Fresh local Worker/D1: PASS — 15 / 15 before the duplicate-safe migration adjustment; after adjustment 14 / 15 plus the single transient navigation case passed on immediate focused rerun.
- Deployed staging authentication/Access Management/email-login smoke: PASS — 1 / 1.
- Cache-busted live health/readiness/version: PASS at exact runtime `edf6dcb361a8ade04f43ff06a774f6672305aa9a`, release 0.7.0, schema 10, migration 0010, D1/R2/protected configuration ready.
- Deterministic login and onboarding previews were regenerated and visually inspected.

## Rollback

- The previous immutable staging Worker version remains available.
- A complete pre-0010 staging SQL export is retained privately.
- Phase 24 still owns the formal rollback rehearsal; production remains gated.

## Next accepted phase

Phase 3 — Public Request Center without login. The current `/request` implementation still requires an authenticated requester account and therefore does not satisfy Phase 3.
