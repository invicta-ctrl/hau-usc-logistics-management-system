import { describe, expect, it } from 'vitest';
import { lendingCatalogDto, safeLendingAvailability } from '../../src/server/lending-catalog-service.js';

const row = (overrides = {}) => ({
  id: 'ITM-SYNTHETIC',
  name: 'Synthetic Projector',
  category: 'Equipment',
  unit: 'piece',
  lending_unit: 'unit',
  lending_kind: 'REUSABLE',
  lending_status: 'ACTIVE',
  lendable_available: 4,
  maximum_loan_quantity: 2,
  default_loan_days: 7,
  due_date_required: 1,
  acknowledgment_required: 1,
  eligibility_rule: '',
  lending_handling_notes: 'Keep dry.',
  borrower_safe_description: 'Portable presentation equipment.',
  borrower_safe_restrictions: 'Return after use.',
  image_asset_key: 'projector.webp',
  condition_tracking: 1,
  on_hand: 5,
  reserved: 1,
  available_to_promise: 4,
  ready_to_claim: 1,
  on_loan: 2,
  overdue: 1,
  damaged_assets: 0,
  maintenance_assets: 0,
  traceable_assets: 5,
  available_assets: 4,
  expected_return_at: '2026-08-10T00:00:00.000Z',
  ...overrides,
});

describe('authoritative lending catalog availability', () => {
  it('classifies maintenance, unavailable, eligibility, limited, and available states', () => {
    expect(safeLendingAvailability(row({ lending_status: 'MAINTENANCE' }))).toBe('MAINTENANCE');
    expect(safeLendingAvailability(row({ lendable_available: 0 }))).toBe('CURRENTLY_UNAVAILABLE');
    expect(safeLendingAvailability(row({ eligibility_rule: 'Authorized borrowers only' }))).toBe(
      'ELIGIBILITY_REQUIRED',
    );
    expect(safeLendingAvailability(row({ lendable_available: 2 }))).toBe('LIMITED');
    expect(safeLendingAvailability(row({ lendable_available: 4 }))).toBe('AVAILABLE');
  });

  it('keeps borrower output safe and adds operational balances only for staff', () => {
    const borrower = lendingCatalogDto(row());
    expect(borrower).toMatchObject({
      productId: 'ITM-SYNTHETIC',
      type: 'REUSABLE',
      unit: 'unit',
      description: 'Portable presentation equipment.',
      imageUrl: '/brand/catalog/projector.webp',
      conditionTracked: true,
    });
    expect(borrower).not.toHaveProperty('onHand');
    expect(borrower).not.toHaveProperty('reserved');

    const staff = lendingCatalogDto(row(), { staff: true });
    expect(staff).toMatchObject({
      onHand: 5,
      reserved: 1,
      availableToPromise: 4,
      readyToClaim: 1,
      onLoan: 2,
      overdue: 1,
      expectedReturnAt: '2026-08-10T00:00:00.000Z',
    });
  });
});
