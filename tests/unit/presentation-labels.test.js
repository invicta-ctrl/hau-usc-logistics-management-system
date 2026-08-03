import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  inventoryLabel,
  presentationLabel,
  presentationLabelMaps,
  presentationNumber,
  statusLabel,
  sumPresentationNumbers,
} from '../../src/domain/presentation-labels.js';

const root = resolve(import.meta.dirname, '../..');
const read = (path) => readFile(resolve(root, path), 'utf8');

describe('v0.7.1 presentation labels', () => {
  it('maps operational enums without changing their tokens', () => {
    expect(statusLabel('FOR_REVIEW')).toBe('For Review');
    expect(statusLabel('NEEDS_CLASSIFICATION', { context: 'classificationStatus' })).toBe(
      'Needs Classification',
    );
    expect(inventoryLabel('MAINTENANCE_REQUIRED', 'maintenance')).toBe('Maintenance Required');
    expect(presentationLabel('COM_MATERIALS', { context: 'committee' })).toBe('Materials Committee');
    expect(presentationLabel('INVENTORY_REQUIREMENT', { context: 'eventLink' })).toBe(
      'Inventory Requirement',
    );
    expect(presentationLabelMaps.role.ADMINISTRATOR).toBe('Administrator');
  });

  it('uses truthful missing values and readable unknown fallbacks', () => {
    expect(presentationLabel('')).toBe('Not recorded');
    expect(presentationLabel(null, { missing: 'Not reported' })).toBe('Not reported');
    expect(presentationLabel('UNEXPECTED_REVIEW_STATE')).toBe('Unexpected Review State');
    expect(presentationLabel('NOT_AVAILABLE_FOR_LENDING', { context: 'lendingAudience' })).toBe(
      'Not available for lending',
    );
  });

  it('preserves numeric zero and fails closed when metrics are absent or invalid', () => {
    expect(presentationNumber({ count: 0 }, 'count')).toBe(0);
    expect(presentationNumber({ count: '0' }, 'count')).toBe(0);
    expect(presentationNumber({}, 'count')).toBe('Not reported');
    expect(presentationNumber({ count: 'not-a-number' }, 'count')).toBe('Not reported');
    expect(sumPresentationNumbers([0, 2])).toBe(2);
    expect(sumPresentationNumbers([0, 'Not reported'])).toBe('Not reported');
  });

  it('keeps runtime-extension copy free of common mojibake and protects bounded Slice 7 surfaces', async () => {
    const [runtime, inventoryView, styles] = await Promise.all([
      read('src/visual/runtime-extensions.js'),
      read('src/features/inventory/view.js'),
      read('src/styles/visual/runtime-extensions.css'),
    ]);
    expect(runtime).not.toMatch(/[ÂâÃï¿½]/u);
    expect(runtime).toContain("button.textContent = 'Approving…';");
    expect(runtime).toContain("button.textContent = 'Recording…';");
    expect(runtime).toContain('const numberMetric = presentationNumber;');
    expect(runtime).toContain("const evidenceFailures = sumMetricValues([failed, restoreRequired]);");
    expect(runtime).toContain('<label class="classification-select"');
    expect(runtime).toContain('<span class="sr-only">Select ');
    expect(runtime).not.toContain('<label class="request-line classification-row">');
    expect(runtime).toContain('classification-actions');
    expect(inventoryView).toContain('Item label unavailable');
    expect(inventoryView).toContain('No QR or barcode has been created.');
    expect(styles).toContain('min-block-size: 44px;');
    expect(styles).toContain('@media (max-width: 414px)');
  });
});
