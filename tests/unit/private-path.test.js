import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolvePrivatePath } from '../../scripts/private-path.mjs';

const roots = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('private path guard', () => {
  it('resolves a normal outside file and rejects a junction back into the repository', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'hau-private-path-'));
    roots.push(root);
    const repoRoot = path.join(root, 'repo');
    const privateRoot = path.join(root, 'private');
    const junction = path.join(privateRoot, 'repo-link');
    await Promise.all([mkdir(repoRoot), mkdir(privateRoot)]);
    const privateFile = path.join(privateRoot, 'config.json');
    await writeFile(privateFile, '{}');
    await symlink(repoRoot, junction, 'junction');

    await expect(resolvePrivatePath(privateFile, { repoRoot })).resolves.toBe(privateFile);
    await expect(
      resolvePrivatePath(path.join(junction, 'private-output.json'), {
        repoRoot,
        allowMissing: true,
      }),
    ).rejects.toThrow(/outside the repository/u);
  });

  it('rejects a filesystem root even when dot segments hide it lexically', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'hau-private-root-'));
    roots.push(root);
    const repoRoot = path.join(root, 'repo');
    await mkdir(repoRoot);
    const filesystemRoot = path.parse(root).root;

    await expect(
      resolvePrivatePath(`${filesystemRoot}.`, {
        repoRoot,
        kind: 'directory',
        allowMissing: true,
      }),
    ).rejects.toThrow(/filesystem root/u);
  });
});
