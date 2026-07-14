import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import {
  analyzeAssembledDocument,
  assembleAppsScriptTemplate,
  bundleDiagnostics,
  collectViteAssetSources,
  createAppsScriptFiles,
  extractRawTextElementContent,
  splitExpandedSourceHtml,
} from '../../scripts/apps-script-bundle-lib.mjs';

const expandedHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Fixture</title>
    <link rel="stylesheet" href="/styles/one.css">
    <link rel="stylesheet" href="/styles/two.css">
  </head>
  <body>
    <main id="loading" class="loading-overlay">Preparing the Logistics workspace...</main>
    <nav id="primaryNav"></nav>
    <section id="visual-baseline"><p>Approved body markup</p></section>
    <script type="module" src="/visual/runtime.js"></script>
  </body>
</html>`;

const bootstrapScript = `
const closingTagExample = "</script>";
const htmlTemplateExample = \`<section><script data-example>text</script></section>\`;
globalThis.__fixtureValues = { closingTagExample, htmlTemplateExample };
document.addEventListener("DOMContentLoaded",a);
function a(){
  document.getElementById("loading").classList.add("hidden");
  globalThis.google.script.run
    .withSuccessHandler(()=>{})
    .withFailureHandler(()=>{})
    .api_getBootstrapData({requestOnly:false});
}`;

function fixtureFiles() {
  return createAppsScriptFiles({
    expandedHtml,
    scriptSources: ['globalThis.__firstChunkLoaded=true;', bootstrapScript],
    styleSources: ['.app-shell{display:grid}', '.loading-overlay.hidden{display:none}'],
  });
}

function executeFixtureScript(script) {
  const listeners = [];
  const apiCalls = [];
  const loadingClasses = new Set(['loading-overlay']);
  let successHandler = () => {};
  let failureHandler = () => {};
  let runner;
  const target = {
    withSuccessHandler(handler) {
      successHandler = handler;
      return runner;
    },
    withFailureHandler(handler) {
      failureHandler = handler;
      return runner;
    },
  };
  runner = new Proxy(target, {
    get(object, property) {
      if (property in object) return object[property];
      return (payload) => {
        apiCalls.push({ method: String(property), payload });
        successHandler({ ok: true, data: {} });
      };
    },
  });
  const context = vm.createContext({
    console,
    setTimeout,
    clearTimeout,
    document: {
      addEventListener(type, handler) {
        if (type === 'DOMContentLoaded') listeners.push(handler);
      },
      getElementById(id) {
        if (id !== 'loading') return null;
        return { classList: { add: (name) => loadingClasses.add(name) } };
      },
    },
    google: { script: { run: runner } },
  });
  vm.runInContext(script, context);
  for (const listener of listeners) listener();
  return { context, listeners, apiCalls, loadingClasses, failureHandler };
}

describe('Apps Script separate-output packaging', () => {
  it('removes only build references while preserving approved body markup', () => {
    const shell = splitExpandedSourceHtml(expandedHtml);
    expect(shell.head).toContain('<meta charset="utf-8">');
    expect(shell.head).not.toContain('stylesheet');
    expect(shell.body).toContain('<section id="visual-baseline"><p>Approved body markup</p></section>');
    expect(shell.body).not.toContain('/visual/runtime.js');
    expect(fixtureFiles().appBody.trim()).toBe(shell.body);
  });

  it('combines multiple CSS and JavaScript outputs without nested wrappers', () => {
    const files = fixtureFiles();
    expect(files.appStyles.match(/<style\b/g)).toHaveLength(1);
    expect(files.appStyles.match(/<\/style>/g)).toHaveLength(1);
    expect(files.appScript.match(/^<script\b/g)).toHaveLength(1);
    expect(files.appScript.match(/<\/script>\s*$/g)).toHaveLength(1);
    expect(files.appStyles).toContain('.app-shell{display:grid}\n.loading-overlay.hidden{display:none}');
    expect(files.appScript.indexOf('__firstChunkLoaded')).toBeLessThan(
      files.appScript.indexOf('closingTagExample'),
    );
  });

  it('escapes literal closing-script sequences while preserving runtime values', () => {
    const files = fixtureFiles();
    const script = extractRawTextElementContent(files.appScript, 'script', 'hau-app-script');
    expect(script).not.toMatch(/<\/script/i);
    expect(script).toContain('<\\/script>');
    const execution = executeFixtureScript(script);
    expect(execution.context.__fixtureValues.closingTagExample).toBe('</script>');
    expect(execution.context.__fixtureValues.htmlTemplateExample).toBe(
      '<section><script data-example>text</script></section>',
    );
  });

  it('reproduces visible JavaScript leakage in the unsafe outer-script pattern', () => {
    const unsafe = `<html><head></head><body><div id="loading">Loading</div><script>${bootstrapScript}</script></body></html>`;
    const broken = analyzeAssembledDocument(unsafe);
    expect(broken.suspiciousVisibleJavaScriptTokenCount).toBeGreaterThan(0);
    expect(broken.visibleBodyText).toContain('api_getBootstrapData');

    const safe = analyzeAssembledDocument(assembleAppsScriptTemplate(fixtureFiles()));
    expect(safe.scriptCount).toBe(1);
    expect(safe.styleCount).toBe(1);
    expect(safe.bodyCount).toBe(1);
    expect(safe.suspiciousVisibleJavaScriptTokenCount).toBe(0);
  });

  it('renders the server-trusted request-only flag into the assembled body', () => {
    const files = fixtureFiles();
    expect(files.index).toContain("data-request-only=\"<?= requestOnly ? 'true' : 'false' ?>\"");
    expect(files.index).toContain('data-bootstrap-contract-version="<?= bootstrapContractVersion ?>"');
    const internal = analyzeAssembledDocument(assembleAppsScriptTemplate(files));
    const requestOnly = analyzeAssembledDocument(assembleAppsScriptTemplate(files, { requestOnly: true }));
    const legacy = analyzeAssembledDocument(assembleAppsScriptTemplate(files, { bootstrapContractVersion: 1 }));
    const internalBody = internal.tokens.find((token) => token.type === 'tag' && !token.closing && token.name === 'body');
    const requestOnlyBody = requestOnly.tokens.find((token) => token.type === 'tag' && !token.closing && token.name === 'body');
    const legacyBody = legacy.tokens.find((token) => token.type === 'tag' && !token.closing && token.name === 'body');
    expect(internalBody.attributes.get('data-request-only')).toBe('false');
    expect(requestOnlyBody.attributes.get('data-request-only')).toBe('true');
    expect(internalBody.attributes.get('data-bootstrap-contract-version')).toBe('2');
    expect(legacyBody.attributes.get('data-bootstrap-contract-version')).toBe('1');
    expect(() => assembleAppsScriptTemplate(files, { bootstrapContractVersion: 3 })).toThrow(/1 or 2/);
  });

  it('runs one minified-identifier bootstrap and reaches the mocked Apps Script API once', () => {
    const script = extractRawTextElementContent(
      fixtureFiles().appScript,
      'script',
      'hau-app-script',
    );
    const execution = executeFixtureScript(script);
    expect(execution.listeners).toHaveLength(1);
    expect(execution.apiCalls).toEqual([
      { method: 'api_getBootstrapData', payload: { requestOnly: false } },
    ]);
    expect(execution.loadingClasses.has('hidden')).toBe(true);
  });

  it('is deterministic and reports exact hashes, sizes, marker counts, and positions', () => {
    const first = fixtureFiles();
    const second = fixtureFiles();
    expect(second).toEqual(first);
    const diagnostics = bundleDiagnostics(first);
    expect(diagnostics.index.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(diagnostics.index.markers['<?'].count).toBe(7);
    expect(diagnostics.appScript.bytes).toBe(Buffer.byteLength(first.appScript));
    expect(diagnostics.appScript.markers['</script'].positions).toEqual([
      first.appScript.lastIndexOf('</script'),
    ]);
  });

  it('collects one Vite entry chunk and multiple ordered CSS assets', () => {
    const sources = collectViteAssetSources({
      output: [
        { type: 'asset', fileName: 'z.css', source: '.z{}' },
        { type: 'chunk', fileName: 'app.js', code: 'globalThis.app=true;' },
        { type: 'asset', fileName: 'a.css', source: '.a{}' },
        { type: 'asset', fileName: 'index.html', source: '<html></html>' },
      ],
    });
    expect(sources.scriptSources).toEqual(['globalThis.app=true;']);
    expect(sources.styleSources).toEqual(['.a{}', '.z{}']);
  });

  it('rejects inline source scripts and ambiguous multi-chunk builds', () => {
    expect(() =>
      splitExpandedSourceHtml(
        '<html><head></head><body><main></main><script>inline()</script></body></html>',
      ),
    ).toThrow(/Inline <script>/);
    expect(() =>
      collectViteAssetSources({
        output: [
          { type: 'chunk', fileName: 'a.js', code: 'a()' },
          { type: 'chunk', fileName: 'b.js', code: 'b()' },
          { type: 'asset', fileName: 'app.css', source: '.app{}' },
        ],
      }),
    ).toThrow(/one inlined JavaScript entry chunk/);
  });

  it('renders the trusted Apps Script environment into the assembled body', () => {
    const files = fixtureFiles();

    expect(files.index).toContain(
      'data-app-environment="<?= appEnvironment ?>"',
    );

    const staging = analyzeAssembledDocument(
      assembleAppsScriptTemplate(files, {
        appEnvironment: 'STAGING',
      }),
    );

    const production = analyzeAssembledDocument(
      assembleAppsScriptTemplate(files, {
        appEnvironment: 'PRODUCTION',
      }),
    );

    const stagingBody = staging.tokens.find(
      (token) =>
        token.type === 'tag' &&
        !token.closing &&
        token.name === 'body',
    );

    const productionBody = production.tokens.find(
      (token) =>
        token.type === 'tag' &&
        !token.closing &&
        token.name === 'body',
    );

    expect(
      stagingBody.attributes.get('data-app-environment'),
    ).toBe('STAGING');

    expect(
      productionBody.attributes.get('data-app-environment'),
    ).toBe('PRODUCTION');

    expect(() =>
      assembleAppsScriptTemplate(files, {
        appEnvironment: 'DEVELOPMENT',
      }),
    ).toThrow(/STAGING or PRODUCTION/);
  });

});
