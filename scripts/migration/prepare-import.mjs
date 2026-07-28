import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { argument, isInside, repoRoot, sha256, validateExport } from './export-contract.mjs';

const sql = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
};

function convert(raw, rule, importedAt) {
  let value = Object.hasOwn(rule, 'constant') ? rule.constant : raw;
  if (value === '__IMPORT_TIME__') value = importedAt;
  if ((value === undefined || value === null || value === '') && Object.hasOwn(rule, 'default'))
    value = rule.default;
  if (rule.required && (value === undefined || value === null || String(value).trim() === ''))
    throw new Error('REQUIRED_VALUE_MISSING');
  if (
    rule.type.startsWith('nullable-') &&
    (value === undefined || value === null || String(value).trim() === '')
  )
    return null;
  if (rule.type.endsWith('text') || rule.type === 'text') return String(value ?? '').trim();
  if (['number', 'nullable-number', 'positive-number', 'nonzero-number'].includes(rule.type)) {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error('NUMBER_INVALID');
    if (rule.type === 'positive-number' && number <= 0) throw new Error('POSITIVE_NUMBER_REQUIRED');
    if (rule.type === 'nonzero-number' && number === 0) throw new Error('NONZERO_NUMBER_REQUIRED');
    return number;
  }
  if (['integer', 'nullable-integer'].includes(rule.type)) {
    const number = Number(value);
    if (!Number.isInteger(number)) throw new Error('INTEGER_INVALID');
    return number;
  }
  if (rule.type === 'boolean') {
    if (
      String(value ?? '')
        .trim()
        .toUpperCase() === 'TO_CLASSIFY' &&
      Object.hasOwn(rule, 'default')
    ) {
      value = rule.default;
    }
    if ([true, 1, '1', 'TRUE', 'true', 'YES', 'yes', '✔', '✓'].includes(value)) return 1;
    if ([false, 0, '0', 'FALSE', 'false', 'NO', 'no', ''].includes(value)) return 0;
    throw new Error('BOOLEAN_INVALID');
  }
  if (rule.type === 'json') {
    if (typeof value === 'string') JSON.parse(value);
    return typeof value === 'string' ? value : JSON.stringify(value);
  }
  if (['datetime', 'nullable-datetime'].includes(rule.type)) {
    if (Number.isNaN(Date.parse(value))) throw new Error('DATETIME_INVALID');
    return new Date(value).toISOString();
  }
  throw new Error('MAPPING_TYPE_UNSUPPORTED');
}

function insertStatement(mapping, values) {
  const columns = Object.keys(mapping.fields).length ? Object.keys(mapping.fields) : Object.keys(values);
  const rendered = columns.map((column) => sql(values[column])).join(', ');
  const base = `INSERT INTO ${mapping.targetTable} (${columns.join(', ')}) VALUES (${rendered})`;
  if (mapping.mode === 'append-only' || mapping.mode === 'insert-only')
    return `${base} ON CONFLICT DO NOTHING;`;
  const mutable = columns.filter((column) => column !== mapping.primaryKey);
  return `${base} ON CONFLICT(${mapping.primaryKey}) DO UPDATE SET ${mutable.map((column) => `${column}=excluded.${column}`).join(', ')};`;
}

async function main() {
  const input = argument('--input');
  const output = argument('--output-sql');
  const rejectionsOutput = argument('--rejections');
  const reconciliationOutput = argument('--reconciliation-sql');
  const ownerReviewOutput = argument('--owner-review-queue');
  const candidateSha = argument('--candidate-sha');
  for (const [name, value] of Object.entries({
    input,
    output,
    rejectionsOutput,
    reconciliationOutput,
    ownerReviewOutput,
  })) {
    if (!value || !path.isAbsolute(value))
      throw new Error(`${name} must be an absolute path outside the repository.`);
    if (isInside(repoRoot, value)) throw new Error(`${name} must remain outside the repository.`);
  }
  const source = JSON.parse(await readFile(input, 'utf8'));
  const validation = await validateExport(source, { candidateSha });
  if (!validation.valid) throw new Error(`Export validation failed: ${validation.issues.join('; ')}`);
  const importedAt = new Date().toISOString();
  const batchId = `IMP-${validation.snapshotHash.slice(0, 24)}`;
  const statements = ['PRAGMA foreign_keys = ON;', 'BEGIN TRANSACTION;'];
  const rejections = [];
  const ownerReviews = [];
  const imported = [];
  let openingBalanceCount = 0;
  let openingBalanceQuantity = 0;
  const eventSeries = new Map();
  const requestLineItems = new Map(
    (source.tabs['04_REQUEST_LINES'] ?? []).map((row) => [
      String(row.Request_Line_ID ?? '').trim(),
      String(row.Item_ID ?? '').trim(),
    ]),
  );
  const eventCommittees = new Map(
    (source.tabs['13_EVENTS'] ?? []).map((row) => [
      String(row.Event_ID ?? '').trim(),
      String(row.Owner_Committee ?? '').trim(),
    ]),
  );
  const sourceUserCommittees = new Map(
    (source.tabs['14_USERS_ACCESS'] ?? []).map((row) => {
      let committeeIds = [];
      try {
        committeeIds = JSON.parse(String(row.Committee_IDs_JSON || '[]'));
      } catch {
        committeeIds = [];
      }
      return [
        String(row.User_ID ?? '').trim(),
        Array.isArray(committeeIds) ? committeeIds.map((value) => String(value).trim()).filter(Boolean) : [],
      ];
    }),
  );
  const requestCommittees = new Map();
  const sourceIdCounts = new Map();
  for (const [tab, sourceRows] of Object.entries(source.tabs)) {
    const sourceId = validation.mapping.tabs[tab]?.sourceId;
    if (!sourceId) continue;
    const counts = new Map();
    for (const row of sourceRows) {
      const value = String(row[sourceId] ?? '').trim();
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    sourceIdCounts.set(tab, counts);
  }
  for (const row of source.tabs['13_EVENTS'] ?? []) {
    const id = String(row.Event_Series_ID ?? '').trim();
    if (id && !eventSeries.has(id)) {
      eventSeries.set(id, {
        id,
        code: String(row.Series_Code ?? '').trim(),
        name: String(row.Event_Series_Name ?? id).trim(),
      });
    }
  }
  statements.push(
    `INSERT INTO import_batches (` +
      `id, source_snapshot_hash, source_workbook_label, source_snapshot_at, export_schema_version, ` +
      `exporter_version, candidate_sha, status, source_row_count, imported_row_count, rejected_row_count, created_at` +
      `) VALUES (` +
      [
        batchId,
        validation.snapshotHash,
        source.metadata.sourceWorkbookLabel,
        source.metadata.snapshotAt,
        source.schemaVersion,
        source.metadata.exporterVersion,
        source.metadata.candidateSha,
        'PREPARED',
        validation.verifiedTabs.reduce((sum, tab) => sum + tab.rowCount, 0),
        0,
        0,
        importedAt,
      ]
        .map(sql)
        .join(', ') +
      `) ON CONFLICT(source_snapshot_hash) DO NOTHING;`,
  );
  for (const series of eventSeries.values()) {
    statements.push(
      `INSERT INTO event_series (id, code, name, status, created_at, updated_at) VALUES (` +
        `${sql(series.id)}, ${sql(series.code)}, ${sql(series.name)}, 'ACTIVE', ${sql(importedAt)}, ${sql(importedAt)}` +
        `) ON CONFLICT(id) DO UPDATE SET code=excluded.code, name=excluded.name, updated_at=excluded.updated_at;`,
    );
  }
  const orderedTabs = [
    '01_ITEM_MASTER',
    '13_EVENTS',
    '03_REQUESTS',
    '04_REQUEST_LINES',
    '06_LENDING',
    '05_RESERVATIONS',
    '11_SUPPLIERS',
    '08_RESTOCK',
    '09_DELIVERABLES',
    '10_CANVASS',
    '12_EVIDENCE',
    '07_RELEASES',
    '02_LEDGER',
    '15_STATUS_HISTORY',
    '16_AUDIT_LOG',
    '14_USERS_ACCESS',
  ];
  for (const tab of orderedTabs) {
    const mapping = validation.mapping.tabs[tab];
    const sourceRows = source.tabs[tab] ?? [];
    for (let index = 0; index < sourceRows.length; index += 1) {
      const row = sourceRows[index];
      const sourceFingerprint = sha256(
        JSON.stringify(
          Object.keys(row)
            .sort()
            .map((key) => [key, row[key] ?? null]),
        ),
      );
      const sourceRecordId = String(row[mapping.sourceId] ?? '').trim();
      const stagedStatements = [];
      try {
        if (sourceRecordId && (sourceIdCounts.get(tab)?.get(sourceRecordId) ?? 0) > 1) {
          throw new Error('SOURCE_ID_DUPLICATE');
        }
        if (mapping.transform === 'release-lines') {
          const lineIds = JSON.parse(String(row.Request_Line_IDs_JSON || '[]'));
          const quantities = JSON.parse(String(row.Quantities_JSON || '[]'));
          const units = JSON.parse(String(row.Units_JSON || '[]'));
          if (
            !sourceRecordId ||
            !Array.isArray(lineIds) ||
            !lineIds.length ||
            lineIds.length !== quantities.length ||
            lineIds.length !== units.length
          ) {
            throw new Error('RELEASE_ARRAYS_INVALID');
          }
          lineIds.forEach((lineId, releaseIndex) => {
            const normalizedLineId = String(lineId).trim();
            const itemId = requestLineItems.get(normalizedLineId);
            if (!itemId) throw new Error('RELEASE_ITEM_UNRESOLVED');
            const quantity = Number(quantities[releaseIndex]);
            if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('RELEASE_QUANTITY_INVALID');
            const targetId = lineIds.length === 1 ? sourceRecordId : `${sourceRecordId}-${releaseIndex + 1}`;
            const idempotencyKey = `${String(row.Idempotency_Key || `IMPORT:${sourceRecordId}`)}:${releaseIndex + 1}`;
            const values = {
              id: targetId,
              request_id: String(row.Request_ID || '').trim() || null,
              request_line_id: normalizedLineId,
              event_id: String(row.Event_ID || '').trim() || null,
              lending_ticket_id: String(row.Lending_Ticket_ID || '').trim() || null,
              recipient_name: 'REDACTED_SOURCE_RECIPIENT',
              recipient_role: String(row.Recipient_Role || 'REDACTED').trim(),
              department: String(row.Department || '').trim(),
              item_id: itemId,
              quantity,
              unit: String(units[releaseIndex] || '').trim(),
              released_by: 'SYSTEM-IMPORT',
              released_at: new Date(row.Released_At || row.Created_At).toISOString(),
              confirmation_label: String(row.Confirmation_Label || 'IMPORTED_CONFIRMATION').trim(),
              evidence_id: null,
              idempotency_key: idempotencyKey,
              status: String(row.Status || 'CONFIRMED').trim(),
              notes: String(row.Notes || '').trim(),
            };
            stagedStatements.push(insertStatement(mapping, values));
          });
          statements.push(...stagedStatements);
          imported.push({
            tab,
            rowNumber: index + 2,
            sourceRecordId,
            sourceFingerprint,
            targetTable: mapping.targetTable,
            targetId: sourceRecordId,
          });
          continue;
        }
        const values = Object.fromEntries(
          Object.entries(mapping.fields).map(([target, rule]) => [
            target,
            convert(row[rule.source], rule, importedAt),
          ]),
        );
        if (tab === '03_REQUESTS') {
          const creatorCommittees = sourceUserCommittees.get(String(row.Created_By ?? '').trim()) ?? [];
          values.owner_committee_id =
            eventCommittees.get(String(row.Event_ID ?? '').trim()) ||
            (creatorCommittees.length === 1 ? creatorCommittees[0] : null);
          requestCommittees.set(values.id, values.owner_committee_id);
          if (!values.client_request_id) values.client_request_id = `IMPORT:${values.id}`;
        }
        if (tab === '06_LENDING') {
          const creatorCommittees = sourceUserCommittees.get(String(row.Created_By ?? '').trim()) ?? [];
          values.owner_committee_id = creatorCommittees.length === 1 ? creatorCommittees[0] : null;
        }
        if (tab === '08_RESTOCK') {
          values.assigned_committee_id = requestCommittees.get(values.source_request_id) ?? null;
        }
        if (tab === '02_LEDGER' && !values.idempotency_key) values.idempotency_key = `IMPORT:${values.id}`;
        if (tab === '05_RESERVATIONS' && !values.idempotency_key)
          values.idempotency_key = `IMPORT:${values.id}`;
        if (tab === '10_CANVASS' && !values.idempotency_key) values.idempotency_key = `IMPORT:${values.id}`;
        if (tab === '15_STATUS_HISTORY' && !values.idempotency_key)
          values.idempotency_key = `IMPORT:${values.id}`;
        if (tab === '16_AUDIT_LOG' && !values.correlation_id)
          values.correlation_id = `IMPORT_${values.id}`.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64);
        if (tab === '08_RESTOCK') values.received_quantity = row.Received_At ? values.requested_quantity : 0;
        stagedStatements.push(insertStatement(mapping, values));
        if (tab === '01_ITEM_MASTER') {
          const openingQuantity = convert(row.Opening_Qty, { type: 'number', default: 0 }, importedAt);
          if (openingQuantity < 0) throw new Error('NEGATIVE_OPENING_QUANTITY');
          if (openingQuantity > 0) {
            openingBalanceCount += 1;
            openingBalanceQuantity += openingQuantity;
            stagedStatements.push(
              `INSERT INTO inventory_ledger (` +
                `id, created_at, transaction_type, direction, item_id, event_item_id, quantity, unit, ` +
                `signed_quantity, related_entity_type, related_entity_id, request_id, event_id, ` +
                `actor_account_id, idempotency_key, reversal_of, status, notes` +
                `) VALUES (` +
                [
                  `IMP-OPEN-${values.id}`,
                  source.metadata.snapshotAt,
                  'OPENING_BALANCE',
                  'IN',
                  values.id,
                  null,
                  openingQuantity,
                  values.unit,
                  openingQuantity,
                  'IMPORT_BATCH',
                  batchId,
                  null,
                  null,
                  'SYSTEM-IMPORT',
                  `IMPORT:OPENING_BALANCE:${values.id}`,
                  null,
                  'POSTED',
                  'Imported approved opening balance',
                ]
                  .map(sql)
                  .join(', ') +
                `) ON CONFLICT DO NOTHING;`,
            );
          }
          const handling = String(row.Handling ?? '')
            .trim()
            .toUpperCase();
          const inventoryKind =
            handling.includes('REUSABLE') || handling.includes('LOAN')
              ? 'REUSABLE'
              : handling.includes('CONSUMABLE')
                ? 'CONSUMABLE'
                : '';
          if (!inventoryKind) {
            ownerReviews.push({
              tab,
              rowNumber: index + 2,
              sourceRecordId,
              sourceFingerprint,
              reasonCode: 'INVENTORY_CLASSIFICATION_REQUIRED',
              requiredFields: [
                'inventoryKind',
                'isLendable',
                'lendingAudience',
                'assetInstanceCountIfReusable',
                'conditionIfReusable',
                'maintenanceStateIfReusable',
              ],
            });
          }
          const aliases = String(row.Aliases || '')
            .split(/[|,;]/)
            .map((value) => value.trim())
            .filter(Boolean);
          aliases.forEach((alias) =>
            stagedStatements.push(
              `INSERT INTO item_aliases (item_id, normalized_alias, display_alias) VALUES (` +
                `${sql(values.id)}, ${sql(
                  alias
                    .toUpperCase()
                    .replace(/[^A-Z0-9]+/g, ' ')
                    .trim(),
                )}, ${sql(alias)}` +
                `) ON CONFLICT(item_id, normalized_alias) DO UPDATE SET display_alias=excluded.display_alias;`,
            ),
          );
        }
        if (tab === '06_LENDING' && row.Released_At) {
          const handoffKey = `IMPORT:HANDOFF:${values.id}`;
          stagedStatements.push(
            `INSERT INTO lending_handoffs (id, lending_ticket_id, released_by, released_at, idempotency_key, notes) VALUES (` +
              `${sql(`HND-${values.id}`)}, ${sql(values.id)}, 'SYSTEM-IMPORT', ${sql(new Date(row.Released_At).toISOString())}, ${sql(handoffKey)}, 'Imported source handoff'` +
              `) ON CONFLICT DO NOTHING;`,
          );
        }
        if (tab === '06_LENDING' && row.Returned_At) {
          const returnKey = `IMPORT:RETURN:${values.id}`;
          stagedStatements.push(
            `INSERT INTO lending_returns (id, lending_ticket_id, returned_by, returned_at, condition_label, idempotency_key, notes) VALUES (` +
              `${sql(`RTN-${values.id}`)}, ${sql(values.id)}, 'SYSTEM-IMPORT', ${sql(new Date(row.Returned_At).toISOString())}, 'IMPORTED', ${sql(returnKey)}, 'Imported source return'` +
              `) ON CONFLICT DO NOTHING;`,
          );
        }
        if (tab === '08_RESTOCK' && row.Received_At) {
          const receiveKey = String(row.Idempotency_Key || `IMPORT:RESTOCK:${values.id}`);
          stagedStatements.push(
            `INSERT INTO restock_receipts (id, restock_request_id, quantity, unit, invoice_status, invoice_number, evidence_id, idempotency_key, received_at, received_by, notes) VALUES (` +
              `${sql(`RRC-${values.id}`)}, ${sql(values.id)}, ${sql(values.received_quantity)}, ${sql(values.unit)}, ${sql(String(row.Invoice_Status || ''))}, ${sql(String(row.Invoice_Number || ''))}, NULL, ${sql(receiveKey)}, ${sql(new Date(row.Received_At).toISOString())}, 'SYSTEM-IMPORT', 'Imported cumulative restock receipt'` +
              `) ON CONFLICT DO NOTHING;`,
            `INSERT INTO receiving_records (id, entity_type, entity_id, item_id, quantity, unit, received_by, received_at, idempotency_key, notes) VALUES (` +
              `${sql(`RCV-${values.id}`)}, 'RESTOCK', ${sql(values.id)}, ${sql(values.item_id)}, ${sql(values.received_quantity)}, ${sql(values.unit)}, 'SYSTEM-IMPORT', ${sql(new Date(row.Received_At).toISOString())}, ${sql(receiveKey)}, 'Imported cumulative restock receipt'` +
              `) ON CONFLICT DO NOTHING;`,
          );
        }
        if (tab === '09_DELIVERABLES' && Number(values.quantity_received) > 0) {
          stagedStatements.push(
            `INSERT INTO receiving_records (id, entity_type, entity_id, item_id, quantity, unit, received_by, received_at, idempotency_key, notes) VALUES (` +
              `${sql(`RCV-${values.id}`)}, 'DELIVERABLE', ${sql(values.id)}, ${sql(values.inventory_match_id)}, ${sql(values.quantity_received)}, ${sql(values.unit)}, 'SYSTEM-IMPORT', ${sql(values.updated_at)}, ${sql(`IMPORT:DELIVERABLE:${values.id}`)}, 'Imported cumulative deliverable receipt'` +
              `) ON CONFLICT DO NOTHING;`,
          );
        }
        statements.push(...stagedStatements);
        imported.push({
          tab,
          rowNumber: index + 2,
          sourceRecordId,
          sourceFingerprint,
          targetTable: mapping.targetTable,
          targetId: String(values[mapping.primaryKey]),
        });
      } catch (error) {
        rejections.push({
          tab,
          rowNumber: index + 2,
          sourceRecordId,
          sourceFingerprint,
          reasonCode: error.message,
        });
      }
    }
  }
  for (const record of imported) {
    statements.push(
      `INSERT INTO imported_source_rows (` +
        `import_batch_id, source_tab, source_row_number, source_record_id, source_fingerprint, target_table, target_id, import_status, imported_at` +
        `) VALUES (` +
        [
          batchId,
          record.tab,
          record.rowNumber,
          record.sourceRecordId,
          record.sourceFingerprint,
          record.targetTable,
          record.targetId,
          'IMPORTED',
          importedAt,
        ]
          .map(sql)
          .join(', ') +
        `) ON CONFLICT DO NOTHING;`,
    );
  }
  for (const record of rejections) {
    statements.push(
      `INSERT INTO imported_source_rows (` +
        `import_batch_id, source_tab, source_row_number, source_record_id, source_fingerprint, target_table, target_id, import_status, reason_code, imported_at` +
        `) VALUES (` +
        [
          batchId,
          record.tab,
          record.rowNumber,
          record.sourceRecordId,
          record.sourceFingerprint,
          validation.mapping.tabs[record.tab].targetTable,
          '',
          'QUARANTINED',
          record.reasonCode,
          importedAt,
        ]
          .map(sql)
          .join(', ') +
        `) ON CONFLICT DO NOTHING;`,
    );
  }
  statements.push(
    `UPDATE import_batches SET status='APPLIED', imported_row_count=${imported.length}, ` +
      `rejected_row_count=${rejections.length}, applied_at=${sql(importedAt)} WHERE id=${sql(batchId)};`,
    'COMMIT;',
  );
  const reconciliation = [
    `SELECT id, source_snapshot_hash, status, source_row_count, imported_row_count, rejected_row_count FROM import_batches WHERE id=${sql(batchId)};`,
    `SELECT source_tab, import_status, COUNT(*) AS row_count FROM imported_source_rows WHERE import_batch_id=${sql(batchId)} GROUP BY source_tab, import_status ORDER BY source_tab, import_status;`,
    `SELECT COUNT(*) AS catalog_nonzero_opening_quantities FROM inventory_items WHERE opening_quantity <> 0;`,
    `SELECT ABS(COUNT(*) - ${openingBalanceCount}) AS opening_balance_ledger_count_difference FROM inventory_ledger WHERE transaction_type='OPENING_BALANCE' AND related_entity_type='IMPORT_BATCH' AND related_entity_id=${sql(batchId)};`,
    `SELECT ABS(COALESCE(SUM(signed_quantity), 0) - ${openingBalanceQuantity}) AS opening_balance_quantity_difference FROM inventory_ledger WHERE transaction_type='OPENING_BALANCE' AND related_entity_type='IMPORT_BATCH' AND related_entity_id=${sql(batchId)};`,
    `SELECT COUNT(*) AS pending_inventory_classifications FROM inventory_items WHERE upper(trim(handling)) IN ('', 'TO_CLASSIFY');`,
    `SELECT COUNT(*) AS unsafe_lendable_unclassified_items FROM inventory_items WHERE is_lendable = 1 AND upper(trim(handling)) IN ('', 'TO_CLASSIFY');`,
    `SELECT COUNT(*) AS active_mock_inventory_items FROM inventory_items WHERE status = 'ACTIVE' AND (upper(id) LIKE '%SYNTHETIC%' OR upper(id) LIKE 'SMOKE.%' OR upper(name) LIKE '%SYNTHETIC%');`,
    `SELECT COUNT(*) AS negative_inventory_balances FROM inventory_balances WHERE on_hand < 0 OR reserved < 0 OR available_to_promise < 0;`,
    `SELECT COUNT(*) AS request_lines_over_received FROM request_lines WHERE received_quantity > requested_quantity;`,
    `SELECT COUNT(*) AS duplicate_handoffs FROM (SELECT lending_ticket_id FROM lending_handoffs GROUP BY lending_ticket_id HAVING COUNT(*) > 1);`,
    `SELECT COUNT(*) AS duplicate_returns FROM (SELECT lending_ticket_id FROM lending_returns GROUP BY lending_ticket_id HAVING COUNT(*) > 1);`,
    `SELECT COUNT(*) AS unscoped_requests FROM requests WHERE owner_committee_id IS NULL;`,
    `SELECT COUNT(*) AS unscoped_lending_tickets FROM lending_tickets WHERE owner_committee_id IS NULL;`,
    `SELECT COUNT(*) AS unscoped_restock_requests FROM restock_requests WHERE assigned_committee_id IS NULL;`,
    `SELECT COUNT(*) AS unscoped_deliverables FROM deliverables WHERE assigned_committee_id IS NULL;`,
  ].join('\n');
  await writeFile(output, `${statements.join('\n')}\n`, { flag: 'wx', mode: 0o600 });
  await writeFile(
    rejectionsOutput,
    `${JSON.stringify({ batchId, snapshotHash: validation.snapshotHash, rejections }, null, 2)}\n`,
    { flag: 'wx', mode: 0o600 },
  );
  await writeFile(
    ownerReviewOutput,
    `${JSON.stringify(
      {
        batchId,
        snapshotHash: validation.snapshotHash,
        status: ownerReviews.length ? 'OWNER_REVIEW_REQUIRED' : 'COMPLETE',
        ownerReviews,
      },
      null,
      2,
    )}\n`,
    { flag: 'wx', mode: 0o600 },
  );
  await writeFile(reconciliationOutput, `${reconciliation}\n`, { flag: 'wx', mode: 0o600 });
  console.log(`Prepared private import batch ${batchId}.`);
  console.log(`Imported rows prepared: ${imported.length}`);
  console.log(`Quarantined rows: ${rejections.length}`);
  console.log(`Owner-review rows: ${ownerReviews.length}`);
  console.log('No workbook ID or row values were printed.');
  if (rejections.length) process.exitCode = 2;
  else if (ownerReviews.length) process.exitCode = 3;
}

main().catch((error) => {
  console.error(error instanceof SyntaxError ? 'Migration export is not valid JSON.' : error.message);
  process.exitCode = 1;
});
