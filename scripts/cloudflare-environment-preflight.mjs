import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const PLACEHOLDER = /(?:REPLACE|TBD|TODO|UNKNOWN|00000000-0000-0000-0000-000000000000)/iu;
const SHA = /^[0-9a-f]{40}$/iu;
const PROTECTED_NAMES = new Set(['PASSWORD_PEPPER', 'TRACKING_LINK_SECRET', 'PROTECTED_PROFILE_ENCRYPTION_KEY', 'SESSION_SIGNING_SECRET']);

function parseJsonc(value) {
  return JSON.parse(value.replace(/^\s*\/\/.*$/gmu, '').replace(/\/\*[\s\S]*?\*\//gu, ''));
}

function binding(config, collection, name) {
  return (config[collection] ?? []).find((entry) => entry.binding === name);
}

function requiredEnvironment(config, expected, issues) {
  const actual = String(config.vars?.ENVIRONMENT ?? '').toUpperCase();
  if (actual !== expected) issues.push(`${expected}: vars.ENVIRONMENT must be ${expected}`);
  if (!SHA.test(String(config.vars?.CANDIDATE_SHA ?? ''))) issues.push(`${expected}: vars.CANDIDATE_SHA must be an exact 40-character commit SHA`);
  if (config.preview_urls === true) issues.push(`${expected}: preview_urls must not be enabled`);
  if (!config.observability?.logs?.enabled) issues.push(`${expected}: Workers Logs must be enabled`);
  if (!config.observability?.traces?.enabled) issues.push(`${expected}: Workers Traces must be enabled`);
  if (expected === 'STAGING' && config.observability?.logs?.head_sampling_rate !== 1) issues.push('STAGING: log sampling must be 1 during acceptance');
  const d1 = binding(config, 'd1_databases', 'DB');
  const r2 = binding(config, 'r2_buckets', 'BRAND_ASSETS');
  if (!d1 || PLACEHOLDER.test(String(d1.database_name)) || PLACEHOLDER.test(String(d1.database_id))) issues.push(`${expected}: exact D1 DB binding is required`);
  if (!r2 || PLACEHOLDER.test(String(r2.bucket_name))) issues.push(`${expected}: exact BRAND_ASSETS R2 binding is required`);
  for (const key of Object.keys(config.vars ?? {})) {
    if (PROTECTED_NAMES.has(key)) issues.push(`${expected}: ${key} must be a protected secret, not a plaintext var`);
  }
  return { d1, r2 };
}

export function validateEnvironmentSeparation(staging, production, { expectedSha } = {}) {
  const issues = [];
  const stagingBindings = requiredEnvironment(staging, 'STAGING', issues);
  const productionBindings = requiredEnvironment(production, 'PRODUCTION', issues);
  if (!staging.name || !production.name || staging.name === production.name) issues.push('Worker names must be present and distinct');
  if (stagingBindings.d1?.database_id === productionBindings.d1?.database_id) issues.push('Staging and production D1 database IDs must be distinct');
  if (stagingBindings.r2?.bucket_name === productionBindings.r2?.bucket_name) issues.push('Staging and production R2 buckets must be distinct');
  if (staging.vars?.CANDIDATE_SHA !== production.vars?.CANDIDATE_SHA) issues.push('Staging and production configs must bind the same frozen candidate SHA');
  if (expectedSha && staging.vars?.CANDIDATE_SHA !== expectedSha) issues.push('Private configs must match the current repository HEAD');
  return { valid: issues.length === 0, issues };
}

async function run() {
  const [stagingPath, productionPath] = process.argv.slice(2);
  if (!path.isAbsolute(stagingPath ?? '') || !path.isAbsolute(productionPath ?? '')) throw new Error('Usage: node scripts/cloudflare-environment-preflight.mjs <absolute-staging-config> <absolute-production-config>');
  const [staging, production] = await Promise.all([readFile(stagingPath, 'utf8').then(parseJsonc), readFile(productionPath, 'utf8').then(parseJsonc)]);
  const expectedSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const result = validateEnvironmentSeparation(staging, production, { expectedSha });
  if (!result.valid) {
    console.error('Cloudflare environment preflight: FAILED');
    result.issues.forEach((issue) => console.error(`- ${issue}`));
    process.exitCode = 1;
    return;
  }
  console.log('Cloudflare environment preflight: PASSED');
  console.log('Staging and production Worker, D1, R2, environment, candidate, and observability settings are distinct and complete.');
  console.log('No private provider identifiers or secret values were printed.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(error?.code === 'ENOENT' ? 'Cloudflare environment preflight config is missing.' : error.message);
    process.exitCode = 1;
  });
}
