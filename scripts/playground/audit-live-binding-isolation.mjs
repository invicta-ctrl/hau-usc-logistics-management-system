import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { latestDeploymentVersionId } from './deployment-history.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const wranglerBin = path.join(repoRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

function bindingValue(version, name, type, property) {
  const bindings = version?.resources?.bindings;
  if (!Array.isArray(bindings)) return '';
  return String(
    bindings.find((entry) => entry.name === name && entry.type === type)?.[property] ?? '',
  ).trim();
}

export function classifyLiveBindingIsolation(stagingVersion, productionVersion) {
  const staging = {
    d1: bindingValue(stagingVersion, 'DB', 'd1', 'database_id'),
    brand: bindingValue(stagingVersion, 'BRAND_ASSETS', 'r2_bucket', 'bucket_name'),
    evidence: bindingValue(stagingVersion, 'EVIDENCE_ASSETS', 'r2_bucket', 'bucket_name'),
  };
  const production = {
    d1: bindingValue(productionVersion, 'DB', 'd1', 'database_id'),
    brand: bindingValue(productionVersion, 'BRAND_ASSETS', 'r2_bucket', 'bucket_name'),
    evidence: bindingValue(productionVersion, 'EVIDENCE_ASSETS', 'r2_bucket', 'bucket_name'),
  };
  const stagingComplete = Object.values(staging).every(Boolean);
  const productionComplete = Object.values(production).every(Boolean);
  const productionCrossover =
    !stagingComplete ||
    !productionComplete ||
    staging.d1 === production.d1 ||
    staging.brand === production.brand ||
    staging.evidence === production.evidence;

  return Object.freeze({
    valid: stagingComplete && productionComplete && !productionCrossover,
    classification: 'ISOLATED_STAGING_WORKING_D1_R2',
    staging: Object.freeze({
      d1Bound: Boolean(staging.d1),
      brandR2Bound: Boolean(staging.brand),
      evidenceR2Bound: Boolean(staging.evidence),
    }),
    productionComparisonAvailable: productionComplete,
    productionCrossover,
  });
}

function wranglerJson(args) {
  const result = spawnSync(process.execPath, [wranglerBin, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.status !== 0)
    throw new Error('Live binding isolation audit failed without exposing provider details.');
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error('Live binding isolation audit returned an unreadable provider response.');
  }
}

function latestVersion(environment) {
  const deployments = wranglerJson(['deployments', 'list', '--env', environment, '--json']);
  const versionId = latestDeploymentVersionId(deployments);
  if (!versionId) throw new Error('Live binding isolation audit found no current deployment.');
  return wranglerJson(['versions', 'view', versionId, '--env', environment, '--json']);
}

export function runLiveBindingIsolationAudit() {
  return classifyLiveBindingIsolation(latestVersion('staging'), latestVersion('production'));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = runLiveBindingIsolationAudit();
    console.log(JSON.stringify(result));
    if (!result.valid) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Live binding isolation audit failed.');
    process.exitCode = 1;
  }
}
