import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';

export async function restoreAndVerifyD1Export(exportPath, databasePath) {
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
      String(database.prepare('PRAGMA integrity_check').get()?.integrity_check ?? '').toLowerCase() ===
      'ok';
    const foreignKeyRows = database.prepare('PRAGMA foreign_key_check').all();
    if (!integrityOk || foreignKeyRows.length) {
      throw new Error('Private isolated restore verification failed.');
    }
    return { integrityOk: true, foreignKeyViolations: 0 };
  } finally {
    database.close();
  }
}
