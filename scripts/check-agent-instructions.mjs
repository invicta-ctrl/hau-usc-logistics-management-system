import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_FILES = [
  '.codex/config.toml',
  '.codex/agents/log-triage.toml',
  '.codex/agents/repo-mapper.toml',
  '.codex/CAVEMAN_WORKFLOW.md',
  '.codex/TASK_ROUTING.md',
  '.codex/USAGE_POLICY.md',
  '.codex/CURRENT_TASK.md',
  '.codex/TASK_HISTORY.md',
];

export function validateAgentInstructions(text) {
  const required = [
    ['skill registry', /skill registry/i],
    ['task routing', /\.codex\/TASK_ROUTING\.md/i],
    ['Caveman workflow', /\.codex\/CAVEMAN_WORKFLOW\.md/i],
    ['usage policy', /\.codex\/USAGE_POLICY\.md/i],
    ['single writer', /only writer by default/i],
    ['bounded subagents', /at most two concurrent read-only subagents/i],
    ['specification gate', /accepted specification or amendment/i],
  ];
  return required.filter(([, pattern]) => !pattern.test(text)).map(([name]) => name);
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
    ['model gpt-5.6-terra', agent.model === 'gpt-5.6-terra'],
    [
      'developer_instructions',
      typeof agent.developer_instructions === 'string' && agent.developer_instructions.trim().length > 0,
    ],
    ['read-only sandbox', agent.sandbox_mode === 'read-only'],
    ['low reasoning', agent.model_reasoning_effort === 'low'],
  ];
  for (const [name, valid] of checks) {
    if (!valid) missing.push(name);
  }

  const allowed = new Set([
    'name',
    'description',
    'model',
    'model_reasoning_effort',
    'sandbox_mode',
    'developer_instructions',
  ]);
  for (const key of Object.keys(agent)) {
    if (!allowed.has(key)) missing.push(`unsupported field ${key}`);
  }
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
  for (const name of sectionNames) {
    if (name !== 'agents') errors.push(`unsupported section [${name}]`);
  }

  const agents = parsed.sections.agents || Object.create(null);
  if (agents.max_threads !== 2) errors.push('max_threads must be 2');
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
    for (const item of validateAgentInstructions(fs.readFileSync(agentsPath, 'utf8'))) {
      errors.push(`AGENTS.md missing ${item}`);
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
