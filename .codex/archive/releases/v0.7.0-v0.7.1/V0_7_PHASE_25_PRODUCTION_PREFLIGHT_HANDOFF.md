# v0.7.0 Phase 25 Production Authorization and Preflight Handoff

Status: ACCEPTED — PRODUCTION UNTOUCHED

Frozen candidate: `73612344a7e0b1f533ff56a3e24695176bb9a75e`

Staging baseline entering the gate: `d095685e223be2697cc72582d35967e70cfd5163`

Schema: 29 / `0029_reusable_asset_reassignment.sql`

## Authorization and resource separation

- The owner-authorized outside-Git production package is bound to the exact
  candidate SHA, build/Worker/migration/mapping hashes, approved active launch
  window, operator labels, smoke classification, rollback inputs, and private
  production targets.
- Production Worker, D1, brand R2, evidence R2, environment, candidate,
  observability, route label, and Google configuration are distinct from the
  staging bindings. Preview URLs are disabled and the target is production.
- The production secret package contains all four application secrets and the
  ten required Google credentials/private identifiers. Values are complete,
  mutually distinct where required, retained outside Git, and unapplied.
- The private production export/bookmark evidence is fresh, integrity is
  `ok`, foreign-key violations are zero, test-data promotion is false, and no
  active synthetic production account exists.

## Google production truth

- A dedicated production roster-reader service account has only source-level
  Viewer access. A live `spreadsheets.readonly` request through that identity
  read the approved `Official!A1:M128` range as 128 rows by 13 columns without
  exposing cell values.
- The active service-account key was transferred through an ephemeral local
  encryption envelope and identity-validated before storage outside Git. The
  failed transfer key and all earlier inaccessible download attempts were
  revoked; no plaintext key entered repository output.
- Six production Drive roles were created and privately verified through the
  narrow `drive.file` OAuth grant. The OAuth-created hierarchy is separated by
  production app properties and is the authoritative production mapping.
- An earlier empty connector-created hierarchy is preserved only as private
  superseded setup context; it is not referenced by the production mapping.
- Email verification remains truthfully `NOT_CONFIGURED` and non-operational.
  No healthy provider state was fabricated.

## Verification

- Focused OAuth/environment tests: 11 / 11.
- `npm run check`: 75 Vitest files / 494 tests plus governance, lint, builds,
  generated parity, Apps Script, standalone artifacts, Cloudflare types, and
  Cloudflare dry-run.
- Private staging/production environment preflight: passed.
- Private production authorization check: authorized for the active window.
- Private production launch preflight: authorized for the active window.
- Exact production Wrangler package dry-run: passed without upload.
- Candidate and upstream are equal; the only untracked path is the preserved
  `.codegraph/` directory.

## Boundary and next phase

Phase 25 passes. Production was not deployed, migrated, configured, seeded,
written, or smoke-tested. Continue directly to Phase 26 final freeze: deploy
the exact candidate to staging, run the full repository and deployed browser
gates, confirm exact-head CI, and record the immutable release/hash package.
