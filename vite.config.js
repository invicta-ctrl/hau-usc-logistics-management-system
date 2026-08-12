import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { parsePlaygroundOrigin, verifyPlaygroundOrigin } from './scripts/playground-proxy-guard.mjs';
import { v5ApplicationBridge } from './scripts/v5-application-plugin.mjs';

async function playgroundProxy() {
  const configured = String(process.env.HAU_PLAYGROUND_PROXY_ORIGIN ?? '').trim();
  if (!configured) return undefined;

  const target = parsePlaygroundOrigin(configured);
  await verifyPlaygroundOrigin(target);

  const options = () => ({
    target: target.origin,
    changeOrigin: true,
    secure: true,
    configure(proxy) {
      proxy.on('proxyReq', (request) => {
        request.setHeader('origin', target.origin);
        request.setHeader('referer', `${target.origin}/`);
      });
    },
  });
  return {
    '/api': options(),
    '/brand': options(),
    '/media': options(),
  };
}

function standaloneClassicScript() {
  return {
    name: 'hau-standalone-classic-script',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = bundle['index.html'];
      if (!html || typeof html.source !== 'string') return;
      html.source = renderStandaloneClassicHtml(html.source);
    },
  };
}

export function renderStandaloneClassicHtml(source) {
  const moduleScript = source.match(/<script type="module" crossorigin>([\s\S]*?)<\/script>/u);
  if (!moduleScript) throw new Error('The inlined V5 module script is missing.');

  const withoutModuleScript = source.replace(moduleScript[0], '');
  if (!withoutModuleScript.includes('</body>')) {
    throw new Error('The V5 application body is missing.');
  }

  const classicScript = `<script>${moduleScript[1]}</script>\n</body>`;
  return withoutModuleScript
    .replace('</body>', () => classicScript)
    .replace(/\r+\n?/gu, '\n')
    .replace(/[ \t]+$/gmu, '');
}

export default defineConfig(async () => ({
  root: 'src',
  base: './',
  plugins: [v5ApplicationBridge(), viteSingleFile(), standaloneClassicScript()],
  server: {
    host: '127.0.0.1',
    proxy: await playgroundProxy(),
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
  test: {
    environment: 'node',
    include: ['../tests/**/*.test.js'],
    coverage: { reporter: ['text', 'json-summary'] },
  },
}));
