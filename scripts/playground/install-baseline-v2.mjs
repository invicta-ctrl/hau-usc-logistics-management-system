import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reconcileInventoryDatabase } from '../d1/reconcile-inventory-truth.mjs';
import { restoreAndVerifyD1Export } from '../d1/verify-d1-export.mjs';
import { d1Rows } from './reset-workspace.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const wranglerBin = path.join(repoRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

function inside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function privateExisting(value, label) {
  if (!path.isAbsolute(value ?? '')) throw new Error(`${label} must be an absolute private path.`);
  const resolved = await realpath(value);
  if (inside(repoRoot, resolved) || !(await stat(resolved)).isFile()) {
    throw new Error(`${label} must be a private file outside the repository.`);
  }
  return resolved;
}

async function privateNew(value, label) {
  if (!path.isAbsolute(value ?? '')) throw new Error(`${label} must be an absolute private path.`);
  const parent = await realpath(path.dirname(value));
  const resolved = path.join(parent, path.basename(value));
  if (inside(repoRoot, resolved)) throw new Error(`${label} must remain outside the repository.`);
  try {
    await stat(resolved);
    throw new Error(`${label} exists; refusing to overwrite it.`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return resolved;
}

function wrangler(args, { json = false } = {}) {
  const result = spawnSync(process.execPath, [wranglerBin, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.status !== 0) throw new Error(`Playground baseline provider command failed (${args[0]}).`);
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

const manifestPath = await privateExisting(argument('--manifest'), 'Resource manifest');
const resetReportPath = await privateExisting(argument('--reset-report'), 'Reset report');
const overlayPath = await privateExisting(argument('--overlay'), 'Coverage overlay');
const baselineReportPath = await privateExisting(argument('--baseline-report'), 'Coverage baseline report');
const outputManifestPath = await privateNew(argument('--output-manifest'), 'Updated resource manifest');
const outputReportPath = await privateNew(argument('--output-report'), 'Install report');
const liveExportPath = await privateNew(argument('--live-export'), 'Live D1 export');
const [manifest, resetReport, overlay, baselineReport] = await Promise.all([
  readFile(manifestPath, 'utf8').then(JSON.parse),
  readFile(resetReportPath, 'utf8').then(JSON.parse),
  readFile(overlayPath, 'utf8'),
  readFile(baselineReportPath, 'utf8').then(JSON.parse),
]);

if (manifest.status !== 'READY' || !manifest.d1?.databaseId || !manifest.resources?.names?.d1Working) {
  throw new Error('Private Playground manifest is not ready.');
}
if (
  resetReport.target !== 'PLAYGROUND' ||
  resetReport.productionMutation !== 'NONE' ||
  !Number.isSafeInteger(resetReport.generation?.after)
) {
  throw new Error('A reconciled current Playground reset report is required.');
}
if (
  baselineReport.status !== 'PASS' ||
  baselineReport.baselineId !== 'PGBL-20260828-COVERAGE-V2' ||
  baselineReport.sourceClassification !== 'DERIVED_FROM_PRIVACY_FILTERED_BASELINE_NO_NEW_PRODUCTION_READ'
) {
  throw new Error('Coverage baseline report is not accepted v2.');
}
for (const forbidden of [/\bDROP\b/iu, /\bDELETE\b/iu, /\bALTER\b/iu, /\bCREATE\s+TABLE\b/iu]) {
  if (forbidden.test(overlay)) throw new Error('Coverage overlay is destructive or schema-changing.');
}
if (!overlay.includes('PRAGMA defer_foreign_keys = ON;') || !overlay.includes('PGBL-20260828-COVERAGE-V2')) {
  throw new Error('Coverage overlay lacks its exact atomic identity boundary.');
}

const databaseId = manifest.d1.databaseId;
const providerInventory = wrangler(['d1', 'list', '--json'], { json: true });
const exact = providerInventory.find((entry) => entry.name === manifest.resources.names.d1Working);
if ((exact?.uuid ?? exact?.id) !== databaseId) throw new Error('Fixed Playground D1 identity mismatch.');

const preflightSql = `SELECT
  (SELECT value FROM app_metadata WHERE key='operational_schema_version') AS schema_version,
  (SELECT name FROM d1_migrations ORDER BY id DESC LIMIT 1) AS latest_migration,
  (SELECT value FROM app_metadata WHERE key='playground.baseline_id') AS baseline_id,
  (SELECT value FROM app_metadata WHERE key='playground.baseline_version') AS baseline_version,
  (SELECT value FROM app_metadata WHERE key='playground.working_state') AS working_state,
  (SELECT value FROM app_metadata WHERE key='playground.reset_generation') AS reset_generation,
  (SELECT COUNT(*) FROM sessions) + (SELECT COUNT(*) FROM password_reset_tokens) +
  (SELECT COUNT(*) FROM auth_rate_limits) + (SELECT COUNT(*) FROM auth_rate_limit_events) +
  (SELECT COUNT(*) FROM email_verification_challenges) + (SELECT COUNT(*) FROM account_applications) +
  (SELECT COUNT(*) FROM account_application_history) + (SELECT COUNT(*) FROM public_request_rate_limit_events) +
  (SELECT COUNT(*) FROM public_lending_rate_limit_events) + (SELECT COUNT(*) FROM reporting_outbox) AS transient_total,
  (SELECT COUNT(*) FROM pragma_foreign_key_check) AS foreign_key_violations;`;
const preflight = d1Rows(
  wrangler(['d1', 'execute', databaseId, '--remote', '--command', preflightSql, '--json'], { json: true }),
)[0];
const workingState = JSON.parse(String(preflight?.working_state ?? '{}'));
if (
  String(preflight?.schema_version) !== '32' ||
  String(preflight?.latest_migration) !== '0032_staff_account_activity_history.sql' ||
  workingState.state !== 'CLEAN' ||
  workingState.activeTestSession !== false ||
  Number(preflight?.reset_generation) !== resetReport.generation.after ||
  Number(preflight?.transient_total) !== 0 ||
  Number(preflight?.foreign_key_violations) !== 0
) {
  throw new Error('Live Playground is not the exact clean post-reset baseline.');
}

const beforeInfo = wrangler(['d1', 'time-travel', 'info', databaseId, '--json'], { json: true });
const preApplyBookmark = bookmarkFrom(beforeInfo);
if (!preApplyBookmark) throw new Error('Reversible pre-apply bookmark is unavailable.');

let mutationAttempted = false;
let succeeded = false;
let workspace = '';
try {
  mutationAttempted = true;
  wrangler(['d1', 'execute', databaseId, '--remote', '--file', overlayPath, '--yes']);
  const postflightSql = `SELECT
    (SELECT value FROM app_metadata WHERE key='playground.baseline_id') AS baseline_id,
    (SELECT value FROM app_metadata WHERE key='playground.baseline_version') AS baseline_version,
    (SELECT value FROM app_metadata WHERE key='playground.reset_generation') AS reset_generation,
    (SELECT COUNT(*) FROM pragma_foreign_key_check) AS foreign_key_violations,
    (SELECT COUNT(*) FROM sessions) + (SELECT COUNT(*) FROM password_reset_tokens) +
      (SELECT COUNT(*) FROM auth_rate_limits) + (SELECT COUNT(*) FROM auth_rate_limit_events) +
      (SELECT COUNT(*) FROM email_verification_challenges) + (SELECT COUNT(*) FROM account_applications) +
      (SELECT COUNT(*) FROM account_application_history) + (SELECT COUNT(*) FROM public_request_rate_limit_events) +
      (SELECT COUNT(*) FROM public_lending_rate_limit_events) + (SELECT COUNT(*) FROM reporting_outbox) AS transient_total,
    (SELECT COUNT(*) FROM inventory_items WHERE is_lendable = 1) AS lendable_items,
    (SELECT COUNT(*) FROM reservations WHERE status = 'ACTIVE') AS active_reservations,
    (SELECT COUNT(*) FROM lending_tickets WHERE status IN ('FOR_REVIEW','READY_TO_CLAIM','ON_LOAN')) AS active_lending,
    (SELECT COUNT(*) FROM event_operational_links) AS event_links,
    (SELECT COUNT(*) FROM canonical_people) AS canonical_people,
    (SELECT COUNT(*) FROM account_staff_links) AS account_person_links,
    (SELECT COUNT(*) FROM staff_account_activity_history) AS staff_activity,
    (SELECT COUNT(*) FROM reference_records) AS reference_records,
    (SELECT COUNT(*) FROM reference_links) AS reference_links;`;
  const postflight = d1Rows(
    wrangler(['d1', 'execute', databaseId, '--remote', '--command', postflightSql, '--json'], { json: true }),
  )[0];
  const safeCounts = Object.fromEntries(
    [
      'lendable_items',
      'active_reservations',
      'active_lending',
      'event_links',
      'canonical_people',
      'account_person_links',
      'staff_activity',
      'reference_records',
      'reference_links',
    ].map((key) => [key, Number(postflight?.[key] ?? 0)]),
  );
  if (
    postflight?.baseline_id !== 'PGBL-20260828-COVERAGE-V2' ||
    Number(postflight?.baseline_version) !== 2 ||
    Number(postflight?.reset_generation) !== resetReport.generation.after ||
    Number(postflight?.foreign_key_violations) !== 0 ||
    Number(postflight?.transient_total) !== 0 ||
    Object.values(safeCounts).some((value) => value < 1)
  ) {
    throw new Error('Live Playground coverage postflight failed.');
  }

  wrangler(['d1', 'export', databaseId, '--remote', '--output', liveExportPath]);
  workspace = await mkdtemp(path.join(tmpdir(), 'hau-pg-v2-live-'));
  const restoredPath = path.join(workspace, 'restored.sqlite');
  await restoreAndVerifyD1Export(liveExportPath, restoredPath);
  const restored = new DatabaseSync(restoredPath, { readOnly: true });
  let reconciliation;
  try {
    reconciliation = reconcileInventoryDatabase(restored, { environment: 'ISOLATED_STAGING' });
  } finally {
    restored.close();
  }
  if (reconciliation.summary.disposition !== 'RECONCILED') {
    throw new Error('Live exported Playground inventory reconciliation failed.');
  }

  const afterInfo = wrangler(['d1', 'time-travel', 'info', databaseId, '--json'], { json: true });
  const cleanBaselineBookmark = bookmarkFrom(afterInfo);
  if (!cleanBaselineBookmark || cleanBaselineBookmark === preApplyBookmark) {
    throw new Error('A distinct v2 clean baseline bookmark was not returned.');
  }
  const updatedManifest = {
    ...manifest,
    baseline: {
      ...manifest.baseline,
      baselineId: baselineReport.baselineId,
      baselineVersion: baselineReport.baselineVersion,
      sourceBaselineId: baselineReport.sourceBaselineId,
      sourceClassification: baselineReport.sourceClassification,
      coverageOverlayVersion: baselineReport.coverageOverlayVersion,
      capturedAt: baselineReport.capturedAt,
      databaseSha256: baselineReport.databaseSha256,
      sqlSha256: baselineReport.sqlSha256,
    },
    d1: {
      ...manifest.d1,
      cleanBaselineBookmark,
      cleanBaselineBookmarkCapturedAt: new Date().toISOString(),
    },
  };
  await writeFile(outputManifestPath, `${JSON.stringify(updatedManifest, null, 2)}\n`, {
    flag: 'wx',
    mode: 0o600,
  });
  await writeFile(
    outputReportPath,
    `${JSON.stringify(
      {
        status: 'PASS',
        completedAt: new Date().toISOString(),
        target: 'PLAYGROUND',
        baselineId: baselineReport.baselineId,
        baselineVersion: baselineReport.baselineVersion,
        resetGeneration: resetReport.generation.after,
        productionRead: 'NONE',
        productionMutation: 'NONE',
        schemaMutation: 'NONE',
        preApplyRecoveryBookmark: preApplyBookmark,
        cleanBaselineBookmark,
        safeCounts,
        inventoryReconciliation: reconciliation.summary,
      },
      null,
      2,
    )}\n`,
    { flag: 'wx', mode: 0o600 },
  );
  succeeded = true;
  console.log('Playground baseline coverage v2: INSTALLED AND VERIFIED');
  console.log(
    'Production read/mutation and schema mutation: NONE. Private identities and bookmarks were not printed.',
  );
} catch (error) {
  if (mutationAttempted && !succeeded) {
    let rollbackStatus = 'FAILED_ROLLBACK_UNVERIFIED';
    try {
      wrangler(['d1', 'time-travel', 'restore', databaseId, '--bookmark', preApplyBookmark]);
      const rollbackSql = `SELECT
        (SELECT value FROM app_metadata WHERE key='playground.baseline_id') AS baseline_id,
        (SELECT value FROM app_metadata WHERE key='playground.baseline_version') AS baseline_version,
        (SELECT value FROM app_metadata WHERE key='playground.reset_generation') AS reset_generation,
        (SELECT value FROM app_metadata WHERE key='playground.working_state') AS working_state,
        (SELECT COUNT(*) FROM pragma_foreign_key_check) AS foreign_key_violations,
        (SELECT COUNT(*) FROM sessions) + (SELECT COUNT(*) FROM password_reset_tokens) +
          (SELECT COUNT(*) FROM auth_rate_limits) + (SELECT COUNT(*) FROM auth_rate_limit_events) +
          (SELECT COUNT(*) FROM email_verification_challenges) + (SELECT COUNT(*) FROM account_applications) +
          (SELECT COUNT(*) FROM account_application_history) + (SELECT COUNT(*) FROM public_request_rate_limit_events) +
          (SELECT COUNT(*) FROM public_lending_rate_limit_events) + (SELECT COUNT(*) FROM reporting_outbox) AS transient_total;`;
      const rollback = d1Rows(
        wrangler(['d1', 'execute', databaseId, '--remote', '--command', rollbackSql, '--json'], {
          json: true,
        }),
      )[0];
      const rollbackWorkingState = JSON.parse(String(rollback?.working_state ?? '{}'));
      if (
        rollback?.baseline_id !== preflight?.baseline_id ||
        Number(rollback?.baseline_version) !== Number(preflight?.baseline_version) ||
        Number(rollback?.reset_generation) !== resetReport.generation.after ||
        rollbackWorkingState.state !== 'CLEAN' ||
        rollbackWorkingState.activeTestSession !== false ||
        Number(rollback?.foreign_key_violations) !== 0 ||
        Number(rollback?.transient_total) !== 0
      ) {
        throw new Error('Rollback state verification failed.');
      }
      rollbackStatus = 'FAILED_ROLLED_BACK';
    } catch {
      rollbackStatus = 'FAILED_ROLLBACK_UNVERIFIED';
    }
    await rm(outputManifestPath, { force: true });
    await rm(outputReportPath, { force: true });
    await writeFile(
      outputReportPath,
      `${JSON.stringify(
        {
          status: rollbackStatus,
          completedAt: new Date().toISOString(),
          target: 'PLAYGROUND',
          productionRead: 'NONE',
          productionMutation: 'NONE',
          schemaMutation: 'NONE',
          rollbackBookmark: preApplyBookmark,
          errorClass: 'BASELINE_V2_INSTALL_FAILED',
        },
        null,
        2,
      )}\n`,
      { flag: 'wx', mode: 0o600 },
    );
    if (rollbackStatus !== 'FAILED_ROLLED_BACK') {
      throw new Error('Playground baseline v2 install failed and rollback could not be verified.', {
        cause: error,
      });
    }
  }
  throw error;
} finally {
  if (workspace) await rm(workspace, { recursive: true, force: true });
}
