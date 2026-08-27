import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const verifier = resolve(root, 'scripts', 'verify-deploy-artifact.mjs');
const artifact = (mode) => `<!doctype html><html><head><meta name="hau-deploy-target" content="${mode}"></head><body></body></html>`;

async function verify(target, html) {
  const directory = await mkdtemp(join(tmpdir(), 'hau-deploy-artifact-'));
  try {
    await writeFile(join(directory, 'index.html'), html);
    const result = spawnSync(process.execPath, [verifier, target, directory], { cwd: root, encoding: 'utf8' });
    return { status: result.status, output: `${result.stdout}${result.stderr}` };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

describe('deploy artifact verifier', () => {
  it('accepts one canonical staging marker for staging', async () => {
    const result = await verify('staging', artifact('staging'));
    expect(result.status).toBe(0);
    expect(result.output).toContain('Deploy artifact verified: build mode staging');
  });

  it('accepts one canonical production marker for production', async () => {
    const result = await verify('production', artifact('production'));
    expect(result.status).toBe(0);
    expect(result.output).toContain('Deploy artifact verified: build mode production');
  });

  it('rejects a marker that does not match the requested target', async () => {
    const result = await verify('production', artifact('staging'));
    expect(result.status).toBe(1);
    expect(result.output).toContain('does not satisfy the production deploy');
  });

  it('rejects absent, duplicate, and preview markers', async () => {
    const absent = await verify('staging', '<!doctype html><html><head></head><body></body></html>');
    const duplicate = await verify('staging', `<head>${artifact('staging').match(/<meta[^>]+>/u)[0]}${artifact('staging').match(/<meta[^>]+>/u)[0]}</head>`);
    const preview = await verify('staging', artifact('preview'));
    expect(absent.output).toContain('exactly one canonical deploy target marker');
    expect(duplicate.output).toContain('exactly one canonical deploy target marker');
    expect(preview.output).toContain('invalid deploy target marker');
  });
});
