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
  it('requires the durable routing and safety triggers', () => {
    const valid = [
      'skill registry',
      '.codex/TASK_ROUTING.md',
      '.codex/CAVEMAN_WORKFLOW.md',
      '.codex/USAGE_POLICY.md',
      'only writer by default',
      'at most two concurrent read-only subagents',
      'accepted specification or amendment',
    ].join('\n');
    expect(validateAgentInstructions(valid)).toEqual([]);
    expect(validateAgentInstructions(valid.replace('skill registry', 'skills'))).toContain('skill registry');
  });

  it('validates read-only custom-agent essentials', () => {
    const valid = `name = "repo_mapper"\ndescription = "map"\nmodel = "gpt-5.6-terra"\nmodel_reasoning_effort = "low"\nsandbox_mode = "read-only"\ndeveloper_instructions = '''\nread only\n'''`;
    expect(validateAgentToml(valid, 'repo_mapper')).toEqual([]);
    expect(validateAgentToml(valid.replace('read-only', 'workspace-write'), 'repo_mapper')).toContain(
      'read-only sandbox',
    );
    expect(validateAgentToml(valid.replace('gpt-5.6-terra', 'gpt-5.6'), 'repo_mapper')).toContain(
      'model gpt-5.6-terra',
    );
    expect(validateAgentToml(`${valid}\nmalformed`, 'repo_mapper')[0]).toMatch(/valid restricted TOML/);
    expect(
      validateAgentToml(
        valid.replace('description = "map"', 'description = "read\\/only"'),
        'repo_mapper',
      )[0],
    ).toMatch(/unsupported TOML escape/);
  });

  it('parses only the supported TOML subset and rejects configuration drift', () => {
    const valid = '[agents]\nmax_threads = 2\nmax_depth = 1\ninterrupt_message = false\n';
    expect(parseRestrictedToml(valid).sections.agents).toMatchObject({ max_threads: 2, max_depth: 1 });
    expect(validateProjectConfig(valid)).toEqual([]);
    expect(validateProjectConfig(valid.replace('max_threads = 2', 'max_threads = 3'))).toContain(
      'max_threads must be 2',
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
    fs.writeFileSync(path.join(cwd, '.codex/CURRENT_TASK.md'), `${'alpha '.repeat(800)}UNFINISHEDTOKEN`);
    fs.writeFileSync(path.join(cwd, '.plans/current-slice.md'), 'slice');
    fs.writeFileSync(path.join(cwd, '.plans/AUTONOMOUS_PROGRAM_STATUS.md'), 'status');
    fs.writeFileSync(path.join(cwd, 'docs/WORK_CONTINUATION.md'), 'continuation');

    const packet = buildContextPacket(cwd);
    expect(Buffer.byteLength(packet, 'utf8')).toBeLessThanOrEqual(12 * 1024);
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
