# Security and Access

## Roles and permissions

| Role | Review/reserve | Release | Receive | Admin |
|---|---:|---:|---:|---:|
| REQUESTER | no | no | no | no |
| DOL_STAFF | yes | yes | yes | no |
| COMMITTEE_HEAD | yes | no | yes | no |
| DOL_DIRECTOR | yes | yes | yes | yes |
| ADMIN | yes | yes | yes | yes |
| READ_ONLY_AUDITOR | no | no | no | no |

Every sensitive server action resolves the active Google identity and checks `14_USERS_ACCESS`. Frontend role display is not security. Catalog exceptions, migration, configuration, access changes, cycle-count adjustments, event-item merges, and environment health checks require admin permission.

## Public/request-only boundary

The request-only bootstrap returns event choices and sanitized catalog suggestions without exact on-hand, reserved, available-to-promise, verification-note, or legacy-source values. The requester UI labels stock routing as pending DOL review; the locked review command performs the authoritative full/partial/none decision. Request-only data excludes users, authorization flags, ledger rows, reservations, suppliers/TINs, borrower records, evidence internals, audits, errors, configuration values, health reports, and admin functions. Server entry points still reject staff commands invoked manually.

Evidence uploads are also permission-gated server-side before file bytes are decoded or Drive is accessed: receiving evidence requires `Can_Receive`, release/lending evidence requires `Can_Release`, and other supporting documents require `Can_Admin`.

## Deployment configuration

Operational environment and spreadsheet routing are required Apps Script Script Properties: `HAU_ENVIRONMENT`, `HAU_SPREADSHEET_ID`, and `HAU_BACKUP_SPREADSHEET_ID`. They are not committed to git and have no code fallback. Missing, placeholder, malformed, unsupported, or identical operational/backup values fail closed before a Sheet is opened. Operators must verify the admin-only `healthCheck()` result before enabling staging or production writes.

## Secrets and personal data

Use Script Properties or controlled config for secrets; do not store them in client JavaScript or git. Spreadsheet/Drive IDs must not appear in public error details. Logs may retain stack traces only in `18_ERROR_LOG`; public errors receive code, safe message, correlation ID, retryability, and safe property names—not configured values.

Borrower/student/contact data belongs only in authorized operational tables. It never appears in Drive filenames. Define retention, breach response, offboarding, least-privilege sharing, quarterly access review, and institutional identity requirements before launch.
