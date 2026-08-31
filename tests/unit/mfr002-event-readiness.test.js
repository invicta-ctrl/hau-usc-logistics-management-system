import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readableEventValue } from '../../src/frontend/app/events/EventReadinessRoute';

const root = resolve(import.meta.dirname, '../..');
const readSource = (relativePath) => readFileSync(resolve(root, relativePath), 'utf8');

describe('MFR-002 U08 event logistics readiness', () => {
  it('keeps blank and exact event values truthful instead of deriving readiness', () => {
    expect(readableEventValue('ON_TIME')).toBe('On Time');
    expect(readableEventValue('')).toBe('Not reported');
    expect(readableEventValue('PARTIALLY_READY')).toBe('Partially Ready');
  });

  it('leads with activities and keeps series/day context secondary and independently empty', () => {
    const source = readSource('src/frontend/app/events/EventReadinessRoute.tsx');

    expect(source.indexOf('<ActivityReports')).toBeLessThan(source.indexOf('<ScheduleContext'));
    expect(source).toContain('Activity logistics readiness');
    expect(source).toContain('Series and day context');
    expect(source).toContain('No activity logistics reports are loaded in this bounded view.');
    expect(source).toContain('No event series are loaded in this bounded view.');
    expect(source).toContain('No event days are loaded in this bounded view.');
    expect(source).toContain('Nothing was inferred from another event collection.');
  });

  it('uses one semantic record representation and exposes no event write affordance', () => {
    const source = readSource('src/frontend/app/events/EventReadinessRoute.tsx');

    expect(source).toContain('data-event-readiness-activities');
    expect(source).not.toContain('<table');
    expect(source).not.toContain('event-cards');
    expect(source).not.toContain('New event');
    expect(source).not.toContain('<form');
    expect(source).not.toContain('role="dialog"');
    expect(source).toContain('no event, request, inventory, supplier, or readiness score is created here');
  });

  it('preserves the protected route gate, abort, denial, retry, and inspection no-fetch branch', () => {
    const source = readSource('src/frontend/app/events/EventReadinessRoute.tsx');

    expect(source.indexOf('if (inspection)')).toBeLessThan(source.indexOf('.eventManagement('));
    expect(source).toContain('if (!eventAllowed)');
    expect(source).toContain('const abort = new AbortController()');
    expect(source).toContain('abort.signal.aborted');
    expect(source).toContain("? 'denied'");
    expect(source).toContain('setReloadKey((value) => value + 1)');
  });
});
