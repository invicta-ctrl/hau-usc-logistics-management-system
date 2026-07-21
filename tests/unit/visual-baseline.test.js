import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const read = (path) => readFile(resolve(root, path), 'utf8');
const compact = (value) => value.replace(/\s+/g, ' ').trim();
const generatedNotice =
  '<!-- Generated from legacy/HAU-USC_Logistics-Prototype.original.html. Do not hand-edit. -->';
const withoutGeneratedNotice = (value) => {
  if (!value.startsWith(generatedNotice)) return value;
  return value.slice(generatedNotice.length).replace(/^\r?\n/, '');
};

const viewIds = ['overview', 'request', 'lending', 'release', 'restocking', 'procurement', 'inventory'];
const cssModules = [
  'tokens-base',
  'shell',
  'components',
  'overview',
  'forms',
  'tables',
  'overlays',
  'responsive',
];
const cssMarkers = [
  ':root{',
  '.app-shell{',
  '.panel,.card{',
  '.hero{',
  'form{display:grid',
  '.table-wrap{',
  '.drawer-backdrop,.modal-backdrop{',
  '@media(max-width:1180px)',
];

describe('authoritative visual extraction', () => {
  it('routes the active Food queue and revision-safe updates through service endpoints', async () => {
    const source = await read('src/visual/runtime-extensions.js');
    expect(source).toContain('await services.getFoodWorkQueue()');
    expect(source).toContain('await services.updateFoodComponent({');
    expect(source).toContain("relatedEntityType: 'COMPOSITE_COMPONENT'");
  });

  it('removes only the exact generated notice with LF or CRLF endings', () => {
    const markup = '<section id="visual-baseline"></section>';
    expect(withoutGeneratedNotice(`${generatedNotice}\n${markup}`)).toBe(markup);
    expect(withoutGeneratedNotice(`${generatedNotice}\r\n${markup}`)).toBe(markup);
    expect(withoutGeneratedNotice(`${generatedNotice}${markup}`)).toBe(markup);
    expect(withoutGeneratedNotice(`<!-- unrelated -->\n${markup}`)).toBe(`<!-- unrelated -->\n${markup}`);
  });

  it('preserves the original body markup across shell and view modules', async () => {
    const source = await read('legacy/HAU-USC_Logistics-Prototype.original.html');
    const originalBody = source.match(/<body>([\s\S]*?)<\/body>/i)[1];
    const originalMarkup = originalBody.replace(/\s*<script>[\s\S]*?<\/script>\s*$/i, '');
    const fragments = await Promise.all([
      read('src/visual/shell-before.html'),
      ...viewIds.map((id) => read(`src/visual/views/${id}.html`)),
      read('src/visual/shell-after.html'),
    ]);
    expect(compact(fragments.map(withoutGeneratedNotice).join(''))).toBe(compact(originalMarkup));
  });

  it('preserves the original CSS cascade across ordered modules', async () => {
    const source = await read('legacy/HAU-USC_Logistics-Prototype.original.html');
    const originalCss = source.match(/<style>([\s\S]*?)<\/style>/i)[1];
    const modules = await Promise.all(cssModules.map((name) => read(`src/styles/visual/${name}.css`)));
    const originalSegments = cssMarkers.map((marker, index) => {
      const start = originalCss.indexOf(marker);
      const end = cssMarkers[index + 1] ? originalCss.indexOf(cssMarkers[index + 1]) : originalCss.length;
      return compact(originalCss.slice(start, end));
    });
    modules.forEach((module, index) => {
      const actual = compact(module);
      if (cssModules[index] === 'overlays') {
        expect(actual.startsWith(originalSegments[index])).toBe(true);
        expect(actual.slice(originalSegments[index].length)).toContain('.loading-panel');
        expect(actual.slice(originalSegments[index].length)).toContain('.loading-retry');
      } else {
        expect(actual).toBe(originalSegments[index]);
      }
    });
  });

  it('keeps the original interaction hooks and adds the production adapter bridge', async () => {
    const runtime = await read('src/visual/runtime.js');
    expect(runtime).toContain('createLegacyRuntimeAdapter(mockServices)');
    expect(runtime).toContain(
      'import { appEnvironment, backendMode, bootstrapContractVersion, createLegacyRuntimeAdapter }',
    );
    expect(runtime).toContain(
      'import { validateEssentialBootstrap, validateBootstrapModule, createStateFromEssentialBootstrap, mergeBootstrapModule }',
    );
    expect(runtime).toContain('import { createModuleDataController }');
    expect(runtime).toContain('import { createRuntimeExtensions }');
    expect(runtime).toContain(
      'if(useEssentialBootstrap)return services.loadEssentialBootstrap({requestOnly})',
    );
    expect(runtime).toContain(
      "return backendMode==='mock'?loadState():services.loadBootstrapData({requestOnly})",
    );
    expect(runtime).toContain('services.loadBootstrapModule(module,params)');
    expect(runtime).toContain('async function loadAuthoritativeState(requestOnly)');
    expect(runtime).toContain(
      "acceptAuthoritativeState(await loadAuthoritativeState(document.body.classList.contains('request-mode')))",
    );
    expect(runtime).toContain('BOOTSTRAP_STAGES.ACTIVE_MODULE');
    expect(runtime).toContain('function renderActiveModule()');
    expect(runtime).toContain('Reset Demo Data is available only in local preview mode.');
    expect(runtime).toContain('reset.hidden=true;reset.disabled=true;reset.tabIndex=-1');
    expect(runtime).toContain(
      "if(backendMode==='mock')byId('resetDemo').addEventListener('click',resetDemoData)",
    );
    expect(runtime).toContain('state.catalogAvailabilityProtected||item.availabilityProtected');
    expect(runtime).toContain("fulfillmentSource:'PENDING_REVIEW'");
    expect(runtime).toContain('Pending DOL Stock Review');
    expect(runtime).toContain(
      'The request was recorded for DOL review. Submission did not reduce physical stock.',
    );
    expect(runtime).toContain('acceptAuthoritativeState');
    expect(runtime).toContain('runtimeExtensions.install()');
    expect(runtime).toContain('runtimeExtensions?.start()');

    for (const hook of [
      'bindGlobalEvents()',
      'bindRequestEvents()',
      'bindLendingEvents()',
      'bindReleaseEvents()',
      'bindRestockEvents()',
      'bindProcurementEvents()',
      'bindInventoryEvents()',
    ]) {
      expect(runtime).toContain(hook);
    }
  });
});
