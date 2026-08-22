import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { parsePlaygroundOrigin, verifyPlaygroundOrigin } from './scripts/playground-proxy-guard.mjs';

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
  return { '/api': options(), '/brand': options(), '/media': options() };
}

export default defineConfig(async () => ({
  root: 'src',
  base: './',
  plugins: [react(), tailwindcss(), viteSingleFile()],
  server: { host: '127.0.0.1', proxy: await playgroundProxy() },
  preview: { host: '127.0.0.1' },
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
    fileParallelism: false,
    testTimeout: 10_000,
    coverage: { reporter: ['text', 'json-summary'] },
  },
}));
