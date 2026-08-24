import { defineConfig } from '@playwright/test';

const widths = [320, 390, 768, 1024, 1440];
const localPreviewPort = process.env.HAU_FRONTEND_E2E_PORT ?? '4174';
const localPreviewUrl = `http://127.0.0.1:${localPreviewPort}`;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: [
    'frontend-cutover.spec.js',
    'preview-index.spec.js',
    'r3-a1-a2-routing.spec.js',
    'fi07-lending-hub.spec.js',
  ],
  timeout: 30_000,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: localPreviewUrl, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: widths.map((width) => ({
    name: `frontend-${width}`,
    use: { browserName: 'chromium', viewport: { width, height: width < 768 ? 844 : 1000 } },
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
