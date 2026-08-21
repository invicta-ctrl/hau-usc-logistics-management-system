import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_FILES = [
  '.agents/PROJECT_POLICY.md',
  '.codex/config.toml',
  '.codex/agents/log-triage.toml',
  '.codex/agents/repo-mapper.toml',
  '.codex/CAVEMAN_WORKFLOW.md',
  '.codex/TASK_ROUTING.md',
  '.codex/USAGE_POLICY.md',
  '.codex/CURRENT.md',
  '.codex/CURRENT_TASK.md',
  '.codex/CURRENT_HANDOFF.md',
  '.codex/PHASE_AND_CONTEXT_POLICY.md',
  '.codex/TASK_HISTORY.md',
];

function hasTenStepWorkflow(text) {
  const section = text.match(/### Fast workflow(?: \(10 steps\))?\r?\n([\s\S]*?)(?=\r?\n### |\r?\n## |$)/i);
  if (!section) return false;
  return Array.from({ length: 10 }, (_, index) =>
    new RegExp(`^${index + 1}\\.\\s+`, 'm').test(section[1]),
  ).every(Boolean);
}

function missingMarkers(text, markers) {
  return markers
    .filter(([, pattern]) => !(pattern instanceof RegExp ? pattern.test(text) : pattern(text)))
    .map(([name]) => name);
}

export function validateUniversalAgentInstructions(text) {
  const required = [
    ['universal governance id', /governance_id:\s*EARL-UNIVERSAL-AGENTS-V1/i],
    ['canonical Context Vault repository', /canonical_repository:\s*invicta-ctrl\/gpt-context-vault/i],
    ['byte-identical managed replicas', /managed_replica_policy:\s*byte-identical-generated/i],
    ['project extension path', /project_extension_path:\s*\.agents\/PROJECT_POLICY\.md/i],
    ['sole editable authority', /only editable general-policy authority/i],
    ['ChatGPT bounded Context Vault route', /Context Vault AGENTS\.md[\s\S]*?START_HERE\.md[\s\S]*?CONTEXT_INDEX\.md[\s\S]*?minimum relevant context[\s\S]*?authoritative project repository/i],
    ['canonical synchronization contract', /## Canonical AGENTS synchronization contract/i],
  ];
  const forbidden = [
    ['HAU orchestration leaked into universal root', /MAX_TERRA_SUBAGENTS|MAX_LUNA_SUBAGENTS|TERRA_INTEGRATION_WRITER/i],
    ['HAU release policy leaked into universal root', /Isolated Staging Playground|backup\/last-known-good/i],
  ];
  return [
    ...missingMarkers(text, required),
    ...forbidden.filter(([, pattern]) => pattern.test(text)).map(([name]) => name),
  ];
}

export function validateAgentInstructions(text) {
  const required = [
    ['HAU project extension id', /extension_id:\s*HAU-USC-LOGISTICS-PROJECT-POLICY-V1/i],
    ['universal root first', /Read the byte-identical universal root `AGENTS\.md` first/i],
    ['canonical continuity chain', /universal AGENTS\.md[\s\S]*?\.agents\/PROJECT_POLICY\.md[\s\S]*?\.codex\/CURRENT\.md/i],
    ['TOKEN-OPT sole efficiency authority', /TOKEN-OPT-001 is the sole account-wide token\/context-efficiency authority/i],
    ['Sol orchestrator', /ORCHESTRATOR_MODEL:\s*GPT-5\.6 Sol/i],
    ['Sol writes forbidden', /ORCHESTRATOR_WRITES:\s*FORBIDDEN/i],
    ['zero default children', /DEFAULT_CHILDREN:\s*0\b/i],
    ['one active child maximum', /MAX_ACTIVE_CHILDREN:\s*1\b/i],
    ['delegation depth one', /DELEGATION_DEPTH:\s*1\b/i],
    ['ordinary reasoning High or lower', /ORDINARY_REASONING:\s*high or lower/i],
    ['no routine independent review', /ROUTINE_INDEPENDENT_REVIEW:\s*false/i],
    ['no routine full suite per module', /ROUTINE_FULL_SUITE_AFTER_SMALL_MODULE:\s*false/i],
    ['stop when green', /STOP_WHEN_GREEN:\s*true/i],
    ['one Terra integration writer', /CANONICAL_ACTIVE_WRITER:\s*one Terra Integration Writer/i],
    ['Luna writes forbidden', /LUNA_WRITES:\s*FORBIDDEN/i],
    ['writer lock', /ACTIVE_WRITER.*hard lock/i],
    ['permanent recovery policy', /## Permanent Git and recovery policy/i],
    ['mandatory release path', /## Mandatory release path after v0\.8\.0/i],
    ['environment isolation', /## Environment and data-isolation rules/i],
    ['protected domain invariants', /## Protected domain invariants/i],
    ['Quick Document Fix Mode', /## Quick Document Fix Mode/i],
    ['ten-step document workflow', hasTenStepWorkflow],
    ['conditional Luna review', /Use a bounded Luna review only for/i],
    ['no repeated review loop', /do not start a repeated audit loop/i],
    ['synchronization preserves unrelated dirty work', /unrelated\s+dirty work elsewhere is not by itself a blocker/i],
  ];
  const forbidden = [
    ['routine Terra pool', /MAX_TERRA_SUBAGENTS:\s*16|sixteen Terra|up to 16 Terra/i],
    ['routine Luna pool', /MAX_LUNA_SUBAGENTS:\s*16|sixteen Luna|up to 16 Luna/i],
    ['routine concurrent Terra writers', /PARALLEL_TERRA:\s*isolated non-overlapping/i],
  ];
  return [
    ...missingMarkers(text, required),
    ...forbidden.filter(([, pattern]) => pattern.test(text)).map(([name]) => name),
  ];
}

export function parseRestrictedToml(text) {
  const document = { root: Object.create(null), sections: Object.create(null) };
  const lines = String(text).split(/\r?\n/);
  let target = document.root;

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const section = trimmed.match(/^\[([A-Za-z0-9_-]+)\]$/);
    if (section) {
      if (Object.hasOwn(document.sections, section[1])) {
        throw new Error(`line ${index + 1}: duplicate section [${section[1]}]`);
      }
      target = Object.create(null);
      document.sections[section[1]] = target;
      continue;
    }

    const assignment = trimmed.match(/^([A-Za-z0-9_-]+)\s*=\s*(.*)$/);
    if (!assignment) throw new Error(`line ${index + 1}: unsupported syntax`);
    const [, key, rawValue] = assignment;
    if (Object.hasOwn(target, key)) throw new Error(`line ${index + 1}: duplicate key ${key}`);

    if (rawValue === "'''") {
      const valueLines = [];
      let closed = false;
      while (++index < lines.length) {
        if (lines[index].trim() === "'''") {
          closed = true;
          break;
        }
        valueLines.push(lines[index]);
      }
      if (!closed) throw new Error(`unterminated multiline string for ${key}`);
      target[key] = valueLines.join('\n');
      continue;
    }

    if (/^"(?:[^"\\]|\\.)*"$/.test(rawValue)) {
      const body = rawValue.slice(1, -1);
      for (let cursor = 0; cursor < body.length; cursor += 1) {
        if (body[cursor] !== '\\') continue;
        const escape = body[cursor + 1];
        if ('"\\btnfr'.includes(escape)) {
          cursor += 1;
          continue;
        }
        if (escape === 'u' && /^[0-9A-Fa-f]{4}$/.test(body.slice(cursor + 2, cursor + 6))) {
          cursor += 5;
          continue;
        }
        throw new Error(`line ${index + 1}: unsupported TOML escape for ${key}`);
      }
      try {
        target[key] = JSON.parse(rawValue);
      } catch {
        throw new Error(`line ${index + 1}: invalid string for ${key}`);
      }
    } else if (/^'[^']*'$/.test(rawValue)) {
      target[key] = rawValue.slice(1, -1);
    } else if (/^-?\d+$/.test(rawValue)) {
      target[key] = Number(rawValue);
    } else if (/^(?:true|false)$/.test(rawValue)) {
      target[key] = rawValue === 'true';
    } else {
      throw new Error(`line ${index + 1}: unsupported value for ${key}`);
    }
  }
  return document;
}

export function validateAgentToml(text, expectedName) {
  let parsed;
  try {
    parsed = parseRestrictedToml(text);
  } catch (error) {
    return [`valid restricted TOML (${error.message})`];
  }

  if (Object.keys(parsed.sections).length) return ['top-level agent fields only'];
  const agent = parsed.root;
  const missing = [];
  const checks = [
    ['name', agent.name === expectedName],
    ['description', typeof agent.description === 'string' && agent.description.trim().length > 0],
    ['Luna description', /\bLuna\b/.test(agent.description || '')],
    ['model gpt-5.6-luna', agent.model === 'gpt-5.6-luna'],
    ['developer_instructions', typeof agent.developer_instructions === 'string' && agent.developer_instructions.trim().length > 0],
    ['read-only instructions', /Do not edit files/i.test(agent.developer_instructions || '')],
    ['no agent spawning', /Do not[\s\S]{0,500}spawn agents/i.test(agent.developer_instructions || '')],
    ['read-only sandbox', agent.sandbox_mode === 'read-only'],
    ['High reasoning', agent.model_reasoning_effort === 'high'],
  ];
  for (const [name, valid] of checks) if (!valid) missing.push(name);

  const allowed = new Set(['name', 'description', 'model', 'model_reasoning_effort', 'sandbox_mode', 'developer_instructions']);
  for (const key of Object.keys(agent)) if (!allowed.has(key)) missing.push(`unsupported field ${key}`);
  return missing;
}

export function validateProjectConfig(text) {
  let parsed;
  try {
    parsed = parseRestrictedToml(text);
  } catch (error) {
    return [`valid restricted TOML (${error.message})`];
  }

  const errors = [];
  if (Object.keys(parsed.root).length) errors.push('top-level fields are not allowed');
  const sectionNames = Object.keys(parsed.sections);
  if (!Object.hasOwn(parsed.sections, 'agents')) errors.push('missing [agents]');
  for (const name of sectionNames) if (name !== 'agents') errors.push(`unsupported section [${name}]`);

  const agents = parsed.sections.agents || Object.create(null);
  if (!Number.isInteger(agents.max_threads) || agents.max_threads < 1 || agents.max_threads > 2) {
    errors.push('max_threads must be between 1 and 2');
  }
  if (agents.max_depth !== 1) errors.push('max_depth must be 1');
  if (agents.interrupt_message !== false) errors.push('interrupt_message must be false');
  for (const key of Object.keys(agents)) {
    if (!['max_threads', 'max_depth', 'interrupt_message'].includes(key)) {
      errors.push(`unsupported [agents] field ${key}`);
    }
  }
  return errors;
}

export function validateProjectAgentFiles(root) {
  const errors = [];
  for (const relative of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(root, relative))) errors.push(`missing ${relative}`);
  }

  const agentsPath = path.join(root, 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) {
    errors.push('missing AGENTS.md');
  } else {
    for (const item of validateUniversalAgentInstructions(fs.readFileSync(agentsPath, 'utf8'))) {
      errors.push(`AGENTS.md missing ${item}`);
    }
  }

  const extensionPath = path.join(root, '.agents/PROJECT_POLICY.md');
  if (fs.existsSync(extensionPath)) {
    for (const item of validateAgentInstructions(fs.readFileSync(extensionPath, 'utf8'))) {
      errors.push(`.agents/PROJECT_POLICY.md missing ${item}`);
    }
  }

  const configPath = path.join(root, '.codex/config.toml');
  if (fs.existsSync(configPath)) {
    for (const item of validateProjectConfig(fs.readFileSync(configPath, 'utf8'))) {
      errors.push(`.codex/config.toml ${item}`);
    }
  }

  for (const [relative, name] of [
    ['.codex/agents/log-triage.toml', 'log_triage'],
    ['.codex/agents/repo-mapper.toml', 'repo_mapper'],
  ]) {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) continue;
    for (const item of validateAgentToml(fs.readFileSync(file, 'utf8'), name)) {
      errors.push(`${relative} missing ${item}`);
    }
  }
  return errors;
}

function run() {
  const errors = validateProjectAgentFiles(process.cwd());
  if (errors.length) {
    console.error(`Agent instruction check failed (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Agent instruction check passed (${REQUIRED_FILES.length} project files).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run();
