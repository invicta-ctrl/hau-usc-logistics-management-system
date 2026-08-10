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
];

function hasTenStepQuickDocumentWorkflow(text) {
  const section = text.match(/### Fast workflow \(10 steps\)\r?\n([\s\S]*?)(?=\r?\n### |\r?\n## |$)/i);
  if (!section) return false;
  return Array.from({ length: 10 }, (_, index) =>
    new RegExp(`^${index + 1}\\.\\s+`, 'm').test(section[1]),
  ).every(Boolean);
}

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
    ['accepted mainline governance amendment', /## Accepted mainline governance amendment — 2026-08-10/i],
    [
      'accepted mainline governance amendment durability',
      /`?AGENTS\.md`? section is the durable accepted governance amendment at the\s+first step of the canonical continuity chain/i,
    ],
    ['accepted mainline governance amendment status', /STATUS:\*{0,2}\s*ACCEPTED/i],
    ['accepted mainline governance amendment owner', /OWNER:\*{0,2}\s*Earl/i],
    [
      'accepted mainline governance amendment directive',
      /QUICK Mainline AGENTS Governance Sync \+ Fast Document-Fix Mode/i,
    ],
    [
      'accepted mainline governance amendment scope',
      /Root Sol\/Terra\/Luna sync[\s\S]*?Quick Document Fix Mode[\s\S]*?directly coupled enforcement[\s\S]*?branch\/commit\/PR\/merge to `?main`?/i,
    ],
    [
      'accepted mainline governance amendment exclusions',
      /Runtime,\s+deploy,\s+provider,\s+database,\s+migration,\s+production-data,\s+recovery,\s+frontend,\s+and release behavior/i,
    ],
    [
      'accepted mainline governance/runtime distinction',
      /Main-governance lineage is distinct from deployed Production\s+runtime/i,
    ],
    [
      'accepted mainline governance legacy bootstrap exception',
      /Legacy current\/task\s+`?REQUIRED_MODEL:\s*CODEX`?\s+remains superseded and non-authoritative[\s\S]*?does not require\s+a current-chain rewrite for this explicitly accepted bootstrap/i,
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
    [
      'legacy current metadata superseded',
      /legacy\s+`?REQUIRED_MODEL:\s*CODEX`?\s+metadata[\s\S]*?superseded and non-authoritative/i,
    ],
    ['permanent branch and playground policy', /Permanent Git branch and playground release policy/i],
    ['isolated staging playground policy', /Isolated Staging Playground/i],
    ['Quick Document Fix Mode', /## Quick Document Fix Mode/i],
    ['Quick Document Fix eligibility', /Quick Document Fix Mode is available only when all/i],
    ['Quick Document Fix eligibility section', /### Eligibility/i],
    [
      'Quick Document Fix default staffing',
      /one Terra Integration\s+Writer,\s+zero Luna reviewers,\s+and\s+zero Sol children/i,
    ],
    ['ten-step fast workflow', hasTenStepQuickDocumentWorkflow],
    ['Quick Document Fix authorized Git path', /authorized Git branch\/commit\/push\/PR\/merge path/i],
    ['Quick Document Fix excludes Git-history rewrites', /excludes Git-history rewrites/i],
    ['Quick Document Fix excludes unknown-work deletion', /deletion of unknown work/i],
    [
      'Quick Document Fix excludes executable authorization changes',
      /executable security, authentication, or authorization changes/i,
    ],
    ['Quick Document Fix excludes broad architecture decisions', /broad\s+architecture decisions/i],
    ['Quick Document Fix Sol reads authority', /Sol reads the exact target and direct authority/i],
    ['Quick Document Fix Sol defines minimal diff', /Sol defines the minimal diff/i],
    ['Quick Document Fix one Terra assignment', /Sol assigns ONE Terra MAX writer/i],
    ['Quick Document Fix Terra-only document edit', /Terra edits only the required documents/i],
    ['Quick Document Fix Terra validation', /Terra runs focused documentation-governance validation/i],
    ['Quick Document Fix one Sol review', /Sol reviews the complete diff once/i],
    ['Quick Document Fix material-only repair', /repairs only material defects/i],
    ['Quick Document Fix commit once', /commits exactly once/i],
    [
      'Quick Document Fix push and merge',
      /pushes and merges only through the smallest permitted repository path/i,
    ],
    ['limited Luna triggers', /The default is zero Luna reviewers/i],
    ['Luna Earl audit trigger', /Earl\s+explicitly requests an independent audit/i],
    ['Luna large-diff trigger', /genuinely large diff where one\s+independent read materially reduces risk/i],
    ['no repeated audit loops', /Do not repeat audit loops/i],
    ['proportional documentation-only verification', /Run proportional documentation-only verification/i],
    ['documentation-only test exclusions', /does not voluntarily run full browser\/e2e suites/i],
    ['documentation-only CodeQL exclusion', /CodeQL/i],
    ['required merge checks only', /wait only for the\s+required merge checks/i],
    ['minimal continuity updates', /Use minimal continuity updates/i],
    ['current-chain continuity trigger', /document is part of the current chain/i],
    ['active-governance continuity trigger', /active governance or the exact next action\s+changes/i],
    ['repository-record continuity trigger', /repository requires a specific record/i],
    ['one concise continuity entry', /Add one concise factual entry only when/i],
    ['bootstrap continuity exception', /For this bootstrap sync, do not add\s+continuity files/i],
    ['Quick Document Fix stop condition', /Stop Quick Document Fix Mode immediately/i],
    [
      'Quick Document Fix success stop',
      /requested document must be present, focused validation must pass, the\s+complete diff must be reviewed, and the required push\/merge must be complete\.\s+Then STOP\./i,
    ],
    ['specification gate', /accepted specification or amendment/i],
  ];
  const errors = required
    .filter(([, pattern]) => !(pattern instanceof RegExp ? pattern.test(text) : pattern(text)))
    .map(([name]) => name);
  const obsolete = [
    ['obsolete Codex-only writer language', /Codex is the only writer by default/i],
    ['obsolete two-read-only-subagent cap', /at most two concurrent read-only subagents/i],
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
    ['no agent spawning', /Do not[\s\S]{0,500}spawn agents/i.test(agent.developer_instructions || '')],
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
  if (agents.max_threads !== 32) {
    errors.push('max_threads must be 32');
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
