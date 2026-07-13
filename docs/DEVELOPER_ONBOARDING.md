# Developer Onboarding

## Fifteen-minute local start

Prerequisites: Git, Node.js 22, npm, and a clean clone. Google/clasp access is not needed for DEMO development. Never copy someone else's `.clasp.json`, credentials, or live identifiers.

### Minutes 0–3: verify the task boundary

```powershell
git rev-parse --show-toplevel
git branch --show-current
git rev-parse HEAD
git status --short
git fetch origin --prune
```

Follow the handshake in `AGENTS.md`, including upstream comparison or the exact manager-authorized fresh-branch exception. Read the required documents listed there, then confirm the starting commit in the current resume block. Stop on a dirty, divergent, wrong, or unexpected checkout.

### Minutes 3–8: install and verify

```powershell
node --version
npm --version
npm ci
npm test
```

Node should report major version 22. A failure is work to diagnose, not a reason to regenerate baselines, remove tests, or update dependencies casually.

### Minutes 8–12: run the fictional preview

```powershell
npm run dev
```

Open the local URL printed by Vite. This is DEMO mode with fictional browser data. Exercise Overview, Request Center, Lending, Release, Restocking, Procurement, and Inventory. No Google Sheets or Drive resource is changed.

### Minutes 12–15: understand the release shape

```powershell
npm run check:governance
npm run build
npm run verify
```

`npm run build` generates three single-file artifacts from source: `dist/index.html`, the reviewer shareable HTML, and `apps-script/Index.html`. Do not hand-edit them. The complete pre-handoff gate is `npm run check`; Playwright is additional where Chromium is installed.

## Repository map

| Path                                                          | Ownership                                                                                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `legacy/HAU-USC_Logistics-Prototype.original.html`            | Approved immutable visual baseline                                                                                                          |
| `src/visual/`                                                 | Generated/extracted authoritative visual fragments and runtime; regenerate with `npm run extract:visual` when the approved baseline changes |
| `src/styles/visual/`                                          | Authoritative visual styles extracted from the baseline plus reviewed runtime extension                                                     |
| `src/services/`                                               | Browser adapter and service boundaries                                                                                                      |
| `src/app/`, `src/components/`, `src/features/`, `src/domain/` | Modular UI/domain work and testable logic; not all modules are the authoritative build screen tree                                          |
| `apps-script/`                                                | Server identity, validation, workflows, Sheets, Drive, setup, migration, backup, and callables                                              |
| `scripts/`                                                    | Build, packaging, verification, and governance guardrails                                                                                   |
| `tests/unit`, `tests/integration`, `tests/e2e`                | Pure/domain, workflow, and browser coverage                                                                                                 |
| `docs/`                                                       | Canonical contracts, operating procedures, and handoff state                                                                                |

Start architecture questions at [Documentation Index](DOCUMENTATION_INDEX.md), not at an old handoff report.

## Modes and environment truth

| Mode                | How selected                                              | Persistence                  | Identity                            | Safe use                               |
| ------------------- | --------------------------------------------------------- | ---------------------------- | ----------------------------------- | -------------------------------------- |
| DEMO/mock           | Local/default preview configuration                       | Fictional browser state      | Simulated                           | UI, domain, and acceptance development |
| CURRENT Apps Script | Generated Apps Script bundle served by configured project | Operational Sheets and Drive | Active Google institutional account | Authorized staging/production only     |
| FUTURE HTTP         | `HttpApiAdapter` with base URL                            | Not implemented              | Not implemented                     | Contract scaffold only                 |

Source code, local build success, and a clasp source upload do not prove a deployment. Environment state requires the evidence in [Operations and Deployment Runbook](OPERATIONS_AND_DEPLOYMENT_RUNBOOK.md).

## Add or change a visual screen safely

1. Confirm whether the milestone changes the approved legacy baseline or only a runtime extension. Do not casually redesign the baseline.
2. If the approved baseline changed, update the baseline under explicit design approval and run `npm run extract:visual`; review the generated fragment diff.
3. Update the screen title/navigation/view IDs consistently in the authoritative visual shell/runtime/plugin.
4. Keep service calls semantic; no screen may call `google.script.run`, Sheets, or Drive.
5. Add desktop and mobile rendering, keyboard/focus, empty/loading/error, permission-denied, offline, and recorded-but-refresh-failed behavior.
6. Update the screen matrix in [Architecture](ARCHITECTURE.md) and browser tests.
7. Run `npm run check` and the relevant Playwright specs.

If the task instead targets the modular `src/features/` tree, state explicitly whether it is scaffolding or a deliberate build-entry convergence. Do not assume a new module appears in the authoritative Vite output.

## Add or change an API method safely

1. Define purpose, caller, permission, input/output, mutation effect, audit/history, idempotency, locking, errors, and retry semantics in [API and Service Contracts](API_AND_SERVICE_CONTRACTS.md).
2. Add the browser method to the launch contract and implement matching mock, Apps Script adapter, and future HTTP mappings as applicable.
3. Add the `api_*` callable as a thin guard/router. Business logic belongs in the relevant Apps Script service.
4. Resolve identity on the server. Revalidate entity links, state, quantity, and policy under a script lock when they can race.
5. Require `clientRequestId`, allocate IDs server-side, append audit/history, and record the result for replay.
6. Return only a safe result envelope; never return raw config, stack, access row, Sheet range, or Drive ID.
7. Make the browser reload bootstrap after success and preserve the no-resubmit warning if refresh fails.
8. Add adapter, pure/domain, integration, authorization, replay, concurrency/conflict, and browser tests.

## Add a Sheet field or tab safely

1. Determine whether the value is business authority, derived cache, metadata, personal data, or restricted security data.
2. Update `HAU_SHEETS`/`HAU_HEADERS` and repository DTO mapping; never use a row number as identity.
3. Make setup additive and idempotent. Append approved columns without reordering/wiping existing data and backfill only conservative reviewed defaults.
4. Preserve the four legacy tabs and every VERIFY source coordinate/value.
5. Add schema validation, migration dry-run, repeated-setup, old-row compatibility, and rollback/reconciliation tests.
6. Update [Google Sheets Schema](GOOGLE_SHEETS_SCHEMA.md), [Data Dictionary](DATA_DICTIONARY.md), migration documentation, and the current continuation record owned by the orchestrator.
7. Prove the change against a backed-up staging copy before production.

Never write to the pre-rework backup spreadsheet and never repair inventory by editing a posted ledger entry.

## Add an evidence type or Drive permission safely

1. Define the semantic evidence type, allowed related entities, destination configuration key, uploader permission, label/code, and retention class.
2. Authorize before decoding bytes or touching Drive.
3. Keep the folder lookup allowlisted and fail closed; no arbitrary caller folder and no My Drive fallback.
4. Validate size, MIME/extension, entity relationship, and idempotency; compute digest server-side.
5. Keep personal/commercial values out of filenames and public DTOs.
6. Define compensation if Drive succeeds and metadata fails.
7. Update [Google Drive Evidence](GOOGLE_DRIVE_EVIDENCE.md), security/privacy classification, setup validation, and tests.

## Add a permission safely

1. Name it as a positive capability such as `Can_...`; absence and blank mean denied except an explicitly documented migration fallback.
2. Add the access column additively and update role-default mapping only after owner approval.
3. Check it in every server read/mutation entry point before sensitive work. UI visibility is supplementary.
4. Sanitize bootstrap DTOs so request-only or lower-privilege clients never receive the capability or protected fields.
5. Test active/inactive, missing user, each role default, explicit true/false/blank, direct callable invocation, and unauthorized detail leakage.
6. Update [Security and Access](SECURITY_AND_ACCESS.md), admin guidance, API catalog, schema, and acceptance plan.

## Add a migration safely

1. Make discovery/dry-run read-only and produce counts/exceptions without exposing sensitive values.
2. Require an explicit approval state for every mapping or correction; ambiguous rows remain VERIFY.
3. Take and privately record a fresh staging backup.
4. Apply once under admin authorization and a lock, with a migration version/freeze marker, status history, and audit.
5. Preserve exact source sheet, row, block, name, quantity, and unit. Never modify legacy input cells.
6. Reconcile counts, balances, orphan links, duplicates, units, reservations, ledger, evidence, and errors.
7. Roll back application code by deployment pointer and correct data only through an audited forward migration/adjustment.

## Clasp staging workflow

Install clasp only when the manager authorizes staging work. Copy `.clasp.json.example` to ignored `.clasp.json` and enter the staging Script ID locally. Clasp 3.3 has no supported push simulation. Run `clasp status`, then follow the separate temporary remote snapshot, manifest comparison, explicitly authorized push, second pull, and exact parity procedure in [Clasp Deployment](CLASP_DEPLOYMENT.md). Never push production as a development check.

## Troubleshooting

| Symptom                                    | Likely cause                                                | Safe response                                                                                                      |
| ------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `npm ci` rejects Node or lockfile          | Wrong Node major or modified dependency metadata            | Use Node 22 and restore task context; do not delete lockfile                                                       |
| Visual edit does not appear                | Edited non-authoritative module or stale generated artifact | Check Vite authoritative visual plugin and source fragment; rebuild, never patch generated HTML                    |
| Visual extraction creates a broad diff     | Baseline changed or parser assumptions shifted              | Stop and review baseline approval plus every generated fragment                                                    |
| `BACKEND_UNAVAILABLE` locally              | Apps Script/HTTP mode selected outside its host             | Use DEMO for local UI or configure only an authorized staging host                                                 |
| `SETUP_REQUIRED` / `CONFIGURATION_INVALID` | Missing/placeholder/wrong environment properties            | Stop writes; administrator repairs private staging config and reruns health check                                  |
| `DRIVE_FOLDER_INVALID`                     | Missing access, wrong key, deleted/moved folder             | Stop upload; validate all seven reviewed folders; never fall back                                                  |
| `SCHEMA_MISSING`                           | Required tab/header absent                                  | Run additive setup only after backup and authorization; validate again                                             |
| `LOCK_TIMEOUT`                             | Concurrent mutation                                         | Preserve idempotency key, wait briefly, retry once if client marks retryable, then reconcile                       |
| Recorded-but-not-refreshed warning         | Mutation succeeded but bootstrap reload failed              | Do not resubmit; use Refresh and correlate audit/result                                                            |
| Sensitive-content check fails              | Tracked secret/resource/production-shaped identifier        | Inspect the reported category/location privately; remove/generalize and rotate if real; scanner never prints value |
| Documentation link check fails             | Missing canonical page or bad relative link                 | Correct the canonical index/path; do not suppress the validator                                                    |
| Playwright unavailable                     | Chromium dependency absent                                  | Report unrun browser checks honestly; do not claim pass                                                            |

## Before handoff

Run `npm run check`, relevant Playwright specs, `git diff --check`, and `git status --short`. Update only the handoff/status files assigned to your writer role. Commit one small logical unit, report exact SHA and unrun checks, and push only when the manager explicitly authorizes it.
