import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_OUTPUT = '.codex/evidence/P22_PLAYGROUND_PERFORMANCE_BASELINE.json';

function argument(name, fallback) {
  const prefix = `--${name}=`;
  const match = process.argv.find((value) => value.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function round(value) {
  return Number(Number(value ?? 0).toFixed(2));
}

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(absolute));
    else files.push(absolute);
  }
  return files;
}

async function summarizeBuild(directory) {
  const files = await filesUnder(directory);
  const artifacts = [];
  for (const file of files) {
    const body = await readFile(file);
    artifacts.push({
      path: path.relative(ROOT, file).replaceAll('\\', '/'),
      bytes: body.byteLength,
      gzipBytes: gzipSync(body, { level: 9 }).byteLength,
    });
  }
  const htmlPath = path.join(directory, 'index.html');
  const html = await readFile(htmlPath, 'utf8');
  const inlineScripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => Buffer.byteLength(match[1]));
  const inlineStyles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((match) => Buffer.byteLength(match[1]));
  return {
    files: artifacts,
    totalBytes: artifacts.reduce((total, item) => total + item.bytes, 0),
    totalGzipBytes: artifacts.reduce((total, item) => total + item.gzipBytes, 0),
    initialHtmlBytes: Buffer.byteLength(html),
    initialHtmlGzipBytes: gzipSync(Buffer.from(html), { level: 9 }).byteLength,
    inlineScriptCount: inlineScripts.length,
    inlineScriptBytes: inlineScripts.reduce((total, bytes) => total + bytes, 0),
    inlineStyleCount: inlineStyles.length,
    inlineStyleBytes: inlineStyles.reduce((total, bytes) => total + bytes, 0),
    emittedJavaScriptFiles: artifacts.filter((item) => item.path.endsWith('.js')).length,
    emittedCssFiles: artifacts.filter((item) => item.path.endsWith('.css')).length,
    routeChunkCount: artifacts.filter((item) => /\.(?:js|css)$/.test(item.path)).length,
  };
}

async function artifactBaseline() {
  return {
    deployment: await summarizeBuild(path.join(ROOT, '.wrangler', 'build', 'staging')),
    canonicalApplication: await summarizeBuild(path.join(ROOT, 'dist')),
  };
}

const PROFILES = [
  {
    id: 'desktop-1440',
    viewport: { width: 1440, height: 1000 },
    cpuSlowdown: 1,
    network: { label: 'local-unthrottled', latencyMs: 0, downloadMbps: 0, uploadMbps: 0 },
  },
  {
    id: 'older-laptop-1440',
    viewport: { width: 1440, height: 900 },
    cpuSlowdown: 4,
    network: { label: 'constrained-broadband', latencyMs: 40, downloadMbps: 20, uploadMbps: 5 },
  },
  {
    id: 'midrange-mobile-390',
    viewport: { width: 390, height: 844 },
    cpuSlowdown: 4,
    network: { label: 'midrange-mobile', latencyMs: 80, downloadMbps: 8, uploadMbps: 2 },
  },
  {
    id: 'slower-network-390',
    viewport: { width: 390, height: 844 },
    cpuSlowdown: 4,
    network: { label: 'slower-network', latencyMs: 150, downloadMbps: 4, uploadMbps: 1 },
  },
];

function bytesPerSecond(mbps) {
  return mbps > 0 ? (mbps * 1_000_000) / 8 : -1;
}

async function installApiFixtures(page) {
  await page.route('**/api/version', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, correlationId: 'p22-baseline', playground: true }),
  }));
  await page.route('**/api/public/advertisements', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, items: [] }),
  }));
  await page.route('**/api/health', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true }),
  }));
  await page.route('**/api/readiness', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, ready: true }),
  }));
  await page.route('**/api/playground/status', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      resetCenter: {
        baselineId: 'playground-clean-v2',
        baselineVersion: '2',
        generation: 6,
        workingState: 'CLEAN',
        activeTestSession: false,
        resetAvailable: true,
        confirmationPhrase: 'RESET PLAYGROUND',
        pendingOperation: null,
        lastReset: null,
      },
    }),
  }));
}

async function installPerformanceObservers(page) {
  await page.addInitScript(() => {
    window.__p22Metrics = { lcp: 0, cls: 0, clsSources: [], longestEvent: 0 };
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const latest = entries.at(-1);
      if (latest) window.__p22Metrics.lcp = latest.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        window.__p22Metrics.cls += entry.value;
        for (const source of entry.sources ?? []) {
          const node = source.node;
          const label = node instanceof Element
            ? `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ''}${[...node.classList].slice(0, 2).map((name) => `.${name}`).join('')}`
            : 'unknown';
          window.__p22Metrics.clsSources.push({
            value: entry.value,
            node: label,
            previous: {
              x: source.previousRect?.x ?? 0,
              y: source.previousRect?.y ?? 0,
              width: source.previousRect?.width ?? 0,
              height: source.previousRect?.height ?? 0,
            },
            current: {
              x: source.currentRect?.x ?? 0,
              y: source.currentRect?.y ?? 0,
              width: source.currentRect?.width ?? 0,
              height: source.currentRect?.height ?? 0,
            },
          });
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__p22Metrics.longestEvent = Math.max(window.__p22Metrics.longestEvent, entry.duration);
        }
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
    } catch {
      // Older Chromium builds may not expose PerformanceEventTiming.
    }
  });
}

async function configureProfile(cdp, profile, includeNetwork) {
  await cdp.send('Network.enable');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuSlowdown });
  if (!includeNetwork || profile.network.downloadMbps <= 0) return;
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: profile.network.latencyMs,
    downloadThroughput: bytesPerSecond(profile.network.downloadMbps),
    uploadThroughput: bytesPerSecond(profile.network.uploadMbps),
    connectionType: 'cellular4g',
  });
}

function observeNetwork(cdp) {
  const counters = { requests: 0, transferBytes: 0, resources: [] };
  const pending = new Map();
  cdp.on('Network.requestWillBeSent', (event) => {
    if (!/^https?:/i.test(event.request.url)) return;
    counters.requests += 1;
    const resource = {
      path: new URL(event.request.url).pathname,
      type: event.type,
      transferBytes: 0,
    };
    counters.resources.push(resource);
    pending.set(event.requestId, resource);
  });
  cdp.on('Network.loadingFinished', (event) => {
    const resource = pending.get(event.requestId);
    if (!resource) return;
    resource.transferBytes = round(event.encodedDataLength ?? 0);
    counters.transferBytes += event.encodedDataLength ?? 0;
    pending.delete(event.requestId);
  });
  return counters;
}

async function navigationMetrics(page) {
  return page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = Object.fromEntries(performance.getEntriesByType('paint').map((entry) => [entry.name, entry.startTime]));
    return {
      ttfbMs: navigation ? navigation.responseStart - navigation.requestStart : 0,
      domContentLoadedMs: navigation?.domContentLoadedEventEnd ?? 0,
      loadEventMs: navigation?.loadEventEnd ?? 0,
      firstContentfulPaintMs: paint['first-contentful-paint'] ?? 0,
      lcpMs: window.__p22Metrics?.lcp ?? 0,
      cls: window.__p22Metrics?.cls ?? 0,
      clsSources: window.__p22Metrics?.clsSources ?? [],
      longestInteractionEventMs: window.__p22Metrics?.longestEvent ?? 0,
    };
  });
}

async function measureIndexSearch(page) {
  const search = page.locator('[data-preview-search]');
  const started = await page.evaluate(() => performance.now());
  await search.fill('invtry');
  await page.locator('[data-preview-route="inventory"]').waitFor({ state: 'visible' });
  const duration = await page.evaluate((start) => performance.now() - start, started);
  await search.fill('');
  return round(duration);
}

async function measureBuiltProfile(browser, baseUrl, profile) {
  const context = await browser.newContext({ viewport: profile.viewport });
  const page = await context.newPage();
  await installApiFixtures(page);
  await installPerformanceObservers(page);
  const cdp = await context.newCDPSession(page);
  await configureProfile(cdp, profile, true);
  const network = observeNetwork(cdp);
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  const started = Date.now();
  await page.goto(`${baseUrl}/#/__preview/index`, { waitUntil: 'domcontentloaded', timeout: 360_000 });
  await page.locator('[data-preview-index]').waitFor({ state: 'visible', timeout: 360_000 });
  const indexReadyMs = Date.now() - started;
  await page.waitForLoadState('networkidle', { timeout: 360_000 });
  await page.waitForTimeout(250);
  const initialNetwork = {
    requestCount: network.requests,
    transferBytes: round(network.transferBytes),
    resources: network.resources,
  };
  const timing = await navigationMetrics(page);
  const indexSearchMs = await measureIndexSearch(page);
  await page.waitForTimeout(100);
  await context.close();
  return {
    profile: profile.id,
    viewport: profile.viewport,
    cpuSlowdown: profile.cpuSlowdown,
    network: profile.network,
    indexReadyMs,
    indexSearchMs,
    initialNetwork,
    timing: Object.fromEntries(
      Object.entries(timing).map(([key, value]) => [key, typeof value === 'number' ? round(value) : value]),
    ),
    consoleErrors,
  };
}

const WORKSPACE_ROUTES = [
  { route: 'inventory', metric: 'inventoryLoadMs' },
  { route: 'request-center', metric: 'requestQueueLoadMs' },
  { route: 'lending', metric: 'lendingLoadMs' },
  { route: 'events', metric: 'eventsLoadMs' },
  { route: 'administration', metric: 'administrationLoadMs' },
];

async function measureInspectionProfile(browser, baseUrl, profile) {
  const context = await browser.newContext({ viewport: profile.viewport });
  const page = await context.newPage();
  await installApiFixtures(page);
  const cdp = await context.newCDPSession(page);
  await configureProfile(cdp, profile, false);
  const network = observeNetwork(cdp);
  await page.goto(`${baseUrl}/#/__preview/index`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.locator('[data-preview-index]').waitFor({ state: 'visible', timeout: 120_000 });
  await page.waitForLoadState('networkidle', { timeout: 120_000 });
  await page.waitForTimeout(250);
  network.requests = 0;
  network.transferBytes = 0;
  network.resources = [];
  const routeLoads = {};
  let inventorySearchMs = null;

  for (const { route, metric } of WORKSPACE_ROUTES) {
    const before = {
      requests: network.requests,
      transferBytes: network.transferBytes,
      resources: network.resources.length,
    };
    const started = await page.evaluate(() => performance.now());
    await page.locator(`[data-preview-route="${route}"] [data-action="open-preview"]`).click();
    await page.locator(`[data-preview-inspection="true"][data-preview-route="${route}"]`).waitFor({ state: 'visible' });
    routeLoads[metric] = round(await page.evaluate((start) => performance.now() - start, started));
    await page.waitForTimeout(50);
    routeLoads[`${metric}Network`] = {
      requestCount: network.requests - before.requests,
      transferBytes: round(network.transferBytes - before.transferBytes),
      resources: network.resources.slice(before.resources),
    };
    if (route === 'inventory') {
      const search = page.getByRole('searchbox', { name: 'Search inventory' });
      const searchStarted = await page.evaluate(() => performance.now());
      await search.fill('projector');
      inventorySearchMs = round(await page.evaluate(async (start) => {
        await new Promise((resolve) => requestAnimationFrame(() => resolve()));
        return performance.now() - start;
      }, searchStarted));
    }
    await page.getByRole('link', { name: 'Back to Playground Index' }).first().click();
    await page.locator('[data-preview-index]').waitFor({ state: 'visible' });
  }
  await context.close();
  return {
    profile: profile.id,
    viewport: profile.viewport,
    cpuSlowdown: profile.cpuSlowdown,
    routeLoads,
    inventorySearchMs,
  };
}

const builtBaseUrl = argument('built-base-url', 'http://127.0.0.1:4184').replace(/\/$/, '');
const inspectionBaseUrl = argument('inspection-base-url', 'http://127.0.0.1:4173').replace(/\/$/, '');
const output = path.resolve(ROOT, argument('output', DEFAULT_OUTPUT));
const phase = argument('phase', 'P22');
const measurementClass = argument('measurement-class', 'before-optimization-local-lab');
const requestedProfiles = new Set(argument('profiles', '').split(',').map((value) => value.trim()).filter(Boolean));
const measuredProfiles = requestedProfiles.size > 0
  ? PROFILES.filter((profile) => requestedProfiles.has(profile.id))
  : PROFILES;
if (measuredProfiles.length === 0) throw new Error('No requested performance profile matched.');
const browser = await chromium.launch({ headless: true });

try {
  const artifacts = await artifactBaseline();
  const builtProfiles = [];
  const inspectionProfiles = [];
  for (const profile of measuredProfiles) {
    builtProfiles.push(await measureBuiltProfile(browser, builtBaseUrl, profile));
    inspectionProfiles.push(await measureInspectionProfile(browser, inspectionBaseUrl, profile));
  }
  const report = {
    schemaVersion: 1,
    phase,
    measurementClass,
    measuredAt: new Date().toISOString(),
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(),
    environment: {
      node: process.version,
      platform: process.platform,
      chromium: browser.version(),
      builtBaseUrl,
      inspectionBaseUrl,
      note: 'Built-profile measurements use the deployment-shaped staging build. Protected workspace transitions use the exact-4173 deterministic inspection harness and sanitized sample data; no live operational records are read.',
    },
    artifacts,
    builtProfiles,
    inspectionProfiles,
  };
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`${phase} performance baseline written to ${path.relative(ROOT, output).replaceAll('\\', '/')}`);
  console.log(`Deployment HTML: ${artifacts.deployment.initialHtmlBytes} bytes (${artifacts.deployment.initialHtmlGzipBytes} gzip bytes)`);
  console.log(`Deployment route chunks: ${artifacts.deployment.routeChunkCount}`);
  console.log(`Canonical application HTML: ${artifacts.canonicalApplication.initialHtmlBytes} bytes (${artifacts.canonicalApplication.initialHtmlGzipBytes} gzip bytes)`);
} finally {
  await browser.close();
}
