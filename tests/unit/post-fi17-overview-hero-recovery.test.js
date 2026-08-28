import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  HERO_PLAYBACK_INITIAL,
  heroMotionControlLabel,
  heroPlaybackReducer,
} from '../../src/frontend/app/landing/HeroMotion';

const root = resolve(import.meta.dirname, '../..');
const readSource = (relativePath) => readFileSync(resolve(root, relativePath), 'utf8');

describe('post-FI17 Overview and hero-motion recovery', () => {
  it('wires OverviewRoute through the server-derived authenticated route and sanitized safe-preview session', () => {
    const renderer = readSource('src/frontend/app/AppRouteRenderer.tsx');
    const inspection = readSource('src/frontend/preview/index/PreviewInspectionRoute.tsx');
    const previewData = readSource('src/frontend/preview/index/previewData.ts');
    const overview = readSource('src/frontend/app/overview/OverviewRoute.tsx');

    expect(renderer).toMatch(
      /session && isAuthRoute\(route\)[\s\S]*route === 'overview'[\s\S]*<OverviewRoute session=\{session\} \/>/,
    );
    expect(inspection).toMatch(
      /authRoute === 'overview'[\s\S]*<OverviewRoute session=\{LOCAL_PREVIEW_SESSION\} dark=\{dark\} \/>/,
    );
    expect(inspection).not.toContain('/api/');
    expect(inspection).not.toMatch(/\bfetch\s*\(/);
    expect(previewData).toContain('export const LOCAL_PREVIEW_SESSION: Session');
    expect(previewData).toMatch(/capabilities:\s*\[\s*'overview'/);
    expect(overview).not.toContain('This workspace route is reserved and has not yet been built.');
    expect(overview).not.toContain('Route reserved · not yet built');
  });

  it('bundles the owner hero media with autoplay-safe looping, poster fallback, pause/resume, and reduced-motion protection', () => {
    const hero = readSource('src/frontend/app/landing/HeroMotion.tsx');
    const section = readSource('src/frontend/app/landing/HeroSection.tsx');

    expect(section).toContain(
      "import heroVideoSrc from '../../assets/hero/hausc-institutional-logistics-hero.mp4';",
    );
    expect(section).toContain('<HeroMotion videoSrc={heroVideoSrc} />');
    expect(hero).toMatch(
      /autoPlay=\{Boolean\([\s\S]*resolvedVideoSrc && motionAllowed && !playback\.pausedByUser && !playback\.playbackBlocked/,
    );
    expect(hero).toContain('muted');
    expect(hero).toContain('loop');
    expect(hero).toContain('playsInline');
    expect(hero).toContain('preload="metadata"');
    expect(hero).toContain("setAttribute('fetchpriority', 'high')");
    expect(hero).toContain('poster={heroPoster}');
    expect(hero).toContain("URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }))");
    expect(hero).toContain('URL.revokeObjectURL(objectUrl)');
    expect(hero).toMatch(/if \(!motionAllowed\)[\s\S]*setResolvedVideoSrc\(undefined\)/);
    expect(hero).toContain("'Pause hero motion'");
    expect(hero).toContain("'Resume hero motion'");
    expect(hero).not.toContain('aria-pressed');
    expect(hero).toContain('prefers-reduced-motion: reduce');
    expect(hero).toContain('onError={() => {');
  });

  it('keeps the control truthful when initial autoplay or a resume attempt is rejected', () => {
    const blockedInitialPlayback = heroPlaybackReducer(HERO_PLAYBACK_INITIAL, 'PLAY_REJECTED');
    expect(blockedInitialPlayback.playing).toBe(false);
    expect(heroMotionControlLabel(blockedInitialPlayback)).toBe('Retry hero motion');

    const pausedPlayback = heroPlaybackReducer(
      heroPlaybackReducer(HERO_PLAYBACK_INITIAL, 'PLAYING'),
      'REQUEST_PAUSE',
    );
    expect(heroMotionControlLabel(pausedPlayback)).toBe('Resume hero motion');

    const blockedResume = heroPlaybackReducer(
      heroPlaybackReducer(pausedPlayback, 'REQUEST_PLAY'),
      'PLAY_REJECTED',
    );
    expect(blockedResume.playing).toBe(false);
    expect(heroMotionControlLabel(blockedResume)).toBe('Retry hero motion');
  });
});
