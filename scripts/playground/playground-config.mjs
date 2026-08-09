import path from 'node:path';

const TEMPORARY_BRANCH = /^(?:release|fix|hotfix)\/v\d+\.\d+\.\d+-[a-z0-9][a-z0-9-]*$/u;
const SHA = /^[0-9a-f]{40}$/u;
const HASH = /^[0-9a-f]{64}$/u;

function binding(config, collection, name) {
  return (config?.[collection] ?? []).find((entry) => entry.binding === name);
}

export function validatePlaygroundConfig({
  config,
  manifest,
  productionBindings,
  expectedSha,
  expectedTree,
  expectedBranch,
  expectedArtifactHash,
  repoRoot,
}) {
  const issues = [];
  const names = manifest?.resources?.names ?? {};
  const d1 = binding(config, 'd1_databases', 'DB');
  const brand = binding(config, 'r2_buckets', 'BRAND_ASSETS');
  const evidence = binding(config, 'r2_buckets', 'EVIDENCE_ASSETS');
  if (manifest?.status !== 'READY') issues.push('Private playground resource manifest must be READY');
  if (config?.vars?.ENVIRONMENT !== 'STAGING') issues.push('ENVIRONMENT must be STAGING');
  if (config?.vars?.PLAYGROUND_MODE !== true) issues.push('PLAYGROUND_MODE must be true');
  if (config?.vars?.PLAYGROUND_LABEL !== 'ISOLATED_STAGING_PLAYGROUND') {
    issues.push('PLAYGROUND_LABEL must be the exact server-owned label');
  }
  if (config?.vars?.ACCOUNT_APPLICATION_EMAIL_PROVIDER !== 'disabled') {
    issues.push('Playground provider/email delivery must be disabled');
  }
  if (
    config?.vars?.ACCOUNT_APPLICATION_IDENTITY_CLASSES_JSON !==
    manifest?.playgroundRequiredVars?.ACCOUNT_APPLICATION_IDENTITY_CLASSES_JSON
  ) {
    issues.push('Identity-class configuration must match the private playground manifest');
  }
  if (
    config?.vars?.RECOVERY_HOSTNAME !== manifest?.playgroundHostname ||
    !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]+\.workers\.dev$/u.test(
      config?.vars?.RECOVERY_HOSTNAME ?? '',
    )
  ) {
    issues.push('Recovery hostname must match the exact private playground hostname');
  }
  if (!TEMPORARY_BRANCH.test(expectedBranch ?? '')) issues.push('Candidate branch is not an allowed temporary branch');
  if (config?.vars?.CANDIDATE_BRANCH !== expectedBranch) issues.push('Candidate branch identity mismatch');
  if (!SHA.test(expectedSha ?? '') || config?.vars?.CANDIDATE_SHA !== expectedSha) {
    issues.push('Candidate commit identity mismatch');
  }
  if (!SHA.test(expectedTree ?? '') || config?.vars?.CANDIDATE_TREE_SHA !== expectedTree) {
    issues.push('Candidate tree identity mismatch');
  }
  if (!HASH.test(expectedArtifactHash ?? '') || config?.vars?.APPLICATION_ARTIFACT_HASH !== expectedArtifactHash) {
    issues.push('Application artifact identity mismatch');
  }
  if (d1?.database_name !== names.d1Working || d1?.database_id !== manifest?.d1?.databaseId) {
    issues.push('DB must target the fixed playground working D1');
  }
  if (brand?.bucket_name !== names.r2WorkingBrand) {
    issues.push('BRAND_ASSETS must target the fixed playground working bucket');
  }
  if (evidence?.bucket_name !== names.r2WorkingEvidence) {
    issues.push('EVIDENCE_ASSETS must target the fixed playground working bucket');
  }
  const boundBuckets = (config?.r2_buckets ?? []).map((entry) => entry.bucket_name);
  if (boundBuckets.includes(names.r2BaselineBrand) || boundBuckets.includes(names.r2BaselineEvidence)) {
    issues.push('Sealed baseline R2 resources must not be bound to ordinary playground runtime');
  }
  if (d1?.database_id === productionBindings?.d1Id) issues.push('Playground D1 cannot equal production D1');
  if (boundBuckets.includes(productionBindings?.brandBucket)) {
    issues.push('Playground brand R2 cannot equal production R2');
  }
  if (boundBuckets.includes(productionBindings?.evidenceBucket)) {
    issues.push('Playground evidence R2 cannot equal production R2');
  }
  if (config?.workers_dev !== true || config?.preview_urls !== false) {
    issues.push('Playground must use workers_dev with preview URLs disabled');
  }
  if (config?.route || (config?.routes ?? []).length) issues.push('Playground cannot declare production routes');
  if (config?.triggers) issues.push('Playground scheduled triggers must remain disabled');
  if (repoRoot) {
    if (path.resolve(config?.main ?? '') !== path.join(repoRoot, 'src', 'worker', 'index.js')) {
      issues.push('Worker entrypoint must be the canonical repository source');
    }
    if (
      path.resolve(config?.assets?.directory ?? '') !==
      path.join(repoRoot, '.wrangler', 'build', 'staging')
    ) {
      issues.push('Assets must be the exact staging build artifact directory');
    }
  }
  return { valid: issues.length === 0, issues };
}

export { TEMPORARY_BRANCH };
