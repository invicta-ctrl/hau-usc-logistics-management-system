# Google Sheets migration and reporting sidecar

## Accepted boundary

Google Sheets is an approved migration input and bounded reporting sidecar. After staging cutover, D1 is the operational source of truth. The application does not dual-write normal workflow mutations to Sheets, and a later manual Sheet edit cannot overwrite newer D1 state.

`apps-script/D1ExportService.gs` is deliberately read-only: it builds a deterministic, redacted migration export from the explicitly allowed tabs. It does not create Drive files, modify cells, append rows, deploy a web app, or call the Cloudflare API. The operator must place the export in an approved private location outside Git.

## Export contract

The private JSON export contains:

- safe workbook/owner/purpose labels, never the workbook ID;
- candidate commit and exporter version;
- snapshot time and SHA-256;
- per-tab row count and canonical SHA-256;
- only the columns allowed by `migration/google-sheets-to-d1.v1.json`;
- an explicit data classification and excluded-field list.

Passwords, reset/session material, personal contact data outside the approved migration boundary, supplier tax identifiers, raw Drive IDs/URLs, private configuration, and evidence binaries are excluded. Evidence is represented only by approved safe metadata or a separately authorized bridge.

## Deterministic pipeline

All paths below must be absolute and outside the repository:

```text
approved Sheet snapshot
  -> read-only Apps Script export
  -> migration:validate
  -> migration:prepare
  -> local D1 dry-run and reconciliation
  -> staging D1 import and reconciliation
  -> cutover flag
```

Commands:

```powershell
npm run migration:validate -- --input <private-export.json> --candidate-sha <commit>
npm run migration:prepare -- --input <private-export.json> --output-sql <private-import.sql> --rejections <private-rejections.json> --reconciliation-sql <private-reconcile.sql> --candidate-sha <commit>
```

The prepared SQL uses source fingerprints, `ON CONFLICT` handling, an import batch, and imported-row records. Reapplying the same snapshot must not create duplicate ledger, handoff, return, release, receipt, or idempotency rows. Quarantined rows remain explicit and block acceptance until disposition is approved.

## Reporting sidecar after cutover

If reporting export is authorized later, it must be asynchronous and one-way from D1 through `reporting_outbox` to approved Sheet views. It must:

- use a least-privilege credential stored as a Cloudflare secret or approved Google property;
- export safe projections only;
- record correlation/source identifiers and delivery state;
- tolerate retries idempotently;
- never accept a Sheet row as a silent operational write-back.

## Owner-protected identity roster

Phase 15 adds a separate, read-only Google Sheets integration for the approved
private identity roster. It is not an operational workflow write-back and it
does not reuse the legacy Apps Script access sync.

The Cloudflare Worker reads the configured range only when the authenticated
System Owner requests **Preview sync**. It uses a least-privilege service
account with `spreadsheets.readonly`, validates the exact six-column roster
schema, computes an opaque source fingerprint, and stores protected values in
D1 only after an explicit fingerprint-confirmed apply. Ordinary login and
self-profile reads use only the last applied D1 projection and never query
Google.

Private configuration and secrets:

- `GOOGLE_ROSTER_SPREADSHEET_ID`
- `GOOGLE_ROSTER_RANGE`
- `GOOGLE_ROSTER_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_ROSTER_PRIVATE_KEY` (Cloudflare secret)
- `ROSTER_DATA_ENCRYPTION_KEY` (Cloudflare secret)

The spreadsheet identifier, service-account identity, private key, roster
rows, Student IDs, institutional email addresses, verification results,
review notes, and protected snapshot values must never appear in Git, logs, or
redacted launch evidence. The application reports only missing configuration
key names outside the owner workflow.

Exact source headers, in order:

```text
Student_ID
Institutional_Email
Display_Name
Verification_Result
Active
Review_Notes
```

Accepted verification values are `VERIFIED`, `PENDING`, `NOT_VERIFIED`, and
`REJECTED`. `Active` must be a boolean or exact `TRUE`/`FALSE`. Any invalid or
duplicate Student ID/email rejects the complete preview from apply.

Each apply creates an encrypted, immutable pre-apply D1 snapshot. Only the
latest applied run can be rolled back, with exact fingerprint confirmation and
an audited reason. A post-write count/fingerprint reconciliation is mandatory.

The separate reporting/Drive bridge still remains gated by its private
authorization package.
