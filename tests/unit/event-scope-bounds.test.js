import { describe, expect, it } from 'vitest';
import { isOutsideEventBounds } from '../../src/server/d1/operational-service.js';

// RV-01.3: "unrelated committee/event/location -> No" on the command path.
//
// This pins the two properties that regressed in review: the bounds are
// CONJUNCTIVE (each satisfied independently, matching the read path in
// resolveOperationalContext) and they FAIL CLOSED (a bounded actor must
// positively match; missing context is a refusal).
const outside = (bounds) => isOutsideEventBounds(bounds);

describe('event and series scope bounds', () => {
  it('admits everything when the actor carries no bound', () => {
    expect(outside({ boundedEventIds: [], boundedSeriesIds: [], eventId: 'EVT-B' })).toBe(false);
    expect(outside({})).toBe(false);
    expect(outside({ boundedEventIds: [], boundedSeriesIds: [], eventSeriesId: 'SER-9' })).toBe(false);
  });

  it('enforces an event bound on its own', () => {
    const bounds = { boundedEventIds: ['EVT-A'], boundedSeriesIds: [] };
    expect(outside({ ...bounds, eventId: 'EVT-A' })).toBe(false);
    expect(outside({ ...bounds, eventId: 'EVT-B' })).toBe(true);
  });

  it('enforces a series bound on its own', () => {
    const bounds = { boundedEventIds: [], boundedSeriesIds: ['SER-1'] };
    expect(outside({ ...bounds, eventSeriesId: 'SER-1' })).toBe(false);
    expect(outside({ ...bounds, eventSeriesId: 'SER-2' })).toBe(true);
  });

  // The regression: with both bounds set, an OR admits any event in the bounded
  // series, including events the actor is explicitly NOT bound to.
  it('requires BOTH bounds when the actor carries both', () => {
    const bounds = { boundedEventIds: ['EVT-A'], boundedSeriesIds: ['SER-1'] };

    // EVT-A lives in SER-1: both bounds satisfied.
    expect(outside({ ...bounds, eventId: 'EVT-A', eventSeriesId: 'SER-1' })).toBe(false);

    // EVT-B also lives in SER-1, but the actor is bound to EVT-A only. The
    // series match must not rescue it.
    expect(outside({ ...bounds, eventId: 'EVT-B', eventSeriesId: 'SER-1' })).toBe(true);

    // The mirror case: right event, wrong series.
    expect(outside({ ...bounds, eventId: 'EVT-A', eventSeriesId: 'SER-2' })).toBe(true);

    // Neither matches.
    expect(outside({ ...bounds, eventId: 'EVT-B', eventSeriesId: 'SER-2' })).toBe(true);
  });

  it('fails closed when a bounded actor supplies no context', () => {
    expect(outside({ boundedEventIds: ['EVT-A'], boundedSeriesIds: [] })).toBe(true);
    expect(outside({ boundedEventIds: [], boundedSeriesIds: ['SER-1'] })).toBe(true);
    expect(outside({ boundedEventIds: ['EVT-A'], boundedSeriesIds: ['SER-1'] })).toBe(true);

    // A record carrying only one of the two identifiers still fails the other
    // bound, so an omitted column cannot exempt a call site.
    expect(
      outside({ boundedEventIds: ['EVT-A'], boundedSeriesIds: ['SER-1'], eventId: 'EVT-A' }),
    ).toBe(true);
    expect(
      outside({ boundedEventIds: ['EVT-A'], boundedSeriesIds: ['SER-1'], eventSeriesId: 'SER-1' }),
    ).toBe(true);
  });

  it('treats an empty-string identifier as absent rather than as a match', () => {
    expect(outside({ boundedEventIds: [''], boundedSeriesIds: [], eventId: '' })).toBe(true);
  });

  it('accepts either a Set or an array of bounds', () => {
    expect(
      outside({
        boundedEventIds: new Set(['EVT-A']),
        boundedSeriesIds: new Set(['SER-1']),
        eventId: 'EVT-B',
        eventSeriesId: 'SER-1',
      }),
    ).toBe(true);
  });
});
