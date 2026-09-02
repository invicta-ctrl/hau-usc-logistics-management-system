import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { projectPreviewIndexGate } from '../../src/frontend/preview/index/trustedGate.ts';

const root = resolve(import.meta.dirname, '../..');
const source = (relativePath) => readFileSync(resolve(root, relativePath), 'utf8');

describe('FBR-001 Phase F3 administration, profile, and Playground visual parity', () => {
  it('marks the remaining native route bodies without replacing their adapters', () => {
    const administration = source('src/frontend/app/AdministrationRoute.tsx');
    const profile = source('src/frontend/app/profile/ProfileRoute.tsx');
    const index = source('src/frontend/preview/index/PreviewIndexPage.tsx');
    const inspection = source('src/frontend/preview/index/PreviewInspectionRoute.tsx');

    expect(administration).toContain('data-fbr-f3-administration');
    expect(profile).toContain('data-fbr-f3-profile');
    expect(index).toContain('data-fbr-f3-preview-index');
    expect(inspection).toContain('data-fbr-f3-inspection');
    expect(administration).toMatch(/frontendBackend\s*\.adminAccountDirectory/u);
    expect(profile).toMatch(/frontendBackend\s*\.updateProfileAppearance/u);
    expect(profile).toMatch(/frontendBackend\s*\.changeProfilePassword/u);
  });

  it('keeps capability-filtered administration and preview mutation guards intact', () => {
    const administration = source('src/frontend/app/AdministrationRoute.tsx');
    const profile = source('src/frontend/app/profile/ProfileRoute.tsx');

    expect(administration).toContain('const hasCapability = (capability: string) => inspection || capabilities.includes(capability)');
    expect(administration).toContain('hasCapability("reference.manage")');
    expect(administration).toContain('hasCapability("brand.manage")');
    expect(administration).toContain('hasCapability("system.admin")');
    expect(profile).toContain('const preview = Boolean(previewProfile)');
    expect(profile).toContain('if (preview) return;');
  });

  it('keeps the Playground launcher and inspection routes unavailable outside validated Playground mode', () => {
    const productionLike = projectPreviewIndexGate({ playground: false });
    const playground = projectPreviewIndexGate({ playground: true });

    expect(productionLike).toMatchObject({ validatedPlayground: false, indexAllowed: false });
    expect(playground).toMatchObject({ validatedPlayground: true, indexAllowed: true });
  });

  it('uses deliberate scroll, top decision rules, focus visibility, and reduced-motion treatment', () => {
    const administrationStyles = source('src/frontend/styles/administration-workspace.css');
    const styles = source('src/frontend/styles/fbr-f3-admin-profile.css');

    expect(administrationStyles).toContain('box-shadow: inset 0 0.2rem');
    expect(administrationStyles).toContain('border-top: 0.25rem');
    expect(styles).toContain('border-block-start: 0.25rem');
    expect(styles).toContain('border-inline-start: 1px');
    expect(styles).toContain('overflow-x: auto');
    expect(styles).toContain('focus-visible');
    expect(styles).toContain('prefers-reduced-motion: reduce');
    expect(styles).not.toMatch(/\bfetch\s*\(/u);
  });
});
