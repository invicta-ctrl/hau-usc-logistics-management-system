import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { request as apiRequest } from '@playwright/test';
import { parseJsonConfig, validateEnvironmentSeparation } from './cloudflare-environment-preflight.mjs';
import { resolvePrivatePath } from './private-path.mjs';
import {
  readPackageReleaseVersion,
  RELEASE_MIGRATION,
  RELEASE_SCHEMA_VERSION,
  validateReleaseCandidateIdentity,
} from './staging-sandbox-lib.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const expectedMigration = RELEASE_MIGRATION;

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

async function get(baseUrl, pathname) {
  return fetch(new URL(pathname, `${baseUrl.replace(/\/$/u, '')}/`), {
    redirect: 'manual',
    headers: { 'cache-control': 'no-cache' },
  });
}

async function post(baseUrl, pathname) {
  return fetch(new URL(pathname, `${baseUrl.replace(/\/$/u, '')}/`), {
    method: 'POST',
    redirect: 'manual',
    headers: { 'cache-control': 'no-cache', 'content-type': 'application/json' },
    body: '{}',
  });
}

async function main() {
  const configPath = await resolvePrivatePath(process.argv[2], {
    repoRoot,
    label: 'Staging config',
  });
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const branch = execFileSync('git', ['branch', '--show-current'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  const releaseVersion = await readPackageReleaseVersion(repoRoot);

  const productionConfigPath = await resolvePrivatePath(argument('--production-config'), {
    repoRoot,
    label: 'Production config',
  });
  const credentialPath = await resolvePrivatePath(argument('--credential'), {
    repoRoot,
    label: 'Staging credential',
  });
  const [config, productionConfig, credential] = await Promise.all([
    readFile(configPath, 'utf8').then(parseJsonConfig),
    readFile(productionConfigPath, 'utf8').then(parseJsonConfig),
    readFile(credentialPath, 'utf8').then(JSON.parse),
  ]);
  const separation = validateEnvironmentSeparation(config, productionConfig, {
    expectedSha: head,
    allowStagingCandidate: true,
  });
  if (!separation.valid) throw new Error('ENVIRONMENT_SEPARATION_FAILED');
  const configIdentity = validateReleaseCandidateIdentity(config, {
    releaseVersion,
    head,
    branch,
    mode: 'staging',
  });
  if (!configIdentity.valid) throw new Error('STAGING_CANDIDATE_IDENTITY_CONFIG_INVALID');
  if (
    typeof credential?.accessId !== 'string' ||
    !credential.accessId.trim() ||
    typeof credential?.password !== 'string' ||
    !credential.password
  ) {
    throw new Error('STAGING_CREDENTIAL_INVALID');
  }
  const baseUrl = String(config.vars?.SANDBOX_BASE_URL ?? '');
  if (
    config.vars?.ENVIRONMENT !== 'STAGING' ||
    !/^https:\/\//u.test(baseUrl) ||
    /prod(uction)?/iu.test(new URL(baseUrl).hostname)
  ) {
    throw new Error('STAGING_CANDIDATE_IDENTITY_CONFIG_INVALID');
  }

  const routeResults = {};
  for (const route of ['/login', '/portals', '/request', '/lending']) {
    const response = await get(baseUrl, route);
    routeResults[route] = response.status;
    if (response.status !== 200) throw new Error('STAGING_ROUTE_SMOKE_FAILED');
  }

  const [versionResponse, readinessResponse, deniedResponse, missingResponse] = await Promise.all([
    get(baseUrl, '/api/version'),
    get(baseUrl, '/api/readiness'),
    post(baseUrl, '/api/admin/access/directory'),
    get(baseUrl, '/api/not-a-real-route'),
  ]);
  if (!versionResponse.ok || !readinessResponse.ok) throw new Error('STAGING_IDENTITY_ENDPOINT_FAILED');
  const [version, readiness] = await Promise.all([versionResponse.json(), readinessResponse.json()]);
  if (
    version.environment !== 'STAGING' ||
    version.appVersion !== releaseVersion ||
    version.releaseVersion !== releaseVersion ||
    version.candidateSha !== head ||
    version.database?.schemaVersion !== RELEASE_SCHEMA_VERSION ||
    version.database?.latestMigration !== expectedMigration
  ) {
    throw new Error('STAGING_VERSION_IDENTITY_MISMATCH');
  }
  if (
    readiness.environment !== 'STAGING' ||
    readiness.appVersion !== releaseVersion ||
    readiness.candidateSha !== head ||
    readiness.database?.schemaVersion !== RELEASE_SCHEMA_VERSION ||
    readiness.database?.latestMigration !== expectedMigration ||
    readiness.ready !== true ||
    readiness.dependencies?.protectedConfiguration !== true
  ) {
    throw new Error('STAGING_READINESS_MISMATCH');
  }
  if (![401, 403].includes(deniedResponse.status)) throw new Error('STAGING_PROTECTED_ROUTE_NOT_DENIED');
  if (missingResponse.status !== 404) throw new Error('STAGING_SAFE_ERROR_BEHAVIOR_FAILED');

  const authenticated = await apiRequest.newContext({ baseURL: baseUrl });
  try {
    const loginResponse = await authenticated.post('/api/auth/login', {
      data: { accessId: credential.accessId, password: credential.password },
    });
    if (loginResponse.status() !== 200) throw new Error('STAGING_AUTHENTICATION_FAILED');
    const login = await loginResponse.json();
    if (login?.state !== 'AUTHENTICATED' || login?.user?.authorization?.roleId !== 'SYSTEM_OWNER') {
      throw new Error('STAGING_AUTHORIZATION_IDENTITY_FAILED');
    }
    const mainHubResponse = await authenticated.post('/api/getEssentialBootstrapData', { data: {} });
    if (mainHubResponse.status() !== 200) throw new Error('STAGING_AUTHENTICATED_BOOTSTRAP_FAILED');
    const mainHub = await mainHubResponse.json();
    if (
      mainHub?.currentUser?.authorization?.roleId !== 'SYSTEM_OWNER' ||
      !Array.isArray(mainHub?.navigation)
    ) {
      throw new Error('STAGING_AUTHENTICATED_BOOTSTRAP_MISMATCH');
    }
    for (const module of [
      'overview',
      'inventory',
      'request',
      'release',
      'lending',
      'restocking',
      'procurement',
    ]) {
      const response = await authenticated.post('/api/getBootstrapModule', {
        data: { module, page: 1, pageSize: 10 },
      });
      if (response.status() !== 200) throw new Error('STAGING_AUTHENTICATED_BOOTSTRAP_FAILED');
      const result = await response.json();
      if (result?.ok !== true || result?.module !== module || typeof result?.data !== 'object') {
        throw new Error('STAGING_AUTHENTICATED_BOOTSTRAP_MISMATCH');
      }
      if (
        module === 'inventory' &&
        (!Array.isArray(result.data.inventoryItems) || !Array.isArray(result.data.ledgerTransactions))
      ) {
        throw new Error('STAGING_AUTHENTICATED_BOOTSTRAP_MISMATCH');
      }
    }
  } finally {
    await authenticated.dispose();
  }

  process.stdout.write(
    `${JSON.stringify({
      environment: 'STAGING',
      candidateSha: head,
      version: releaseVersion,
      schemaVersion: RELEASE_SCHEMA_VERSION,
      latestMigration: expectedMigration,
      routes: routeResults,
      readiness: true,
      protectedConfiguration: true,
      protectedRouteDenied: true,
      safeMissingRoute: true,
      authenticatedMainHub: true,
      authenticatedModules: [
        'overview',
        'inventory',
        'request',
        'release',
        'lending',
        'restocking',
        'procurement',
      ],
      productionIsolation: separation.valid,
    })}\n`,
  );
}

main().catch((error) => {
  const safe = /^[A-Z0-9_]+$/u.test(String(error?.message ?? '')) ? error.message : 'STAGING_SMOKE_ERROR';
  console.error(`Staging candidate smoke failed: ${safe}`);
  process.exitCode = 1;
});
