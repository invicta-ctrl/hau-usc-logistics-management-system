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
- Final recovery export is 1,235,317 bytes with SHA-256
  `db5e7688259c230920b7e4f6e6682fe655c9355e0383f733d472e13a6c90a7f1`.
  Its independent 76-table restore reports integrity `ok` and zero foreign-key
  violations.

Provider identifiers, bookmarks, routes, credentials, and the SQL exports are
retained outside Git. Recovery follows `docs/BACKUP_AND_RECOVERY.md`.
