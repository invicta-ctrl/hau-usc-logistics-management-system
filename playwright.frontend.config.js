import { defineConfig } from '@playwright/test';

const widths = [320, 390, 768, 1024, 1440];

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['frontend-cutover.spec.js', 'preview-index.spec.js'],
  timeout: 30_000,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4174', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: widths.map((width) => ({
    name: `frontend-${width}`,
    use: { browserName: 'chromium', viewport: { width, height: width < 768 ? 844 : 1000 } },
  })),
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4174',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
