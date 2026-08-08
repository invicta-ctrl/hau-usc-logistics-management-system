import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');

describe('v0.7.2 governed UI integration contract', () => {
  it('wires the canonical Link Registry to real authorized adapter methods', async () => {
    const source = await readFile(resolve(root, 'src/visual/runtime-extensions.js'), 'utf8');

    for (const marker of [
      'services.listReferenceLinks',
      'services.createReferenceLink',
      'services.updateReferenceLink',
      'services.transitionReferenceLink',
      'services.getReferenceLinkHistory',
      "contract: 'canonical-link-registry'",
      'data-reference-link-transition',
      'presentationLabel(record.syncState)',
    ]) {
      expect(source).toContain(marker);
    }
  });

  it('exposes every accepted Announcement lifecycle action with revision and idempotency guards', async () => {
    const source = await readFile(resolve(root, 'src/visual/runtime-extensions.js'), 'utf8');

    for (const marker of [
      'services.previewAdvertisement',
      'services.publishAdvertisement',
      'services.scheduleAdvertisement',
      'services.pauseAdvertisement',
      'services.resumeAdvertisement',
      'services.archiveAdvertisement',
      'expectedRevision: Number(item.revision)',
      'clientRequestId:',
    ]) {
      expect(source).toContain(marker);
    }
  });

  it('presents explicit warning-only low-stock enablement and whole-number controls', async () => {
    const [source, domain] = await Promise.all([
      readFile(resolve(root, 'src/visual/runtime-extensions.js'), 'utf8'),
      readFile(resolve(root, 'src/domain/catalog-management.js'), 'utf8'),
    ]);

    expect(source).toContain('name="lowStockAlertEnabled"');
    expect(source).toContain('name="lowStockThreshold"');
    expect(source).toContain('Warning only; it never changes stock or purchasing.');
    expect(source).toContain("input.step = '1'");
    expect(domain).toContain('operationalInteger(value, { field, min: allowZero ? 0 : 1 })');
  });

  it('keeps every public announcement control at least 44 CSS pixels high', async () => {
    const source = await readFile(resolve(root, 'src/styles/visual/auth.css'), 'utf8');

    expect(source).toContain('.public-announcement-controls > button');
    expect(source).toContain('min-height: 2.75rem');
    expect(source).toMatch(
      /\.public-announcement-indicators button \{[\s\S]*?width: 2\.75rem;[\s\S]*?height: 2\.75rem;/u,
    );
  });
});
