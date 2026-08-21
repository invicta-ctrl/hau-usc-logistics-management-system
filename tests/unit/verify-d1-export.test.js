import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { restoreAndVerifyD1Export } from '../../scripts/d1/verify-d1-export.mjs';

async function proofPaths() {
  const directory = await mkdtemp(path.join(tmpdir(), 'hau-d1-restore-'));
  return {
    exportPath: path.join(directory, 'export.sql'),
    databasePath: path.join(directory, 'restored.sqlite'),
  };
}

describe('private D1 export restore proof', () => {
  it('loads dependency-ordered exports before enforcing the complete foreign-key graph', async () => {
    const paths = await proofPaths();
    await writeFile(
      paths.exportPath,
      [
        'CREATE TABLE child (id TEXT PRIMARY KEY, parent_id TEXT REFERENCES parent(id));',
        "INSERT INTO child VALUES ('child-1', 'parent-1');",
        'CREATE TABLE parent (id TEXT PRIMARY KEY);',
        "INSERT INTO parent VALUES ('parent-1');",
      ].join('\n'),
    );
    await expect(restoreAndVerifyD1Export(paths.exportPath, paths.databasePath)).resolves.toEqual({
      integrityOk: true,
      foreignKeyViolations: 0,
    });
  });

  it('fails closed when the restored export contains a foreign-key violation', async () => {
    const paths = await proofPaths();
    await writeFile(
      paths.exportPath,
      [
        'CREATE TABLE parent (id TEXT PRIMARY KEY);',
        'CREATE TABLE child (id TEXT PRIMARY KEY, parent_id TEXT REFERENCES parent(id));',
        "INSERT INTO child VALUES ('child-1', 'missing-parent');",
      ].join('\n'),
    );
    await expect(restoreAndVerifyD1Export(paths.exportPath, paths.databasePath)).rejects.toThrow(
      'Private isolated restore verification failed.',
    );
  });

  it('proves the expected schema, latest migration, and immutable-history surfaces', async () => {
    const paths = await proofPaths();
    const historyTables = [
      'inventory_ledger',
      'reservation_consumptions',
      'status_history',
      'audit_log',
      'release_corrections',
      'inventory_asset_movements',
      'inventory_classification_history',
      'evidence_restore_history',
      'event_activity_history',
    ];
    await writeFile(
      paths.exportPath,
      [
        'CREATE TABLE app_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);',
        "INSERT INTO app_metadata VALUES ('operational_schema_version', '30');",
        'CREATE TABLE d1_migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL);',
        "INSERT INTO d1_migrations VALUES (30, '0030_production_access_and_operations.sql');",
        ...historyTables.map((table) => `CREATE TABLE ${table} (id TEXT PRIMARY KEY);`),
      ].join('\n'),
    );

    await expect(
      restoreAndVerifyD1Export(paths.exportPath, paths.databasePath, {
        expectedSchema: '30',
        expectedMigration: '0030_production_access_and_operations.sql',
        requireImmutableHistory: true,
      }),
    ).resolves.toEqual({
      integrityOk: true,
      foreignKeyViolations: 0,
      operationalSchema: '30',
      latestMigration: '0030_production_access_and_operations.sql',
      immutableHistoryTablesAvailable: historyTables.length,
    });
  });

  it('fails closed when strict restore identity evidence is incomplete', async () => {
    const paths = await proofPaths();
    await writeFile(
      paths.exportPath,
      [
        'CREATE TABLE app_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);',
        "INSERT INTO app_metadata VALUES ('operational_schema_version', '30');",
        'CREATE TABLE d1_migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL);',
        "INSERT INTO d1_migrations VALUES (30, '0030_production_access_and_operations.sql');",
      ].join('\n'),
    );

    await expect(
      restoreAndVerifyD1Export(paths.exportPath, paths.databasePath, {
        expectedSchema: '30',
        expectedMigration: '0030_production_access_and_operations.sql',
        requireImmutableHistory: true,
      }),
    ).rejects.toThrow('Private isolated restore identity verification failed.');
  });
});
