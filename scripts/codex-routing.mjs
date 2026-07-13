import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const INPUT_KINDS = ['rough_instruction', 'partial_task', 'complete_prompt', 'precise_command'];
export const VERIFIED_MODELS = ['gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.6-sol'];
export const REASONING_EFFORTS = ['minimal', 'low', 'medium', 'high', 'xhigh'];
export const AGENTS = ['worker', 'explorer', 'judgment-worker', 'reviewer'];
export const VERIFICATION_PROFILES = ['documentation', 'focused', 'full', 'release'];
export const CONFIDENCE_THRESHOLD = 0.85;

const REQUIRED_REFINEMENT_FIELDS = [
  'input_kind', 'original_input', 'interpreted_objective', 'refined_prompt',
  'authoritative_context_read', 'verified_facts', 'scope', 'non_goals',
  'requirements', 'constraints', 'acceptance_criteria', 'verification_profile_hint',
  'documentation_updates', 'assumptions', 'unresolved_material_questions',
  'material_scope_expansion', 'requires_user_approval', 'confidence', 'safe_to_route',
];

const REQUIRED_ROUTE_FIELDS = [
  'schema_version', 'route_id', 'route_class', 'safe_to_execute', 'model',
  'reasoning_effort', 'agent', 'sandbox', 'approval_policy', 'verification_profile',
  'use_subagents', 'use_worktrees', 'usage_justification', 'why_not_cheaper',
  'why_not_more_expensive', 'requires_user_approval', 'stop_reasons',
];

const BROAD_VERBS = /\b(?:fix|improve|finish|continue|check|make|implement|review|optimi[sz]e|overhaul)\b/i;
const PRECISE_VERBS = /^(?:correct|fix|change|rename|replace|remove|update|format|spell)\b/i;
const FILE_REFERENCE = /(?:^|[\\/\s])(?:[\w.-]+[\\/]?)+\.(?:md|mdx|js|mjs|cjs|ts|tsx|json|toml|py|ps1|html|css)$/i;
const APPROVAL_PATTERN = /\b(?:deploy|publish|merge|push|migrat(?:e|ion)|production|delete|drop|reset|clasp|spreadsheet write|drive upload)\b/i;
const JUDGMENT_PATTERN = /\b(?:architecture|schema|permission|authorization|security|ledger|inventory|data integrity|migration|audit)\b/i;
const EXPLORATION_PATTERN = /\b(?:locate|find|trace|why|root cause|unfamiliar|cross-file|debug)\b/i;
const DOCUMENTATION_PATTERN = /\b(?:readme|documentation|markdown|typo|wording|link|changelog)\b/i;

function asText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJsonOrPrint(value, outputPath) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  if (outputPath) {
    fs.writeFileSync(outputPath, text, 'utf8');
  } else {
    process.stdout.write(text);
  }
}

export function classifyInput(input) {
  const text = asText(input);
  if (!text) throw new Error('Input must contain a non-empty instruction or prompt.');
  const structuredSignals = [
    /(^|\n)\s*#{1,3}\s*(?:goal|objective)/i,
    /\b(?:scope|non-goal|non-goals|requirements?)\b/i,
    /\b(?:acceptance criteria|definition of done|done when)\b/i,
    /\b(?:verification|tests?|checks?)\b/i,
    /\b(?:constraints?|limitations?)\b/i,
    /\b(?:documentation|changelog|handoff)\b/i,
  ].filter((pattern) => pattern.test(text)).length;
  const hasNamedFile = FILE_REFERENCE.test(text);
  const hasVagueReference = /\b(?:this|that|it|everything|all of it)\b/i.test(text);
  const hasBroadVerb = BROAD_VERBS.test(text);

  if (PRECISE_VERBS.test(text) && hasNamedFile && text.length <= 220 && !hasVagueReference) {
    return 'precise_command';
  }
  if (structuredSignals >= 4 && text.length >= 220 && !hasVagueReference) {
    return 'complete_prompt';
  }
  if (hasBroadVerb && (hasVagueReference || !hasNamedFile || text.length < 180 || structuredSignals < 2)) {
    return 'rough_instruction';
  }
  return 'partial_task';
}

export function createDirectRefinement(input, inputKind = classifyInput(input)) {
  const original = asText(input);
  if (!INPUT_KINDS.includes(inputKind)) throw new Error(`Unsupported input kind: ${inputKind}`);
  const requiresApproval = APPROVAL_PATTERN.test(original);
  const profile = inputKind === 'precise_command' && DOCUMENTATION_PATTERN.test(original)
    ? 'documentation'
    : inputKind === 'precise_command' ? 'focused' : 'full';
  return {
    input_kind: inputKind,
    original_input: original,
    interpreted_objective: original,
    refined_prompt: original,
    authoritative_context_read: [],
    verified_facts: [],
    scope: [],
    non_goals: [],
    requirements: [original],
    constraints: ['Preserve project authority and existing safety rules.', 'Do not perform external writes or destructive actions without explicit approval.'],
    acceptance_criteria: ['The requested outcome is implemented or corrected.', 'The selected verification profile passes.'],
    verification_profile_hint: profile,
    documentation_updates: [],
    assumptions: [],
    unresolved_material_questions: [],
    material_scope_expansion: false,
    requires_user_approval: requiresApproval,
    confidence: inputKind === 'complete_prompt' || inputKind === 'precise_command' ? 0.98 : 0.9,
    safe_to_route: true,
  };
}

export function validateRefinement(value) {
  const errors = [];
  if (!isPlainObject(value)) return ['Refinement must be a JSON object.'];
  for (const field of REQUIRED_REFINEMENT_FIELDS) {
    if (!(field in value)) errors.push(`Missing refinement field: ${field}`);
  }
  if (!INPUT_KINDS.includes(value.input_kind)) errors.push('input_kind is invalid.');
  for (const field of ['original_input', 'interpreted_objective', 'refined_prompt', 'verification_profile_hint']) {
    if (!nonEmptyString(value[field])) errors.push(`${field} must be a non-empty string.`);
  }
  for (const field of ['authoritative_context_read', 'verified_facts', 'scope', 'non_goals', 'requirements', 'constraints', 'acceptance_criteria', 'documentation_updates', 'assumptions', 'unresolved_material_questions']) {
    if (!Array.isArray(value[field]) || value[field].some((item) => typeof item !== 'string')) {
      errors.push(`${field} must be an array of strings.`);
    }
  }
  for (const field of ['material_scope_expansion', 'requires_user_approval', 'safe_to_route']) {
    if (typeof value[field] !== 'boolean') errors.push(`${field} must be boolean.`);
  }
  if (!Number.isFinite(value.confidence) || value.confidence < 0 || value.confidence > 1) {
    errors.push('confidence must be a number from 0 to 1.');
  }
  if (Array.isArray(value.acceptance_criteria) && value.acceptance_criteria.length === 0) {
    errors.push('acceptance_criteria must not be empty.');
  }
  if (typeof value.refined_prompt === 'string' && value.refined_prompt.length > 20000) errors.push('refined_prompt is too large.');
  return errors;
}

function routeSignals(refinement) {
  const text = [
    refinement.original_input,
    refinement.interpreted_objective,
    ...(refinement.requirements || []),
    ...(refinement.scope || []),
    ...(refinement.verified_facts || []),
    ...(refinement.assumptions || []),
  ].join('\n');
  return {
    text,
    approval: APPROVAL_PATTERN.test(text) || refinement.requires_user_approval,
    judgment: JUDGMENT_PATTERN.test(text) && (!EXPLORATION_PATTERN.test(text) || /\b(?:architecture|schema|permission|authorization|security|migration|data integrity)\b/i.test(text)),
    exploration: EXPLORATION_PATTERN.test(text),
    documentation: DOCUMENTATION_PATTERN.test(text),
    broad: refinement.material_scope_expansion || (refinement.scope || []).length >= 6,
    readOnly: /\b(?:inspect|review|audit|assess|summarize|locate|find|trace)\b/i.test(text) && !/\b(?:implement|fix|change|add|update|remove)\b/i.test(text),
  };
}

export function routeRefinement(refinement, { approvalRecorded = false } = {}) {
  const errors = validateRefinement(refinement);
  if (errors.length) throw new Error(`Invalid refinement: ${errors.join(' ')}`);
  const signals = routeSignals(refinement);
  const stopReasons = [];
  if (refinement.confidence < CONFIDENCE_THRESHOLD) stopReasons.push(`Refinement confidence ${refinement.confidence} is below ${CONFIDENCE_THRESHOLD}.`);
  if (refinement.unresolved_material_questions.length) stopReasons.push('Material questions remain unresolved.');
  if (refinement.material_scope_expansion) stopReasons.push('Material scope expansion was introduced during refinement.');
  if (!refinement.safe_to_route) stopReasons.push('Refinement marked the task unsafe to route.');
  if (signals.approval && !approvalRecorded) stopReasons.push('Explicit approval is required before destructive or external-write work.');

  let routeClass = 'implementation';
  let model = 'gpt-5.6-luna';
  let reasoning = 'medium';
  let agent = 'worker';
  let sandbox = 'workspace-write';
  let verificationProfile = refinement.verification_profile_hint;
  if (!VERIFICATION_PROFILES.includes(verificationProfile)) verificationProfile = 'focused';

  if (signals.approval || (signals.judgment && signals.broad)) {
    routeClass = 'deep_review';
    model = 'gpt-5.6-sol';
    reasoning = 'xhigh';
    agent = 'reviewer';
    sandbox = 'read-only';
    verificationProfile = 'release';
  } else if (signals.judgment) {
    routeClass = 'judgment';
    model = 'gpt-5.6-sol';
    reasoning = 'high';
    agent = 'judgment-worker';
    verificationProfile = 'full';
  } else if (signals.exploration) {
    routeClass = 'exploration';
    model = 'gpt-5.6-terra';
    reasoning = 'medium';
    agent = signals.readOnly ? 'explorer' : 'worker';
    sandbox = signals.readOnly ? 'read-only' : 'workspace-write';
    verificationProfile = 'focused';
  } else if (signals.documentation || refinement.input_kind === 'precise_command') {
    routeClass = 'fast';
    model = 'gpt-5.6-terra';
    reasoning = 'low';
    verificationProfile = 'documentation';
  } else if ((refinement.scope || []).length >= 4 || refinement.acceptance_criteria.length >= 5) {
    routeClass = 'implementation';
    model = 'gpt-5.6-luna';
    reasoning = 'high';
    verificationProfile = 'full';
  }

  const safe = stopReasons.length === 0;
  const routeId = `hau-usc-${routeClass}-${model.replaceAll('.', '-')}-${reasoning}`;
  return {
    schema_version: 1,
    route_id: routeId,
    route_class: routeClass,
    safe_to_execute: safe,
    model,
    reasoning_effort: reasoning,
    agent,
    sandbox,
    approval_policy: 'on-request',
    verification_profile: verificationProfile,
    use_subagents: false,
    use_worktrees: false,
    usage_justification: signals.exploration
      ? 'Repository tracing is the main difficulty; one bounded worker is sufficient.'
      : signals.judgment
        ? 'The task requires judgment about established architecture or data-integrity boundaries.'
        : 'A single bounded worker preserves the usage reserve for deterministic verification and review.',
    why_not_cheaper: signals.judgment
      ? 'A lower tier would under-resource the architecture, security, or data-integrity judgment.'
      : signals.exploration
        ? 'Lower effort would under-resource cross-file exploration.'
        : 'The task spans enough behavior or verification to need the selected effort.',
    why_not_more_expensive: signals.approval || signals.judgment
      ? 'The selected verified high-judgment tier is sufficient; no broader fan-out is justified.'
      : 'The architecture and acceptance conditions are sufficiently bounded for one worker.',
    requires_user_approval: signals.approval,
    stop_reasons: stopReasons,
    ...(approvalRecorded ? { approval_recorded: true } : {}),
  };
}

export function validateRoute(value) {
  const errors = [];
  if (!isPlainObject(value)) return ['Route must be a JSON object.'];
  for (const field of REQUIRED_ROUTE_FIELDS) if (!(field in value)) errors.push(`Missing route field: ${field}`);
  if (value.schema_version !== 1) errors.push('schema_version must be 1.');
  if (!nonEmptyString(value.route_id)) errors.push('route_id must be a non-empty string.');
  if (!['fast', 'implementation', 'exploration', 'judgment', 'deep_review'].includes(value.route_class)) errors.push('route_class is invalid.');
  if (!VERIFIED_MODELS.includes(value.model)) errors.push(`Unsupported model: ${value.model}`);
  if (!REASONING_EFFORTS.includes(value.reasoning_effort)) errors.push(`Unsupported reasoning effort: ${value.reasoning_effort}`);
  if (!AGENTS.includes(value.agent)) errors.push(`Unsupported agent: ${value.agent}`);
  if (!['read-only', 'workspace-write'].includes(value.sandbox)) errors.push('sandbox is invalid.');
  if (!['on-request', 'never'].includes(value.approval_policy)) errors.push('approval_policy is invalid.');
  if (!VERIFICATION_PROFILES.includes(value.verification_profile)) errors.push('verification_profile is invalid.');
  for (const field of ['safe_to_execute', 'use_subagents', 'use_worktrees', 'requires_user_approval']) if (typeof value[field] !== 'boolean') errors.push(`${field} must be boolean.`);
  if (!Array.isArray(value.stop_reasons) || value.stop_reasons.some((item) => typeof item !== 'string')) errors.push('stop_reasons must be an array of strings.');
  for (const field of ['usage_justification', 'why_not_cheaper', 'why_not_more_expensive']) if (!nonEmptyString(value[field])) errors.push(`${field} must be a non-empty string.`);
  if (value.safe_to_execute && value.stop_reasons?.length) errors.push('Executable route cannot contain stop reasons.');
  if (value.safe_to_execute && value.requires_user_approval && value.approval_recorded !== true) errors.push('Approval must be recorded before an approval-requiring route executes.');
  return errors;
}

export function renderBrief(refinement) {
  const errors = validateRefinement(refinement);
  if (errors.length) throw new Error(`Invalid refinement: ${errors.join(' ')}`);
  const list = (items) => items.length ? items.map((item) => `- ${item}`).join('\n') : '- None recorded.';
  return [
    '# Refined Execution Brief',
    '',
    '## Original instruction', '', refinement.original_input, '',
    '## Interpreted objective', '', refinement.interpreted_objective, '',
    '## Authoritative context read', '', list(refinement.authoritative_context_read), '',
    '## Current verified state', '', list(refinement.verified_facts), '',
    '## Scope', '', list(refinement.scope), '',
    '## Non-goals', '', list(refinement.non_goals), '',
    '## Requirements', '', list(refinement.requirements), '',
    '## Constraints', '', list(refinement.constraints), '',
    '## Acceptance criteria', '', list(refinement.acceptance_criteria), '',
    '## Verification plan', '', `- Profile hint: ${refinement.verification_profile_hint}`, '',
    '## Documentation updates', '', list(refinement.documentation_updates), '',
    '## Assumptions', '', list(refinement.assumptions), '',
    '## Unresolved material questions', '', list(refinement.unresolved_material_questions), '',
    '## Execution safety', '', `- Safe to route: ${refinement.safe_to_route}`, `- Requires user approval: ${refinement.requires_user_approval}`, '',
    '## Refinement confidence', '', `${refinement.confidence}`, '',
  ].join('\n');
}

export function validatePolicyFiles(root) {
  const routingRoot = path.join(root, '.codex', 'routing');
  const requiredMarkdown = ['README.md', 'INSTRUCTION_REFINEMENT_POLICY.md', 'REFINED_EXECUTION_BRIEF_TEMPLATE.md', 'ROUTING_POLICY.md'];
  for (const file of requiredMarkdown) {
    const fullPath = path.join(routingRoot, file);
    if (!fs.existsSync(fullPath)) throw new Error(`Missing routing file: ${file}`);
  }
  const refinementSchema = readJson(path.join(routingRoot, 'task-refinement.schema.json'));
  const routeSchema = readJson(path.join(routingRoot, 'route.schema.json'));
  const profiles = readJson(path.join(routingRoot, 'verification-profiles.json'));
  const riskRules = readJson(path.join(routingRoot, 'task-risk-rules.json'));
  if (refinementSchema.type !== 'object' || routeSchema.type !== 'object') throw new Error('Routing schemas must be JSON objects.');
  if (!profiles.profiles || !riskRules.confidence_threshold) throw new Error('Routing policy files are incomplete.');
  for (const file of fs.readdirSync(path.join(routingRoot, 'examples'))) {
    if (!file.endsWith('.json')) continue;
    const errors = validateRoute(readJson(path.join(routingRoot, 'examples', file)));
    if (errors.length) throw new Error(`${file}: ${errors.join(' ')}`);
  }
  return { ok: true, models: VERIFIED_MODELS, profiles: Object.keys(profiles.profiles) };
}

function getFlag(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function inputFromArgs(args) {
  const inputFile = getFlag(args, '--input-file');
  if (inputFile) return fs.readFileSync(inputFile, 'utf8');
  return fs.readFileSync(0, 'utf8');
}

if (process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1])) {
  const [command, ...args] = process.argv.slice(2);
  try {
    if (command === 'classify') {
      process.stdout.write(`${classifyInput(inputFromArgs(args))}\n`);
    } else if (command === 'direct-refinement') {
      const input = inputFromArgs(args);
      writeJsonOrPrint(createDirectRefinement(input, getFlag(args, '--input-kind') || classifyInput(input)), getFlag(args, '--output'));
    } else if (command === 'validate-refinement') {
      const errors = validateRefinement(readJson(args[0]));
      if (errors.length) throw new Error(errors.join(' '));
      process.stdout.write('refinement: valid\n');
    } else if (command === 'render-brief') {
      const output = renderBrief(readJson(args[0]));
      const outputPath = getFlag(args, '--output');
      if (outputPath) fs.writeFileSync(outputPath, `${output}\n`, 'utf8'); else process.stdout.write(`${output}\n`);
    } else if (command === 'route') {
      writeJsonOrPrint(routeRefinement(readJson(args[0]), { approvalRecorded: args.includes('--approved') }), getFlag(args, '--output'));
    } else if (command === 'validate-route') {
      const errors = validateRoute(readJson(args[0]));
      if (errors.length) throw new Error(errors.join(' '));
      process.stdout.write('route: valid\n');
    } else if (command === 'docs') {
      const root = path.resolve(args[0] || process.cwd());
      process.stdout.write(`${JSON.stringify(validatePolicyFiles(root))}\n`);
    } else if (command === 'hash') {
      process.stdout.write(`${crypto.createHash('sha256').update(fs.readFileSync(args[0])).digest('hex')}\n`);
    } else {
      throw new Error('Usage: classify|direct-refinement|validate-refinement|render-brief|route|validate-route|docs|hash');
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
