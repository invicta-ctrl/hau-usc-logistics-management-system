import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createReleaseCandidateManifest } from '../../scripts/create-release-candidate-manifest.mjs';

const root = resolve(import.meta.dirname, '../..');
const read = (file) => readFile(resolve(root, file), 'utf8');

describe('v0.7.1 release pipeline', () => {
  it('keeps the Cloudflare preview static, manually gated, and free of protected bindings', async () => {
    const [workflow, config] = await Promise.all([
      read('.github/workflows/cloudflare-preview.yml'),
      read('cloudflare/wrangler.preview.jsonc').then(JSON.parse),
    ]);

    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('environment: cloudflare-preview');
    expect(workflow).toContain('ref: ${{ inputs.candidate_sha }}');
    expect(workflow).toContain('preview_url:');
    expect(workflow).toContain('PREVIEW_URL: ${{ inputs.preview_url }}');
    expect(workflow).toContain('npm run build');
    expect(workflow).toContain('--config cloudflare/wrangler.preview.jsonc');
    expect(workflow).toContain('--tag "candidate-${CANDIDATE_SHA}"');
    expect(workflow).toContain('--message "Static mock preview for ${CANDIDATE_SHA}"');
    expect(workflow).not.toContain('${GITHUB_SHA}');
    expect(workflow).toContain('workersDevHost.test(url.hostname)');
    expect(workflow).toContain('curl --fail');
    expect(workflow).toContain("--header 'Cache-Control: no-cache'");
    expect(workflow).toContain('codex_candidate=${CANDIDATE_SHA}');
    expect(workflow).toContain('sha256sum dist/index.html');
    expect(workflow).toContain('sha256sum "$preview_root"');
    expect(workflow).toContain('$GITHUB_STEP_SUMMARY');
    expect(workflow).toContain('v0.7.1-preview-evidence-${{ inputs.candidate_sha }}');
    expect(workflow).not.toMatch(/pull_request_target|wrangler\.production|PRODUCTION_D1|PRODUCTION_R2/u);
    expect(config).toMatchObject({
      workers_dev: true,
      preview_urls: true,
      assets: { directory: '../dist', not_found_handling: 'single-page-application' },
    });
    expect(config).not.toHaveProperty('main');
    expect(config).not.toHaveProperty('d1_databases');
    expect(config).not.toHaveProperty('r2_buckets');
    expect(config).not.toHaveProperty('vars');
  });

  it('packages an exact checked candidate without any deployment step or provider secret', async () => {
    const workflow = await read('.github/workflows/release-candidate.yml');

    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('environment: release-candidate');
    expect(workflow).toContain('ref: ${{ inputs.candidate_sha }}');
    expect(workflow).toContain('npm run check');
    expect(workflow).toContain('create-release-candidate-manifest.mjs');
    expect(workflow).toContain('actions/upload-artifact@v4');
    expect(workflow).not.toMatch(/wrangler deploy|CLOUDFLARE_API_TOKEN|pull_request_target/u);
  });

  it('binds the candidate manifest to the release, commit, and generated artifacts', async () => {
    const manifest = await createReleaseCandidateManifest();

    expect(manifest).toMatchObject({ schemaVersion: 1, releaseVersion: '0.7.1' });
    expect(manifest.candidate.releaseSha).toMatch(/^[0-9a-f]{40}$/u);
    expect(manifest.candidate.distSha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(manifest.artifacts.cloudflareHtmlSha256).toBe(manifest.candidate.distSha256);
    expect(manifest.artifacts.shareableHtmlSha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(manifest.artifacts.appsScriptHtmlSha256).toMatch(/^[0-9a-f]{64}$/u);
  });
});
