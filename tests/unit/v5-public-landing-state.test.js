import { describe, expect, it } from 'vitest';
import { projectPublicAdvertisementState, resolveV5RouteState } from '../../src/v5/integration/runtime.js';
import { SURFACES } from '../../src/v5/src/registry.js';
import { landing } from '../../src/v5/src/surfaces/public.js';

describe('V5 public landing advertisement state projection', () => {
  it('registers every truthful state without changing the route classification', () => {
    const surface = SURFACES.find(({ id }) => id === 'public.landing');

    expect(surface?.states).toEqual(['populated', 'loading', 'empty', 'error', 'media-failure']);
    for (const state of surface.states) {
      expect(resolveV5RouteState('public.landing', state)).toBe(state);
    }
  });

  it('derives the presentation state only from the existing public collection and media outcome', () => {
    expect(projectPublicAdvertisementState([])).toBe('empty');
    expect(projectPublicAdvertisementState(null)).toBe('empty');
    expect(projectPublicAdvertisementState([{ title: 'Published item' }])).toBe('populated');
    expect(projectPublicAdvertisementState([{ title: 'Published item' }], 'FAIL')).toBe('media-failure');
  });

  it.each([
    ['loading', 'Loading official updates', 'aria-busy="true"'],
    [
      'populated',
      'Authorized announcements appear here only after the official service publishes them.',
      'aria-busy="false"',
    ],
    ['empty', 'No published updates are currently available.', 'aria-busy="false"'],
    ['error', 'Updates are temporarily unavailable', 'aria-busy="false"'],
    ['media-failure', 'The published media could not be loaded.', 'aria-busy="false"'],
  ])('renders the %s state without a fabricated advertisement', (state, message, busy) => {
    const markup = landing({ state });

    expect(markup).toContain(`data-advertisement-state="${state}"`);
    expect(markup).toContain(busy);
    expect(markup).toContain(message);
    expect(markup).not.toContain('hau-campus-login-background.jpg');
    expect(markup).not.toContain('landing-hero__media"');
    expect(markup).not.toContain('#/public.register');
  });
});
