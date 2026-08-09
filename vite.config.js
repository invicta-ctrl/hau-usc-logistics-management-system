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
      html.source = html.source.replace(/<script type="module" crossorigin>/g, '<script>');
    },
  };
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
