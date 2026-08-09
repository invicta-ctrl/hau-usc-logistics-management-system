import { describe, expect, it } from 'vitest';
import {
  PERMANENT_BRANCHES,
  recoveryPointerRotation,
  validateBranchTopology,
} from '../../scripts/playground/branch-governance.mjs';

const id = (character) => character.repeat(40);

describe('permanent branch topology and recovery rotation', () => {
  it('allows exactly five permanent pointers plus one active temporary branch', () => {
    const branches = [
      ...PERMANENT_BRANCHES.map((name) => ({ name })),
      { name: 'release/v0.8.1-playground' },
      { name: 'release/v0.8.0-inventory-truth-ledger-lock', mergedOrClosed: true },
      { name: 'feature/v0.7.3-frontend-design-integration', dispositionedLegacy: true },
    ];
    expect(validateBranchTopology(branches)).toEqual({
      valid: true,
      issues: [],
      activeTemporaryBranches: ['release/v0.8.1-playground'],
    });
  });

  it('rejects permanent environment branches and more than one active writer', () => {
    const result = validateBranchTopology([
      ...PERMANENT_BRANCHES.map((name) => ({ name })),
      { name: 'staging' },
      { name: 'release/v0.8.1-one' },
      { name: 'fix/v0.8.1-two' },
    ]);
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        'More than one production-bound temporary branch is active',
        'A forbidden permanent environment/development branch exists',
      ]),
    );
  });

  it('refuses early rotation and maps all pointers only after production acceptance', () => {
    const current = {
      main: id('1'),
      'backup/last-known-good': id('2'),
      'regression/r1': id('3'),
      'regression/r2': id('4'),
      'regression/r3': id('5'),
    };
    expect(() =>
      recoveryPointerRotation(current, { newAcceptedMain: id('6'), productionAccepted: false }),
    ).toThrow(/forbidden before production smoke/iu);
    expect(
      recoveryPointerRotation(current, { newAcceptedMain: id('6'), productionAccepted: true }),
    ).toEqual({
      main: id('6'),
      'backup/last-known-good': id('1'),
      'regression/r1': id('2'),
      'regression/r2': id('3'),
      'regression/r3': id('4'),
    });
  });
});
