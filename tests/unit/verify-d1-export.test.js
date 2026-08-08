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
});
