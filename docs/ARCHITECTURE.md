# Architecture

## Runtime boundaries

The approved HTML/CSS baseline is extracted into `src/visual/` and `src/styles/visual/`. Feature handlers call `createLegacyRuntimeAdapter()`; local builds receive the in-browser mock service, while `apps-script/Index.html` receives `AppsScriptAdapter`. Only that adapter knows `google.script.run`.

```text
Approved visual modules
        ↓
Browser service contract
   ↙          ↓          ↘
Mock       Apps Script   Future HTTP API
              ↓
Authorization → validation → lock/idempotency → workflow service
              ↓
Sheet repositories + Drive evidence + audit/status/error logs
```

Apps Script files are intentionally separated by concern: configuration and validation, generic Sheet repository, identity and permissions, ID/audit/error infrastructure, workflow services, Drive/evidence, migration/backup, and setup/router entry points.

## Authority model

- Posted ledger rows and active reservations determine inventory availability.
- Operational Sheets are server-owned tables; manual spreadsheet editing is monitoring/reconciliation only.
- Original legacy tabs and exact imported values are immutable migration evidence.
- Drive stores evidence bytes; `12_EVIDENCE` stores searchable metadata and links.
- Request-only clients receive catalog suggestions and their operation result, not ledgers, supplier TINs, users, borrower history, or audit data.

## Build outputs

Vite generates a single-file standalone build. A build script copies it to the reviewer artifact and injects staging runtime configuration into `apps-script/Index.html`. The future static-host build remains independent of Apps Script globals.

## Transaction model

Apps Script uses `LockService.getScriptLock()` for state-changing commands. Each command checks an idempotency key, validates current state, allocates server IDs, appends records, writes history/audit, and stores the result for safe replay. Paired transfer ledger rows are appended in one range write. Google Sheets is not a general ACID database; the launch runbook requires controlled concurrency and reconciliation monitoring.
