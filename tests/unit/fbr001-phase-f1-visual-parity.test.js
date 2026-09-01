import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const source = (path) => readFile(resolve(root, path), 'utf8');

describe('FBR-001 Phase F1 public/request/overview visual parity contract', () => {
  it('keeps the five F1 families on real adapters while declaring the canonical presentation boundary', async () => {
    const [landing, current, signIn, publicFlows, requester, overview] = await Promise.all([
      source('src/frontend/app/landing/LandingPage.tsx'),
      source('src/frontend/app/landing/CurrentSection.tsx'),
      source('src/frontend/app/auth/StaffSignInPage.tsx'),
      source('src/frontend/app/PublicFlows.tsx'),
      source('src/frontend/app/request/ExternalRequestCenter.tsx'),
      source('src/frontend/app/overview/OverviewRoute.tsx'),
    ]);

    expect(landing).toContain('fbr-f1-landing');
    expect(current).toContain('frontendBackend.publicAdvertisements');
    expect(current).toContain('"media-error"');
    expect(signIn).toContain('fbr-f1-auth');
    expect(signIn).toContain('"activation-required"');
    expect(signIn).toContain('"service-error"');
    expect(publicFlows).toContain('fbr-f1-public-flow');
    expect(publicFlows).toContain('frontendBackend.publicLendingCatalog');
    expect(publicFlows).toContain('frontendBackend.trackPublicLending');
    expect(requester).toContain('fbr-f1-requester');
    expect(requester).toContain('frontendBackend.cancelRequesterRequest');
    expect(overview).toContain('fbr-f1-overview');
    expect(overview).toContain("operationalModuleBootstrap('overview'");
    expect(overview).toContain("'stale'");
    expect(`${landing}\n${current}\n${signIn}\n${publicFlows}\n${requester}\n${overview}`).not.toContain('localStorage');
  });

  it('uses tokenized editorial and Workbench CSS with deliberate narrow-screen behavior', async () => {
    const [index, entryFlows, overview] = await Promise.all([
      source('src/frontend/styles/index.css'),
      source('src/frontend/styles/entry-flows.css'),
      source('src/frontend/styles/operations-overview.css'),
    ]);

    expect(index).toContain('.fbr-f1-landing');
    expect(entryFlows).toContain('.fbr-f1-auth');
    expect(entryFlows).toContain('.fbr-f1-public-flow > nav');
    expect(entryFlows).toContain('overflow-x: auto');
    expect(entryFlows).toContain('var(--theme-page)');
    expect(entryFlows).toContain('var(--theme-focus)');
    expect(entryFlows).toContain('var(--radius-overlay)');
    expect(entryFlows).toContain('@media (max-width: 39.999rem)');
    expect(overview).toContain('.fbr-f1-overview');
    expect(overview).toContain('border-block-start: 2px solid var(--theme-accent)');
  });
});
