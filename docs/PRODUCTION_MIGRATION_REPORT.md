# v0.7.0 Production Migration Report

Production launch source: `dc98d670fdd63f649037616c5a2d51e5c62ca4ae`.

- Prelaunch production D1 contained no application data and had 29 pending
  migrations. An export and Time Travel bookmark were retained before writes.
- Migrations 0001 through 0029 applied in repository order with schema metadata
  and migration ledger agreement.
- Approved inventory, event, account, and brand metadata seeds were applied and
  replayed idempotently.
- Post-launch reconciliation reports schema 29 / migration 0029 and zero
  foreign-key violations.
- Final zero-session recovery export is 1,235,351 bytes with SHA-256
  `1018c5e6e19c2e2da50c0910950ca40c6cbc54a77a47537951622c40621e8452`.
  Its independent 76-table restore reports integrity `ok` and zero foreign-key
  violations.

Provider identifiers, bookmarks, routes, credentials, and the SQL exports are
retained outside Git. Recovery follows `docs/BACKUP_AND_RECOVERY.md`.
