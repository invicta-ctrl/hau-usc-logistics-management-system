import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  parseRestrictedToml,
  validateAgentInstructions,
  validateAgentToml,
  validateProjectConfig,
} from '../../scripts/check-agent-instructions.mjs';
import { REQUIRED_RESUME_FIELDS, validateContinuation } from '../../scripts/check-work-continuation.mjs';
import { buildContextPacket, truncateUtf8 } from '../../tools/codex/context-packet.mjs';
import { buildRepoSummary } from '../../tools/codex/repo-summary.mjs';
import {
  appendTail,
  buildWindowsCommandLine,
  parseArgs,
  sanitizeLabel,
} from '../../tools/codex/run-capped.mjs';

describe('Codex governance validators', () => {
  it('requires the canonical Sol/Terra/Luna and Quick Document Fix policies', () => {
    const valid = [
      'skill registry',
      '.codex/TASK_ROUTING.md',
      '.codex/CAVEMAN_WORKFLOW.md',
      '.codex/USAGE_POLICY.md',
      'AGENTS.md -> .codex/CURRENT.md -> .codex/CURRENT_TASK.md -> .codex/CURRENT_HANDOFF.md',
      '## Accepted mainline governance amendment — 2026-08-10',
      'This AGENTS.md section is the durable accepted governance amendment at the first step of the canonical continuity chain',
      'STATUS: ACCEPTED',
      'OWNER: Earl',
      'QUICK Mainline AGENTS Governance Sync + Fast Document-Fix Mode',
      'Root Sol/Terra/Luna sync, Quick Document Fix Mode, directly coupled enforcement, and branch/commit/PR/merge to main',
      'Runtime, deploy, provider, database, migration, production-data, recovery, frontend, and release behavior',
      'Main-governance lineage is distinct from deployed Production runtime',
      'Legacy current/task REQUIRED_MODEL: CODEX remains superseded and non-authoritative and does not require a current-chain rewrite for this explicitly accepted bootstrap',
      'ORCHESTRATOR_MODEL: GPT-5.6 Sol',
      'ORCHESTRATOR_WRITES: FORBIDDEN',
      'SOL_SUBAGENTS: FORBIDDEN',
      'MAX_SOL_SUBAGENTS: 0',
      'WRITER_MODEL: Terra MAX',
      'MAX_TERRA_SUBAGENTS: 16',
      'CANONICAL_ACTIVE_WRITER: one Terra Integration Writer',
      'PARALLEL_TERRA: isolated non-overlapping worktrees or patch scopes only',
      'READER_MODEL: Luna MAX',
      'LUNA_WRITES: FORBIDDEN',
      'MAX_LUNA_SUBAGENTS: 16',
      'DELEGATION_DEPTH: 1',
      'SUBAGENT_SPAWNER: Sol only',
      'MODEL_SUBSTITUTION: forbidden unless Earl explicitly amends the task',
      'On main, legacy REQUIRED_MODEL: CODEX metadata is explicitly superseded and non-authoritative for model routing.',
      'Permanent Git branch and playground release policy',
      'Isolated Staging Playground',
      '## Quick Document Fix Mode',
      '### Eligibility',
      'Quick Document Fix Mode is available only when all',
      'authorized Git branch/commit/push/PR/merge path',
      'excludes Git-history rewrites',
      'deletion of unknown work',
      'executable security, authentication, or authorization changes',
      'broad architecture decisions',
      'Default staffing is one Terra Integration Writer, zero Luna reviewers, and zero Sol children.',
      '### Fast workflow (10 steps)',
      '1. Sol reads the exact target and direct authority',
      '2. Sol defines the minimal diff',
      '3. Sol assigns ONE Terra MAX writer',
      '4. Terra edits only the required documents',
      '5. Terra runs focused documentation-governance validation',
      '6. Sol reviews the complete diff once',
      '7. Terra repairs only material defects',
      '8. Terra commits exactly once',
      '9. Terra pushes and merges only through the smallest permitted repository path',
      '10. When the requested document is present, focused validation passes, the complete diff has been reviewed, and the required push/merge is complete, STOP.',
      'The default is zero Luna reviewers',
      'Earl explicitly requests an independent audit',
      'genuinely large diff where one independent read materially reduces risk',
      'Do not repeat audit loops',
      'Run proportional documentation-only verification',
      'does not voluntarily run full browser/e2e suites',
      'CodeQL',
      'wait only for the required merge checks',
      'Use minimal continuity updates',
      'document is part of the current chain',
      'active governance or the exact next action changes',
      'repository requires a specific record',
      'Add one concise factual entry only when',
      'For this bootstrap sync, do not add continuity files',
      'Stop Quick Document Fix Mode immediately',
      'The requested document must be present, focused validation must pass, the complete diff must be reviewed, and the required push/merge must be complete. Then STOP.',
      'accepted specification or amendment',
    ].join('\n');
    expect(validateAgentInstructions(valid)).toEqual([]);
    expect(validateAgentInstructions(valid.replace('skill registry', 'skills'))).toContain('skill registry');
    expect(validateAgentInstructions(valid.replace('STATUS: ACCEPTED', 'STATUS: DRAFT'))).toContain(
      'accepted mainline governance amendment status',
    );
    expect(
      validateAgentInstructions(
        valid.replace('QUICK Mainline AGENTS Governance Sync + Fast Document-Fix Mode', 'other directive'),
      ),
    ).toContain('accepted mainline governance amendment directive');
    expect(
      validateAgentInstructions(valid.replace('MAX_SOL_SUBAGENTS: 0', 'MAX_SOL_SUBAGENTS: 1')),
    ).toContain('zero Sol children');
    expect(validateAgentInstructions(valid.replace('10. When', '11. When'))).toContain(
      'ten-step fast workflow',
    );
    expect(
      validateAgentInstructions(valid.replace('Sol assigns ONE Terra MAX writer', 'Sol assigns Terra')),
    ).toContain('Quick Document Fix one Terra assignment');
    expect(
      validateAgentInstructions(valid.replace('Sol reviews the complete diff once', 'Sol reviews later')),
    ).toContain('Quick Document Fix one Sol review');
    expect(
      validateAgentInstructions(valid.replace('Terra commits exactly once', 'Terra commits later')),
    ).toContain('Quick Document Fix commit once');
    expect(
      validateAgentInstructions(
        valid.replace(
          'Terra pushes and merges only through the smallest permitted repository path',
          'Terra waits',
        ),
      ),
    ).toContain('Quick Document Fix push and merge');
    expect(validateAgentInstructions(`${valid}\nCodex is the only writer by default.`)).toContain(
      'obsolete Codex-only writer language',
    );
    expect(validateAgentInstructions(`${valid}\nAt most two concurrent read-only subagents.`)).toContain(
      'obsolete two-read-only-subagent cap',
    );
  });

  it('validates read-only Luna MAX custom-agent essentials', () => {
    const valid = `name = "repo_mapper"\ndescription = "Luna MAX map"\nmodel = "gpt-5.6-luna"\nmodel_reasoning_effort = "max"\nsandbox_mode = "read-only"\ndeveloper_instructions = '''\nRead only. Do not edit files or spawn agents.\n'''`;
    expect(validateAgentToml(valid, 'repo_mapper')).toEqual([]);
    expect(validateAgentToml(valid.replace('read-only', 'workspace-write'), 'repo_mapper')).toContain(
      'read-only sandbox',
    );
    expect(validateAgentToml(valid.replace('gpt-5.6-luna', 'gpt-5.6-terra'), 'repo_mapper')).toContain(
      'model gpt-5.6-luna',
    );
    expect(
      validateAgentToml(
        valid.replace('model_reasoning_effort = "max"', 'model_reasoning_effort = "low"'),
        'repo_mapper',
      ),
    ).toContain('maximum reasoning');
    expect(validateAgentToml(valid.replace('spawn agents', 'summarize logs'), 'repo_mapper')).toContain(
      'no agent spawning',
    );
    expect(validateAgentToml(`${valid}\nmalformed`, 'repo_mapper')[0]).toMatch(/valid restricted TOML/);
    expect(
      validateAgentToml(
        valid.replace('description = "Luna MAX map"', 'description = "read\\/only"'),
        'repo_mapper',
      )[0],
    ).toMatch(/unsupported TOML escape/);
  });

  it('parses only the supported TOML subset and rejects configuration drift', () => {
    const valid = '[agents]\nmax_threads = 32\nmax_depth = 1\ninterrupt_message = false\n';
    expect(parseRestrictedToml(valid).sections.agents).toMatchObject({
      max_threads: 32,
      max_depth: 1,
    });
    expect(validateProjectConfig(valid)).toEqual([]);
    expect(validateProjectConfig(valid.replace('max_threads = 32', 'max_threads = 2'))).toContain(
      'max_threads must be 32',
    );
    expect(
      validateProjectConfig(
        '[agents]\nmax_concurrent_threads_per_session = 32\nmax_depth = 1\ninterrupt_message = false\n',
      ),
    ).toEqual(
      expect.arrayContaining([
        'max_threads must be 32',
        'unsupported [agents] field max_concurrent_threads_per_session',
      ]),
    );
    expect(validateProjectConfig(`${valid}unknown = true`)).toContain('unsupported [agents] field unknown');
    expect(() => parseRestrictedToml(`${valid}max_depth = 1`)).toThrow(/duplicate key/);
  });

  it('requires every compact resume field near the top', () => {
    const fields = REQUIRED_RESUME_FIELDS.map((field) => `- **${field}:** value`).join('\n');
    const valid = `# Work Continuation\n\n## Current resume block\n\n${fields}`;
    expect(validateContinuation(valid)).toEqual([]);
    expect(validateContinuation(valid.replace('- **Blocker:** value\n', ''))).toContain(
      'missing or empty Blocker',
    );
  });

  it('fails closed when repository status cannot be verified', () => {
    const runGit = (args, optional = false) => {
      const command = args.join(' ');
      if (command.startsWith('status ')) throw new Error('status unavailable');
      if (optional) return '';
      return command.startsWith('log ') ? 'abc commit' : 'value';
    };
    expect(() => buildRepoSummary(runGit)).toThrow(/status unavailable/);
  });

  it('marks a successful repository status read as verified', () => {
    const runGit = (args, optional = false) => {
      const command = args.join(' ');
      if (optional) return '';
      if (command.startsWith('status ')) return ' M file-one\n?? file-two';
      if (command.startsWith('log ')) return 'abc commit';
      return 'value';
    };
    expect(buildRepoSummary(runGit)).toMatchObject({ statusVerified: true, dirtyPaths: 2 });
  });

  it('builds byte-bounded context with explicit per-source truncation', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'hau-context-packet-'));
    for (const directory of ['.codex', '.plans', 'docs']) {
      fs.mkdirSync(path.join(cwd, directory), { recursive: true });
    }
    fs.writeFileSync(path.join(cwd, '.codex/CURRENT.md'), 'pointer');
    fs.writeFileSync(path.join(cwd, '.codex/CURRENT_HANDOFF.md'), 'handoff');
    fs.writeFileSync(path.join(cwd, '.codex/CURRENT_TASK.md'), `${'alpha '.repeat(800)}UNFINISHEDTOKEN`);
    fs.writeFileSync(path.join(cwd, '.plans/current-slice.md'), 'slice');
    fs.writeFileSync(path.join(cwd, 'docs/WORK_CONTINUATION.md'), 'continuation');

    const packet = buildContextPacket(cwd);
    expect(Buffer.byteLength(packet, 'utf8')).toBeLessThanOrEqual(12 * 1024);
    expect(packet).toContain('## CURRENT POINTER');
    expect(packet).toContain('## CURRENT HANDOFF');
    expect(packet).toContain('[.codex/CURRENT_TASK.md truncated; read the source for full content]');
    expect(packet).toContain('UNFINISHEDTOKEN');
    expect(packet).not.toContain('\uFFFD');
    const [head, tail] = packet.split('[.codex/CURRENT_TASK.md truncated; read the source for full content]');
    expect(head.trimEnd()).toMatch(/alpha$/);
    expect(tail.trimStart()).toMatch(/^alpha|^UNFINISHEDTOKEN/);
    expect(Buffer.byteLength(truncateUtf8('😀'.repeat(20), 40, '[cut]'), 'utf8')).toBeLessThanOrEqual(40);
  });
});

describe('run-capped helpers', () => {
  it('sanitizes labels and retains only the byte tail', () => {
    expect(sanitizeLabel('Full Check / Windows')).toBe('full-check-windows');
    expect(appendTail(Buffer.from('abc'), Buffer.from('def'), 4).toString()).toBe('cdef');
  });

  it('parses explicit command boundaries and caps', () => {
    expect(parseArgs(['--label', 'check', '--success-bytes', '100', '--', 'node', '-v'])).toMatchObject({
      label: 'check',
      successBytes: 100,
      command: 'node',
      args: ['-v'],
    });
  });

  it('keeps Windows command shims explicit in parsed commands', () => {
    expect(parseArgs(['--', 'npm.cmd', 'run', 'check'])).toMatchObject({
      command: 'npm.cmd',
      args: ['run', 'check'],
    });
  });

  it('quotes safe Windows shim tokens and rejects shell metacharacters', () => {
    expect(buildWindowsCommandLine('npm.cmd', ['run', 'full check'])).toBe('npm.cmd run "full check"');
    expect(() => buildWindowsCommandLine('npm.cmd', ['run', 'check&deploy'])).toThrow(/metacharacters/);
  });

  it('preserves child exit codes and writes a complete ignored log', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'hau-run-capped-'));
    const script = path.resolve('tools/codex/run-capped.mjs');
    const result = spawnSync(
      process.execPath,
      [
        script,
        '--label',
        'failure',
        '--failure-bytes',
        '80',
        '--',
        process.execPath,
        '-e',
        "process.stdout.write('x'.repeat(400)); process.exit(7)",
      ],
      { cwd, encoding: 'utf8', windowsHide: true },
    );
    expect(result.status).toBe(7);
    expect(result.stdout).toContain('run-capped: exit=7');
    const logs = fs.readdirSync(path.join(cwd, '.codex/runtime/logs'));
    expect(logs).toHaveLength(1);
    expect(fs.readFileSync(path.join(cwd, '.codex/runtime/logs', logs[0]), 'utf8')).toHaveLength(400);
  });

  it.runIf(process.platform === 'win32')('runs a Windows command shim and preserves its exit code', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'hau-run-capped-cmd-'));
    const shim = path.join(cwd, 'fixture.cmd');
    fs.writeFileSync(shim, '@echo off\r\necho shim-ok\r\nexit /b 3\r\n');
    const script = path.resolve('tools/codex/run-capped.mjs');
    const result = spawnSync(process.execPath, [script, '--label', 'cmd-shim', '--', shim], {
      cwd,
      encoding: 'utf8',
      windowsHide: true,
    });
    expect(result.status).toBe(3);
    expect(result.stdout).toContain('shim-ok');
    expect(result.stdout).toContain('run-capped: exit=3');
    expect(fs.readdirSync(path.join(cwd, '.codex/runtime/logs'))).toHaveLength(1);
  });
});
