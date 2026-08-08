import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { findObviousSecrets, parseHandoffFields, validateHandoff } from '../../scripts/handoff-verify.mjs';

const SPECIFICATION = '.codex/specs/active/accepted.md';
const NEXT_ACTION = 'Review the bounded change before transfer.';

function writeFields(file, fields, extra = '') {
  const body = Object.entries(fields)
    .map(([key, value]) => key + ': ' + value)
    .join('\n');
  fs.writeFileSync(file, body + (extra ? '\n' + extra : '') + '\n');
}

function makeGit(root, state = ' M AGENTS.md') {
  return (args) => {
    const command = args.join(' ');
    if (command === 'rev-parse --show-toplevel') return root;
    if (command === 'rev-parse --abbrev-ref HEAD') return 'maintenance/test';
    if (command === 'rev-parse HEAD') return '0123456789abcdef0123456789abcdef01234567';
    if (command === 'status --porcelain=v1') return state;
    throw new Error('unexpected Git command');
  };
}

function createFixture(overrides = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hau-handoff-verify-'));
  fs.mkdirSync(path.join(root, '.codex/specs/active'), { recursive: true });
  fs.writeFileSync(path.join(root, SPECIFICATION), '# accepted\n');
  const worktree = root.replace(/\\/g, '/');

  const current = {
    PROGRAM: 'HAU-USC Logistics',
    MILESTONE: 'Test',
    STATUS: 'ACTIVE',
    BRANCH: 'maintenance/test',
    HEAD: '0123456789abcdef0123456789abcdef01234567',
    UPSTREAM: 'NONE - sanctioned local branch',
    WORKTREE: worktree,
    WORKTREE_STATE: 'DIRTY - test fixture',
    ACTIVE_WRITER: 'CODEX',
    REQUIRED_MODEL: 'Terra',
    CURRENT_TASK: '.codex/CURRENT_TASK.md',
    CURRENT_HANDOFF: '.codex/CURRENT_HANDOFF.md',
    ACCEPTED_SPEC: SPECIFICATION,
    BLOCKER: 'NONE',
    NEXT_EXACT_ACTION: NEXT_ACTION,
    HANDOFF_STATUS: 'ACTIVE',
    ...(overrides.current || {}),
  };
  const task = {
    INTENT: 'TESTING',
    MODE: 'EXECUTE',
    OBJECTIVE: 'Validate handoff records',
    TARGET: 'maintenance/test',
    CURRENT_POINTER: '.codex/CURRENT.md',
    CURRENT_HANDOFF: '.codex/CURRENT_HANDOFF.md',
    ACCEPTED_SPEC: SPECIFICATION,
    AUTHORITY: 'accepted test spec',
    REQUIRED_MODEL: 'Terra',
    ACTIVE_WRITER: 'CODEX',
    RISK: 'LOW',
    SCOPE: 'test only',
    OUT_OF_SCOPE: 'external actions',
    VERIFICATION: 'focused test',
    STOP_CONDITIONS: 'bad fixture',
    NEXT_EXACT_ACTION: NEXT_ACTION,
    ...(overrides.task || {}),
  };
  const handoff = {
    FROM: 'CODEX',
    TO: 'CODEX',
    BRANCH: 'maintenance/test',
    HEAD: '0123456789abcdef0123456789abcdef01234567',
    UPSTREAM: 'NONE - sanctioned local branch',
    WORKTREE: worktree,
    WORKTREE_STATE: 'DIRTY - test fixture',
    ACTIVE_WRITER: 'CODEX',
    CURRENT_POINTER: '.codex/CURRENT.md',
    CURRENT_TASK: '.codex/CURRENT_TASK.md',
    ACCEPTED_SPEC: SPECIFICATION,
    COMPLETED: 'fixture created',
    VALIDATION: 'not yet run',
    EXTERNAL_ACTIONS: 'none',
    BLOCKER: 'NONE',
    NEXT_EXACT_ACTION: NEXT_ACTION,
    RESUME_COMMANDS: 'npm run handoff:verify',
    PROHIBITED_ACTIONS: 'no writes',
    ...(overrides.handoff || {}),
  };

  writeFields(path.join(root, '.codex/CURRENT.md'), current, overrides.currentExtra);
  writeFields(path.join(root, '.codex/CURRENT_TASK.md'), task, overrides.taskExtra);
  writeFields(path.join(root, '.codex/CURRENT_HANDOFF.md'), handoff, overrides.handoffExtra);
  return { root, git: makeGit(root, overrides.status), current, task, handoff };
}

describe('handoff verification', () => {
  it('accepts mutually consistent canonical records', () => {
    const fixture = createFixture();
    expect(validateHandoff(fixture.root, { runGit: fixture.git })).toEqual([]);
  });

  it('accepts explicit Git-resolved markers for commit-self-referential fields', () => {
    const fixture = createFixture({
      current: { BRANCH: 'GIT_BRANCH', HEAD: 'GIT_HEAD', WORKTREE_STATE: 'GIT_STATUS' },
      handoff: { BRANCH: 'GIT_BRANCH', HEAD: 'GIT_HEAD', WORKTREE_STATE: 'GIT_STATUS' },
    });
    expect(validateHandoff(fixture.root, { runGit: fixture.git })).toEqual([]);
  });

  it('fails closed for branch, worktree-state, and task-reference drift', () => {
    const fixture = createFixture({
      current: { BRANCH: 'wrong-branch', CURRENT_TASK: '.codex/MISSING.md' },
      handoff: { WORKTREE_STATE: 'CLEAN - wrong state' },
    });
    const errors = validateHandoff(fixture.root, { runGit: fixture.git });
    expect(errors).toContain('.codex/CURRENT.md CURRENT_TASK must reference .codex/CURRENT_TASK.md');
    expect(errors).toContain('recorded branch does not match Git');
    expect(errors).toContain('handoff worktree state must start DIRTY');
  });

  it('detects obvious credential patterns without returning the matched value', () => {
    const secret = 'ghp_abcdefghijklmnopqrstuvwx123456';
    const fixture = createFixture({ handoffExtra: 'ACCESS_TOKEN: ' + secret });
    const errors = validateHandoff(fixture.root, { runGit: fixture.git });
    expect(errors).toContain('.codex/CURRENT_HANDOFF.md contains an obvious GitHub token');
    expect(errors.join('\n')).not.toContain(secret);
    expect(findObviousSecrets('ACCESS_TOKEN: ' + secret)).toContain('GitHub token');
  });

  it('parses duplicate structured fields for fail-closed validation', () => {
    const parsed = parseHandoffFields('BRANCH: first\nBRANCH: second\n');
    expect(parsed.fields.BRANCH).toBe('second');
    expect(parsed.duplicateFields).toEqual(['BRANCH']);
  });
});
