# Future Hosting and Database

Do not delay the Apps Script pilot for this migration. The browser contract already isolates hosting/backend choices.

## Recommended future hosting

Cloudflare Pages is the leading static-host option for this repository because of GitHub preview deployments, low-cost static delivery, custom domains, response-header controls, rollbacks, and a natural Workers API path. Firebase Hosting is a strong alternative if HAU standardizes on Google Cloud identity/functions. Vercel and Netlify remain compatible with the Vite output.

The hosted frontend must call an authenticated server API; it must never expose the Sheet or use Apps Script as an unauthenticated public data proxy. Implement `HttpApiAdapter` against Cloudflare Workers, Firebase Functions, Supabase Edge Functions, or another reviewed backend.

## PostgreSQL/Supabase relational target

| Table | Key and important constraints | Sheet source |
|---|---|---|
| users | UUID PK, unique institutional email, active | 14_USERS_ACCESS |
| roles/user_roles | role PK, user/role unique, permission policy | 14_USERS_ACCESS |
| events/event_series | UUID PK, unique codes, valid date range | 13_EVENTS |
| items | UUID PK, unique display ID, status check, provenance | 01_ITEM_MASTER |
| requests | UUID PK, unique display ID, requester/event FKs | 03_REQUESTS |
| request_lines | UUID PK, request FK, item/event-item FK, quantity checks | 04_REQUEST_LINES |
| reservations | UUID PK, item FK, status/quantity checks, unique idempotency | 05_RESERVATIONS |
| ledger_transactions | UUID PK, unique display ID/idempotency, signed quantity check, immutable | 02_LEDGER |
| lending_tickets | UUID PK, borrower/item FKs, transition/due constraints | 06_LENDING |
| releases/release_lines | UUID PK, request/ticket FKs, quantity checks | 07_RELEASES JSON split into lines |
| restock_receipts | UUID PK, item/request-line FKs, idempotency unique | 08_RESTOCK |
| deliverables/deliverable_receipts | UUID PK/FK, cumulative totals derived | 09_DELIVERABLES plus ledger/evidence |
| suppliers | UUID PK, normalized name/location duplicate index | 11_SUPPLIERS |
| canvass_references | UUID PK, supplier/request-line FKs, checked/expiry indexes | 10_CANVASS |
| evidence | UUID PK, unique Drive/storage ID, digest/entity index | 12_EVIDENCE |
| status_history | UUID PK, entity/type/time index | 15_STATUS_HISTORY |
| audit_logs | UUID PK, correlation/entity/time indexes | 16_AUDIT_LOG |
| idempotency_records | unique `(scope,key)`, response, completed_at | audit idempotency events |
| migration_mappings | UUID PK, unique legacy source coordinate | 19_MIGRATION_MAP |

Use foreign keys, unique constraints on display IDs and idempotency keys, positive-quantity checks, enum/check constraints, and database transactions for each command. Index active reservations by item, ledger by item/event-item/time, request lines by request/status, lending by status/due date, evidence by entity/digest, and audits by correlation ID.

Supabase row-level security should separate requesters’ own submissions from staff operational data. Privileged commands belong in server-side functions/service-role code; never grant browsers direct ledger writes. Migrate with dual reconciliation and a read-only cutover window, not live spreadsheet/public database dual writes.
