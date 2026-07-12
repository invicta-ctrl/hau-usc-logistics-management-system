# Apps Script Staging Web App Incident — 2026-07-12

## Purpose

This document records the exact stopping point of the staging web app deployment work so a fresh ChatGPT or Codex session can continue without repeating setup, migration, Drive, or deployment steps blindly.

This is an active staging incident, not a production incident.

## Repository checkpoint before this documentation commit

- Repository: `invicta-ctrl/hau-usc-logistics-management-system`
- Branch: `feat/apps-script-backend-and-launch-readiness`
- Pull request: draft PR #2
- Code head before this incident log: `cc878ea8b89e9af98eeda3c949a4ed1595242806`
- PR state at that checkpoint: open, mergeable, unmerged
- GitHub Apps Script static check on that checkpoint: passed
- GitHub CI on that checkpoint: passed

Always verify the current remote head and CI before making another change because this file itself creates a later documentation commit.

## Staging setup already completed successfully

The following staging work was completed before the web app rendering incident:

- A dedicated staging Apps Script project was created.
- The Apps Script API was enabled for the account.
- Local `clasp` authentication and push were completed.
- The three required Script Properties were configured:
  - `HAU_ENVIRONMENT = STAGING`
  - `HAU_SPREADSHEET_ID = <configured staging operational spreadsheet>`
  - `HAU_BACKUP_SPREADSHEET_ID = <configured staging backup spreadsheet>`
- Runtime configuration validation completed.
- `setupDatabase()` completed against staging.
- Database schema validation completed.
- The dedicated staging Drive root and child evidence folders were configured and validated.
- Migration dry-run completed.
- Reconciliation completed.
- A timestamped launch backup was created in the staging Archive and Recovery folder.
- Daily triggers were created and verified:
  - `updateOverdueLending`
  - `scheduledBackup`
- No production migration was applied.
- No PR was merged.

Exact staging IDs and deployment URLs are intentionally not committed. They remain in Apps Script Script Properties, the local untracked `.clasp.json`, and the user's Google Workspace resources.

## What initially failed

The first staging web app deployment returned a blank white Apps Script page.

Browser inspection showed:

- The document title was present.
- The body HTML length was `0`.
- No useful application-side JavaScript error appeared.

The Apps Script bundle was then split into:

- `apps-script/Index.html`
- `apps-script/AppBody.html`
- `apps-script/AppStyles.html`
- `apps-script/AppScript.html`

After the split, the application markup and loading overlay rendered, proving that the blank-body problem was partially resolved.

## Second failure: loading overlay never completed

Both `/dev` and `/exec` eventually rendered the interface shell but stayed on:

> Preparing the Logistics workspace...

Apps Script Executions showed only `doGet` calls and no `api_getBootstrapData` execution. This proved that the browser bootstrap had not reached the backend adapter.

Several generator changes attempted to address this:

- `fc51d85a9d3a6f35094840003486ac2bd0e236e1` — initialize after late script evaluation
- `e5d73cabc4a39799cae94ee39daac20e1106bdf4` — wrap Apps Script partials in executable shell tags
- `a5a359afa22c69834f04b701996dbec5ced52a98` — support minified bootstrap identifiers
- `cc878ea8b89e9af98eeda3c949a4ed1595242806` — validate minified bootstrap identifiers

Earlier staging-read improvements also converted Sheet `Date` values into browser-safe strings and reused the opened spreadsheet within a request, but the browser never reached bootstrap, so those changes were not the immediate blocker.

## Current observed failure

After pushing the latest generated bundle and creating web app **Version 6**:

- Repeated `doGet` executions failed in roughly half a second.
- Apps Script displayed only:

> The log entry was too large and was omitted.

- The web app page displayed a large block of raw minified JavaScript as visible text.
- The dashboard did not initialize.
- No end-to-end staging workflow was run.

The exact server exception is not yet known because Apps Script omitted the oversized log entry. Do not claim that the root cause is confirmed.

## Strong evidence and current interpretation

The incident is now isolated to Apps Script HTML generation or template evaluation, before the normal bootstrap API call.

Observed facts:

1. The backend setup, schema, Drive configuration, migration dry-run, reconciliation, backup, and triggers completed independently.
2. Earlier versions completed `doGet` but did not execute the browser bootstrap.
3. Version 6 now fails inside `doGet`.
4. Raw bundled JavaScript became visible page text.
5. `api_getBootstrapData` was not reached during the stuck-loading phase.

Areas that require investigation, without assuming which one is the cause:

- Apps Script template evaluation of a very large included JavaScript partial
- Incorrect or nested `<script>` / `<style>` container handling
- HTML escaping or literal source emission from `include_()`
- A `</script>` sequence or template delimiter inside the bundled source terminating the shell unexpectedly
- HTML Service size, parsing, or logging behavior
- A generated `Index.html` structure that passes static checks but is not valid after Apps Script evaluation

## Important safety boundary

Do **not** rerun the following merely to troubleshoot the rendering incident:

- `setupDatabase()`
- `setupDriveFolders()`
- migration application
- migration dry-run
- reconciliation
- launch backup
- trigger setup

Those stages already completed. Repeating them adds noise and can create duplicate or unnecessary staging artifacts.

Do not touch production resources. Do not run `applyApprovedMigration()`. Do not merge PR #2.

## Recommended next milestone

Treat the next task as a bounded deployment-packaging investigation, not a general backend review.

### Step 1 — verify repository and local state

```powershell
cd "D:\Documents\DOL Website GitHub"
git fetch origin --prune
git switch feat/apps-script-backend-and-launch-readiness
git pull --ff-only
git status --short
git rev-parse HEAD
```

Stop if the working tree is dirty or another agent is writing.

### Step 2 — reproduce the exact generated bundle locally

```powershell
npm ci
npm run build
npm run check:apps-script
```

Inspect the generated files, especially:

- `apps-script/Index.html`
- `apps-script/AppScript.html`
- `scripts/create-apps-script-bundle.mjs`

Do not hand-edit generated Apps Script HTML as the permanent fix. Correct the generator and regenerate.

### Step 3 — add a deterministic render/package test before another deployment

The test should construct or emulate the final Apps Script HTML shell and verify at minimum:

- the body markup appears exactly once
- CSS is inside one executable `<style>` block
- JavaScript is inside one executable `<script>` block
- no JavaScript source is emitted as visible body text
- no nested script/style wrapper remains in raw partials
- the bootstrap function is invoked exactly once
- the resulting document can be parsed and reaches a mocked `api_getBootstrapData` call

A static string-presence check alone is insufficient because the current bundle passed static checks yet failed in Apps Script.

### Step 4 — use a minimal diagnostic deployment before the full bundle

Temporarily create a controlled diagnostic shell through the generator or a separate diagnostic file that proves, in order:

1. `doGet` can evaluate the template.
2. The body partial renders.
3. The style partial applies.
4. A tiny inline script executes.
5. A tiny `google.script.run` call executes.
6. Only then restore the full generated application script.

Keep diagnostic changes isolated and reversible. Do not overwrite staging data.

### Step 5 — deploy only after local checks pass

Run:

```powershell
clasp status
clasp push
```

Then create one new version of the existing web app deployment and test `/exec`. Avoid repeated version creation while the same local evidence is unresolved.

## Suggested Codex task boundary

A fresh Codex task may be useful now, but it should be narrowly scoped:

> Diagnose and fix the Apps Script HTML Service packaging failure on branch `feat/apps-script-backend-and-launch-readiness`. Start from the current remote head. Do not alter backend domain behavior, staging data, visual design, Script Properties, Drive resources, or production resources. Reproduce `npm run build`, inspect the generated Apps Script shell and partials, add a deterministic render/package regression test, and fix the generator so the evaluated page executes the browser bootstrap instead of displaying raw minified JavaScript. Run `npm run check`. Do not run `clasp push` or create a deployment unless explicitly authorized after review.

## Fresh-chat starter

Use this in the next project conversation:

> Continue the HAU-USC Logistics staging deployment incident. Verify repository `invicta-ctrl/hau-usc-logistics-management-system`, branch `feat/apps-script-backend-and-launch-readiness`, draft PR #2. Read `AGENTS.md`, `docs/WORK_CONTINUATION.md`, and `docs/INCIDENT_APPS_SCRIPT_STAGING_WEBAPP_2026-07-12.md` first. Confirm the current head and CI. The staging database, Drive folders, migration dry-run, reconciliation, launch backup, and triggers are already complete. Do not rerun them. The current blocker is Apps Script HTML generation: Version 6 `doGet` fails with an omitted oversized log and the web page displays raw minified JavaScript. Investigate the generated shell and add a deterministic render test before another deployment.

## Evidence retained outside Git

The user has screenshots showing:

- the blank-body stage
- the stuck loading overlay
- Executions with only `doGet`
- Version 6 failed `doGet` entries
- the omitted oversized log message
- raw minified JavaScript rendered as page text
- multiple GitHub Actions notification emails during intermediate packaging attempts

These screenshots contain operational context and are not committed as repository assets.