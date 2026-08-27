import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createReleaseCandidateManifest } from '../../scripts/create-release-candidate-manifest.mjs';

const root = resolve(import.meta.dirname, '../..');
const read = (file) => readFile(resolve(root, file), 'utf8');

describe('authoritative release pipeline', () => {
  it('does not require retired generated Apps Script UI artifacts for a Figma frontend checkout', async () => {
    const check = await read('scripts/check-apps-script.mjs');

    expect(check).toContain(
      "const frontendWorkerCandidate = applicationIndex.includes('./frontend/main.jsx')",
    );
    expect(check).toContain('requiredFiles.filter((file) => !generatedAppsScriptFiles.has(file))');
    expect(check).toContain('Legacy generated UI artifacts are not applicable');
  });

  it('keeps the Cloudflare preview static, manually gated, and free of protected bindings', async () => {
    const [workflow, config, handoff] = await Promise.all([
      read('.github/workflows/cloudflare-preview.yml'),
      read('cloudflare/wrangler.preview.jsonc').then(JSON.parse),
      read('.codex/archive/releases/v0.7.0-v0.7.1/V0_7_1_SLICE_8_RELEASE_CANDIDATE_HANDOFF.md'),
    ]);

    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('environment: cloudflare-preview');
    expect(workflow).toContain('ref: ${{ inputs.candidate_sha }}');
    expect(workflow).toContain('PREVIEW_WORKER_NAME: hau-usc-logistics-preview');
    expect(workflow).toContain('CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_PREVIEW_API_TOKEN }}');
    expect(workflow).toContain('CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_PREVIEW_ACCOUNT_ID }}');
    expect(workflow).toContain(
      'https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/subdomain',
    );
    expect(workflow).toContain("process.env.PREVIEW_WORKER_NAME !== 'hau-usc-logistics-preview'");
    expect(workflow).toContain(
      'preview_url="https://${PREVIEW_WORKER_NAME}.${preview_account_subdomain}.workers.dev"',
    );
    expect(workflow).toContain('$RUNNER_TEMP/cloudflare-preview-account-subdomain');
    expect(workflow).toContain('deploy_log="$RUNNER_TEMP/cloudflare-preview-deploy.log"');
    expect(workflow).toContain('redact_preview_urls');
    expect(workflow).toContain('https://<redacted>.workers.dev');
    expect(workflow).toContain('npm run build');
    expect(workflow).toContain('--config cloudflare/wrangler.preview.jsonc');
    expect(workflow).toContain('--tag "candidate-${CANDIDATE_SHA}"');
    expect(workflow).toContain('--message "Static mock preview for ${CANDIDATE_SHA}"');
    expect(workflow).not.toContain('${GITHUB_SHA}');
    expect(workflow).toContain('accountSubdomainPattern.test(subdomain)');
    expect(workflow).toContain('curl --fail');
    expect(workflow).toContain("--header 'Cache-Control: no-cache'");
    expect(workflow).toContain('codex_candidate=${CANDIDATE_SHA}');
    expect(workflow).toContain('sha256sum dist/index.html');
    expect(workflow).toContain('sha256sum "$preview_root"');
    expect(workflow).toContain('preview_target_sha256=');
    expect(workflow).toContain('complete URL withheld');
    expect(workflow).not.toContain('preview_url:');
    expect(workflow).not.toContain('${{ inputs.preview_url }}');
    expect(workflow).not.toContain('${{ inputs.preview_account_subdomain }}');
    expect(workflow).not.toContain('preview_url=$PREVIEW_URL');
    expect(workflow).not.toContain('Preview URL: $PREVIEW_URL');
    expect(workflow).not.toContain('echo "preview_url=');
    expect(workflow).not.toContain('echo "- Preview URL:');
    expect(workflow).toContain('$GITHUB_STEP_SUMMARY');
    expect(workflow).toContain('v0.8.0-preview-evidence-${{ inputs.candidate_sha }}');
    expect(workflow).not.toMatch(/pull_request_target|wrangler\.production|PRODUCTION_D1|PRODUCTION_R2/u);
    expect(handoff).toContain('logistics.hausc.org');
    expect(handoff).toContain('request.hausc.org');
    expect(handoff).toContain('lending.hausc.org');
    expect(handoff).not.toContain('.hau-usc.org');
    expect(config).toMatchObject({
      name: 'hau-usc-logistics-preview',
      workers_dev: true,
      preview_urls: true,
      assets: { directory: '../dist', not_found_handling: 'single-page-application' },
    });
    expect(config).not.toHaveProperty('main');
    expect(config).not.toHaveProperty('d1_databases');
    expect(config).not.toHaveProperty('r2_buckets');
    expect(config).not.toHaveProperty('vars');
  });

  it('packages an exact checked candidate, deploys only to playground, and stops for Earl', async () => {
    const [workflow, playgroundDeploy, packageJson, viteConfig, artifactVerifier] = await Promise.all([
      read('.github/workflows/release-candidate.yml'),
      read('scripts/playground/deploy-playground.mjs'),
      read('package.json').then(JSON.parse),
      read('vite.config.js'),
      read('scripts/verify-deploy-artifact.mjs'),
    ]);

    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).not.toMatch(/^\s+push:/mu);
    expect(workflow).toContain('environment: release-candidate');
    expect(workflow).toContain('ref: ${{ inputs.candidate_sha }}');
    expect(workflow).toContain('refs/remotes/origin/${EXPECTED_BRANCH}');
    expect(workflow).toContain('npm run check:release-candidate');
    expect(packageJson.scripts['lint:release-candidate']).toBe(
      'eslint . --ignore-pattern "prototypes/public-portals-r3/**"',
    );
    expect(packageJson.scripts['check:release-candidate']).toBe(
      'npm run check:governance && npm run lint:release-candidate && npm run build && npm run test && npm run check:apps-script && npm run verify:dist && npm run check:cloudflare',
    );
    expect(workflow).toContain('create-release-candidate-manifest.mjs');
    expect(workflow).toContain('.release/candidate.json');
    expect(workflow).toContain('release-candidate-${{ steps.identity.outputs.sha }}');
    expect(workflow).toContain('actions/upload-artifact@v4');
    expect(workflow).toContain('HAU-USC_Logistics-Frontend-Shareable.html');
    expect(workflow).not.toContain('HAU-USC_Logistics-Prototype-Shareable.html');
    expect(workflow).not.toContain('apps-script/');
    expect(workflow).toContain('environment: isolated-staging-playground');
    expect(workflow).toContain('deploy-playground.mjs');
    expect(workflow).toContain('CLOUDFLARE_API_TOKEN');
    expect(workflow).toContain('attempt <= 15');
    expect(workflow).toContain("headers: { 'cache-control': 'no-cache' }");
    expect(workflow).toContain('version?.candidateSha === expected');
    expect(workflow).toContain("version?.database?.schemaVersion === '32'");
    expect(workflow).toContain('Stop for Earl manual testing');
    expect(workflow).toContain('WAIT FOR EARL. No production job exists in this workflow.');
    expect(workflow).not.toContain('deploy-environment.mjs production');
    expect(workflow).not.toContain('pull_request_target');
    expect(playgroundDeploy).toContain('function rollbackStagingBindings(manifest)');
    expect(playgroundDeploy).toContain(
      "['versions', 'view', stagingVersionId, '--env', 'staging', '--json']",
    );
    expect(playgroundDeploy).toContain('rollbackBindings: rollbackStagingBindings(manifest)');
    expect(viteConfig).toContain("const DEPLOY_ARTIFACT_MARKER_NAME = 'hau-deploy-target';");
    expect(viteConfig).toContain('name: DEPLOY_ARTIFACT_MARKER_NAME');
    expect(artifactVerifier).toContain('must contain exactly one canonical deploy target marker');
    expect(artifactVerifier).not.toContain('const modeMatches =');
  });

  it('binds the candidate manifest to the release, commit, and generated artifacts', async () => {
    const [manifest, packageJson] = await Promise.all([
      createReleaseCandidateManifest(),
      read('package.json').then(JSON.parse),
    ]);

    expect(manifest).toMatchObject({ schemaVersion: 1, releaseVersion: packageJson.version });
    expect(manifest.candidate.releaseSha).toMatch(/^[0-9a-f]{40}$/u);
    expect(manifest.candidate.distSha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(manifest.artifacts.cloudflareHtmlSha256).toBe(manifest.candidate.distSha256);
    expect(manifest.artifacts.shareableHtmlSha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(manifest.artifacts).not.toHaveProperty('appsScriptHtmlSha256');
  });

  it('fails closed around staging smoke, recovery identity, and live deployment authorization', async () => {
    const [
      packageJson,
      smoke,
      stagingEvidence,
      productionEvidence,
      deploy,
      privateConfigs,
      sandbox,
      preflight,
    ] = await Promise.all([
      read('package.json').then(JSON.parse),
      read('scripts/staging-candidate-smoke.mjs'),
      read('scripts/staging-candidate-evidence.mjs'),
      read('scripts/production-recovery-evidence.mjs'),
      read('scripts/deploy-environment.mjs'),
      read('scripts/create-private-cloudflare-configs.mjs'),
      read('scripts/staging-sandbox.mjs'),
      read('scripts/production-launch-preflight.mjs'),
    ]);

    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u);
    expect(smoke).toContain("post(baseUrl, '/api/admin/access/directory')");
    expect(smoke).toContain("authenticated.post('/api/getEssentialBootstrapData'");
    expect(smoke).toContain("'inventory',");
    expect(smoke).toContain('data: { module, page: 1, pageSize: 10 }');
    expect(smoke).toContain('validateEnvironmentSeparation');
    expect(smoke).toContain('readPackageReleaseVersion');
    expect(smoke).toContain('validateReleaseCandidateIdentity');
    expect(smoke).toContain('version.releaseVersion !== releaseVersion');
    expect(stagingEvidence).toContain("'r2', 'bucket', 'info'");
    expect(stagingEvidence).toContain('STAGING_TIME_TRAVEL_BOOKMARK_MISSING');
    expect(stagingEvidence).toContain('assertReleaseBackupTuple');
    expect(productionEvidence).toContain("'d1', 'time-travel', 'info'");
    expect(productionEvidence).toContain("'r2', 'bucket', 'info'");
    expect(productionEvidence).toContain('validateStagingSandboxConfig');
    expect(productionEvidence).toContain('restoreAndVerifyD1Export');
    expect(productionEvidence).toContain('reconcileInventoryDatabase');
    expect(productionEvidence).toContain('readPackageReleaseVersion');
    expect(productionEvidence).toContain('releaseIdentityModeForRecovery');
    expect(productionEvidence).toContain('validateReleaseCandidateIdentity');
    expect(productionEvidence).toContain('identityMode,');
    expect(productionEvidence).toContain(
      "currentCandidate.branch === 'main' ? 'POST_MERGE_FINAL' : 'PRE_MERGE_READ_ONLY'",
    );
    expect(productionEvidence).toContain('assertReleaseBackupTuple');
    expect(productionEvidence).toContain('PRODUCTION_SYNTHETIC_ACTIVE_ACCOUNTS_FOUND');
    expect(deploy).toContain("actions?.workerDeploy !== 'APPROVED'");
    expect(deploy).toContain('result.launchAuthorized');
    expect(deploy).toContain('validateProductionLaunchPreflight');
    expect(deploy).toContain('readProductionProviderBindingInventory');
    expect(deploy).toContain('production plaintext --secrets input is prohibited');
    expect(deploy).not.toContain("const secretsIndex = rest.indexOf('--secrets')");
    expect(deploy).not.toContain("label: 'Private production secrets'");
    expect(deploy).toContain("path.join(repoRoot, 'src', 'worker', 'index.js')");
    expect(deploy).toContain("path.join(repoRoot, 'dist')");
    expect(deploy).toContain('const artifactDirectory = path.join(repoRoot, expected.artifactDirectory)');
    expect(deploy).toContain("path.join(repoRoot, 'scripts', 'verify-deploy-artifact.mjs')");
    expect(deploy).toContain(
      "[wranglerExecutable, 'deploy', '-c', configPath, '--assets', artifactDirectory]",
    );
    expect(deploy).not.toContain("execFileSync('npx', ['wrangler', 'deploy'");
    expect(deploy).toContain('readPackageReleaseVersion');
    expect(deploy).toContain('validateReleaseCandidateIdentity');
    expect(deploy).toContain("mode: target === 'production' ? 'production' : 'staging'");
    expect(deploy).not.toContain('release/v0.8.0-inventory-truth-ledger-lock');
    expect(preflight).toContain('REQUIRED_PRODUCTION_PROVIDER_BINDING_NAMES');
    expect(preflight).toContain('secrets.required');
    expect(preflight).toContain("['secret', 'list', '--config', configPath]");
    expect(preflight).toContain("'versions',");
    expect(preflight).toContain("'view',");
    expect(preflight).not.toContain('productionSecrets');
    expect(sandbox).toContain('runtime.releaseVersion === releaseVersion');
    expect(sandbox).toContain('readPackageReleaseVersion');
    const sandboxIdentityGuard = sandbox.indexOf(
      'const releaseIdentity = validateReleaseCandidateIdentity(config, {',
    );
    const sandboxProviderInventory = sandbox.indexOf(
      'const stagingDatabaseId = expectedDatabaseId(configPath);',
    );
    const sandboxIdentityRejection = sandbox.indexOf('if (!releaseIdentity.valid)');
    const sandboxFullValidation = sandbox.indexOf(
      'const configResult = validateStagingSandboxConfig(config, {',
    );
    expect(sandboxIdentityGuard).toBeGreaterThan(-1);
    expect(sandboxIdentityRejection).toBeGreaterThan(sandboxIdentityGuard);
    expect(sandboxProviderInventory).toBeGreaterThan(sandboxIdentityRejection);
    expect(sandboxFullValidation).toBeGreaterThan(sandboxProviderInventory);

    const recoveryIdentityGuard = productionEvidence.indexOf(
      'const stagingIdentity = validateReleaseCandidateIdentity(staging, {',
    );
    const productionConfigGuard = productionEvidence.indexOf(
      "if (production.name !== expectedWorker || production.vars?.ENVIRONMENT !== 'PRODUCTION')",
    );
    const recoveryIdentityRejection = productionEvidence.indexOf('if (!stagingIdentity.valid)');
    const recoveryProviderInventory = productionEvidence.indexOf(
      "runWrangler(stagingConfigPath, ['d1', 'list', '--json'])",
    );
    const recoveryFullValidation = productionEvidence.indexOf(
      'const stagingValidation = validateStagingSandboxConfig(staging, {',
    );
    expect(recoveryIdentityGuard).toBeGreaterThan(-1);
    expect(recoveryIdentityRejection).toBeGreaterThan(recoveryIdentityGuard);
    expect(productionConfigGuard).toBeGreaterThan(recoveryIdentityRejection);
    expect(recoveryProviderInventory).toBeGreaterThan(productionConfigGuard);
    expect(recoveryFullValidation).toBeGreaterThan(recoveryProviderInventory);
    expect(privateConfigs).toContain('resolvePrivatePath');
    expect(privateConfigs).toContain("main: path.join(repoRoot, 'src', 'worker', 'index.js')");
    expect(privateConfigs).toContain("directory: path.join(repoRoot, 'dist')");
  });
});
