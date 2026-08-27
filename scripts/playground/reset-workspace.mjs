import { createHash, randomBytes } from 'node:crypto';
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

export function d1Rows(result) {
  const candidate = Array.isArray(result) ? result : [result];
  return candidate.flatMap((entry) => entry?.results ?? entry?.result?.[0]?.results ?? []);
}

function sqlText(value) {
  return `'${String(value ?? '').replaceAll("'", "''")}'`;
}

function sha256(value) {
  return createHash('sha256').update(String(value ?? '')).digest('hex');
}

export function nextResetGeneration(value) {
  const current = Number(value ?? 0);
  if (!Number.isSafeInteger(current) || current < 0 || current >= Number.MAX_SAFE_INTEGER) {
    throw new Error('Reset refused: the current reset generation is invalid.');
  }
  return current + 1;
}

const TRANSIENT_COUNT_FIELDS = Object.freeze([
  'sessions',
  'password_reset_tokens',
  'auth_rate_limits',
  'auth_rate_limit_events',
  'email_verification_challenges',
  'account_applications',
  'account_application_history',
  'public_request_rate_limit_events',
  'public_lending_rate_limit_events',
  'reporting_outbox',
]);

export const RESET_VERIFICATION_SQL = "SELECT (SELECT value FROM app_metadata WHERE key='operational_schema_version') AS schema_version, (SELECT name FROM d1_migrations ORDER BY id DESC LIMIT 1) AS latest_migration, (SELECT value FROM app_metadata WHERE key='playground.working_state') AS working_state, (SELECT value FROM app_metadata WHERE key='playground.reset_generation') AS reset_generation, (SELECT COUNT(*) FROM sessions) AS sessions, (SELECT COUNT(*) FROM password_reset_tokens) AS password_reset_tokens, (SELECT COUNT(*) FROM auth_rate_limits) AS auth_rate_limits, (SELECT COUNT(*) FROM auth_rate_limit_events) AS auth_rate_limit_events, (SELECT COUNT(*) FROM email_verification_challenges) AS email_verification_challenges, (SELECT COUNT(*) FROM account_applications) AS account_applications, (SELECT COUNT(*) FROM account_application_history) AS account_application_history, (SELECT COUNT(*) FROM public_request_rate_limit_events) AS public_request_rate_limit_events, (SELECT COUNT(*) FROM public_lending_rate_limit_events) AS public_lending_rate_limit_events, (SELECT COUNT(*) FROM reporting_outbox) AS reporting_outbox, (SELECT COUNT(*) FROM pragma_foreign_key_check) AS foreign_key_violations, (SELECT COUNT(*) FROM evidence_metadata WHERE private_storage_reference IS NOT NULL AND TRIM(private_storage_reference) <> '') AS evidence_object_count, COALESCE((SELECT json_group_array(private_storage_reference) FROM (SELECT private_storage_reference FROM evidence_metadata WHERE private_storage_reference IS NOT NULL AND TRIM(private_storage_reference) <> '' ORDER BY private_storage_reference)), '[]') AS evidence_object_keys_json;";

function nonNegativeInteger(value, field) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`Reset verification returned an invalid ${field} count.`);
  }
  return parsed;
}

export function validateResetVerification(row, r2, expectedGeneration) {
  if (!row || typeof row !== 'object') throw new Error('D1 reset verification returned no summary row.');
  const workingState = JSON.parse(String(row.working_state ?? '{}'));
  const generation = Number(row.reset_generation);
  const transientCounts = Object.fromEntries(
    TRANSIENT_COUNT_FIELDS.map((field) => [field, nonNegativeInteger(row[field], field)]),
  );
  const transientTotal = Object.values(transientCounts).reduce((sum, value) => sum + value, 0);
  const evidenceKeys = JSON.parse(String(row.evidence_object_keys_json ?? '[]'));
  if (!Array.isArray(evidenceKeys) || evidenceKeys.some((key) => typeof key !== 'string')) {
    throw new Error('D1 reset verification returned an invalid evidence-key projection.');
  }
  const evidenceObjectCount = nonNegativeInteger(row.evidence_object_count, 'evidence_object');
  const foreignKeyViolations = nonNegativeInteger(row.foreign_key_violations, 'foreign_key_violation');
  const r2Evidence = r2?.working?.evidence;
  const linkageMatches =
    evidenceObjectCount === evidenceKeys.length &&
    evidenceObjectCount === Number(r2Evidence?.count) &&
    sha256(JSON.stringify(evidenceKeys)) === String(r2Evidence?.keyHash ?? '');
  if (
    String(row.schema_version) !== '32' ||
    String(row.latest_migration) !== '0032_staff_account_activity_history.sql' ||
    workingState.state !== 'CLEAN' ||
    workingState.activeTestSession !== false ||
    Number(workingState.resetGeneration) !== expectedGeneration ||
    generation !== expectedGeneration ||
    transientTotal !== 0 ||
    foreignKeyViolations !== 0 ||
    !linkageMatches
  ) {
    throw new Error('D1 reset verification failed.');
  }
  return { generation, transientCounts, transientTotal, foreignKeyViolations, evidenceObjectCount, linkageMatches };
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
  const beforeRows = d1Rows(
    wrangler(
      [
        'd1',
        'execute',
        databaseId,
        '--remote',
        '--command',
        "SELECT COALESCE((SELECT value FROM app_metadata WHERE key='playground.reset_generation'), '0') AS reset_generation, (SELECT COUNT(*) FROM sessions) AS sessions;",
        '--json',
      ],
      { json: true },
    ),
  );
  const before = beforeRows[0];
  if (!before) throw new Error('Reset refused: the current Playground reset state is unavailable.');
  const generation = nextResetGeneration(before.reset_generation);
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
      { binding: 'BASELINE_EVIDENCE', bucket_name: names.r2BaselineEvidence },
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

  const completedAt = new Date().toISOString();
  const workingState = JSON.stringify({
    state: 'CLEAN',
    activeTestSession: false,
    resetGeneration: generation,
    updatedAt: completedAt,
  });
  wrangler([
    'd1',
    'execute',
    databaseId,
    '--remote',
    '--command',
    `INSERT INTO app_metadata (key, value, updated_at) VALUES ('playground.reset_generation', ${sqlText(generation)}, ${sqlText(completedAt)}) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at; INSERT INTO app_metadata (key, value, updated_at) VALUES ('playground.working_state', ${sqlText(workingState)}, ${sqlText(completedAt)}) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at;`,
  ]);

  const verification = wrangler(
    [
      'd1',
      'execute',
      databaseId,
      '--remote',
      '--command',
      RESET_VERIFICATION_SQL,
      '--json',
    ],
    { json: true },
  );
  const resetVerification = validateResetVerification(d1Rows(verification)[0], resetResult, generation);
  const report = {
    schemaVersion: 2,
    completedAt,
    target: 'PLAYGROUND',
    productionMutation: 'NONE',
    preResetRecoveryBookmark: preResetBookmark,
    restoredCleanBookmark: cleanBookmark,
    generation: { before: generation - 1, after: generation },
    oldSessionsInvalidated: nonNegativeInteger(before.sessions, 'before_session'),
    d1: {
      schemaVersion: '32',
      latestMigration: '0032_staff_account_activity_history.sql',
      foreignKeys: 'PASS',
      transientCounts: resetVerification.transientCounts,
      evidenceObjectCount: resetVerification.evidenceObjectCount,
      d1ToR2Linkage: resetVerification.linkageMatches ? 'PASS' : 'FAIL',
    },
    r2: resetResult,
  };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  console.log('Reset Workspace: PASS');
  console.log('D1 restored to the sealed playground bookmark; R2 working state reconciled to baseline.');
  console.log('Production mutation: NONE. Private bookmarks, names, identifiers, keys, and hashes were not printed.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
