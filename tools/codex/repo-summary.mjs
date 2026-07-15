import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function git(args, optional = false) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', windowsHide: true }).trim();
  } catch (error) {
    if (optional) return '';
    throw error;
  }
}

export function buildRepoSummary(runGit = git) {
  const branch = runGit(['branch', '--show-current']);
  const upstream = runGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'], true);
  const status = runGit(['status', '--short', '--untracked-files=all']);
  return {
    root: runGit(['rev-parse', '--show-toplevel']),
    branch,
    head: runGit(['rev-parse', 'HEAD']),
    upstream: upstream || null,
    aheadBehind: upstream ? runGit(['rev-list', '--left-right', '--count', 'HEAD...@{upstream}']) : null,
    statusVerified: true,
    dirtyPaths: status ? status.split(/\r?\n/).length : 0,
    recentCommits: runGit(['log', '-5', '--oneline', '--decorate']).split(/\r?\n/),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(buildRepoSummary(), null, 2));
}
