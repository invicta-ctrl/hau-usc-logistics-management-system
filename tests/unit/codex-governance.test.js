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
  validateUniversalAgentInstructions,
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
  it('requires the byte-identical universal root contract', () => {
    const valid = [
      'governance_id: EARL-UNIVERSAL-AGENTS-V1',
      'canonical_repository: invicta-ctrl/gpt-context-vault',
      'managed_replica_policy: byte-identical-generated',
      'project_extension_path: .agents/PROJECT_POLICY.md',
      'only editable general-policy authority',
      'Context Vault AGENTS.md -> START_HERE.md -> CONTEXT_INDEX.md -> minimum relevant context -> authoritative project repository',
      '## Canonical AGENTS synchronization contract',
    ].join('\n');
    expect(validateUniversalAgentInstructions(valid)).toEqual([]);
    expect(validateUniversalAgentInstructions(`${valid}\nMAX_TERRA_SUBAGENTS: 16`)).toContain(
      'HAU orchestration leaked into universal root',
    );
  });

  it('requires the current Sol Advisor routing, writer-lock, and Quick Document Fix policies', () => {
    const valid = [
      'extension_id: HAU-USC-LOGISTICS-PROJECT-POLICY-V1',
      'Read the byte-identical universal root `AGENTS.md` first',
      'universal AGENTS.md -> .agents/PROJECT_POLICY.md -> .codex/CURRENT.md',
      'SOL-ADVISOR-GLOBAL-001 is the active account-wide routing authority',
      'Sol / High declares `solo|delegate|audit|full`; solo is default',
      'Luna / Max is bounded implementation',
      'Terra / High is higher-risk implementation',
      'fresh Sol / High reviews only audit/full',
      'No child may spawn',
      'No agent may create an implementation Sol child',
      'At most two writers may coexist account-wide',
      'Every repository or worktree has at most one writer',
      'ACTIVE_WRITER is a hard lock',
      'No silent model substitution is permitted',
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
      'Permanent Git branch and playground release policy',
      '## Permanent Git and recovery policy',
      '## Mandatory release path after v0.8.0',
      '## Environment and data-isolation rules',
      '## Protected domain invariants',
      'Isolated Staging Playground',
      '## Quick Document Fix Mode',
      '### Eligibility',
      'Quick Document Fix Mode is available only when all',
      'authorized Git branch/commit/push/PR/merge path',
      'excludes Git-history rewrites',
      'deletion of unknown work',
      'executable security, authentication, or authorization changes',
      'broad architecture decisions',
      '### Fast workflow (10 steps)',
      '1. Sol reads the exact target and direct authority',
      '2. Sol defines the minimal diff',
      '3. Sol declares `solo` or the smallest justified route',
      '4. The selected implementation lane edits only required documents',
      '5. The selected implementation lane runs focused documentation checks',
      '6. Sol verifies the complete diff',
      '7. The selected implementation lane repairs only material defects',
      '8. The selected implementation lane commits exactly once',
      '9. The selected implementation lane pushes and merges only through the smallest permitted repository path',
      '10. When the requested document is present, focused validation passes, the complete diff has been reviewed, and the required push/merge is complete, STOP.',
      'Use a fresh Sol / High reviewer only when Sol declares `audit` or `full`',
      'Do not repeat audit loops',
      'do not start a repeated audit loop',
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
      'unrelated dirty work elsewhere is not by itself a blocker',
    ].join('\n');
    expect(validateAgentInstructions(valid)).toEqual([]);
    for (const [source, replacement, missing] of [
      ['SOL-ADVISOR-GLOBAL-001 is the active account-wide routing authority', 'local routing policy', 'active Sol Advisor authority'],
      ['Sol / High declares `solo|delegate|audit|full`; solo is default', 'Sol routing is unspecified', 'Sol four-mode routing'],
      ['solo is default', 'solo is conditional', 'solo default'],
      ['Luna / Max is bounded implementation', 'Luna routing is unspecified', 'Luna bounded implementation'],
      ['Terra / High is higher-risk implementation', 'Terra routing is unspecified', 'Terra higher-risk implementation'],
      ['fresh Sol / High reviews only audit/full', 'fresh Sol review is unrestricted', 'fresh Sol audit/full review only'],
      ['No child may spawn', 'Children may spawn', 'no child spawning'],
      ['No agent may create an implementation Sol child', 'Sol child policy is unspecified', 'no implementation Sol child'],
      ['At most two writers may coexist account-wide', 'Writer count is unrestricted', 'two isolated writers maximum'],
      ['Every repository or worktree has at most one writer', 'Writer scope is unrestricted', 'one writer per repository or worktree'],
      ['ACTIVE_WRITER is a hard lock', 'ACTIVE_WRITER is advisory', 'writer lock'],
      ['No silent model substitution is permitted', 'Silent model substitution is permitted', 'no silent model substitution'],
    ]) {
      expect(validateAgentInstructions(valid.replace(source, replacement))).toContain(missing);
    }
    expect(validateAgentInstructions(valid.replace('10. When', '11. When'))).toContain(
      'ten-step document workflow',
    );
  });

  it('validates read-only Luna custom-agent essentials', () => {
    const valid = `name = "repo_mapper"\ndescription = "Luna map"\nmodel = "gpt-5.6-luna"\nmodel_reasoning_effort = "high"\nsandbox_mode = "read-only"\ndeveloper_instructions = '''\nRead only. Do not edit files or spawn agents.\n'''`;
    expect(validateAgentToml(valid, 'repo_mapper')).toEqual([]);
    expect(validateAgentToml(valid.replace('read-only', 'workspace-write'), 'repo_mapper')).toContain(
      'read-only sandbox',
    );
    expect(validateAgentToml(valid.replace('gpt-5.6-luna', 'gpt-5.6-terra'), 'repo_mapper')).toContain(
      'model gpt-5.6-luna',
    );
    expect(
      validateAgentToml(
        valid.replace('model_reasoning_effort = "high"', 'model_reasoning_effort = "low"'),
        'repo_mapper',
      ),
    ).toContain('High reasoning');
    expect(validateAgentToml(valid.replace('spawn agents', 'summarize logs'), 'repo_mapper')).toContain(
      'no agent spawning',
    );
    expect(validateAgentToml(`${valid}\nmalformed`, 'repo_mapper')[0]).toMatch(/valid restricted TOML/);
    expect(
      validateAgentToml(
        valid.replace('description = "Luna map"', 'description = "read\\/only"'),
        'repo_mapper',
      )[0],
    ).toMatch(/unsupported TOML escape/);
  });

  it('parses only the supported TOML subset and rejects configuration drift', () => {
    const valid = '[agents]\nmax_threads = 2\nmax_depth = 1\ninterrupt_message = false\n';
    expect(parseRestrictedToml(valid).sections.agents).toMatchObject({
      max_threads: 2,
      max_depth: 1,
    });
    expect(validateProjectConfig(valid)).toEqual([]);
    expect(validateProjectConfig(valid.replace('max_threads = 2', 'max_threads = 3'))).toContain(
      'max_threads must be between 1 and 2',
    );
    expect(
      validateProjectConfig(
        '[agents]\nmax_concurrent_threads_per_session = 32\nmax_depth = 1\ninterrupt_message = false\n',
      ),
    ).toEqual(
      expect.arrayContaining([
        'max_threads must be between 1 and 2',
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
