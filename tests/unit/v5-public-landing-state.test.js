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
  ])(
    'renders the %s state inside the live-Make Current composition without a fabricated advertisement',
    (state, message, busy) => {
      const markup = landing({ state });

      expect(markup).toContain(`data-advertisement-state="${state}"`);
      expect(markup).toContain(busy);
      expect(markup).toContain(message);
      expect(markup).toContain('What the council is doing now');
      expect(markup).toContain('Current production snapshot');
      expect(markup).toContain('id="logistics"');
      expect(markup).toContain('The Logistics hub');
      expect(markup).toContain('Every step is recorded; the evidence is permanent.');
      expect(markup).toContain('data:image/webp;base64,UklGRvBZAABXRUJQ');
      expect(markup).not.toContain('/brand/login-background');
      expect(markup).not.toContain('hau-campus-login-background.jpg');
      expect(markup).not.toContain('landing-hero__media"');
      expect(markup).not.toContain('#/public.register');
    },
  );

  it('keeps the live-Make action hierarchy on real public routes', () => {
    const markup = landing({ state: 'empty' });

    expect(markup).toContain(
      'HAU-USC Logistics coordinates equipment and supply services through a governed record—from first request to confirmed return.',
    );
    expect(markup).toContain('href="#/public.request-intake"');
    expect(markup).toContain('href="#/public.lending-intake"');
    expect(markup).toContain('href="#/public.request-tracking"');
    expect(markup).toContain('href="#/public.signin"');
    expect(markup).toContain('data-act="scroll-to-logistics"');
    expect(markup).toContain('class="landing-brand__crest"');
    expect(markup).toContain('<b>University Student Council</b><span>Holy Angel University</span>');
    expect(markup).toContain('class="landing-brand__divider"');
    expect(markup).toContain('Department of<br />Logistics');
    expect(markup).toContain('class="landing-footer__crest"');
    expect(markup).toContain('Privacy Notice and Acceptable Use');
  });
});
