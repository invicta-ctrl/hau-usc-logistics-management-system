import { describe, expect, it } from 'vitest';
import {
  PERMANENT_BRANCHES,
  temporaryBranchTarget,
  validateBranchTopology,
  validateLegacyBranchRetirement,
} from '../../scripts/playground/branch-governance.mjs';

const id = (character) => character.repeat(40);

describe('permanent branch topology and preservation-gated retirement', () => {
  it('keeps exactly main and Playground as permanent functional branches', () => {
    expect(PERMANENT_BRANCHES).toEqual(['main', 'Playground']);
    expect(temporaryBranchTarget('reconcile/playground-master')).toBe('Playground');
    expect(temporaryBranchTarget('hotfix/main-session-guard')).toBe('main');
  });

  it('allows isolated or explicitly sequenced temporary branches with exact targets', () => {
    const branches = [
      ...PERMANENT_BRANCHES.map((name) => ({ name })),
      {
        name: 'reconcile/playground-master',
        targetBranch: 'Playground',
        isolatedOrSequenced: true,
      },
      {
        name: 'fix/main-session-guard',
        targetBranch: 'main',
        isolatedOrSequenced: true,
      },
      {
        name: 'release/v0.8.3-fi12-playground',
        dispositionedLegacy: true,
      },
    ];
    expect(validateBranchTopology(branches)).toEqual({
      valid: true,
      issues: [],
      activeTemporaryBranches: ['reconcile/playground-master', 'fix/main-session-guard'],
    });
  });

  it('rejects lowercase playground, target mismatch, and unisolated concurrency', () => {
    const result = validateBranchTopology([
      ...PERMANENT_BRANCHES.map((name) => ({ name })),
      { name: 'playground' },
      { name: 'work/playground-ui', targetBranch: 'main' },
      { name: 'fix/main-auth', targetBranch: 'main' },
    ]);
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        'Temporary branch work/playground-ui must target exactly Playground',
        'Concurrent temporary branches require proven isolation or explicit sequencing',
        'A forbidden permanent environment/development branch exists',
      ]),
    );
  });

  it('requires complete preservation proof before a legacy branch can be retired', () => {
    const candidate = {
      name: 'regression/r1',
      head: id('1'),
      tree: id('2'),
      uniqueHistoryPreserved: true,
      liveDependenciesCleared: true,
      recoveryEvidenceVerified: false,
    };
    expect(() => validateLegacyBranchRetirement(candidate)).toThrow(/Recovery evidence is not verified/iu);
    expect(validateLegacyBranchRetirement({ ...candidate, recoveryEvidenceVerified: true })).toEqual({
      name: 'regression/r1',
      head: id('1'),
      tree: id('2'),
      retirementEligible: true,
    });
  });
});
