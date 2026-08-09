import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';

const REQUIRED_IMMUTABLE_HISTORY_TABLES = Object.freeze([
  'inventory_ledger',
  'reservation_consumptions',
  'status_history',
  'audit_log',
  'release_corrections',
  'inventory_asset_movements',
  'inventory_classification_history',
  'evidence_restore_history',
  'event_activity_history',
]);

export async function restoreAndVerifyD1Export(
  exportPath,
  databasePath,
  { expectedSchema = '', expectedMigration = '', requireImmutableHistory = false } = {},
) {
  const exportSql = await readFile(exportPath, 'utf8');
  const database = new DatabaseSync(databasePath);
  try {
    // D1 exports are dependency-ordered for D1 import, not for SQLite's
    // immediate foreign-key enforcement. Load the private proof copy with
    // enforcement disabled, then fail closed on the complete restored graph.
    database.exec('PRAGMA foreign_keys = OFF');
    database.exec(exportSql);
    database.exec('PRAGMA foreign_keys = ON');
    const integrityOk =
      String(database.prepare('PRAGMA integrity_check').get()?.integrity_check ?? '').toLowerCase() === 'ok';
    const foreignKeyRows = database.prepare('PRAGMA foreign_key_check').all();
    if (!integrityOk || foreignKeyRows.length) {
      throw new Error('Private isolated restore verification failed.');
    }
    const operationalSchema = expectedSchema
      ? String(
          database.prepare("SELECT value FROM app_metadata WHERE key = 'operational_schema_version'").get()
            ?.value ?? '',
        )
      : '';
    const latestMigration = expectedMigration
      ? String(database.prepare('SELECT name FROM d1_migrations ORDER BY id DESC LIMIT 1').get()?.name ?? '')
      : '';
    const immutableHistoryTables = requireImmutableHistory
      ? Number(
          database
            .prepare(
              `SELECT COUNT(*) AS count FROM sqlite_master
               WHERE type = 'table' AND name IN (${REQUIRED_IMMUTABLE_HISTORY_TABLES.map(() => '?').join(', ')})`,
            )
            .get(...REQUIRED_IMMUTABLE_HISTORY_TABLES)?.count ?? 0,
        )
      : 0;
    if (
      (expectedSchema && operationalSchema !== expectedSchema) ||
      (expectedMigration && latestMigration !== expectedMigration) ||
      (requireImmutableHistory && immutableHistoryTables !== REQUIRED_IMMUTABLE_HISTORY_TABLES.length)
    ) {
      throw new Error('Private isolated restore identity verification failed.');
    }
    return {
      integrityOk: true,
      foreignKeyViolations: 0,
      ...(expectedSchema ? { operationalSchema } : {}),
      ...(expectedMigration ? { latestMigration } : {}),
      ...(requireImmutableHistory ? { immutableHistoryTablesAvailable: immutableHistoryTables } : {}),
    };
  } finally {
    database.close();
  }
}
