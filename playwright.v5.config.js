import { defineConfig } from '@playwright/test';

const widths = [320, 390, 768, 1024, 1440];

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'v5-current-application.spec.js',
  timeout: 30_000,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: widths.map((width) => ({
    name: `v5-chromium-${width}`,
    use: {
      browserName: 'chromium',
      viewport: { width, height: width <= 390 ? 844 : 900 },
    },
  })),
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
