# Accepted FI-00 through FI-12 Full Playground Backend Population Amendment

STATUS: ACCEPTED
OWNER_AUTHORITY: Earl explicit `I authorize` continuation on 2026-08-27
SOURCE_PACKET: `FM-FRESH-FI00-12-PLAYGROUND-2026-08-27`
LANE: FM / FRONTEND MIGRATION

## Supersession

This amendment supersedes the narrower
`2026-08-27-fi00-fi12-playground-migration-only-amendment.md` for the bounded
backend population, reconciliation, and final Playground acceptance work below.
The prior deployment and public-smoke receipts remain valid historical evidence
and must not be repeated without reconciliation.

## Objective

Populate the already deployed FI-00 through FI-12 isolated Playground with
privacy-filtered, operationally meaningful D1 and R2 data; reconcile schema 32,
ledger-derived inventory, accounts/access, requests, lending, releases,
restocking, receiving, procurement, and required safe objects; then complete
bounded deployed acceptance. No Production deployment is authorized.

## Authorized operations

- Read current Production D1/R2 only as the source of an approved one-way export.
- Preserve the current Playground deployment, D1/R2 recovery point, clean baseline,
  working state, private manifest, and rollback target before mutation.
- Create a private privacy-filtered baseline using the governed repository scripts.
- Import/reset only the existing isolated Playground D1/R2 resources, or create
  replacement Playground-only resources when the accepted runbook requires
  fail-closed replacement rather than in-place mutation.
- Apply only schema/migration state already required by the accepted FI-00 through
  FI-12 candidate: schema 32 and `0032_staff_account_activity_history.sql`.
- Reconcile inventory from append-only movements, reservations, account/access
  relationships, operational workflow records, and safe D1-to-R2 linkages.
- Use installed local and Cloudflare operator authorization without printing or
  committing credentials, tokens, private identifiers, manifests, or exports.
- Run bounded public and authenticated acceptance against
  `https://playground.hausc.org/` and the governed loopback proxy when useful.
- Commit and push the FM branch after verified completion and current-chain closeout.

## Data and privacy contract

- Production is read-only. Playground never synchronizes back to Production.
- Exclude credentials, password material, sessions, CSRF/OTP/reset/verification
  tokens, provider secrets, private evidence, unnecessary contact data, raw private
  identifiers, and recovery material.
- Use deterministic pseudonyms or staging-safe substitutes while preserving required
  relationships, roles, workflow states, representative volume, and referential integrity.
- D1 is structured runtime truth; R2 is governed file/object truth. Google Sheets and
  Drive are not promoted to live truth.
- Inventory balances are derived from append-only ledger movements. Reservations do
  not alter physical on-hand quantity.
- Report the safe baseline as `EXCEPTIONS`, never byte-identical parity.

## Required pre-mutation gates

1. Exact FM branch, HEAD, clean worktree, upstream state, and single writer lock.
2. Existing deployed candidate identity and prior terminal state reconciled.
3. Authenticated Cloudflare operator access and private manifest availability.
4. Exact isolated Playground Worker/D1/R2 tuple with no Production binding crossover.
5. Current D1 schema/migration, row counts, R2 safe manifest, and working-state classification.
6. Verified D1 backup/bookmark/export and R2 rollback/reseed path.
7. Production source access proven read-only and privacy transform proven fail-closed.

## Acceptance

- Schema 32 and migration 0032 accepted with integrity and foreign keys green.
- Inventory, movements, availability, reservations, and lending eligibility reconcile.
- Safe account/access, request, lending, release, restocking, receiving, and procurement
  records are populated and usable where FI-00 through FI-12 exposes them.
- Required R2 objects and D1 metadata links reconcile; private evidence remains excluded.
- Public and authenticated routes are usable at representative desktop/mobile widths.
- No credential/private-data leak, Production traffic, Production write, or FI-13+ scope.
- Known Playground P0/P1/P2 blockers are zero before completion.

## Hard exclusions

No Production deployment, Production D1/R2 mutation, reverse synchronization,
FI-13 through FI-17, Figma write, main promotion, unrelated frontend development,
unapproved schema beyond 32/0032, provider/email send, Google write, destructive
cleanup, history rewrite, or deletion of unknown work.

## Stop conditions

Stop on wrong environment, binding drift, Production crossover, unknown dirty state,
competing writer, missing backup/rollback, privacy uncertainty, non-read-only Production
access, failed transform/integrity/FK/ledger reconciliation, unexpected schema change,
private-value exposure, failed exact-identity proof, or unresolved P0/P1/P2.
