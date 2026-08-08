import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const HANDOFF_DOCUMENTS = Object.freeze({
  current: '.codex/CURRENT.md',
  task: '.codex/CURRENT_TASK.md',
  handoff: '.codex/CURRENT_HANDOFF.md',
});

export const REQUIRED_HANDOFF_FIELDS = Object.freeze({
  current: [
    'PROGRAM',
    'MILESTONE',
    'STATUS',
    'BRANCH',
    'HEAD',
    'UPSTREAM',
    'WORKTREE',
    'WORKTREE_STATE',
    'ACTIVE_WRITER',
    'REQUIRED_MODEL',
    'CURRENT_TASK',
    'CURRENT_HANDOFF',
    'ACCEPTED_SPEC',
    'BLOCKER',
    'NEXT_EXACT_ACTION',
    'HANDOFF_STATUS',
  ],
  task: [
    'INTENT',
    'MODE',
    'OBJECTIVE',
    'TARGET',
    'CURRENT_POINTER',
    'CURRENT_HANDOFF',
    'ACCEPTED_SPEC',
    'AUTHORITY',
    'REQUIRED_MODEL',
    'ACTIVE_WRITER',
    'RISK',
    'SCOPE',
    'OUT_OF_SCOPE',
    'VERIFICATION',
    'STOP_CONDITIONS',
    'NEXT_EXACT_ACTION',
  ],
  handoff: [
    'FROM',
    'TO',
    'BRANCH',
    'HEAD',
    'UPSTREAM',
    'WORKTREE',
    'WORKTREE_STATE',
    'ACTIVE_WRITER',
    'CURRENT_POINTER',
    'CURRENT_TASK',
    'ACCEPTED_SPEC',
    'COMPLETED',
    'VALIDATION',
    'EXTERNAL_ACTIONS',
    'BLOCKER',
    'NEXT_EXACT_ACTION',
    'RESUME_COMMANDS',
    'PROHIBITED_ACTIONS',
  ],
});

const OBVIOUS_SECRET_PATTERNS = [
  ['private-key block', /-----BEGIN(?: [A-Z0-9]+)* PRIVATE KEY-----/i],
  ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/],
  ['OpenAI key', /\bsk-[A-Za-z0-9_-]{20,}\b/],
  [
    'explicit credential assignment',
    /(?:^|\n)\s*(?:API[_-]?KEY|ACCESS[_-]?TOKEN|AUTH[_-]?TOKEN|CLIENT[_-]?SECRET|PRIVATE[_-]?KEY|PASSWORD)\s*[:=]\s*(?:['"])?[A-Za-z0-9_./+=-]{12,}/im,
  ],
];

function stripReference(value) {
  return String(value)
    .trim()
    .replaceAll(String.fromCharCode(96), '')
    .replace(/^['"]|['"]$/g, '');
}

function normalizedReference(value) {
  return stripReference(value).replace(/\\/g, '/');
}

function normalizedPath(value) {
  const resolved = path.resolve(stripReference(value).replace(/\//g, path.sep));
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

function isPlaceholder(value) {
  return /^(?:tbd|todo|fill(?:[- ]?me)?|unknown)$/i.test(String(value).trim());
}

export function parseHandoffFields(text) {
  const fields = Object.create(null);
  const duplicateFields = [];
  for (const line of String(text).split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*):\s*(.*?)\s*$/);
    if (!match) continue;
    const [, key, value] = match;
    if (Object.hasOwn(fields, key)) duplicateFields.push(key);
    fields[key] = value;
  }
  return { fields, duplicateFields };
}

export function findObviousSecrets(text) {
  return OBVIOUS_SECRET_PATTERNS.filter(([, pattern]) => pattern.test(String(text))).map(
    ([label]) => label,
  );
}

export function runGit(root, args) {
  const command = process.platform === 'win32' ? 'git.exe' : 'git';
  const result = spawnSync(command, ['-C', root, ...args], {
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    throw new Error('Git state is unavailable for handoff verification.');
  }
  return result.stdout.trim();
}

function validateRequiredFields(kind, document) {
  const errors = [];
  for (const field of REQUIRED_HANDOFF_FIELDS[kind]) {
    const value = document.fields[field];
    if (!value || !value.trim() || isPlaceholder(value)) {
      errors.push(HANDOFF_DOCUMENTS[kind] + ' missing or empty ' + field);
    }
  }
  for (const field of document.duplicateFields) {
    errors.push(HANDOFF_DOCUMENTS[kind] + ' repeats ' + field);
  }
  return errors;
}

function requireReference(errors, label, value, expected, root) {
  const normalized = normalizedReference(value);
  if (normalized !== expected) {
    errors.push(label + ' must reference ' + expected);
    return;
  }
  if (!fs.existsSync(path.join(root, normalized))) {
    errors.push(label + ' target is missing');
  }
}

function sameValue(left, right) {
  return String(left).trim() === String(right).trim();
}

function isGitMarker(value, marker) {
  return String(value).trim().toUpperCase() === marker;
}

export function validateHandoff(root = process.cwd(), options = {}) {
  const errors = [];
  const documents = Object.create(null);

  for (const [kind, relative] of Object.entries(HANDOFF_DOCUMENTS)) {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) {
      errors.push(relative + ' is missing');
      continue;
    }
    const text = fs.readFileSync(file, 'utf8');
    const parsed = parseHandoffFields(text);
    documents[kind] = { ...parsed, text };
    errors.push(...validateRequiredFields(kind, documents[kind]));
    for (const label of findObviousSecrets(text)) {
      errors.push(relative + ' contains an obvious ' + label);
    }
  }

  if (!documents.current || !documents.task || !documents.handoff) return errors;

  const current = documents.current.fields;
  const task = documents.task.fields;
  const handoff = documents.handoff.fields;
  requireReference(errors, '.codex/CURRENT.md CURRENT_TASK', current.CURRENT_TASK, HANDOFF_DOCUMENTS.task, root);
  requireReference(
    errors,
    '.codex/CURRENT.md CURRENT_HANDOFF',
    current.CURRENT_HANDOFF,
    HANDOFF_DOCUMENTS.handoff,
    root,
  );
  requireReference(
    errors,
    '.codex/CURRENT_TASK.md CURRENT_POINTER',
    task.CURRENT_POINTER,
    HANDOFF_DOCUMENTS.current,
    root,
  );
  requireReference(
    errors,
    '.codex/CURRENT_TASK.md CURRENT_HANDOFF',
    task.CURRENT_HANDOFF,
    HANDOFF_DOCUMENTS.handoff,
    root,
  );
  requireReference(
    errors,
    '.codex/CURRENT_HANDOFF.md CURRENT_POINTER',
    handoff.CURRENT_POINTER,
    HANDOFF_DOCUMENTS.current,
    root,
  );
  requireReference(
    errors,
    '.codex/CURRENT_HANDOFF.md CURRENT_TASK',
    handoff.CURRENT_TASK,
    HANDOFF_DOCUMENTS.task,
    root,
  );

  const currentSpec = normalizedReference(current.ACCEPTED_SPEC);
  const taskSpec = normalizedReference(task.ACCEPTED_SPEC);
  const handoffSpec = normalizedReference(handoff.ACCEPTED_SPEC);
  if (!sameValue(currentSpec, taskSpec) || !sameValue(currentSpec, handoffSpec)) {
    errors.push('current task and handoff must name the same accepted specification');
  }
  if (!fs.existsSync(path.join(root, currentSpec))) {
    errors.push('accepted specification target is missing');
  }
  if (!sameValue(current.ACTIVE_WRITER, handoff.ACTIVE_WRITER)) {
    errors.push('current pointer and handoff active writer differ');
  }
  if (
    !sameValue(current.NEXT_EXACT_ACTION, task.NEXT_EXACT_ACTION) ||
    !sameValue(current.NEXT_EXACT_ACTION, handoff.NEXT_EXACT_ACTION)
  ) {
    errors.push('current task and handoff next exact action differ');
  }

  const git = options.runGit || ((args) => runGit(root, args));
  let gitRoot;
  let branch;
  let head;
  let status;
  try {
    gitRoot = git(['rev-parse', '--show-toplevel']);
    branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
    head = git(['rev-parse', 'HEAD']);
    status = git(['status', '--porcelain=v1']);
  } catch {
    errors.push('Git state is unavailable for handoff verification');
    return errors;
  }

  if (
    (!isGitMarker(current.BRANCH, 'GIT_BRANCH') && !sameValue(current.BRANCH, branch)) ||
    (!isGitMarker(handoff.BRANCH, 'GIT_BRANCH') && !sameValue(handoff.BRANCH, branch))
  ) {
    errors.push('recorded branch does not match Git');
  }
  if (
    (!isGitMarker(current.HEAD, 'GIT_HEAD') && !sameValue(current.HEAD, head)) ||
    (!isGitMarker(handoff.HEAD, 'GIT_HEAD') && !sameValue(handoff.HEAD, head))
  ) {
    errors.push('recorded HEAD does not match Git');
  }
  const expectedWorktree = normalizedPath(gitRoot);
  if (normalizedPath(current.WORKTREE) !== expectedWorktree) {
    errors.push('current pointer worktree does not match Git');
  }
  if (normalizedPath(handoff.WORKTREE) !== expectedWorktree) {
    errors.push('handoff worktree does not match Git');
  }

  const expectedState = status.trim() ? 'DIRTY' : 'CLEAN';
  for (const [label, record] of [
    ['current pointer', current],
    ['handoff', handoff],
  ]) {
    if (
      !isGitMarker(record.WORKTREE_STATE, 'GIT_STATUS') &&
      !String(record.WORKTREE_STATE).trim().toUpperCase().startsWith(expectedState)
    ) {
      errors.push(label + ' worktree state must start ' + expectedState);
    }
  }
  return errors;
}

function run() {
  const errors = validateHandoff(process.cwd());
  if (errors.length) {
    console.error('Handoff verification failed (' + errors.length + '):');
    for (const error of errors) console.error('- ' + error);
    process.exitCode = 1;
    return;
  }
  console.log('Handoff verification passed (canonical records, Git state, and secret scan).');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run();
