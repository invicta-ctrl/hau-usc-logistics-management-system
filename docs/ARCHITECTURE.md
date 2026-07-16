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

## Authoritative refresh and synchronization

The Apps Script browser does not treat a successful command response as refreshed application state. The mutation coordinator waits for the command once, reloads the internal bootstrap, normalizes and accepts that state, rerenders, and only then shows success. If the command was recorded but bootstrap reload fails, the command is not retried; the user receives a recorded-but-not-refreshed warning, correlation context when available, and a Refresh action that performs only a read.

Apps Script HTML Service has no native WebSocket channel for this application. Internal clients therefore call the compact `api_getScopedRevision` endpoint on a 15-second cadence with bounded jitter while the document is visible, online, and focused or recently active. One revision check may be active at a time, repeated failures back off, hidden/offline tabs pause, and `HAU_NEAR_LIVE_REFRESH_ENABLED` defaults false so scheduled checks fail closed. An unchanged token performs no module read. A changed token invalidates and reloads only the active bounded module when the browser has no dirty form, request draft, pending upload, or active modal workflow; otherwise the runtime shows an updates-available banner. Manual and post-mutation module refresh remain available when scheduled polling is disabled.

`17_CONFIG` stores `DATA_REVISION` and `DATA_REVISION_UPDATED_AT`. The mutation guard advances the revision exactly once for each successful non-replay state change. Read-only bootstrap, search, validation, health, and diagnostic operations do not advance it. Direct human edits use the separately installed `handleOperationalSheetEdit(e)` trigger because Apps Script-originated writes do not fire spreadsheet edit triggers.

```text
Browser command → adapter → authorized locked mutation → audit/idempotency
                                                        ↓ exactly once
                                               shared data revision
                                                        ↓
Active bounded-module reload ← changed scoped token ← 15-second jittered compact check
          ↓
accept + normalize + render, or defer behind dirty-form banner
```

## Lending search and catalog management

The internal bootstrap contains the few hundred inventory items needed by the Lending Hub, so predictive ranking occurs locally for responsive keyboard/touch interaction. The authoritative hidden Item ID can only be populated from a suggestion. Exact IDs/names, aliases, prefixes, token matches, and substring matches are ranked in that order. Availability and audience explanations assist the user, but the server rechecks item status, VERIFY, handling, audience, maximum quantity, available-to-promise, and due date during creation, approval, and handoff.

Catalog UI code calls the service adapter for item lookup, creation, update, storage-context changes, archive, and restore. Internal item-detail lookup requires `Can_Review` or `Can_Manage_Catalog`; catalog mutations require `Can_Manage_Catalog`, a script lock, idempotency, server-generated IDs, audit data, and status history. Metadata commands cannot replace ledger-derived quantity truth or historical provenance. The request-only portal receives none of the catalog controls, permissions, revision fields, or internal policy/balance fields, and does not start the internal polling controller.

The global revision remains the mutation/audit sequence. A single CONFIG JSON row stores per-module monotonic tokens. Each successful non-replay mutation increments the global revision once and only the conservatively mapped affected module tokens; unknown operations and direct human Sheet edits invalidate all modules. The scoped endpoint re-authorizes the requested module on every call and returns only contract metadata, the scoped/global token, update time, environment, enabled state, and read counters.

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
