import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');

describe('P14 operational profile route contract', () => {
  it('presents the accepted profile IA and real self-service operations without development copy', async () => {
    const source = await readFile(resolve(root, 'src/frontend/app/profile/ProfileRoute.tsx'), 'utf8');

    for (const marker of [
      'title="Identity"',
      'title="Account"',
      'title="Contact"',
      'title="Appearance"',
      'title="Security & Activity"',
      'updateProfileContact',
      'changeProfileUsername',
      'changeProfilePassword',
      'requestProfileIdentityCorrection',
      'uploadProfileAvatar',
      'deleteProfileAvatar',
      'updateProfileAppearance',
      "(['LIGHT', 'DARK', 'SYSTEM'] as ThemePreference[])",
    ]) {
      expect(source).toContain(marker);
    }
    expect(source).not.toContain('Contract-gated');
    expect(source).not.toContain('current profile contract');
    expect(source).not.toContain('Activity history is unavailable');
  });

  it('keeps preview inspection mutation-free through the explicit preview guard', async () => {
    const source = await readFile(resolve(root, 'src/frontend/app/profile/ProfileRoute.tsx'), 'utf8');
    expect(source).toContain('const preview = Boolean(previewProfile)');
    expect(source).toContain('if (preview) return;');
  });
});
