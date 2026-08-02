import { describe, expect, it } from 'vitest';
import {
  isCountableUnit,
  isKnownQuantityUnit,
  isValidOperationalQuantity,
  quantityStep,
} from '../../src/domain/quantity-units.js';
import { positiveOperationalQuantity } from '../../src/domain/validators.js';
import {
  isInternalWorkspacePath,
  workspacePath,
  workspaceRouteFromPath,
} from '../../src/visual/workspace-routes.js';

describe('canonical workspace routes', () => {
  it('uses the accepted root-level routes and derives modules from canonical history state', () => {
    expect(workspacePath('administrator')).toBe('/admin');
    expect(workspacePath('inventory-pantry', 'release')).toBe('/inventory/release');
    expect(workspaceRouteFromPath('/materials/release')).toMatchObject({
      workspaceId: 'materials',
      module: 'release',
      canonicalPath: '/materials/release',
      legacy: false,
    });
    expect(isInternalWorkspacePath('/food')).toBe(true);
  });

  it('recognizes legacy app routes only so they can be canonicalized safely', () => {
    expect(workspaceRouteFromPath('/app/director/release')).toMatchObject({
      workspaceId: 'director',
      module: 'release',
      canonicalPath: '/director/release',
      legacy: true,
    });
  });
});

describe('countable operational quantities', () => {
  it('rejects fractional countable quantities and accepts whole numbers', () => {
    expect(isCountableUnit('piece')).toBe(true);
    expect(quantityStep('piece')).toBe('1');
    expect(isValidOperationalQuantity(1.5, { unit: 'piece' })).toBe(false);
    expect(isValidOperationalQuantity(2, { unit: 'piece' })).toBe(true);
    expect(() => positiveOperationalQuantity(1.5, 'piece')).toThrow(/whole-number quantity/u);
  });

  it('retains decimal support for measured units', () => {
    expect(isCountableUnit('liter')).toBe(false);
    expect(quantityStep('liter')).toBe('0.01');
    expect(isValidOperationalQuantity(1.5, { unit: 'liter' })).toBe(true);
    expect(positiveOperationalQuantity(1.5, 'liter')).toBe(1.5);
    expect(isValidOperationalQuantity(Number.NaN, { unit: 'liter' })).toBe(false);
    expect(isValidOperationalQuantity(-1, { unit: 'liter' })).toBe(false);
  });

  it('treats governed request-center and kit units as countable', () => {
    for (const unit of [
      'set',
      'unit',
      'chair',
      'table',
      'facility',
      'day',
      'kit',
      'can',
      'pair',
      'pallet',
      'tray',
    ]) {
      expect(isCountableUnit(unit)).toBe(true);
      expect(isValidOperationalQuantity(0.5, { unit })).toBe(false);
    }
  });

  it('fails closed for unknown quantity units', () => {
    expect(isKnownQuantityUnit('unsupported-fixture-unit')).toBe(false);
    expect(quantityStep('unsupported-fixture-unit')).toBe('1');
    expect(isValidOperationalQuantity(1, { unit: 'unsupported-fixture-unit' })).toBe(false);
    expect(() => positiveOperationalQuantity(1, 'unsupported-fixture-unit')).toThrow(/supported unit/u);
  });
});
