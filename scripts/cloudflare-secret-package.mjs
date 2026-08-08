import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACCOUNT_APPLICATION_STAGING_IDENTITY_FIXTURE_SECRET,
  parseAccountApplicationStagingIdentityFixture,
} from '../src/server/account-application/adapters.js';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const GENERATED_SECRET_NAMES = Object.freeze([
  'PASSWORD_PEPPER',
  'TRACKING_LINK_SECRET',
  'PROTECTED_PROFILE_ENCRYPTION_KEY',
  'ROSTER_DATA_ENCRYPTION_KEY',
]);
const PRODUCTION_GOOGLE_SECRET_NAMES = Object.freeze([
  'GOOGLE_ROSTER_PRIVATE_KEY',
  'GOOGLE_EVIDENCE_OAUTH_CLIENT_SECRET',
  'GOOGLE_EVIDENCE_OAUTH_REFRESH_TOKEN',
  'GOOGLE_EVIDENCE_OAUTH_CLIENT_ID',
  'GOOGLE_DRIVE_ROOT_FOLDER_ID',
  'GOOGLE_DRIVE_RECEIPTS_FOLDER_ID',
  'GOOGLE_DRIVE_CANVASS_FOLDER_ID',
  'GOOGLE_DRIVE_DELIVERABLE_FOLDER_ID',
  'GOOGLE_EVIDENCE_RELEASE_FOLDER_ID',
  'GOOGLE_DRIVE_LENDING_FOLDER_ID',
]);

export function createSecretPackage(environment, random = randomBytes) {
  const normalized = String(environment ?? '').toUpperCase();
  if (!['STAGING', 'PRODUCTION'].includes(normalized)) throw new Error('Secret package environment must be STAGING or PRODUCTION.');
  return {
    schemaVersion: 1,
    environment: normalized,
    createdAt: new Date().toISOString(),
    secrets: Object.fromEntries(
      GENERATED_SECRET_NAMES.map((name) => [name, random(48).toString('base64url')]),
    ),
  };
}

async function init(environment, packagePath) {
  if (!path.isAbsolute(packagePath ?? '')) throw new Error('Secret package path must be absolute.');
  await writeFile(packagePath, `${JSON.stringify(createSecretPackage(environment), null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  console.log(`Private ${String(environment).toUpperCase()} secret package created outside Git.`);
  console.log('No secret values were printed.');
}

async function apply(configPath, packagePath) {
  if (![configPath, packagePath].every((value) => path.isAbsolute(value ?? ''))) throw new Error('Config and secret package paths must be absolute.');
  const [resolvedConfig, source] = await Promise.all([realpath(configPath), realpath(packagePath).then((file) => readFile(file, 'utf8').then(JSON.parse))]);
  const config = JSON.parse(await readFile(resolvedConfig, 'utf8'));
  if (String(config.vars?.ENVIRONMENT ?? '').toUpperCase() !== source.environment) throw new Error('Secret package environment does not match the Wrangler config.');
  const secretNames =
    source.environment === 'PRODUCTION'
      ? [...GENERATED_SECRET_NAMES, ...PRODUCTION_GOOGLE_SECRET_NAMES]
      : [...GENERATED_SECRET_NAMES, ACCOUNT_APPLICATION_STAGING_IDENTITY_FIXTURE_SECRET];
  if (
    source.schemaVersion !== 1 ||
    secretNames.some(
      (name) => typeof source.secrets?.[name] !== 'string' || source.secrets[name].length < 16,
    )
  )
    throw new Error('Secret package is incomplete or malformed.');
  if (
    source.environment === 'STAGING' &&
    parseAccountApplicationStagingIdentityFixture(
      source.secrets[ACCOUNT_APPLICATION_STAGING_IDENTITY_FIXTURE_SECRET],
    ).length !== 1
  ) {
    throw new Error('Private staging identity fixture is missing or malformed.');
  }
  const wrangler = path.join(repoRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  for (const name of secretNames) {
    const result = spawnSync(process.execPath, [wrangler, 'secret', 'put', name, '--config', resolvedConfig], {
      cwd: repoRoot,
      input: `${source.secrets[name]}\n`,
      encoding: 'utf8',
      windowsHide: true,
    });
    if (result.status !== 0) throw new Error(`Cloudflare rejected protected secret ${name}.`);
  }
  console.log(`${source.environment} protected Cloudflare secrets applied: ${secretNames.join(', ')}.`);
  console.log('No secret values were printed.');
}

async function run() {
  const [command, first, second] = process.argv.slice(2);
  if (command === 'init') return init(first, second);
  if (command === 'apply') return apply(first, second);
  throw new Error('Usage: node scripts/cloudflare-secret-package.mjs <init ENVIRONMENT PACKAGE_PATH | apply CONFIG_PATH PACKAGE_PATH>');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(error?.code === 'EEXIST' ? 'Refusing to overwrite an existing private secret package.' : error.message);
    process.exitCode = 1;
  });
}
