import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { listPreviewRoutes } from '../../src/frontend/preview/index/registry.ts';

const pageSource = readFileSync(
  new URL('../../src/frontend/preview/index/PreviewIndexPage.tsx', import.meta.url),
  'utf8',
);

describe('MFR-002 U08 Playground Index launcher', () => {
  it('keeps search primary and discloses route/runtime technical detail on demand', () => {
    expect(pageSource.indexOf('<section className="preview-launcher"')).toBeLessThan(
      pageSource.indexOf('<QaStatusStrip'),
    );
    expect(pageSource).toContain('data-preview-entry-details');
    expect(pageSource).toContain('<summary>Technical details</summary>');
    expect(pageSource).toContain('<summary>Runtime details</summary>');
    expect(pageSource).toContain('data-preview-entry-health');
  });

  it('keeps only actionable route filters visible before secondary QA filters', () => {
    expect(pageSource).toContain(
      "const PRIMARY_PREVIEW_FILTERS: readonly PreviewFilter[] = ['ALL', 'PUBLIC', 'AUTHENTICATED'];",
    );
    expect(pageSource).toContain('data-preview-more-filters');
  });

  it('does not permanently cache a rejected runtime-status request', () => {
    expect(pageSource).toMatch(
      /frontendBackend\.systemStatus\(\)\.catch\([\s\S]*qaStatusRequest = null;[\s\S]*throw error;/u,
    );
    expect(pageSource).toContain('Retry runtime check');
    expect(pageSource).toContain("? 'Authorized sign-in required'");
    expect(pageSource).toContain("? 'Unavailable'");
    expect(pageSource).toContain("'Not reported'");
  });

  it('reports the transformed custody and supply routes as backend connected', () => {
    for (const route of ['release', 'restocking', 'procurement']) {
      expect(listPreviewRoutes().find((entry) => entry.route === route)).toMatchObject({
        backendStatus: 'REAL_BACKEND',
        completeness: 'BACKEND_WIRED_COMPLETE',
      });
    }
  });
});
