import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  canonicalTabRows,
  readMapping,
  sha256,
  validateExport,
} from '../../scripts/migration/export-contract.mjs';

const root = resolve(import.meta.dirname, '../..');
const read = (file) => readFile(resolve(root, file), 'utf8');

async function syntheticExport() {
  const mapping = await readMapping();
  const tabs = {
    '01_ITEM_MASTER': [
      {
        Item_ID: 'ITM-SYNTHETIC',
        Item_Name: 'Synthetic item',
        Unit: 'piece',
        Opening_Qty: 1,
        Updated_At: '2026-07-22T00:00:00.000Z',
      },
    ],
  };
  const tabManifest = Object.entries(tabs).map(([label, rows]) => ({
    label,
    rowCount: rows.length,
    sha256: sha256(canonicalTabRows(rows)),
  }));
  const snapshotHash = sha256(
    tabManifest.map((entry) => `${entry.label}:${entry.sha256}:${entry.rowCount}`).join('\n'),
  );
  return {
    schemaVersion: 1,
    metadata: {
      exporterVersion: mapping.exporterVersion,
      snapshotAt: '2026-07-22T00:00:00.000Z',
      snapshotHash,
      sourceWorkbookLabel: 'Synthetic source workbook',
      sourceOwnerLabel: 'Synthetic owner',
      permittedRowsLabel: 'Fictional row only',
      candidateSha: 'candidate-sha',
      dataClassification: 'SYNTHETIC',
      requiredTabs: ['01_ITEM_MASTER'],
      excludedColumns: mapping.restrictedColumns,
      tabs: tabManifest,
    },
    tabs,
  };
}

describe('Phase 3 Cloudflare and D1 foundation', () => {
  it('routes API requests through a Worker before SPA static-asset fallback', async () => {
    const config = JSON.parse(await read('wrangler.jsonc'));
    expect(config.main).toBe('./src/worker/index.js');
    expect(config.assets).toMatchObject({
      directory: './dist',
      binding: 'ASSETS',
      not_found_handling: 'single-page-application',
      run_worker_first: ['/api/*'],
    });
    expect(config.env.staging.name).toBe('hau-usc-logistics-staging');
    expect(config.env.staging.d1_databases[0]).toMatchObject({ binding: 'DB' });
    expect(config.env.staging.d1_databases[0].database_id).toBe(
      '00000000-0000-0000-0000-000000000000',
    );
  });

  it('implements the required API families and keeps HTTP refresh action-driven', async () => {
    const worker = await read('src/worker/index.js');
    const operations = await read('src/server/d1/operational-service.js');
    const runtime = await read('src/visual/runtime.js');
    const extensions = await read('src/visual/runtime-extensions.js');
    for (const route of [
      '/api/health',
      '/api/readiness',
      '/api/session',
      '/api/auth/',
      '/api/bootstrap',
      '/api/admin/migrations',
    ]) {
      expect(worker).toContain(route);
    }
    for (const family of [
      'requests',
      'lending',
      'releases',
      'inventory',
      'restocking',
      'procurement',
      'receiving',
      'reference',
      'admin',
    ]) {
      expect(worker).toContain(`${family}:`);
    }
    for (const mutation of [
      'submitRequest',
      'reviewRequest',
      'reserveStock',
      'confirmRelease',
      'createLendingTicket',
      'confirmLendingHandoff',
      'confirmReturn',
      'receiveRestock',
      'receiveDeliverable',
    ]) {
      expect(operations).toContain(mutation);
    }
    expect(runtime).toContain("const useEssentialBootstrap=backendMode!=='mock'");
    expect(extensions).toContain("if (isRequestOnly() || backendMode !== 'apps-script'");
  });

  it('defines the complete operational model and database-enforced append-only guards', async () => {
    const migrations = await Promise.all(
      [1, 2, 3, 4, 5, 6, 7].map(async (number) => {
        const files = {
          1: '0001_operational_schema.sql',
          2: '0002_authorization_registry.sql',
          3: '0003_distributed_rate_limit.sql',
          4: '0004_data_revisions.sql',
          5: '0005_import_boundary.sql',
          6: '0006_transaction_guards.sql',
          7: '0007_entity_committee_scope.sql',
        };
        return read(`migrations/${files[number]}`);
      }),
    );
    const sql = migrations.join('\n');
    for (const table of [
      'accounts',
      'sessions',
      'event_series',
      'events',
      'requests',
      'request_lines',
      'inventory_items',
      'reservations',
      'inventory_ledger',
      'restock_requests',
      'restock_receipts',
      'lending_tickets',
      'lending_handoffs',
      'lending_returns',
      'release_confirmations',
      'deliverables',
      'canvass_references',
      'receiving_records',
      'evidence_metadata',
      'status_history',
      'audit_log',
      'idempotency_keys',
      'import_batches',
      'imported_source_rows',
      'reporting_outbox',
    ]) {
      expect(sql).toContain(`CREATE TABLE ${table}`);
    }
    expect(sql).toContain('inventory_ledger_no_update');
    expect(sql).toContain('status_history_no_delete');
    expect(sql).toContain('audit_log_no_update');
    expect(sql).toContain('reservation_consumption_guard');
    expect(sql).toContain('inventory_nonnegative_guard');
    expect(sql).toContain('Google Sheet imports are blocked after D1 cutover');
    expect(sql).toContain('owner_committee_id');
    expect(sql).toContain('assigned_committee_id');
  });

  it('enforces target-entity scope and privileged API-family capabilities', async () => {
    const worker = await read('src/worker/index.js');
    const operations = await read('src/server/d1/operational-service.js');
    expect(worker).toContain('GROUP_CAPABILITY');
    expect(worker).toContain('admin: CAPABILITIES.SYSTEM_ADMIN');
    expect(worker).toContain('reference: CAPABILITIES.REFERENCE_MANAGE');
    expect(operations).toContain('function assertEntityScope');
    expect(operations).toContain("'ENTITY_SCOPE_REQUIRED'");
    expect(operations).toContain("'OUT_OF_SCOPE'");
    expect(operations).toContain('request.owner_committee_id');
    expect(operations).toContain("!capabilities.includes(CAPABILITIES.VIEW_INTERNAL) ? 'request' : 'overview'");
  });

  it('validates deterministic redacted exports and rejects restricted source values', async () => {
    const valid = await syntheticExport();
    await expect(validateExport(valid, { candidateSha: 'candidate-sha' })).resolves.toMatchObject({
      valid: true,
      issues: [],
    });
    valid.tabs['01_ITEM_MASTER'][0].Supplier_TIN = 'PRIVATE-VALUE';
    const invalid = await validateExport(valid, { candidateSha: 'candidate-sha' });
    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('contains restricted column Supplier_TIN'),
        expect.stringContaining('count or hash does not match metadata'),
      ]),
    );
  });

  it('derives legacy workflow scope and makes ambiguous ownership a reconciliation blocker', async () => {
    const mapping = JSON.parse(await read('migration/google-sheets-to-d1.v1.json'));
    const importer = await read('scripts/migration/prepare-import.mjs');
    expect(mapping.tabs['03_REQUESTS'].fields.owner_committee_id).toMatchObject({
      constant: null,
      type: 'nullable-text',
    });
    expect(mapping.tabs['06_LENDING'].fields.owner_committee_id).toMatchObject({ constant: null });
    expect(mapping.tabs['08_RESTOCK'].fields.assigned_committee_id).toMatchObject({ constant: null });
    expect(importer).toContain('eventCommittees');
    expect(importer).toContain('sourceUserCommittees');
    expect(importer).toContain('unscoped_requests');
    expect(importer).toContain('unscoped_lending_tickets');
  });

  it('keeps the Sheet bridge read-only and strips private identifiers before export', async () => {
    const exporter = await read('apps-script/D1ExportService.gs');
    expect(exporter).toContain('function buildD1MigrationExport_(options)');
    expect(exporter).toContain('HAU_D1_RESTRICTED_COLUMNS_');
    expect(exporter).not.toContain('DriveApp.createFile');
    expect(exporter).not.toContain('setValue(');
    expect(exporter).not.toContain('appendRow(');
  });
});
