import { createHash, randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtemp, open, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { restoreAndVerifyD1Export } from '../d1/verify-d1-export.mjs';

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
  return createHash('sha256')
    .update(value ?? '')
    .digest('hex');
}

export function validatePlaygroundResetTarget(manifest) {
  const names = manifest?.resources?.names ?? {};
  const requiredNames = [
    names.d1Working,
    names.r2BaselineBrand,
    names.r2WorkingBrand,
    names.r2BaselineEvidence,
    names.r2WorkingEvidence,
  ];
  const hostname = String(manifest?.playgroundHostname ?? '')
    .replace(/^https?:\/\//u, '')
    .replace(/\/$/u, '');
  if (
    manifest?.status !== 'READY' ||
    !/^[0-9a-f-]{36}$/iu.test(String(manifest?.d1?.databaseId ?? '')) ||
    typeof manifest?.d1?.cleanBaselineBookmark !== 'string' ||
    manifest.d1.cleanBaselineBookmark.length < 8 ||
    !hostname ||
    hostname === 'logistics.hausc.org' ||
    !/^[-a-z0-9.]+$/iu.test(hostname) ||
    requiredNames.some(
      (name) => typeof name !== 'string' || !/(?:playground|(?:^|-)pg(?:-|$))/iu.test(name),
    ) ||
    new Set(requiredNames).size !== requiredNames.length
  ) {
    throw new Error('Reset refused: manifest does not identify one isolated Playground tuple.');
  }
  return { hostname, names, requiredNames };
}

async function jsonEndpoint(url, label) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) throw new Error(`Reset refused: ${label} is unavailable.`);
  return payload;
}

async function verifyRuntime(hostname) {
  const baseUrl = `https://${hostname}`;
  const [version, health, readiness] = await Promise.all([
    jsonEndpoint(`${baseUrl}/api/version`, 'Playground version probe'),
    jsonEndpoint(`${baseUrl}/api/health`, 'Playground health probe'),
    jsonEndpoint(`${baseUrl}/api/readiness`, 'Playground readiness probe'),
  ]);
  if (
    version.playground !== true ||
    String(version.environment ?? '').toUpperCase() !== 'STAGING' ||
    String(version.database?.schemaVersion ?? '') !== '32' ||
    String(version.database?.latestMigration ?? '') !== '0032_staff_account_activity_history.sql' ||
    health.ok !== true ||
    readiness.ok !== true ||
    readiness.ready !== true
  ) {
    throw new Error('Reset refused: live Worker is not the ready isolated Playground runtime.');
  }
  return { environment: 'STAGING', playground: true, health: 'AVAILABLE', ready: true };
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

export const RESET_VERIFICATION_SQL =
  "SELECT (SELECT value FROM app_metadata WHERE key='operational_schema_version') AS schema_version, (SELECT name FROM d1_migrations ORDER BY id DESC LIMIT 1) AS latest_migration, (SELECT value FROM app_metadata WHERE key='playground.working_state') AS working_state, (SELECT value FROM app_metadata WHERE key='playground.reset_generation') AS reset_generation, (SELECT COUNT(*) FROM sessions) AS sessions, (SELECT COUNT(*) FROM password_reset_tokens) AS password_reset_tokens, (SELECT COUNT(*) FROM auth_rate_limits) AS auth_rate_limits, (SELECT COUNT(*) FROM auth_rate_limit_events) AS auth_rate_limit_events, (SELECT COUNT(*) FROM email_verification_challenges) AS email_verification_challenges, (SELECT COUNT(*) FROM account_applications) AS account_applications, (SELECT COUNT(*) FROM account_application_history) AS account_application_history, (SELECT COUNT(*) FROM public_request_rate_limit_events) AS public_request_rate_limit_events, (SELECT COUNT(*) FROM public_lending_rate_limit_events) AS public_lending_rate_limit_events, (SELECT COUNT(*) FROM reporting_outbox) AS reporting_outbox, (SELECT COUNT(*) FROM pragma_foreign_key_check) AS foreign_key_violations, (SELECT COUNT(*) FROM evidence_metadata WHERE private_storage_reference IS NOT NULL AND TRIM(private_storage_reference) <> '') AS evidence_object_count, COALESCE((SELECT json_group_array(private_storage_reference) FROM (SELECT private_storage_reference FROM evidence_metadata WHERE private_storage_reference IS NOT NULL AND TRIM(private_storage_reference) <> '' ORDER BY private_storage_reference)), '[]') AS evidence_object_keys_json;";

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
  return {
    generation,
    transientCounts,
    transientTotal,
    foreignKeyViolations,
    evidenceObjectCount,
    linkageMatches,
  };
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
  const exportPath = await privatePath(
    path.join(
      path.dirname(reportPath),
      `${path.basename(reportPath, path.extname(reportPath))}.pre-reset.sql`,
    ),
    { existing: false },
  );
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const { hostname, names, requiredNames } = validatePlaygroundResetTarget(manifest);
  const databaseId = manifest.d1?.databaseId;
  const cleanBookmark = manifest.d1?.cleanBaselineBookmark;
  const lockPath = path.join(path.dirname(manifestPath), 'playground-reset.lock');
  let lock;
  let workspace;
  let targetVerified = false;
  let phase = 'LOCK_ACQUISITION';
  let preResetBookmark = '';
  let preResetExportSha256 = '';
  let generation = 0;
  let before;
  try {
    lock = await open(lockPath, 'wx', 0o600);
    await lock.writeFile(
      `${JSON.stringify({ operation: 'PLAYGROUND_RESET', acquiredAt: new Date().toISOString() })}\n`,
    );

    phase = 'TARGET_PREFLIGHT';
    const inventory = wrangler(['d1', 'list', '--json'], { json: true });
    const exact = inventory.find((entry) => entry.name === names.d1Working);
    if ((exact?.uuid ?? exact?.id) !== databaseId) {
      throw new Error('Reset refused: fixed Playground D1 identity does not match provider inventory.');
    }
    const r2Inventory = wrangler(['r2', 'bucket', 'list']);
    if (requiredNames.slice(1).some((name) => !r2Inventory.includes(name))) {
      throw new Error('Reset refused: fixed Playground R2 identity does not match provider inventory.');
    }
    const runtime = await verifyRuntime(hostname);
    targetVerified = true;

    phase = 'RECOVERY_CAPTURE';
    const beforeInfo = wrangler(['d1', 'time-travel', 'info', databaseId, '--json'], { json: true });
    preResetBookmark = bookmarkFrom(beforeInfo);
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
    before = beforeRows[0];
    if (!before) throw new Error('Reset refused: the current Playground reset state is unavailable.');
    generation = nextResetGeneration(before.reset_generation);
    wrangler(['d1', 'export', databaseId, '--remote', '--output', exportPath]);
    workspace = await mkdtemp(path.join(tmpdir(), 'hau-pg-reset-export-'));
    await restoreAndVerifyD1Export(exportPath, path.join(workspace, 'pre-reset.sqlite'), {
      expectedSchema: '32',
      expectedMigration: '0032_staff_account_activity_history.sql',
    });
    preResetExportSha256 = sha256(await readFile(exportPath));

    phase = 'D1_RESTORE';
    wrangler(['d1', 'time-travel', 'restore', databaseId, '--bookmark', cleanBookmark, '--json'], {
      json: true,
    });

    const resettingAt = new Date().toISOString();
    const resettingState = JSON.stringify({
      state: 'RESETTING',
      activeTestSession: false,
      resetGeneration: generation,
      updatedAt: resettingAt,
    });
    wrangler([
      'd1',
      'execute',
      databaseId,
      '--remote',
      '--command',
      `INSERT INTO app_metadata (key, value, updated_at) VALUES ('playground.working_state', ${sqlText(resettingState)}, ${sqlText(resettingAt)}) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at;`,
    ]);

    phase = 'R2_RECONCILIATION';
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

    phase = 'CLEAN_VERIFICATION';
    const completedAt = new Date().toISOString();
    const workingState = JSON.stringify({
      state: 'CLEAN',
      activeTestSession: false,
      resetGeneration: generation,
      lastReset: completedAt,
      updatedAt: completedAt,
    });
    const oldSessionsInvalidated = nonNegativeInteger(before.sessions, 'before_session');
    const lastResetReceipt = JSON.stringify({
      status: 'PASS',
      generation,
      completedAt,
      oldSessionsInvalidated,
      consequences: [
        'Previous Playground sessions were invalidated.',
        'Transient D1 data was restored to the sealed clean baseline.',
        'Governed R2 working objects were reconciled to the clean baseline.',
        'A new Playground session is required.',
      ],
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
      ['d1', 'execute', databaseId, '--remote', '--command', RESET_VERIFICATION_SQL, '--json'],
      { json: true },
    );
    const resetVerification = validateResetVerification(d1Rows(verification)[0], resetResult, generation);
    phase = 'FINAL_RECEIPT';
    wrangler([
      'd1',
      'execute',
      databaseId,
      '--remote',
      '--command',
      `INSERT INTO app_metadata (key, value, updated_at) VALUES ('playground.last_reset_receipt', ${sqlText(lastResetReceipt)}, ${sqlText(completedAt)}) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at; DELETE FROM app_metadata WHERE key='playground.pending_operation';`,
    ]);
    const report = {
      schemaVersion: 2,
      completedAt,
      target: 'PLAYGROUND',
      productionMutation: 'NONE',
      googleMutation: 'NONE',
      runtime,
      lock: 'ACQUIRED_AND_RELEASED_AFTER_REPORT',
      preResetRecoveryBookmark: preResetBookmark,
      preResetExport: {
        path: exportPath,
        sha256: preResetExportSha256,
        localRestoreVerification: 'PASS',
      },
      restoredCleanBookmark: cleanBookmark,
      generation: { before: generation - 1, after: generation },
      oldSessionsInvalidated,
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
    console.log(
      'Production mutation: NONE. Private bookmarks, names, identifiers, keys, and hashes were not printed.',
    );
  } catch (error) {
    if (targetVerified) {
      try {
        const failedAt = new Date().toISOString();
        const failedState = JSON.stringify({
          state: 'ERROR',
          activeTestSession: false,
          resetGeneration: generation || Number(before?.reset_generation ?? 0),
          updatedAt: failedAt,
        });
        wrangler([
          'd1',
          'execute',
          databaseId,
          '--remote',
          '--command',
          `INSERT INTO app_metadata (key, value, updated_at) VALUES ('playground.working_state', ${sqlText(failedState)}, ${sqlText(failedAt)}) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at;`,
        ]);
      } catch {
        // Preserve the original reset failure when even the fail-closed marker is unavailable.
      }
    }
    try {
      await writeFile(
        reportPath,
        `${JSON.stringify(
          {
            schemaVersion: 2,
            status: 'ERROR',
            failedAt: new Date().toISOString(),
            phase,
            target: 'PLAYGROUND',
            productionMutation: 'NONE',
            googleMutation: 'NONE',
            preResetRecoveryBookmark: preResetBookmark || null,
            preResetExport: preResetExportSha256
              ? { path: exportPath, sha256: preResetExportSha256, localRestoreVerification: 'PASS' }
              : null,
            error: String(error?.message ?? 'Playground reset failed.'),
          },
          null,
          2,
        )}\n`,
        { flag: 'wx', mode: 0o600 },
      );
    } catch {
      // A pre-existing or unavailable report path must not hide the reset failure.
    }
    throw error;
  } finally {
    if (workspace) await rm(workspace, { recursive: true, force: true });
    if (lock) {
      await lock.close();
      await rm(lockPath, { force: true });
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
