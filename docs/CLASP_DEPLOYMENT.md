# Clasp Deployment

The repository intentionally excludes `.clasp.json` and `.clasprc.json`. Never commit a real Script ID or OAuth credentials.

```bash
npm install
npm run check
npm run build
npm install --global @google/clasp
clasp login
cp .clasp.json.example .clasp.json
# replace the placeholder locally with the staging Script ID
clasp status
```

Clasp 3.3 has no supported push simulation. Before an explicitly authorized staging push, pull the remote project into a separate ignored temporary directory, compare its complete source/manifest file set with `apps-script/`, and preserve the reviewed `webapp` access block. `clasp status` is a local inclusion check, not remote parity evidence. If the manifest confirmation cannot be completed interactively, stop; do not treat a skipped command with exit code zero as a successful update.

Only after the remote snapshot is reviewed may the operator run `clasp push --force` against staging. Pull a second fresh remote snapshot immediately afterward and require exact source and manifest parity before creating an immutable Apps Script version or moving an existing deployment. Keep `.clasp.json`, temporary snapshots, Script IDs, credentials, and comparison output containing identifiers outside git. The step-by-step evidence and rollback gates are in [Operations and Deployment Runbook](OPERATIONS_AND_DEPLOYMENT_RUNBOOK.md) and [Launch Runbook](LAUNCH_RUNBOOK.md).

Create separate staging and production Apps Script projects or use carefully managed deployments. Build before each push so `apps-script/Index.html` is current. Deploy the web app with the institutional owner, execute as the owner only when the documented authorization model is acceptable, and restrict access to the intended HAU audience. Maintain a deployment log with date, git commit, Apps Script version, environment, owner, smoke-test result, remote-parity result, and rollback version.

Production promotion requires a passing staging launch checklist, schema/Drive health checks, a new backup, reviewed access rows, CI success, and manual request-only data-leak testing. Never use `clasp push` as production deployment evidence by itself.
