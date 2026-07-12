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

Every sensitive server action resolves the active Google identity and checks `14_USERS_ACCESS`. Frontend role display is not security. Catalog exceptions, migration, configuration, access changes, cycle-count adjustments, and event-item merges require admin permission.

## Public/request-only boundary

The request-only bootstrap returns event choices and sanitized catalog suggestions, including only the aggregate availability needed for a provisional full/partial/none decision. It excludes users, authorization flags, physical/on-hand history, ledger rows, reservations, suppliers/TINs, borrower records, evidence internals, audits, errors, and admin functions. Server entry points still reject staff commands invoked manually.

## Secrets and personal data

Use Script Properties or controlled config for secrets; do not store them in client JavaScript or git. Spreadsheet/Drive IDs must not appear in public error details. Logs may retain stack traces only in `18_ERROR_LOG`; public errors receive code, safe message, correlation ID, retryability, and safe details.

Borrower/student/contact data belongs only in authorized operational tables. It never appears in Drive filenames. Define retention, breach response, offboarding, least-privilege sharing, quarterly access review, and institutional identity requirements before launch.
