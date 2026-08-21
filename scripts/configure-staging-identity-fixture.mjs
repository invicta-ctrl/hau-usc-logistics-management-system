import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACCOUNT_APPLICATION_STAGING_IDENTITY_FIXTURE_SECRET,
  parseAccountApplicationStagingIdentityFixture,
} from '../src/server/account-application/adapters.js';
import { parseExactRecipientAllowlist } from '../src/server/account-application/email-provider-registry.js';
import { parseJsonConfig } from './cloudflare-environment-preflight.mjs';
import { resolvePrivatePath } from './private-path.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

export function buildPrivateStagingIdentityPackage(config, secretPackage) {
  const environment = String(config?.vars?.ENVIRONMENT ?? '')
    .trim()
    .toUpperCase();
  const allowlist = parseExactRecipientAllowlist(
    config?.vars?.ACCOUNT_APPLICATION_EMAIL_RECIPIENT_ALLOWLIST_JSON,
  );
  if (environment !== 'STAGING' || allowlist?.length !== 1) {
    throw new Error('Private staging config must contain one exact approved recipient.');
  }
  if (secretPackage?.schemaVersion !== 1 || secretPackage?.environment !== 'STAGING') {
    throw new Error('Private secret package must target STAGING.');
  }
  const sender = String(config?.vars?.ACCOUNT_APPLICATION_EMAIL_FROM ?? '').trim();
  if (!sender) throw new Error('Private staging email sender is missing.');
  const fixture = [
    {
      institutionalEmail: allowlist[0],
      studentId: 'STAGING-OWNER-FIXTURE-001',
      displayName: 'Owner Staging Verification',
      verificationResult: 'VERIFIED',
      active: true,
      reviewNotes: 'Owner-approved isolated staging identity fixture.',
    },
  ];
  if (parseAccountApplicationStagingIdentityFixture(fixture).length !== 1) {
    throw new Error('Private staging identity fixture could not be validated.');
  }
  return {
    ...secretPackage,
    secrets: {
      ...secretPackage.secrets,
      ACCOUNT_APPLICATION_EMAIL_FROM: sender,
      ACCOUNT_APPLICATION_EMAIL_RECIPIENT_ALLOWLIST_JSON: JSON.stringify(allowlist),
      [ACCOUNT_APPLICATION_STAGING_IDENTITY_FIXTURE_SECRET]: JSON.stringify(fixture),
    },
  };
}

async function run() {
  const [configPath, secretPackagePath, outputPath] = process.argv.slice(2);
  const [resolvedConfig, resolvedPackage, resolvedOutput] = await Promise.all([
    resolvePrivatePath(configPath, { repoRoot, label: 'Staging config' }),
    resolvePrivatePath(secretPackagePath, { repoRoot, label: 'Secret package' }),
    resolvePrivatePath(outputPath, {
      repoRoot,
      label: 'Output package',
      allowMissing: true,
    }),
  ]);
  const [config, secretPackage] = await Promise.all([
    readFile(resolvedConfig, 'utf8').then(parseJsonConfig),
    readFile(resolvedPackage, 'utf8').then(JSON.parse),
  ]);
  const result = buildPrivateStagingIdentityPackage(config, secretPackage);
  await writeFile(resolvedOutput, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  console.log('Private staging identity fixture package created with one exact recipient.');
  console.log('No recipient, protected profile, or secret value was printed.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(
      error?.code === 'EEXIST' ? 'Refusing to overwrite a private fixture package.' : error.message,
    );
    process.exitCode = 1;
  });
}
