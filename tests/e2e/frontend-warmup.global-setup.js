import { chromium } from '@playwright/test';

/**
 * Prime Vite's lazy public-route graph before the responsive projects begin in
 * parallel. The real landing assertion remains in each test; this prevents a
 * cold development transform from leaving unrelated workers on Suspense past
 * their route assertion timeout.
 */
export default async function warmFrontendRoute() {
  const port = process.env.HAU_FRONTEND_E2E_PORT ?? '4174';
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"code":"SESSION_REQUIRED","message":"Sign in to continue."}',
    }),
  );
  await page.route('**/api/public/advertisements', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"items":[]}' }),
  );
  await page.route('**/api/version', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"playground":false}' }),
  );

  try {
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Logistics services and records' }).waitFor({
      state: 'visible',
      timeout: 30_000,
    });
  } finally {
    await browser.close();
  }
}
