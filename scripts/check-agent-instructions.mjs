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
  '.codex/CURRENT.md',
  '.codex/CURRENT_TASK.md',
  '.codex/CURRENT_HANDOFF.md',
  '.codex/PHASE_AND_CONTEXT_POLICY.md',
  '.codex/TASK_HISTORY.md',
  '.codex/specs/active/sol-terra-luna-orchestration-governance-amendment.md',
];

const REQUIRED_CURRENT_ROUTING = [
  ['REQUIRED_MODEL GPT-5.6 SOL', /^REQUIRED_MODEL:\s*GPT-5\.6 SOL\s*$/im],
  ['ORCHESTRATOR_MODEL GPT-5.6 SOL', /^ORCHESTRATOR_MODEL:\s*GPT-5\.6 SOL\s*$/im],
  ['ORCHESTRATOR_WRITES FORBIDDEN', /^ORCHESTRATOR_WRITES:\s*FORBIDDEN\s*$/im],
  ['WRITER_MODEL TERRA MAX', /^WRITER_MODEL:\s*TERRA MAX\s*$/im],
  ['READER_MODEL LUNA MAX', /^READER_MODEL:\s*LUNA MAX\s*$/im],
  ['MAX_SOL_SUBAGENTS 0', /^MAX_SOL_SUBAGENTS:\s*0\s*$/im],
  ['MAX_TERRA_SUBAGENTS 16', /^MAX_TERRA_SUBAGENTS:\s*16\s*$/im],
  ['MAX_LUNA_SUBAGENTS 16', /^MAX_LUNA_SUBAGENTS:\s*16\s*$/im],
  ['DELEGATION_DEPTH 1', /^DELEGATION_DEPTH:\s*1\s*$/im],
  ['SUBAGENT_SPAWNER SOL_ONLY', /^SUBAGENT_SPAWNER:\s*SOL_ONLY\s*$/im],
  [
    'MODEL_SUBSTITUTION forbidden',
    /^MODEL_SUBSTITUTION:\s*FORBIDDEN_UNLESS_EARL_EXPLICITLY_AMENDS_TASK\s*$/im,
  ],
  [
    'GOVERNANCE_AMENDMENT canonical path',
    /^GOVERNANCE_AMENDMENT:\s*\.codex\/specs\/active\/sol-terra-luna-orchestration-governance-amendment\.md\s*$/im,
  ],
];

export function validateAgentInstructions(text) {
  const required = [
    ['skill registry', /skill registry/i],
    ['task routing', /\.codex\/TASK_ROUTING\.md/i],
    ['Caveman workflow', /\.codex\/CAVEMAN_WORKFLOW\.md/i],
    ['usage policy', /\.codex\/USAGE_POLICY\.md/i],
    [
      'canonical continuity chain',
      /AGENTS\.md\s*->\s*\.codex\/CURRENT\.md\s*->\s*\.codex\/CURRENT_TASK\.md\s*->\s*\.codex\/CURRENT_HANDOFF\.md/i,
    ],
    ['GPT-5.6 Sol orchestrator', /ORCHESTRATOR_MODEL:\s*GPT-5\.6 Sol/i],
    ['Sol writes forbidden', /ORCHESTRATOR_WRITES:\s*FORBIDDEN/i],
    ['Sol subagents forbidden', /SOL_SUBAGENTS:\s*FORBIDDEN/i],
    ['zero Sol children', /MAX_SOL_SUBAGENTS:\s*0\b/i],
    ['Terra MAX writer model', /WRITER_MODEL:\s*Terra MAX/i],
    ['Terra MAX cap', /MAX_TERRA_SUBAGENTS:\s*16\b/i],
    ['one Terra Integration Writer', /CANONICAL_ACTIVE_WRITER:\s*one Terra Integration Writer/i],
    ['isolated parallel Terra scopes', /PARALLEL_TERRA:\s*isolated non-overlapping/i],
    ['Luna MAX reader model', /READER_MODEL:\s*Luna MAX/i],
    ['Luna writes forbidden', /LUNA_WRITES:\s*FORBIDDEN/i],
    ['Luna MAX cap', /MAX_LUNA_SUBAGENTS:\s*16\b/i],
    ['delegation depth one', /DELEGATION_DEPTH:\s*1\b/i],
    ['Sol-only child spawner', /SUBAGENT_SPAWNER:\s*Sol only/i],
    ['no silent model substitution', /MODEL_SUBSTITUTION:\s*forbidden/i],
    ['specification gate', /accepted specification or amendment/i],
  ];
  const errors = required.filter(([, pattern]) => !pattern.test(text)).map(([name]) => name);
  const obsolete = [
    ['obsolete Codex-only writer language', /Codex is the only writer/i],
    ['obsolete two-read-only-subagent cap', /at most two concurrent read-only subagents/i],
    ['Sol direct-write permission', /Sol may (?:directly )?(?:edit|write|mutate)/i],
    [
      'Sol-child permission',
      /(?:Sol (?:may|can|is allowed to) (?:spawn|create)|Sol child(?:ren)? (?:are )?allowed)/i,
    ],
    ['Luna writer permission', /Luna (?:may )?(?:write|edit|mutate)/i],
  ];
  return [...errors, ...obsolete.filter(([, pattern]) => pattern.test(text)).map(([name]) => name)];
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
    ['Luna MAX description', /\bLuna MAX\b/.test(agent.description || '')],
    ['model gpt-5.6-luna', agent.model === 'gpt-5.6-luna'],
    [
      'developer_instructions',
      typeof agent.developer_instructions === 'string' && agent.developer_instructions.trim().length > 0,
    ],
    ['read-only instructions', /Do not edit files/i.test(agent.developer_instructions || '')],
    ['read-only sandbox', agent.sandbox_mode === 'read-only'],
    ['maximum reasoning', agent.model_reasoning_effort === 'max'],
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
  if (agents.max_concurrent_threads_per_session !== 32) {
    errors.push('max_concurrent_threads_per_session must be 32');
  }
  if (agents.max_depth !== 1) errors.push('max_depth must be 1');
  if (agents.interrupt_message !== false) errors.push('interrupt_message must be false');
  for (const key of Object.keys(agents)) {
    if (!['max_concurrent_threads_per_session', 'max_depth', 'interrupt_message'].includes(key)) {
      errors.push(`unsupported [agents] field ${key}`);
    }
  }
  return errors;
}

export function validateCurrentModelRouting(text) {
  return REQUIRED_CURRENT_ROUTING.filter(([, pattern]) => !pattern.test(text)).map(([name]) => name);
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

  for (const relative of ['.codex/CURRENT.md', '.codex/CURRENT_TASK.md', '.codex/CURRENT_HANDOFF.md']) {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) continue;
    for (const item of validateCurrentModelRouting(fs.readFileSync(file, 'utf8'))) {
      errors.push(`${relative} missing ${item}`);
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
