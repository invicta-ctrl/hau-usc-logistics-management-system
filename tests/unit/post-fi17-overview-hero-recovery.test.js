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
    const overviewPreview = readSource('src/frontend/app/overview/OverviewPreviewRoute.tsx');

    expect(renderer).toMatch(
      /session && isAuthRoute\(route\)[\s\S]*route === 'overview'[\s\S]*<OverviewRoute session=\{session\} \/>/,
    );
    expect(inspection).toMatch(
      /authRoute === 'overview'[\s\S]*<OverviewPreviewRoute session=\{LOCAL_PREVIEW_SESSION\} dark=\{dark\} \/>/,
    );
    expect(inspection).not.toContain('/api/');
    expect(inspection).not.toMatch(/\bfetch\s*\(/);
    expect(previewData).toContain('export const LOCAL_PREVIEW_SESSION: Session');
    expect(previewData).toMatch(/capabilities:\s*\[\s*'overview'/);
    expect(overview).not.toContain('This workspace route is reserved and has not yet been built.');
    expect(overview).not.toContain('Route reserved · not yet built');
    expect(overview).toContain('<OperationalModuleRoute module="overview"');
    expect(overviewPreview).toContain('Operations overview');
    expect(overviewPreview).toContain('Signed in as {session.displayName}');
    expect(overviewPreview).not.toContain('frontendBackend');
  });

  it('keeps the owner hero media poster-first until the user requests motion', () => {
    const hero = readSource('src/frontend/app/landing/HeroMotion.tsx');
    const section = readSource('src/frontend/app/landing/HeroSection.tsx');
    const headers = readSource('src/public/_headers');

    expect(section).toContain(
      "import heroVideoSrc from '../../assets/hero/hausc-institutional-logistics-hero.mp4';",
    );
    expect(section).toContain('<HeroMotion videoSrc={heroVideoSrc} />');
    expect(hero).toContain('const [motionRequested, setMotionRequested] = useState(false)');
    expect(hero).toMatch(/if \(!motionAllowed \|\| !motionRequested\)[\s\S]*setResolvedVideoSrc\(undefined\)/);
    expect(hero).toMatch(/else if \(!resolvedVideoSrc \|\| failed\)[\s\S]*setMotionRequested\(true\)/);
    expect(hero).toContain("fetch(chunkUrl, { signal: controller.signal })");
    expect(hero).toContain('controller.abort()');
    expect(hero).toContain('muted');
    expect(hero).toContain('loop');
    expect(hero).toContain('playsInline');
    expect(hero).toContain("preload={motionRequested ? 'metadata' : 'none'}");
    expect(hero).not.toContain("setAttribute('fetchpriority', 'high')");
    expect(hero).toContain('poster={heroPoster}');
    expect(hero).toContain("URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }))");
    expect(hero).toContain('URL.revokeObjectURL(objectUrl)');
    expect(hero).toContain("loading ? 'Loading hero motion' : heroMotionControlLabel(playback)");
    expect(hero).toContain("'Pause hero motion'");
    expect(hero).toContain("'Resume hero motion'");
    expect(hero).not.toContain('aria-pressed');
    expect(hero).toContain('prefers-reduced-motion: reduce');
    expect(hero).toContain('onError={() => {');
    expect(headers).toMatch(/Content-Security-Policy:[^\n]*media-src 'self' blob:/u);
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
