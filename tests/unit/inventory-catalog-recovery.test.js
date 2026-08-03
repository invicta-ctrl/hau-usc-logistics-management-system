import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateCatalogDraft, validateCatalogQuantities } from '../../src/domain/catalog-management.js';
import {
  applyMockInventoryClassification,
  bindUnitBoundInputs,
  toFailClosedInventoryClassification,
  withExpectedUpdatedAt,
} from '../../src/visual/runtime-extensions.js';

const root = resolve(import.meta.dirname, '../..');

function catalogDraft(overrides = {}) {
  return {
    itemName: 'Synthetic catalog item',
    category: 'Office Supplies',
    catalogType: 'OFFICE_INVENTORY',
    stockArea: 'Inventory',
    storageLocation: 'Synthetic shelf',
    handling: 'CONSUMABLE',
    unit: 'piece',
    reorderThreshold: '2',
    lendingAudience: 'NOT_AVAILABLE_FOR_LENDING',
    ...overrides,
  };
}

describe('Slice 6 catalog quantity validation', () => {
  it('fails closed for an unknown unit before a catalog command can be submitted', () => {
    expect(validateCatalogDraft(catalogDraft({ unit: 'unsupported-fixture-unit' }))).toMatchObject({
      valid: false,
      field: 'unit',
    });
  });

  it('rejects fractional countable thresholds and lending quantities', () => {
    expect(validateCatalogQuantities(catalogDraft({ reorderThreshold: '1.5' }))).toMatchObject({
      valid: false,
      field: 'reorderThreshold',
    });
    expect(validateCatalogQuantities(catalogDraft({ maximumLoanQuantity: '2.5' }))).toMatchObject({
      valid: false,
      field: 'maximumLoanQuantity',
    });
  });

  it('requires whole operational quantities for measured units and permits zero opening/reorder values', () => {
    expect(
      validateCatalogQuantities(
        catalogDraft({
          unit: 'liter',
          reorderThreshold: '0',
          maximumLoanQuantity: '1.5',
          initialQuantity: '0.25',
        }),
      ),
    ).toMatchObject({ valid: false, field: 'maximumLoanQuantity' });
    expect(
      validateCatalogQuantities(
        catalogDraft({
          unit: 'liter',
          reorderThreshold: '0',
          maximumLoanQuantity: '2',
          initialQuantity: '0',
        }),
      ),
    ).toEqual({ valid: true });
  });

  it('requires an explicit whole-number threshold when low-stock alerts are enabled', () => {
    expect(
      validateCatalogQuantities(catalogDraft({ lowStockAlertEnabled: 'true', lowStockThreshold: '' })),
    ).toMatchObject({ valid: false, field: 'lowStockThreshold' });
    expect(
      validateCatalogQuantities(catalogDraft({ lowStockAlertEnabled: 'true', lowStockThreshold: '2' })),
    ).toEqual({ valid: true });
  });
});

describe('Slice 6 extension-owned quantity and classification behavior', () => {
  it('attaches the current optimistic-concurrency token to every existing-item command', () => {
    const payload = withExpectedUpdatedAt(
      { itemId: 'SYNTHETIC-ITEM', stockArea: 'Inventory' },
      { id: 'SYNTHETIC-ITEM', updatedAt: '2026-08-03T10:00:00.000Z' },
    );
    expect(payload).toEqual({
      itemId: 'SYNTHETIC-ITEM',
      stockArea: 'Inventory',
      expectedUpdatedAt: '2026-08-03T10:00:00.000Z',
    });
  });

  it('resynchronizes number bounds immediately when the catalog unit changes', () => {
    const listeners = new Map();
    const unit = {
      value: 'piece',
      addEventListener(type, listener) {
        listeners.set(type, listener);
      },
    };
    const reorderThreshold = { dataset: {} };
    const maximumLoanQuantity = { dataset: {} };
    const form = { elements: { unit, reorderThreshold, maximumLoanQuantity } };

    bindUnitBoundInputs(form, [
      { name: 'reorderThreshold', allowZero: true },
      { name: 'maximumLoanQuantity' },
    ]);
    expect(reorderThreshold).toMatchObject({ min: '0', step: '1', dataset: { quantityUnit: 'piece' } });
    expect(maximumLoanQuantity).toMatchObject({ min: '1', step: '1' });

    unit.value = 'liter';
    listeners.get('change')();
    expect(reorderThreshold).toMatchObject({ min: '0', step: '1', dataset: { quantityUnit: 'liter' } });
    expect(maximumLoanQuantity).toMatchObject({ min: '1', step: '1' });
  });

  it('keeps pending reusable mock classification fail-closed with unknown assessments and records complete history', () => {
    const pending = toFailClosedInventoryClassification({
      id: 'SYNTHETIC-UNVERIFIED',
      handling: 'Loanable',
      isLendable: true,
      lendingAudience: 'STUDENTS_AND_STAFF',
    });
    expect(pending).toMatchObject({
      classificationStatus: 'NEEDS_CLASSIFICATION',
      inventoryKind: 'UNVERIFIED',
      isLendable: false,
      lendingAudience: 'NOT_AVAILABLE_FOR_LENDING',
    });

    applyMockInventoryClassification(
      pending,
      {
        classificationStatus: 'NEEDS_CLASSIFICATION',
        inventoryKind: 'REUSABLE',
        isLendable: true,
        enableLendingConfirmed: true,
        lendingAudience: 'STUDENTS_AND_STAFF',
        stockArea: 'Inventory',
        storageLocation: 'Synthetic shelf',
        unit: 'piece',
        reorderThreshold: '2',
        conditionReviewState: 'NOT_ASSESSED',
        maintenanceReviewState: 'NOT_ASSESSED',
        assetInstanceCountIfReusable: '2',
      },
      { now: '2026-08-03T00:00:00.000Z' },
    );

    expect(pending).toMatchObject({
      classificationStatus: 'NEEDS_CLASSIFICATION',
      inventoryKind: 'REUSABLE',
      conditionReviewState: 'NOT_ASSESSED',
      maintenanceReviewState: 'NOT_ASSESSED',
      isLendable: false,
      lendingAudience: 'NOT_AVAILABLE_FOR_LENDING',
    });
    expect(pending.classificationHistory[0]).toMatchObject({
      before: expect.objectContaining({ classificationStatus: 'NEEDS_CLASSIFICATION' }),
      after: expect.objectContaining({
        stockArea: 'Inventory',
        storageLocation: 'Synthetic shelf',
        unit: 'piece',
        reorderThreshold: 2,
        isLendable: false,
      }),
    });
  });
});

describe('Slice 6 inventory extension contract', () => {
  it('retains extension-owned controls, fail-closed mock classification, and complete history fields', async () => {
    const source = await readFile(resolve(root, 'src/visual/runtime-extensions.js'), 'utf8');
    for (const marker of [
      'function syncUnitBoundInputs',
      'input.dataset.quantityUnit = unit',
      'const ensureInventoryControls',
      'data-inventory-advanced-filter="classification"',
      'data-inventory-advanced-filter="sort"',
      'const localClassificationDirectory',
      "classificationStatus === 'CLASSIFIED' && item.isLendable === true",
      'const classificationHistoryChangeMarkup',
      "['Stock area', 'stockArea'",
      "'Lending audience'",
      'const mockClassifyInventoryItem',
      'payload.enableLendingConfirmed === true',
      'withExpectedUpdatedAt(payload, currentItem)',
      "expectedUpdatedAt: String(item?.updatedAt ?? '')",
      'Provenance / Movement',
      'data-inventory-action="restore"',
      'before,',
      'after,',
    ]) {
      expect(source).toContain(marker);
    }
  });
});
