import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

export const PARITY_EXCEPTIONS = Object.freeze([
  'PRODUCTION_CREDENTIALS_EXCLUDED',
  'PRODUCTION_SESSIONS_AND_TOKENS_EXCLUDED',
  'PROTECTED_IDENTITY_ROSTER_EXCLUDED',
  'CANONICAL_IDENTITY_PROVENANCE_AND_FINGERPRINTS_EXCLUDED',
  'STAFF_ACCOUNT_ACTIVITY_HISTORY_AND_AUDIT_CONTEXT_EXCLUDED',
  'PERSONAL_AND_CONTACT_FIELDS_PSEUDONYMIZED',
  'PRIVATE_EVIDENCE_OBJECTS_EXCLUDED',
  'PRIVATE_EVIDENCE_METADATA_REDACTED',
  'TRANSIENT_RATE_LIMIT_AND_OUTBOX_STATE_EXCLUDED',
  'SYNTHETIC_STAGING_TEST_ACCOUNTS_OVERLAID',
]);

const EXCLUDED_TABLE_ROWS = new Set([
  'account_application_history',
  'account_applications',
  'auth_rate_limit_events',
  'auth_rate_limits',
  'email_verification_challenges',
  'identity_correction_requests',
  'identity_roster_entries',
  'identity_roster_rollback_snapshots',
  'identity_roster_sync_runs',
  'password_reset_tokens',
  'public_lending_rate_limit_events',
  'public_request_rate_limit_events',
  'reporting_outbox',
  'sessions',
  'source_access_users',
  // Schema 31/32 identity provenance and immutable activity rows can contain
  // internal identifiers, fingerprints, or provider-origin envelopes. They
  // cannot be safely transformed without weakening their source contract, so
  // the Playground baseline fails closed by omitting them entirely.
  'canonical_people',
  'canonical_person_emails',
  'account_staff_links',
  'staff_assignments',
  'staff_account_activity_history',
  'staff_account_activity_audit_context',
]);

const JSON_REDACTION_KEYS = /(?:email|phone|mobile|contact|credential|password|secret|token|session|envelope|borrower|requester|recipient|student|evidence|object.?key|file.?name|address|notes?|reason|description|profile|payload)/iu;

function sha(value) {
  return createHash('sha256').update(String(value ?? '')).digest('hex');
}

export function pseudonym(kind, value, length = 12) {
  return `${kind}-${sha(`${kind}:${String(value ?? '')}`).slice(0, length)}`;
}

function redactJsonValue(value, key = '') {
  if (JSON_REDACTION_KEYS.test(key)) {
    if (value === null) return null;
    if (Array.isArray(value)) return [];
    if (typeof value === 'object') return { playgroundRedacted: true };
    if (typeof value === 'number') return 0;
    if (typeof value === 'boolean') return false;
    return '[redacted]';
  }
  if (Array.isArray(value)) return value.map((entry) => redactJsonValue(entry));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, child]) => [childKey, redactJsonValue(child, childKey)]),
    );
  }
  return value;
}

function redactJson(value) {
  try {
    return JSON.stringify(redactJsonValue(JSON.parse(String(value ?? '{}'))));
  } catch {
    return '{}';
  }
}

function redactText(label, row) {
  return `[playground ${label} ${sha(row.id ?? row.entity_id ?? row.request_id ?? '').slice(0, 8)}]`;
}

function emailFor(value) {
  return `playground+${sha(value).slice(0, 16)}@example.test`;
}

function phoneFor(value) {
  return `+63-900-${sha(value).slice(0, 7)}`;
}

function accessIdFor(value) {
  return `PG-${sha(value).slice(0, 16).toUpperCase()}`;
}

function setIfPresent(row, key, value) {
  if (Object.hasOwn(row, key)) row[key] = typeof value === 'function' ? value(row[key]) : value;
}

function redactCommonIdentityFields(row) {
  for (const key of [
    'access_id_normalized',
    'old_access_id_normalized',
    'new_access_id_normalized',
    'requested_username_normalized',
    'username_normalized',
    'old_username_normalized',
    'new_username_normalized',
  ]) {
    setIfPresent(row, key, (value) => (value ? accessIdFor(value) : value));
  }
  for (const key of ['email', 'profile_email', 'requester_email']) {
    setIfPresent(row, key, (value) => (value ? emailFor(value) : value));
  }
  for (const key of ['contact', 'contact_number', 'profile_mobile_number']) {
    setIfPresent(row, key, (value) => (value ? phoneFor(value) : value));
  }
}

export function sanitizeProductionRow(table, sourceRow) {
  if (EXCLUDED_TABLE_ROWS.has(table)) return null;
  const row = { ...sourceRow };
  redactCommonIdentityFields(row);

  if (table === 'accounts') {
    row.status = 'DISABLED';
    row.profile_full_name = `Playground account ${sha(row.id).slice(0, 8)}`;
    row.password_credential_json = null;
    row.temporary_credential_json = null;
    row.profile_email_verified_at = null;
    row.password_changed_at = null;
    row.last_password_reset_at = null;
    row.verified_email_fingerprint = null;
    row.avatar_asset_key = null;
    row.avatar_updated_at = null;
    row.locked_at ||= row.updated_at ?? row.created_at;
  }

  if (table === 'requests') {
    row.requester_name = `Playground requester ${sha(row.id).slice(0, 8)}`;
    row.purpose = redactText('purpose', row);
    row.notes = redactText('notes', row);
  }
  if (['public_lending_requests', 'public_lending_submissions'].includes(table)) {
    row.borrower_name = `Playground borrower ${sha(row.id).slice(0, 8)}`;
    row.student_id = pseudonym('student', row.student_id);
    row.purpose = redactText('purpose', row);
    setIfPresent(row, 'tracking_digest', (value) => sha(`tracking:${value}`));
    setIfPresent(row, 'receipt_digest', (value) => sha(`receipt:${value}`));
  }
  if (table === 'public_request_access') {
    row.tracking_digest = sha(`tracking:${row.tracking_digest}`);
  }
  if (table === 'lending_tickets') {
    row.borrower_reference = pseudonym('borrower', row.borrower_reference);
    row.borrower_name = `Playground borrower ${sha(row.id).slice(0, 8)}`;
    for (const key of ['purpose', 'notes', 'review_notes', 'rejection_reason', 'substitution_note']) {
      setIfPresent(row, key, redactText(key, row));
    }
  }
  if (table === 'release_confirmations') {
    row.recipient_name = `Playground recipient ${sha(row.id).slice(0, 8)}`;
    row.recipient_role = 'TEST RECIPIENT';
    row.notes = redactText('notes', row);
  }
  if (table === 'evidence_metadata') {
    row.evidence_label = `Redacted evidence ${sha(row.id).slice(0, 8)}`;
    row.normalized_file_name = `${sha(row.id).slice(0, 12)}.redacted`;
    row.sha256 = sha(`redacted-evidence:${row.id}`);
    row.private_storage_reference = `playground-redacted/${sha(row.id).slice(0, 24)}`;
    row.uploaded_by = null;
    row.notes = '[private evidence omitted from playground baseline]';
    row.primary_etag = pseudonym('redacted-etag', row.id, 24);
    row.primary_version = 'PLAYGROUND_REDACTED';
  }
  if (table === 'release_corrections') {
    row.reason = redactText('reason', row);
  }
  if (table === 'audit_log') {
    row.before_json = redactJson(row.before_json);
    row.after_json = redactJson(row.after_json);
    row.notes = redactText('notes', row);
  }
  if (table === 'status_history') {
    row.reason = redactText('reason', row);
    row.metadata_json = redactJson(row.metadata_json);
  }
  if (['advertisement_mutation_results', 'brand_asset_mutation_results'].includes(table)) {
    row.result_json = redactJson(row.result_json);
  }
  if (table === 'access_policy_changes') {
    row.reason = redactText('reason', row);
  }
  if (table === 'idempotency_keys') {
    row.request_fingerprint = sha(`playground-request:${row.request_fingerprint}`);
    row.result_json = redactJson(row.result_json);
  }
  if (table === 'account_application_history') {
    row.before_json = redactJson(row.before_json);
    row.after_json = redactJson(row.after_json);
    row.reason = redactText('reason', row);
  }
  if (table === 'canvass_references') {
    row.supplier_name = `Playground supplier ${sha(row.supplier_id ?? row.id).slice(0, 8)}`;
    row.source_url = '';
    row.notes = redactText('notes', row);
  }
  if (table === 'suppliers') {
    const label = `Playground supplier ${sha(row.id).slice(0, 8)}`;
    row.name = label;
    row.normalized_name = label.toUpperCase();
    row.notes = redactText('notes', row);
  }
  if (table === 'restock_requests') {
    row.supplier_name = `Playground supplier ${sha(row.id).slice(0, 8)}`;
    row.notes = redactText('notes', row);
  }
  if (['event_series', 'event_days', 'events'].includes(table)) {
    row.name = `Playground event ${sha(row.id).slice(0, 8)}`;
    setIfPresent(row, 'notes', redactText('notes', row));
  }
  if (table === 'event_activity_history') {
    row.before_json = redactJson(row.before_json);
    row.after_json = redactJson(row.after_json);
    row.reason = redactText('reason', row);
  }
  if (table === 'evidence_restore_history') {
    row.prior_r2_object_key = `playground-redacted/${sha(row.prior_r2_object_key).slice(0, 24)}`;
    row.restored_r2_object_key = `playground-redacted/${sha(row.restored_r2_object_key).slice(0, 24)}`;
    row.reason = redactText('reason', row);
  }
  for (const key of Object.keys(row)) {
    if (/^(?:protected_.+_envelope|pending_password_credential_json)$/u.test(key)) row[key] = '{}';
    if (/^(?:secret|token|receipt)_digest$/u.test(key)) row[key] = sha(`${key}:${row[key]}`);
  }
  return row;
}

export function isSyntheticStagingAccount(row) {
  const label = `${row?.profile_email ?? ''} ${row?.profile_full_name ?? ''}`.toLowerCase();
  return (
    label.includes('@example.test') ||
    label.includes('@example.com') ||
    label.includes('synthetic') ||
    label.includes('staging')
  );
}

const SYNTHETIC_OVERLAY_ACCOUNT_KEYS = Object.freeze({
  accounts: 'id',
  account_committees: 'account_id',
  account_access_profiles: 'account_id',
});

export function shouldOmitProductionRowForSyntheticOverlay(table, row, syntheticAccountIds) {
  const accountKey = SYNTHETIC_OVERLAY_ACCOUNT_KEYS[table];
  return Boolean(accountKey && syntheticAccountIds?.has(row?.[accountKey]));
}

export function derivedCatalogAlias(itemName) {
  const displayAlias = String(itemName ?? '').normalize('NFKC').trim().replace(/\s+/gu, ' ');
  if (!displayAlias || displayAlias.length > 120) {
    throw new Error('Inventory item name cannot produce a safe Playground alias.');
  }
  return { normalizedAlias: displayAlias.toLocaleLowerCase('en-US'), displayAlias };
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function sqlLiteral(value) {
  if (value === null || value === undefined) return 'NULL';
  if (value instanceof Uint8Array) return `X'${Buffer.from(value).toString('hex')}'`;
  if (typeof value === 'bigint' || typeof value === 'number') return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

function tableDefinitions(database) {
  return database
    .prepare(
      "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND sql IS NOT NULL ORDER BY rowid",
    )
    .all();
}

function dependencyOrderedTables(database, definitions) {
  const tableNames = definitions.map(({ name }) => name);
  const available = new Set(tableNames);
  const dependencies = new Map(
    tableNames.map((table) => [
      table,
      new Set(
        database
          .prepare(`PRAGMA foreign_key_list(${quoteIdentifier(table)})`)
          .all()
          .map((row) => row.table)
          .filter((dependency) => dependency !== table && available.has(dependency)),
      ),
    ]),
  );
  const remaining = new Set(tableNames);
  const ordered = [];
  while (remaining.size) {
    const ready = [...remaining].filter((table) =>
      [...dependencies.get(table)].every((dependency) => !remaining.has(dependency)),
    );
    if (!ready.length) throw new Error('D1 table dependency graph contains a cycle.');
    for (const table of ready) {
      ordered.push(table);
      remaining.delete(table);
    }
  }
  return ordered;
}

function installSchema(source, target) {
  for (const { sql } of tableDefinitions(source)) target.exec(sql);
}

function orderedRows(database, table) {
  const identifier = quoteIdentifier(table);
  const columns = database.prepare(`PRAGMA table_info(${identifier})`).all();
  const primaryKey = columns
    .filter((column) => Number(column.pk) > 0)
    .sort((left, right) => Number(left.pk) - Number(right.pk))
    .map((column) => quoteIdentifier(column.name));
  const orderBy = primaryKey.length ? ` ORDER BY ${primaryKey.join(', ')}` : '';
  return { columns, rows: database.prepare(`SELECT * FROM ${identifier}${orderBy}`).all() };
}

function insertRows(target, table, columns, rows) {
  if (!rows.length) return;
  const names = columns.map((column) => column.name);
  const statement = target.prepare(
    `INSERT INTO ${quoteIdentifier(table)} (${names.map(quoteIdentifier).join(', ')}) VALUES (${names.map(() => '?').join(', ')})`,
  );
  for (const row of rows) statement.run(...names.map((name) => row[name]));
}

function installDerivedSchema(source, target) {
  for (const type of ['index', 'trigger', 'view']) {
    const rows = source
      .prepare(
        'SELECT sql FROM sqlite_master WHERE type = ? AND sql IS NOT NULL ORDER BY name',
      )
      .all(type);
    for (const { sql } of rows) target.exec(sql);
  }
}

function copySanitizedProduction(source, target, syntheticAccountIds) {
  const counts = {};
  for (const { name: table } of tableDefinitions(source)) {
    const { columns, rows } = orderedRows(source, table);
    const sanitized = rows
      .filter((row) => !shouldOmitProductionRowForSyntheticOverlay(table, row, syntheticAccountIds))
      .map((row) => sanitizeProductionRow(table, row))
      .filter(Boolean);
    insertRows(target, table, columns, sanitized);
    counts[table] = { source: rows.length, baseline: sanitized.length };
  }
  return counts;
}

function syntheticStagingAccounts(staging) {
  return staging.prepare('SELECT * FROM accounts ORDER BY id').all().filter(isSyntheticStagingAccount);
}

function assertSyntheticAccountIdentitiesAvailable(target, accounts) {
  for (const account of accounts) {
    for (const field of ['access_id_normalized', 'username_normalized', 'profile_email']) {
      if (account[field] == null || account[field] === '') continue;
      const collision = target
        .prepare(`SELECT id FROM accounts WHERE ${quoteIdentifier(field)} = ? AND id <> ? LIMIT 1`)
        .get(account[field], account.id);
      if (collision) throw new Error('Synthetic staging account identity collides with a different production account.');
    }
  }
}

function overlaySyntheticStagingAccounts(staging, target, accounts) {
  if (!accounts.length) throw new Error('No explicitly synthetic staging accounts were available for overlay.');
  assertSyntheticAccountIdentitiesAvailable(target, accounts);
  const accountIds = new Set(accounts.map((row) => row.id));
  const tables = ['accounts', 'account_committees', 'account_access_profiles'];
  for (const table of tables) {
    const { columns, rows } = orderedRows(staging, table);
    const selected =
      table === 'accounts' ? accounts : rows.filter((row) => accountIds.has(row.account_id));
    insertRows(target, table, columns, selected);
  }
  return accounts.length;
}

function ensureCatalogAliases(target) {
  const existing = Number(target.prepare('SELECT COUNT(*) AS count FROM item_aliases').get()?.count ?? 0);
  if (existing > 0) return 0;
  const insert = target.prepare(
    'INSERT INTO item_aliases (item_id, normalized_alias, display_alias) VALUES (?, ?, ?)',
  );
  const items = target.prepare('SELECT id, name FROM inventory_items ORDER BY id').all();
  for (const item of items) {
    const alias = derivedCatalogAlias(item.name);
    insert.run(item.id, alias.normalizedAlias, alias.displayAlias);
  }
  return items.length;
}

export function createSanitizedBaseline({
  productionDatabasePath,
  stagingDatabasePath,
  outputDatabasePath,
  baselineMetadata,
}) {
  const production = new DatabaseSync(productionDatabasePath, { readOnly: true });
  const staging = new DatabaseSync(stagingDatabasePath, { readOnly: true });
  const target = new DatabaseSync(outputDatabasePath);
  let transactionOpen = false;
  try {
    target.exec('PRAGMA foreign_keys = OFF');
    target.exec('BEGIN IMMEDIATE');
    transactionOpen = true;
    installSchema(production, target);
    const stagingAccounts = syntheticStagingAccounts(staging);
    const syntheticAccountIds = new Set(stagingAccounts.map((row) => row.id));
    const tableCounts = copySanitizedProduction(production, target, syntheticAccountIds);
    const syntheticAccountCount = overlaySyntheticStagingAccounts(staging, target, stagingAccounts);
    const generatedInventoryAliasCount = ensureCatalogAliases(target);
    if (tableCounts.item_aliases) {
      tableCounts.item_aliases.baseline += generatedInventoryAliasCount;
    }
    const capturedAt = baselineMetadata.capturedAt;
    const metadata = target.prepare(
      `INSERT INTO app_metadata (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    );
    metadata.run('playground.clean_baseline', JSON.stringify(baselineMetadata), capturedAt);
    metadata.run(
      'playground.working_state',
      JSON.stringify({ state: 'CLEAN', activeTestSession: false, updatedAt: capturedAt }),
      capturedAt,
    );
    installDerivedSchema(production, target);
    target.exec('COMMIT');
    transactionOpen = false;
    target.exec('PRAGMA foreign_keys = ON');
    const integrity = String(target.prepare('PRAGMA integrity_check').get()?.integrity_check ?? '');
    const foreignKeys = target.prepare('PRAGMA foreign_key_check').all();
    if (integrity.toLowerCase() !== 'ok' || foreignKeys.length) {
      throw new Error('Sanitized baseline failed local integrity or foreign-key verification.');
    }
    return {
      tableCounts,
      syntheticAccountCount,
      generatedInventoryAliasCount,
      integrityOk: true,
      foreignKeyViolations: 0,
    };
  } finally {
    if (transactionOpen) target.exec('ROLLBACK');
    target.close();
    staging.close();
    production.close();
  }
}

export function dumpDatabase(databasePath) {
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const lines = ['PRAGMA defer_foreign_keys=TRUE;'];
    const definitions = tableDefinitions(database);
    for (const { sql } of definitions) lines.push(`${sql};`);
    for (const table of dependencyOrderedTables(database, definitions)) {
      const { columns, rows } = orderedRows(database, table);
      const names = columns.map((column) => column.name);
      for (const row of rows) {
        lines.push(
          `INSERT INTO ${quoteIdentifier(table)} (${names.map(quoteIdentifier).join(', ')}) VALUES (${names.map((name) => sqlLiteral(row[name])).join(', ')});`,
        );
      }
    }
    for (const type of ['index', 'trigger', 'view']) {
      const rows = database
        .prepare('SELECT sql FROM sqlite_master WHERE type = ? AND sql IS NOT NULL ORDER BY name')
        .all(type);
      for (const { sql } of rows) lines.push(`${sql};`);
    }
    return `${lines.join('\n')}\n`;
  } finally {
    database.close();
  }
}

export function dumpDatabaseReplacement(databasePath) {
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const definitions = tableDefinitions(database);
    const tables = dependencyOrderedTables(database, definitions);
    const derived = Object.fromEntries(
      ['index', 'trigger', 'view'].map((type) => [
        type,
        database
          .prepare(
            `SELECT name, sql FROM sqlite_master WHERE type = ? AND sql IS NOT NULL ORDER BY name`,
          )
          .all(type),
      ]),
    );
    const lines = ['PRAGMA defer_foreign_keys=TRUE;'];
    for (const type of ['trigger', 'view', 'index']) {
      for (const { name } of derived[type]) {
        lines.push(`DROP ${type.toUpperCase()} IF EXISTS ${quoteIdentifier(name)};`);
      }
    }
    for (const table of [...tables].reverse()) {
      lines.push(`DELETE FROM ${quoteIdentifier(table)};`);
    }
    for (const table of tables) {
      const { columns, rows } = orderedRows(database, table);
      const names = columns.map((column) => column.name);
      for (const row of rows) {
        lines.push(
          `INSERT INTO ${quoteIdentifier(table)} (${names.map(quoteIdentifier).join(', ')}) VALUES (${names.map((name) => sqlLiteral(row[name])).join(', ')});`,
        );
      }
    }
    for (const type of ['index', 'trigger', 'view']) {
      for (const { sql } of derived[type]) lines.push(`${sql};`);
    }
    return `${lines.join('\n')}\n`;
  } finally {
    database.close();
  }
}
