import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const wranglerBin = path.join(repoRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

function inside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function wrangler(args, { json = false } = {}) {
  const result = spawnSync(process.execPath, [wranglerBin, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.status !== 0) throw new Error(`Playground reset provider command failed (${args[0]}).`);
  return json ? JSON.parse(result.stdout) : result.stdout;
}

function bookmarkFrom(value) {
  if (!value || typeof value !== 'object') return '';
  for (const [key, child] of Object.entries(value)) {
    if (/bookmark/iu.test(key) && typeof child === 'string' && child.length >= 8) return child;
    const nested = bookmarkFrom(child);
    if (nested) return nested;
  }
  return '';
}

async function privatePath(value, { existing }) {
  if (!path.isAbsolute(value ?? '')) throw new Error('Reset paths must be absolute.');
  const parent = await realpath(existing ? value : path.dirname(value));
  const resolved = existing ? parent : path.join(parent, path.basename(value));
  if (inside(repoRoot, resolved)) throw new Error('Reset paths must remain outside the repository.');
  if (existing && !(await stat(resolved)).isFile()) throw new Error('Reset manifest must be a file.');
  if (!existing) {
    try {
      await stat(resolved);
      throw new Error('Reset report exists; refusing to overwrite it.');
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  return resolved;
}

async function run() {
  const [manifestArg, reportArg] = process.argv.slice(2);
  const manifestPath = await privatePath(manifestArg, { existing: true });
  const reportPath = await privatePath(reportArg, { existing: false });
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const databaseId = manifest.d1?.databaseId;
  const cleanBookmark = manifest.d1?.cleanBaselineBookmark;
  if (manifest.status !== 'READY' || !databaseId || !cleanBookmark) {
    throw new Error('Reset refused: the private playground manifest has no sealed clean reset point.');
  }
  const inventory = wrangler(['d1', 'list', '--json'], { json: true });
  const exact = inventory.find((entry) => entry.name === manifest.resources.names.d1Working);
  if ((exact?.uuid ?? exact?.id) !== databaseId) {
    throw new Error('Reset refused: fixed playground D1 identity does not match provider inventory.');
  }
  const beforeInfo = wrangler(['d1', 'time-travel', 'info', databaseId, '--json'], { json: true });
  const preResetBookmark = bookmarkFrom(beforeInfo);
  if (!preResetBookmark) throw new Error('Reset refused: reversible pre-reset bookmark is unavailable.');
  wrangler(['d1', 'time-travel', 'restore', databaseId, '--bookmark', cleanBookmark]);

  const names = manifest.resources.names;
  const token = randomBytes(32).toString('base64url');
  const configPath = path.join(path.dirname(reportPath), `r2-reset-${Date.now()}.private.jsonc`);
  const config = {
    name: `hau-usc-logistics-pg-reset-${Date.now()}`,
    main: path.join(repoRoot, 'scripts', 'playground', 'r2-reset-worker.js'),
    compatibility_date: '2026-03-17',
    workers_dev: true,
    preview_urls: false,
    r2_buckets: [
      { binding: 'BASELINE_BRAND', bucket_name: names.r2BaselineBrand },
      { binding: 'WORKING_BRAND', bucket_name: names.r2WorkingBrand },
      { binding: 'WORKING_EVIDENCE', bucket_name: names.r2WorkingEvidence },
    ],
    vars: { RESET_TOKEN: token },
  };
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  let deployed = false;
  let resetResult;
  try {
    const deployment = wrangler(['deploy', '--config', configPath]);
    deployed = true;
    const workerUrl = deployment.match(/https:\/\/[^\s]+\.workers\.dev/iu)?.[0];
    if (!workerUrl) throw new Error('Temporary reset Worker URL was not returned.');
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const response = await fetch(`${workerUrl}/reset`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
      });
      if (String(response.headers.get('content-type') ?? '').includes('application/json')) {
        resetResult = await response.json();
        if (response.ok && resetResult.ok) break;
      } else {
        await response.arrayBuffer();
      }
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    if (!resetResult?.ok) throw new Error('R2 working-state reset failed reconciliation.');
  } finally {
    if (deployed) wrangler(['delete', '--name', config.name, '--force']);
    await rm(configPath, { force: true });
  }

  const verification = wrangler(
    [
      'd1',
      'execute',
      databaseId,
      '--remote',
      '--command',
      "SELECT value FROM app_metadata WHERE key IN ('operational_schema_version','playground.working_state'); SELECT name FROM d1_migrations ORDER BY id DESC LIMIT 1; SELECT COUNT(*) AS reset_probe_count FROM app_metadata WHERE key='playground.reset_probe'; PRAGMA foreign_key_check;",
      '--json',
    ],
    { json: true },
  );
  const serialized = JSON.stringify(verification);
  if (
    !serialized.includes('0032_staff_account_activity_history.sql') ||
    !serialized.includes('CLEAN') ||
    !serialized.includes('reset_probe_count')
  ) {
    throw new Error('D1 reset verification failed.');
  }
  const report = {
    schemaVersion: 1,
    completedAt: new Date().toISOString(),
    target: 'PLAYGROUND',
    productionMutation: 'NONE',
    preResetRecoveryBookmark: preResetBookmark,
    restoredCleanBookmark: cleanBookmark,
    d1: { schemaVersion: '32', latestMigration: '0032_staff_account_activity_history.sql', foreignKeys: 'PASS' },
    r2: resetResult,
  };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  console.log('Reset Workspace: PASS');
  console.log('D1 restored to the sealed playground bookmark; R2 working state reconciled to baseline.');
  console.log('Production mutation: NONE. Private bookmarks, names, identifiers, keys, and hashes were not printed.');
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
