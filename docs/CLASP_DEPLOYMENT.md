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
clasp push --dry-run
clasp push
```

Create separate staging and production Apps Script projects or use carefully managed deployments. Build before each push so `apps-script/Index.html` is current. Deploy the web app with the institutional owner, execute as the owner only when the documented authorization model is acceptable, and restrict access to the intended HAU audience. Maintain a deployment log with date, git commit, Apps Script version, environment, owner, smoke-test result, and rollback version.

Production promotion requires a passing staging launch checklist, schema/Drive health checks, a new backup, reviewed access rows, CI success, and manual request-only data-leak testing. Never use `clasp push` as production deployment evidence by itself.
