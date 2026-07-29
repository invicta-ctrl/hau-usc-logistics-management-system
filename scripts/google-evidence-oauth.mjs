import { execFile } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const GOOGLE_EVIDENCE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

const DRIVE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const EVIDENCE_ENVIRONMENTS = new Set(['STAGING', 'PRODUCTION']);
const FOLDER_DEFINITIONS = Object.freeze([
  { key: 'ROOT', name: 'HAU-USC Logistics Evidence Backup', parentKey: '' },
  { key: 'RESTOCK_RECEIPT', name: 'Restock Receipts', parentKey: 'ROOT' },
  { key: 'CANVASS', name: 'Canvass', parentKey: 'ROOT' },
  { key: 'DELIVERABLE', name: 'Deliverables', parentKey: 'ROOT' },
  { key: 'RELEASE', name: 'Release Confirmations', parentKey: 'ROOT' },
  { key: 'LENDING', name: 'Lending Evidence', parentKey: 'ROOT' },
]);

function evidenceEnvironment(value = 'STAGING') {
  const environment = String(value).trim().toUpperCase();
  if (!EVIDENCE_ENVIRONMENTS.has(environment)) {
    throw new Error('Google evidence environment must be STAGING or PRODUCTION.');
  }
  return environment;
}

export function evidenceFolderDefinitions(value = 'STAGING') {
  const environment = evidenceEnvironment(value);
  return FOLDER_DEFINITIONS.map((definition) => ({
    ...definition,
    name:
      definition.key === 'ROOT'
        ? `${definition.name} — ${environment}`
        : definition.name,
  }));
}

function base64Url(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

function escapeDriveQuery(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'");
}

export function authorizationParameters({ clientId, redirectUri, state, challenge }) {
  return new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    scope: GOOGLE_EVIDENCE_SCOPE,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
}

async function driveJson(accessToken, url, options = {}, operation = 'request') {
  const response = await fetch(url, {
    ...options,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const providerStatus = String(payload?.error?.status ?? '')
      .replace(/[^A-Z0-9_]/gu, '')
      .slice(0, 40);
    throw new Error(
      `Google Drive ${operation} failed with status ${response.status}${providerStatus ? ` (${providerStatus})` : ''}.`,
    );
  }
  return payload;
}

function folderQuery(definition, parentId, environment) {
  return [
    `mimeType = '${DRIVE_FOLDER_MIME_TYPE}'`,
    `appProperties has { key='hauUscArchiveRole' and value='${definition.key}' }`,
    `appProperties has { key='hauUscEnvironment' and value='${environment}' }`,
    `'${escapeDriveQuery(parentId || 'root')}' in parents`,
    'trashed = false',
    "visibility = 'limited'",
  ].join(' and ');
}

function verifyFolder(folder, definition, parentId, environment) {
  if (
    !folder ||
    typeof folder.id !== 'string' ||
    folder.name !== definition.name ||
    folder.mimeType !== DRIVE_FOLDER_MIME_TYPE ||
    (parentId
      ? !folder.parents?.includes(parentId)
      : !Array.isArray(folder.parents) || folder.parents.length !== 1) ||
    folder.appProperties?.hauUscArchiveRole !== definition.key ||
    folder.appProperties?.hauUscEnvironment !== environment ||
    folder.shared === true ||
    folder.trashed === true
  ) {
    throw new Error(`The ${definition.key} backup folder could not be verified as private.`);
  }
}

async function ensureFolder(accessToken, definition, parentId, environment) {
  const list = new URLSearchParams({
    q: folderQuery(definition, parentId, environment),
    spaces: 'drive',
    pageSize: '2',
    fields: 'files(id,name,mimeType,parents,appProperties,shared,trashed)',
  });
  const matches = await driveJson(
    accessToken,
    `https://www.googleapis.com/drive/v3/files?${list}`,
    {},
    `folder lookup ${definition.key}`,
  );
  if ((matches.files ?? []).length > 1) {
    throw new Error(`Multiple ${definition.key} backup folders require owner reconciliation.`);
  }
  let folder = matches.files?.[0];
  if (!folder) {
    const fields = new URLSearchParams({
      fields: 'id,name,mimeType,parents,appProperties,shared,trashed',
    });
    folder = await driveJson(
      accessToken,
      `https://www.googleapis.com/drive/v3/files?${fields}`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: definition.name,
          mimeType: DRIVE_FOLDER_MIME_TYPE,
          ...(parentId ? { parents: [parentId] } : {}),
          appProperties: {
            hauUscArchiveRole: definition.key,
            hauUscEnvironment: environment,
          },
        }),
      },
      `folder create ${definition.key}`,
    );
  }
  verifyFolder(folder, definition, parentId, environment);
  return folder.id;
}

export async function ensureEvidenceFolderTree(accessToken, { environment: value = 'STAGING' } = {}) {
  const environment = evidenceEnvironment(value);
  const ids = {};
  for (const definition of evidenceFolderDefinitions(environment)) {
    ids[definition.key] = await ensureFolder(
      accessToken,
      definition,
      definition.parentKey ? ids[definition.parentKey] : '',
      environment,
    );
  }
  return ids;
}

async function tokenExchange({ code, client, redirectUri, verifier }) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: client.client_id,
      client_secret: client.client_secret,
      code,
      code_verifier: verifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || typeof payload.access_token !== 'string' || typeof payload.refresh_token !== 'string') {
    throw new Error('Google OAuth authorization did not return an offline refresh token.');
  }
  return payload;
}

function callbackServer({ expectedState }) {
  let resolveCallback;
  let rejectCallback;
  const callback = new Promise((resolve, reject) => {
    resolveCallback = resolve;
    rejectCallback = reject;
  });
  const server = createServer((request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      if (url.pathname !== '/oauth2/callback') {
        response.writeHead(404).end('Not found');
        return;
      }
      if (url.searchParams.get('state') !== expectedState) {
        throw new Error('OAuth state validation failed.');
      }
      const providerError = url.searchParams.get('error');
      if (providerError) throw new Error(`Google OAuth returned ${providerError}.`);
      const code = url.searchParams.get('code');
      if (!code) throw new Error('Google OAuth did not return an authorization code.');
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(
        '<!doctype html><title>HAU-USC authorization complete</title><h1>Authorization complete</h1><p>You may return to Codex.</p>',
      );
      resolveCallback(code);
    } catch (error) {
      response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Authorization could not be completed.');
      rejectCallback(error);
    }
  });
  return { server, callback };
}

async function main() {
  const [clientPath, outputDirectory, rawEnvironment = 'STAGING'] = process.argv.slice(2);
  if (!path.isAbsolute(clientPath ?? '') || !path.isAbsolute(outputDirectory ?? '')) {
    throw new Error(
      'Usage: node scripts/google-evidence-oauth.mjs <absolute-client-json> <absolute-output-directory> [STAGING|PRODUCTION]',
    );
  }
  const environment = evidenceEnvironment(rawEnvironment);
  const outputPrefix = environment.toLowerCase();
  const credential = JSON.parse(await readFile(clientPath, 'utf8'));
  const client = credential.installed;
  if (!client?.client_id || !client?.client_secret) {
    throw new Error('The private desktop OAuth client JSON is invalid.');
  }
  await mkdir(outputDirectory, { recursive: true });
  const state = base64Url(randomBytes(32));
  const verifier = base64Url(randomBytes(64));
  const challenge = base64Url(createHash('sha256').update(verifier).digest());
  const { server, callback } = callbackServer({ expectedState: state });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const redirectUri = `http://127.0.0.1:${address.port}/oauth2/callback`;
  const authorizeUrl = `https://accounts.google.com/o/oauth2/v2/auth?${authorizationParameters({
    clientId: client.client_id,
    redirectUri,
    state,
    challenge,
  })}`;
  console.log('Google authorization is required in the opened browser page.');
  execFile('rundll32.exe', ['url.dll,FileProtocolHandler', authorizeUrl], {
    windowsHide: true,
  }).unref();
  try {
    const code = await callback;
    const token = await tokenExchange({ code, client, redirectUri, verifier });
    const folderIds = await ensureEvidenceFolderTree(token.access_token, { environment });
    await Promise.all([
      writeFile(
        path.join(outputDirectory, `${outputPrefix}-oauth-token.json`),
        `${JSON.stringify(
          {
            refresh_token: token.refresh_token,
            scope: token.scope,
            token_type: token.token_type,
            created_at: new Date().toISOString(),
          },
          null,
          2,
        )}\n`,
        { mode: 0o600, flag: 'wx' },
      ),
      writeFile(
        path.join(outputDirectory, `${outputPrefix}-drive-folders.json`),
        `${JSON.stringify(folderIds, null, 2)}\n`,
        { mode: 0o600, flag: 'wx' },
      ),
    ]);
    console.log('Private OAuth refresh token and verified Drive folder map saved outside Git.');
    console.log('No OAuth values or provider identifiers were printed.');
  } finally {
    server.close();
  }
}

if (
  typeof process !== 'undefined' &&
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
