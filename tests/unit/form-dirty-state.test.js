import { describe, expect, it } from 'vitest';
import { createFormDirtyTracker, normalizedFormSnapshot } from '../../src/visual/form-dirty-state.js';

function form(fields) {
  return { elements: fields, isConnected: true };
}

describe('normalized form dirty state', () => {
  it('returns to clean when values return to the loaded snapshot', () => {
    const name = { name: 'name', type: 'text', value: 'Initial', disabled: false };
    const target = form([name]);
    const tracker = createFormDirtyTracker();
    tracker.register(target);
    name.value = 'Changed';
    expect(tracker.update(target)).toBe(true);
    name.value = 'Initial';
    expect(tracker.update(target)).toBe(false);
  });

  it('includes unchecked state and normalizes line endings', () => {
    const first = normalizedFormSnapshot(
      form([
        { name: 'confirmed', type: 'checkbox', value: 'yes', checked: false },
        { name: 'notes', type: 'textarea', value: 'a\r\nb' },
      ]),
    );
    const second = normalizedFormSnapshot(
      form([
        { name: 'confirmed', type: 'checkbox', value: 'yes', checked: false },
        { name: 'notes', type: 'textarea', value: 'a\nb' },
      ]),
    );
    expect(first).toBe(second);
  });

  it('successful save establishes the new baseline', () => {
    const field = { name: 'quantity', type: 'number', value: '1' };
    const target = form([field]);
    const tracker = createFormDirtyTracker();
    tracker.register(target);
    field.value = '2';
    tracker.update(target);
    tracker.markClean(target);
    expect(tracker.isDirty()).toBe(false);
    field.value = '1';
    expect(tracker.update(target)).toBe(true);
  });
});
