import { defineConfig } from '@playwright/test';

const widths = [320, 390, 768, 1024, 1440];
const localPreviewPort = process.env.HAU_FRONTEND_E2E_PORT ?? '4174';
const localPreviewUrl = `http://127.0.0.1:${localPreviewPort}`;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: [
    'frontend-cutover.spec.js',
    'preview-index.spec.js',
    'fi11-reference-surfaces.spec.js',
    'fi12-convergence.spec.js',
    'r3-a1-a2-routing.spec.js',
    'fi07-lending-hub.spec.js',
    'preview-launcher-geometry.spec.js',
  ],
  timeout: 30_000,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: localPreviewUrl, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  /* Opt-in override for environments whose preinstalled Chromium does not match
     the pinned Playwright build. Unset by default, so normal runs are unchanged. */
  projects: widths.map((width) => ({
    name: `frontend-${width}`,
    use: {
      browserName: 'chromium',
      viewport: { width, height: width < 768 ? 844 : 1000 },
      ...(process.env.HAU_CHROMIUM_PATH
        ? { launchOptions: { executablePath: process.env.HAU_CHROMIUM_PATH } }
        : {}),
    },
  })),
  webServer:
    localPreviewPort === '4173'
      ? undefined
      : {
          command: 'npm run dev -- --host 127.0.0.1 --port 4174',
          url: 'http://127.0.0.1:4174',
          reuseExistingServer: true,
          timeout: 30_000,
        },
});
