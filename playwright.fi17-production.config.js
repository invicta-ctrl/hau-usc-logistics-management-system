import { defineConfig } from '@playwright/test';

const productionPreviewUrl = 'http://127.0.0.1:4180';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'fi17-production-artifact.spec.js',
  timeout: 30_000,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: productionPreviewUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'production-390', use: { browserName: 'chromium', viewport: { width: 390, height: 844 } } },
    {
      name: 'production-1440',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } },
    },
  ],
  webServer: {
    command: 'npm run preview -- --outDir ../dist --host 127.0.0.1 --port 4180 --strictPort',
    url: productionPreviewUrl,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
