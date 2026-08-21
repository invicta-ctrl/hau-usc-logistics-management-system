import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';

function isInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function isFilesystemRoot(candidate) {
  const resolved = path.resolve(candidate);
  const root = path.parse(resolved).root;
  return process.platform === 'win32' ? resolved.toLowerCase() === root.toLowerCase() : resolved === root;
}

async function canonicalTarget(candidate) {
  let existing = path.resolve(candidate);
  const suffix = [];
  while (true) {
    try {
      const canonical = await realpath(existing);
      return path.join(canonical, ...suffix);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      const parent = path.dirname(existing);
      if (parent === existing) throw error;
      suffix.unshift(path.basename(existing));
      existing = parent;
    }
  }
}

export async function resolvePrivatePath(
  candidate,
  { repoRoot, label = 'Private path', kind = 'file', allowMissing = false } = {},
) {
  if (!path.isAbsolute(candidate ?? '') || candidate === path.parse(candidate).root) {
    throw new Error(`${label} must be an absolute private path outside the repository.`);
  }
  const [canonicalRepo, target] = await Promise.all([realpath(repoRoot), canonicalTarget(candidate)]);
  if (isFilesystemRoot(target)) {
    throw new Error(`${label} must not resolve to a filesystem root.`);
  }
  if (isInside(canonicalRepo, target)) {
    throw new Error(`${label} must be an absolute private path outside the repository.`);
  }
  if (!allowMissing) {
    const targetStat = await stat(target);
    if (kind === 'file' && !targetStat.isFile()) throw new Error(`${label} must identify a file.`);
    if (kind === 'directory' && !targetStat.isDirectory()) {
      throw new Error(`${label} must identify a directory.`);
    }
  }
  return target;
}
