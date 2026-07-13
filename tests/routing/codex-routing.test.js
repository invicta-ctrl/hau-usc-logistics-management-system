import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  classifyInput,
  createDirectRefinement,
  routeRefinement,
  validatePolicyFiles,
  validateRefinement,
  validateRoute,
} from '../../scripts/codex-routing.mjs';

const root = path.resolve(process.cwd());

describe('Codex input classification', () => {
  it('classifies rough instructions before implementation', () => {
    expect(classifyInput('Fix the inventory search.')).toBe('rough_instruction');
  });

  it('classifies an understandable but incomplete task as partial', () => {
    expect(classifyInput('The request form should submit with Ctrl+Enter. Existing styling and error behavior must remain.')).toBe('partial_task');
  });

  it('does not expand a complete prompt', () => {
    const prompt = [
      '# Goal',
      'Correct the request-only navigation behavior.',
      '## Scope',
      'Update the existing request-only adapter and its focused browser test.',
      '## Constraints',
      'Do not change the approved visual baseline or make live writes.',
      '## Acceptance criteria',
      'Request-only mode hides internal navigation and the focused test passes.',
      '## Verification',
      'Run the focused test and the repository check.',
      '## Documentation',
      'Update the continuation record with verified results.',
    ].join('\n');
    expect(classifyInput(prompt)).toBe('complete_prompt');
    const refinement = createDirectRefinement(prompt, 'complete_prompt');
    expect(refinement.refined_prompt).toBe(prompt);
  });

  it('recognizes a precise named-file command', () => {
    expect(classifyInput('Correct the typo in README.md')).toBe('precise_command');
  });
});

describe('refinement validation and proportionality', () => {
  it('preserves the original instruction and validates the direct brief', () => {
    const original = 'Correct the typo in README.md';
    const refinement = createDirectRefinement(original, 'precise_command');
    expect(refinement.original_input).toBe(original);
    expect(validateRefinement(refinement)).toEqual([]);
    expect(refinement.refined_prompt).toBe(original);
  });

  it('rejects missing refinement fields', () => {
    expect(validateRefinement({})).toContain('Missing refinement field: original_input');
  });
});

describe('deterministic route policy', () => {
  it('uses the fast route for a documentation command', () => {
    const route = routeRefinement(createDirectRefinement('Correct the typo in README.md', 'precise_command'));
    expect(route.route_class).toBe('fast');
    expect(route.model).toBe('gpt-5.6-terra');
    expect(route.reasoning_effort).toBe('low');
    expect(route.safe_to_execute).toBe(true);
    expect(route.use_subagents).toBe(false);
  });

  it('uses exploration for bounded cross-file tracing', () => {
    const refinement = createDirectRefinement('Locate why predictive inventory search misses an existing item.', 'partial_task');
    refinement.safe_to_route = true;
    const route = routeRefinement(refinement);
    expect(route.route_class).toBe('exploration');
    expect(route.model).toBe('gpt-5.6-terra');
    expect(route.reasoning_effort).toBe('medium');
  });

  it('safe-stops an approval-requiring task', () => {
    const refinement = createDirectRefinement('Deploy the migration to production.', 'partial_task');
    const route = routeRefinement(refinement);
    expect(route.route_class).toBe('deep_review');
    expect(route.model).toBe('gpt-5.6-sol');
    expect(route.reasoning_effort).toBe('xhigh');
    expect(route.safe_to_execute).toBe(false);
    expect(route.stop_reasons.join(' ')).toMatch(/approval/i);
    const approved = routeRefinement(refinement, { approvalRecorded: true });
    expect(approved.safe_to_execute).toBe(true);
    expect(approved.approval_recorded).toBe(true);
  });

  it('safe-stops unresolved material ambiguity', () => {
    const refinement = createDirectRefinement('Implement the new workflow.', 'partial_task');
    refinement.safe_to_route = false;
    refinement.unresolved_material_questions = ['Which workflow is authoritative?'];
    const route = routeRefinement(refinement);
    expect(route.safe_to_execute).toBe(false);
    expect(route.stop_reasons.join(' ')).toMatch(/unsafe|ambiguity/i);
  });

  it('rejects an unsupported model route', () => {
    const example = JSON.parse(fs.readFileSync(path.join(root, '.codex/routing/examples/luna-medium.json'), 'utf8'));
    example.model = 'gpt-5.6-unknown';
    expect(validateRoute(example).join(' ')).toMatch(/Unsupported model/);
  });

  it('validates policy files and route fixtures', () => {
    const result = validatePolicyFiles(root);
    expect(result.ok).toBe(true);
    expect(result.profiles).toEqual(['documentation', 'focused', 'full', 'release']);
  });

  it('keeps runtime prompt and route artifacts ignored', () => {
    const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
    expect(gitignore).toContain('.codex/runtime/*');
    expect(gitignore).toContain('!.codex/runtime/.gitkeep');
  });
});
