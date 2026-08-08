import { execFileSync } from 'node:child_process';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import {
  buildSandboxArchiveSql,
  buildSandboxSeedSql,
  createSandboxCredentials,
} from '../staging-sandbox-lifecycle.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const wrangler = path.join(repoRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

function run(args) {
  return execFileSync(process.execPath, [wrangler, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
}

async function main() {
  const workspace = await mkdtemp(path.join(tmpdir(), 'hau-staging-sandbox-proof-'));
  const persist = path.join(workspace, 'state');
  const config = path.join(repoRoot, 'wrangler.jsonc');
  try {
    run(['d1', 'migrations', 'apply', 'DB', '--local', '--persist-to', persist, '--config', config]);
    for (const generation of [1, 2]) {
      const credentials = await createSandboxCredentials({
        generation,
        pepper: 'local-verification-only-pepper-value',
      });
      const seedPath = path.join(workspace, `seed-${generation}.sql`);
      await writeFile(
        seedPath,
        buildSandboxSeedSql({
          generation,
          now: `2026-08-08T0${generation}:00:00.000Z`,
          credentials,
        }),
        { mode: 0o600 },
      );
      if (generation === 2) {
        const archivePath = path.join(workspace, 'archive-1.sql');
        await writeFile(
          archivePath,
          buildSandboxArchiveSql({ generation: 1, now: '2026-08-08T02:00:00.000Z' }),
          { mode: 0o600 },
        );
        run([
          'd1',
          'execute',
          'DB',
          '--local',
          '--persist-to',
          persist,
          '--config',
          config,
          '--file',
          archivePath,
        ]);
      }
      run([
        'd1',
        'execute',
        'DB',
        '--local',
        '--persist-to',
        persist,
        '--config',
        config,
        '--file',
        seedPath,
      ]);
    }
    const files = await readdir(persist, { recursive: true });
    const databaseRelativePath = files.find((file) => String(file).endsWith('.sqlite'));
    if (!databaseRelativePath) throw new Error('Local D1 SQLite artifact was not found.');
    const database = new DatabaseSync(path.join(persist, databaseRelativePath));
    const counts = database
      .prepare(
        "SELECT (SELECT COUNT(*) FROM accounts WHERE id LIKE 'SBX-%') AS accounts, " +
          "(SELECT COUNT(*) FROM inventory_items WHERE status = 'ACTIVE' AND id LIKE 'SBX-G0002-%') AS active_items, " +
          "(SELECT COUNT(*) FROM inventory_items WHERE status = 'ARCHIVED' AND id LIKE 'SBX-G0001-%') AS archived_items, " +
          "(SELECT COUNT(*) FROM inventory_balances WHERE item_id LIKE 'SBX-G0001-%' AND on_hand <> 0) AS archived_nonzero_balances, " +
          "(SELECT MIN(on_hand) FROM inventory_balances WHERE item_id LIKE 'SBX-G0002-%') AS minimum_active_balance, " +
          "(SELECT value FROM app_metadata WHERE key = 'sandbox_generation') AS generation",
      )
      .get();
    const integrity = database.prepare('PRAGMA integrity_check').get();
    const foreignKeyRows = database.prepare('PRAGMA foreign_key_check').all();
    database.close();
    const integrityOk = String(integrity?.integrity_check ?? '').toLowerCase() === 'ok';
    if (
      Number(counts?.accounts) !== 22 ||
      Number(counts?.active_items) !== 36 ||
      Number(counts?.archived_items) !== 36 ||
      Number(counts?.archived_nonzero_balances) !== 0 ||
      Number(counts?.minimum_active_balance) < 0 ||
      String(counts?.generation) !== '2' ||
      !integrityOk ||
      foreignKeyRows.length
    ) {
      throw new Error('Local sandbox lifecycle proof failed.');
    }
    process.stdout.write(
      `${JSON.stringify({
        generationsVerified: 2,
        accountsPreserved: 22,
        activeItems: 36,
        archivedItems: 36,
        integrityOk: true,
        foreignKeyViolations: 0,
      })}\n`,
    );
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
