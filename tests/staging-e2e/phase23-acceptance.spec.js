import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, request as apiRequest, test } from '@playwright/test';

const candidateSha = process.env.HAU_STAGING_CANDIDATE_SHA;
const evidenceFile = process.env.HAU_PHASE23_EVIDENCE_FILE;
const measurements = {
  candidateSha,
  viewports: [],
  api: [],
  capacity: {},
};

if (!candidateSha || !/^[0-9a-f]{40}$/u.test(candidateSha)) {
  throw new Error('HAU_STAGING_CANDIDATE_SHA must be the exact deployed 40-character commit SHA.');
}

async function ownerCredential() {
  const file = process.env.HAU_STAGING_OWNER_CREDENTIAL_FILE;
  if (!file || !path.isAbsolute(file)) {
    throw new Error('HAU_STAGING_OWNER_CREDENTIAL_FILE must be an absolute private path.');
  }
  const value = JSON.parse(await readFile(file, 'utf8'));
  if (!value?.accessId || !value?.password) throw new Error('The private owner credential is incomplete.');
  return { accessId: String(value.accessId), password: String(value.password) };
}

async function timedRequest(context, endpoint) {
  const startedAt = performance.now();
  const response = await context.get(endpoint, {
    headers: { 'cache-control': 'no-cache, no-store', pragma: 'no-cache' },
  });
  const body = await response.body();
  const durationMs = Math.round((performance.now() - startedAt) * 10) / 10;
  measurements.api.push({
    endpoint,
    status: response.status(),
    durationMs,
    payloadBytes: body.length,
    serverTiming: response.headers()['server-timing'] ?? null,
  });
  return { response, body, durationMs };
}

async function contrastTruth(page) {
  return page.evaluate(() => {
    const rgb = (value) => {
      const values =
        String(value)
          .match(/[\d.]+/gu)
          ?.map(Number) ?? [];
      return values.length >= 3 ? values.slice(0, 3) : null;
    };
    const luminance = (color) => {
      const channels = color.map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const background = (element) => {
      let current = element;
      while (current) {
        const style = getComputedStyle(current);
        const gradient = rgb(style.backgroundImage);
        if (gradient) return gradient;
        const value = style.backgroundColor;
        if (value && !value.endsWith(', 0)') && value !== 'transparent') return rgb(value);
        current = current.parentElement;
      }
      return [255, 255, 255];
    };
    return ['h1', 'p', 'button.primary']
      .map((selector) => {
        const element = [...document.querySelectorAll(selector)].find(
          (entry) => entry.getClientRects().length && getComputedStyle(entry).visibility !== 'hidden',
        );
        if (!element) return null;
        const foreground = rgb(getComputedStyle(element).color);
        const behind = background(element);
        if (!foreground || !behind) return null;
        const values = [luminance(foreground), luminance(behind)].sort((a, b) => b - a);
        return { selector, ratio: Math.round(((values[0] + 0.05) / (values[1] + 0.05)) * 100) / 100 };
      })
      .filter(Boolean);
  });
}

async function pageTruth(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const controls = [...document.querySelectorAll('button, a[href], input, select, textarea')].filter(
      visible,
    );
    const unnamed = controls.filter((element) => {
      const labels =
        'labels' in element ? [...element.labels].map((label) => label.textContent).join(' ') : '';
      return !String(
        element.getAttribute('aria-label') ||
          element.getAttribute('aria-labelledby') ||
          labels ||
          element.textContent ||
          element.getAttribute('title') ||
          element.getAttribute('alt') ||
          element.value ||
          '',
      ).trim();
    });
    const undersized = controls
      .filter((element) => !element.matches('a'))
      .map((element) => ({
        tag: element.tagName,
        type: element.getAttribute('type'),
        ...element.getBoundingClientRect().toJSON(),
      }))
      .filter((rect) => rect.width < 24 || rect.height < 24);
    return {
      overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      unnamedCount: unnamed.length,
      undersized,
      controlCount: controls.length,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  });
}

async function focusTruth(page) {
  await page.keyboard.press('Tab');
  return page.evaluate(() => {
    const active = document.activeElement;
    const style = active ? getComputedStyle(active) : null;
    return {
      tag: active?.tagName ?? '',
      visible: Boolean(active?.matches(':focus-visible')),
      hasIndicator: Boolean(
        style &&
        (style.outlineStyle !== 'none' ||
          style.boxShadow !== 'none' ||
          Number.parseFloat(style.borderWidth) > 0),
      ),
    };
  });
}

async function navigationMeasurement(page, pathname, viewport) {
  const responses = [];
  const collect = (response) => {
    const url = new URL(response.url());
    if (url.origin === new URL(page.url() || 'https://invalid.example').origin || !page.url()) {
      responses.push({ path: url.pathname, status: response.status() });
    }
  };
  page.on('response', collect);
  const startedAt = performance.now();
  await page.goto(pathname, { waitUntil: 'networkidle' });
  const durationMs = Math.round((performance.now() - startedAt) * 10) / 10;
  const navigation = await page.evaluate(() => {
    const entry = performance.getEntriesByType('navigation')[0];
    return entry
      ? {
          domInteractiveMs: Math.round(entry.domInteractive * 10) / 10,
          domCompleteMs: Math.round(entry.domComplete * 10) / 10,
          transferBytes: entry.transferSize,
          encodedBytes: entry.encodedBodySize,
        }
      : null;
  });
  const truth = await pageTruth(page);
  const focus = await focusTruth(page);
  const contrast = await contrastTruth(page);
  page.off('response', collect);
  measurements.viewports.push({
    viewport,
    pathname,
    durationMs,
    navigation,
    responses,
    truth,
    focus,
    contrast,
  });
  expect(durationMs).toBeLessThan(30_000);
  expect(truth.overflowPx).toBeLessThanOrEqual(1);
  expect(truth.unnamedCount).toBe(0);
  expect(truth.undersized).toEqual([]);
  expect(truth.reducedMotion).toBe(true);
  expect(focus.tag).not.toBe('BODY');
  expect(focus.visible).toBe(true);
  expect(focus.hasIndicator).toBe(true);
  expect(contrast.length).toBeGreaterThan(0);
  for (const result of contrast)
    expect(result.ratio).toBeGreaterThanOrEqual(result.selector === 'p' ? 4.5 : 3);
}

test.afterAll(async () => {
  if (!evidenceFile) return;
  if (!path.isAbsolute(evidenceFile)) throw new Error('HAU_PHASE23_EVIDENCE_FILE must be absolute.');
  await writeFile(evidenceFile, `${JSON.stringify(measurements, null, 2)}\n`, 'utf8');
});

test('exact staging identity and repeated API/D1-backed reads are measurable and bounded', async ({
  baseURL,
}) => {
  const context = await apiRequest.newContext({ baseURL });
  try {
    for (let index = 0; index < 5; index += 1) {
      const health = await timedRequest(context, `/api/health?phase23=${crypto.randomUUID()}`);
      expect(health.response.status()).toBe(200);
      expect(JSON.parse(health.body.toString('utf8'))).toMatchObject({
        environment: 'STAGING',
        candidateSha,
        database: { connected: true, schemaVersion: '29' },
      });
      const catalog = await timedRequest(
        context,
        `/api/public/lending/catalog?phase23=${crypto.randomUUID()}`,
      );
      expect(catalog.response.status()).toBe(200);
      expect(JSON.parse(catalog.body.toString('utf8'))).toMatchObject({ ok: true });
    }
  } finally {
    await context.dispose();
  }
});

test('login, requester boundary, and public lending reflow accessibly at required viewports', async ({
  browser,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 820, height: 900 },
    { width: 1366, height: 900 },
  ]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    try {
      await navigationMeasurement(page, '/login', viewport);
      await expect(page.getByLabel('Access ID')).toBeVisible();
      await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
      await page.getByRole('button', { name: 'Sign in' }).click();
      expect(await page.getByLabel('Access ID').evaluate((element) => element.validity.valid)).toBe(false);
      await navigationMeasurement(page, '/request', viewport);
      await expect(page.getByLabel('Access ID')).toBeVisible();
      await navigationMeasurement(page, '/lending', viewport);
      await expect(page.getByRole('heading', { name: 'Lending Center' })).toBeVisible();
      await expect(page.getByRole('button', { name: /Submit borrowing request for review/u })).toBeVisible();
    } finally {
      await context.close();
    }
  }
});

test('desktop 200 percent zoom preserves required actions without horizontal overflow', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/lending', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expect(page.getByRole('button', { name: /Submit borrowing request for review/u })).toBeVisible();
  const truth = await pageTruth(page);
  expect(truth.overflowPx).toBeLessThanOrEqual(1);
});

test('protected owner bootstrap and route transitions remain accessible across required viewports', async ({
  browser,
}) => {
  const credential = await ownerCredential();
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 820, height: 900 },
    { width: 1366, height: 900 },
  ]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    let pollingRequests = 0;
    page.on('response', (response) => {
      if (new URL(response.url()).pathname === '/api/getScopedRevision') pollingRequests += 1;
    });
    try {
      const startedAt = performance.now();
      await page.goto('/app/admin');
      await page.getByLabel('Access ID').fill(credential.accessId);
      await page.getByLabel('Password', { exact: true }).fill(credential.password);
      const loginResponse = page.waitForResponse(
        (response) => new URL(response.url()).pathname === '/api/auth/login',
      );
      await page.getByRole('button', { name: 'Sign in' }).click();
      expect((await loginResponse).status()).toBe(200);
      await expect(page.locator('.app-shell')).toBeVisible();
      const loginBootstrapMs = Math.round((performance.now() - startedAt) * 10) / 10;
      const shell = page.locator('[data-internal-shell-context]');
      const transitions = [];
      for (const workspace of ['director', 'materials', 'administrator']) {
        const transitionStart = performance.now();
        await shell.getByLabel('Workspace').selectOption(workspace);
        await expect(page.locator('body')).toHaveAttribute(
          'data-experience',
          workspace === 'administrator' ? 'administrator' : workspace,
        );
        transitions.push({
          workspace,
          durationMs: Math.round((performance.now() - transitionStart) * 10) / 10,
        });
      }
      const truth = await pageTruth(page);
      if (viewport.width === 1366) await page.waitForTimeout(16_500);
      expect(truth.overflowPx).toBeLessThanOrEqual(1);
      expect(truth.unnamedCount).toBe(0);
      expect(truth.undersized).toEqual([]);
      measurements.viewports.push({
        viewport,
        pathname: '/app/admin',
        loginBootstrapMs,
        transitions,
        truth,
        polling: { observationMs: viewport.width === 1366 ? 16_500 : 0, requests: pollingRequests },
      });
      expect(pollingRequests).toBe(0);
    } finally {
      await context.close();
    }
  }
});

test('bounded login, requester-denial, and lending bursts fail closed without abusive load', async ({
  baseURL,
}) => {
  const context = await apiRequest.newContext({ baseURL });
  const invalidAccessId = `P23.INVALID.${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  try {
    const loginStatuses = [];
    for (let index = 0; index < 6; index += 1) {
      const response = await context.post('/api/auth/login', {
        data: { accessId: invalidAccessId, password: 'Invalid!Synthetic9472' },
      });
      loginStatuses.push(response.status());
    }
    expect(loginStatuses).toEqual([401, 401, 401, 401, 401, 429]);

    const requesterStatuses = await Promise.all(
      Array.from({ length: 10 }, async () => (await context.get('/api/public/request/options')).status()),
    );
    expect(requesterStatuses).toEqual(Array(10).fill(401));

    const origin = new URL(baseURL).origin;
    const lendingStatuses = [];
    for (let index = 0; index < 11; index += 1) {
      const response = await context.post('/api/public/lending', {
        headers: { origin },
        data: { clientRequestId: `phase23-invalid-${index}-${crypto.randomUUID()}` },
      });
      lendingStatuses.push(response.status());
    }
    expect(lendingStatuses.every((status) => status === 422 || status === 429)).toBe(true);
    expect(lendingStatuses).toContain(429);
    const firstThrottle = lendingStatuses.indexOf(429);
    expect(lendingStatuses.slice(firstThrottle)).toEqual(
      Array(lendingStatuses.length - firstThrottle).fill(429),
    );
    measurements.capacity = { loginStatuses, requesterStatuses, lendingStatuses };
  } finally {
    await context.dispose();
  }
});
