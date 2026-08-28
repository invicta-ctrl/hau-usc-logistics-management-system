import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, realpath, stat } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

function inside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function privateFile(value, label) {
  if (!path.isAbsolute(value ?? '')) throw new Error(`${label} must be an absolute private path.`);
  const resolved = await realpath(value);
  if (inside(repoRoot, resolved) || !(await stat(resolved)).isFile()) {
    throw new Error(`${label} must be a private file outside the repository.`);
  }
  return resolved;
}

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeAggregate(value) {
  if (Array.isArray(value)) return value.length;
  if (Number.isFinite(Number(value))) return Number(value);
  if (value && typeof value === 'object' && Number.isFinite(Number(value.count))) return Number(value.count);
  return 0;
}

const reportPath = await privateFile(argument('--report'), 'Baseline report');
const manifestPath = await privateFile(argument('--manifest'), 'Resource manifest');
const databasePath = await privateFile(argument('--database'), 'Baseline database');
const [report, manifest, privacyTransform] = await Promise.all([
  readFile(reportPath, 'utf8').then(JSON.parse),
  readFile(manifestPath, 'utf8').then(JSON.parse),
  readFile(path.join(repoRoot, 'scripts', 'playground', 'baseline-data.mjs')),
]);

const database = new DatabaseSync(databasePath, { readOnly: true });
const count = (sql, parameters = []) => Number(database.prepare(sql).get(...parameters)?.count ?? 0);
const groups = (table, column, predicate = '1 = 1') =>
  Object.fromEntries(
    database
      .prepare(
        `SELECT COALESCE(NULLIF(TRIM(${column}), ''), 'UNSPECIFIED') AS label, COUNT(*) AS count
           FROM ${table}
          WHERE ${predicate}
          GROUP BY label
          ORDER BY label`,
      )
      .all()
      .map((row) => [String(row.label), Number(row.count)]),
  );

try {
  const requiredExceptions = [
    'PRODUCTION_CREDENTIALS_EXCLUDED',
    'PRODUCTION_SESSIONS_AND_TOKENS_EXCLUDED',
    'PROTECTED_IDENTITY_ROSTER_EXCLUDED',
    'PERSONAL_AND_CONTACT_FIELDS_PSEUDONYMIZED',
    'PRIVATE_EVIDENCE_OBJECTS_EXCLUDED',
    'PRIVATE_EVIDENCE_METADATA_REDACTED',
    'SYNTHETIC_STAGING_TEST_ACCOUNTS_OVERLAID',
  ];
  const parityExceptions = Array.isArray(report.parityExceptions) ? report.parityExceptions : [];
  const integrity = String(
    database.prepare('PRAGMA integrity_check').get()?.integrity_check ?? '',
  ).toLowerCase();
  const foreignKeyViolations = database.prepare('PRAGMA foreign_key_check').all().length;
  const schemaVersion = String(
    database.prepare("SELECT value FROM app_metadata WHERE key = 'operational_schema_version'").get()
      ?.value ?? '',
  );
  const latestMigration = String(
    database.prepare('SELECT name FROM d1_migrations ORDER BY id DESC LIMIT 1').get()?.name ?? '',
  );
  const sanitizedExportSha256 = String(report.sanitizedExportSha256 ?? '').toLowerCase();
  const storedBaseline = JSON.parse(
    String(
      database.prepare("SELECT value FROM app_metadata WHERE key = 'playground.clean_baseline'").get()
        ?.value ?? '{}',
    ),
  );
  const baselineId =
    storedBaseline.baselineId ??
    `PGBL-${String(report.capturedAt ?? '')
      .slice(0, 10)
      .replaceAll('-', '')}-${sanitizedExportSha256.slice(0, 12)}`;
  const status =
    report.integrityOk === true &&
    report.foreignKeyViolations === 0 &&
    integrity === 'ok' &&
    foreignKeyViolations === 0 &&
    schemaVersion === '32' &&
    latestMigration === '0032_staff_account_activity_history.sql' &&
    requiredExceptions.every((entry) => parityExceptions.includes(entry)) &&
    manifest.status === 'READY'
      ? 'PASS'
      : 'FAIL';

  const result = {
    status,
    baseline: {
      id: baselineId,
      version: Number(storedBaseline.baselineVersion ?? 1),
      capturedAt: storedBaseline.capturedAt ?? report.capturedAt,
      sourceBaselineId: storedBaseline.sourceBaselineId,
      sourceClassification:
        storedBaseline.sourceClassification ??
        'PRODUCTION_READ_ONLY_PRIVACY_FILTERED_WITH_SYNTHETIC_STAGING_OVERLAY',
      coverageOverlayVersion: storedBaseline.coverageOverlayVersion,
      sourceProductionVersion: report.sourceProductionVersion,
      sourceProductionSha: report.sourceProductionSha,
      sourceExportSha256: report.sourceExportSha256,
      sanitizedExportSha256,
    },
    privacy: {
      transformVersion: `baseline-data.mjs-sha256:${hash(privacyTransform)}`,
      parityExceptions,
      syntheticStagingAccountCount: Number(report.syntheticStagingAccountCount ?? 0),
      generatedInventoryAliasCount: Number(report.generatedInventoryAliasCount ?? 0),
    },
    database: {
      operationalSchema: schemaVersion,
      latestMigration,
      integrityOk: integrity === 'ok',
      foreignKeyViolations,
    },
    domainCounts: {
      inventoryItems: count('SELECT COUNT(*) AS count FROM inventory_items'),
      itemAliases: count('SELECT COUNT(*) AS count FROM item_aliases'),
      postedLedgerRows: count("SELECT COUNT(*) AS count FROM inventory_ledger WHERE status = 'POSTED'"),
      requests: count('SELECT COUNT(*) AS count FROM requests'),
      requestLines: count('SELECT COUNT(*) AS count FROM request_lines'),
      reservations: count('SELECT COUNT(*) AS count FROM reservations'),
      lendingTickets: count('SELECT COUNT(*) AS count FROM lending_tickets'),
      lendingHandoffs: count('SELECT COUNT(*) AS count FROM lending_handoffs'),
      lendingReturns: count('SELECT COUNT(*) AS count FROM lending_returns'),
      releaseConfirmations: count('SELECT COUNT(*) AS count FROM release_confirmations'),
      restockRequests: count('SELECT COUNT(*) AS count FROM restock_requests'),
      restockReceipts: count('SELECT COUNT(*) AS count FROM restock_receipts'),
      receivingRecords: count('SELECT COUNT(*) AS count FROM receiving_records'),
      suppliers: count('SELECT COUNT(*) AS count FROM suppliers'),
      canvassReferences: count('SELECT COUNT(*) AS count FROM canvass_references'),
      eventSeries: count('SELECT COUNT(*) AS count FROM event_series'),
      eventDays: count('SELECT COUNT(*) AS count FROM event_days'),
      eventActivities: count('SELECT COUNT(*) AS count FROM events'),
      eventOperationalLinks: count('SELECT COUNT(*) AS count FROM event_operational_links'),
      evidenceMetadata: count('SELECT COUNT(*) AS count FROM evidence_metadata'),
      accounts: count('SELECT COUNT(*) AS count FROM accounts'),
      activeAccounts: count("SELECT COUNT(*) AS count FROM accounts WHERE status = 'ACTIVE'"),
      roles: count('SELECT COUNT(*) AS count FROM roles'),
      capabilities: count('SELECT COUNT(*) AS count FROM capabilities'),
      roleCapabilities: count('SELECT COUNT(*) AS count FROM role_capabilities'),
      canonicalPeople: count('SELECT COUNT(*) AS count FROM canonical_people'),
      accountPersonLinks: count('SELECT COUNT(*) AS count FROM account_staff_links'),
      staffAssignments: count('SELECT COUNT(*) AS count FROM staff_assignments'),
      staffActivityRows: count('SELECT COUNT(*) AS count FROM staff_account_activity_history'),
      referenceRecords: count('SELECT COUNT(*) AS count FROM reference_records'),
      referenceLinks: count('SELECT COUNT(*) AS count FROM reference_links'),
      brandAssetSlots: count('SELECT COUNT(*) AS count FROM brand_asset_slots'),
    },
    coverage: {
      inventory: {
        inStock: count(
          'SELECT COUNT(*) AS count FROM inventory_items item JOIN inventory_balances balance ON balance.item_id = item.id WHERE balance.available_to_promise > item.reorder_threshold',
        ),
        lowStock: count(
          'SELECT COUNT(*) AS count FROM inventory_items item JOIN inventory_balances balance ON balance.item_id = item.id WHERE balance.available_to_promise > 0 AND balance.available_to_promise <= item.reorder_threshold',
        ),
        outOfStock: count('SELECT COUNT(*) AS count FROM inventory_balances WHERE available_to_promise <= 0'),
        lendable: count(
          "SELECT COUNT(*) AS count FROM inventory_items WHERE lending_audience <> 'NOT_AVAILABLE_FOR_LENDING'",
        ),
        consumable: count("SELECT COUNT(*) AS count FROM inventory_items WHERE handling = 'CONSUMABLE'"),
        categories: count(
          "SELECT COUNT(DISTINCT category) AS count FROM inventory_items WHERE TRIM(category) <> ''",
        ),
      },
      requestsByStatus: groups('requests', 'status'),
      requestLinesByStatus: groups('request_lines', 'status'),
      requestLinesByFulfillment: groups('request_lines', 'fulfillment_source'),
      reservationsByStatus: groups('reservations', 'status'),
      lendingByStatus: groups('lending_tickets', 'status'),
      lendingByType: groups('lending_tickets', 'ticket_type'),
      restockingByStatus: groups('restock_requests', 'status'),
      deliverablesByStatus: groups('deliverables', 'status'),
      eventsByStatus: groups('events', 'status'),
      accountsByStatus: groups('accounts', 'status'),
      roleCapabilities: Object.fromEntries(
        database
          .prepare(
            `SELECT role_id, GROUP_CONCAT(capability_id, ',') AS capabilities
               FROM role_capabilities
              GROUP BY role_id
              ORDER BY role_id`,
          )
          .all()
          .map((row) => [String(row.role_id), String(row.capabilities).split(',').sort()]),
      ),
    },
    r2: {
      brand: {
        baseline: manifest.r2?.brand?.baseline,
        working: manifest.r2?.brand?.working,
        parity: manifest.r2?.brand?.parity,
      },
      evidence: {
        baselineControlObjects: normalizeAggregate(manifest.r2?.evidence?.baselineControlObjects),
        workingApplicationObjects: normalizeAggregate(manifest.r2?.evidence?.workingApplicationObjects),
        productionPrivateObjectsCopied: normalizeAggregate(
          manifest.r2?.evidence?.productionPrivateObjectsCopied,
        ),
        parity: manifest.r2?.evidence?.parity,
      },
    },
    frontend: {
      sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim(),
      sourceTree: execFileSync('git', ['rev-parse', 'HEAD^{tree}'], {
        cwd: repoRoot,
        encoding: 'utf8',
      }).trim(),
    },
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (status !== 'PASS') process.exitCode = 2;
} finally {
  database.close();
}
