import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const frontendRoot = join(repositoryRoot, 'src', 'frontend');

function read(relativePath) {
  return readFileSync(join(repositoryRoot, relativePath), 'utf8');
}

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return /\.(?:ts|tsx)$/u.test(entry.name) ? [target] : [];
  });
}

function fail(message) {
  throw new Error(`Frontend fixture boundary violation: ${message}`);
}

function requireText(source, expected, label) {
  if (!source.includes(expected)) fail(`${label} is missing ${JSON.stringify(expected)}`);
}

function forbidText(source, forbidden, label) {
  if (source.includes(forbidden)) fail(`${label} contains forbidden text ${JSON.stringify(forbidden)}`);
}

function filesContaining(token) {
  return sourceFiles(frontendRoot)
    .filter((path) => readFileSync(path, 'utf8').includes(token))
    .map((path) => relative(repositoryRoot, path).replaceAll('\\', '/'))
    .sort();
}

function requireExactReferences(token, expectedFiles) {
  const actual = filesContaining(token);
  const expected = [...expectedFiles].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(
      `${token} references changed: expected ${expected.join(', ')}, found ${actual.join(', ') || 'none'}`,
    );
  }
}

const normalRenderer = read('src/frontend/app/AppRouteRenderer.tsx');
const previewRenderer = read('src/frontend/preview/index/PreviewInspectionRoute.tsx');
const app = read('src/frontend/app/App.tsx');
const previewController = read('src/frontend/preview/index/usePreviewIndex.ts');
const previewGate = read('src/frontend/preview/index/inspection.ts');

for (const forbidden of [
  'OverviewPreviewRoute',
  'ReleaseDeskRoute',
  'LendingHubRoute',
  'RequestCenterRouteWithStates',
  'LegacyAdministrationFixture',
  'inspection',
  'previewData',
  'PREVIEW_',
  'fixture',
  'Synthetic prototype',
  'no backend',
  'Local review demonstration recorded',
]) {
  forbidText(normalRenderer, forbidden, 'normal AppRouteRenderer');
}

for (const expected of [
  '<OverviewRoute session={session} navigate={navigate} />',
  '<InventoryRoute dark={dark} navigate={navigate} availableRoutes={session.capabilities} />',
  '<InternalRequestHub dark={dark} navigate={navigate} canReviewRequests={session.canReviewRequests} />',
  'module="release"',
  "session.serverCapabilities.includes('fulfillment.release')",
  'module="restocking"',
  "session.serverCapabilities.includes('fulfillment.receive')",
  '<OperationalModuleRoute module="procurement" />',
  'mode="events"',
]) {
  requireText(normalRenderer, expected, 'normal AppRouteRenderer');
}

for (const expected of [
  "import ReleaseDeskRoute from '../../app/ReleaseDeskRoute';",
  "import { OverviewPreviewRoute } from '../../app/overview/OverviewPreviewRoute';",
  '<InventoryRoute dark={dark} navigate={onOpenRoute} inspection />',
  '<InternalRequestHub dark={dark} navigate={onOpenRoute} inspection canReviewRequests />',
  '<AdministrationRoute dark={dark} navigate={onOpenRoute} inspection />',
  'data-preview-inspection="true"',
  'PLAYGROUND INSPECTION · Sample data · Actions are unavailable.',
]) {
  requireText(previewRenderer, expected, 'PreviewInspectionRoute');
}

requireText(app, "preview.inspection.mode === 'INDEX_INSPECTION'", 'App preview gateway');
requireText(app, '<PreviewInspectionRoute', 'App preview gateway');
requireText(previewController, 'projectPreviewIndexGate(version).indexAllowed', 'Preview controller');
requireText(previewController, 'previewInspectionAllowed({', 'Preview controller');
requireText(previewGate, "location.hostname === 'playground.hausc.org'", 'Preview inspection origin gate');
requireText(
  previewGate,
  "location?.hostname === '127.0.0.1' && location.port === '4173'",
  'Local inspection origin gate',
);

requireExactReferences('OverviewPreviewRoute', [
  'src/frontend/app/overview/OverviewPreviewRoute.tsx',
  'src/frontend/preview/index/PreviewInspectionRoute.tsx',
]);
requireExactReferences('ReleaseDeskRoute', [
  'src/frontend/app/ReleaseDeskRoute.tsx',
  'src/frontend/preview/index/PreviewInspectionRoute.tsx',
]);
requireExactReferences('LegacyAdministrationFixture', ['src/frontend/app/AdministrationRoute.tsx']);
requireExactReferences('LendingHubRoute', ['src/frontend/app/LendingHubRoute.tsx']);
requireExactReferences('RequestCenterRouteWithStates', ['src/frontend/app/RequestCenterRouteWithStates.tsx']);

const sharedFixtureContracts = [
  ['src/frontend/app/inventory/InventoryRoute.tsx', 'inspection ? INV_FIXTURE : []'],
  ['src/frontend/app/request/InternalRequestHub.tsx', 'inspection ? PREVIEW_QUEUE : EMPTY_QUEUE'],
  ['src/frontend/app/lending/InternalLendingHub.tsx', 'inspection ? PREVIEW_QUEUE : EMPTY_QUEUE'],
  ['src/frontend/app/AdministrationRoute.tsx', 'inspection ? previewAccounts : []'],
  ['src/frontend/app/SupplyRoutes.tsx', 'inspection ? previewEventManagement : null'],
];

for (const [path, fixtureExpression] of sharedFixtureContracts) {
  const source = read(path);
  requireText(source, 'inspection = false', path);
  requireText(source, fixtureExpression, path);
}

const requestHub = read('src/frontend/app/request/InternalRequestHub.tsx');
requireText(requestHub, "title: 'Request review recorded'", 'InternalRequestHub inspection branch');
if (
  requestHub.indexOf('if (inspection) {', requestHub.indexOf('const submitReview')) >
  requestHub.indexOf('frontendBackend.reviewRequest')
) {
  fail('InternalRequestHub local demonstration no longer precedes the protected backend review');
}

const lendingHub = read('src/frontend/app/lending/InternalLendingHub.tsx');
for (const protectedCall of [
  'frontendBackend.approveLendingTicket',
  'frontendBackend.confirmLendingHandoff',
  'frontendBackend.uploadLendingReturnEvidence',
  'frontendBackend.confirmLendingReturn',
]) {
  requireText(lendingHub, protectedCall, 'InternalLendingHub authenticated mutation path');
}

const operationalRoute = read('src/frontend/app/operations/OperationalModuleRoute.tsx');
const releaseStation = read('src/frontend/app/operations/ReleaseStation.tsx');
const receivingStation = read('src/frontend/app/operations/ReceivingStation.tsx');
for (const protectedCall of ['frontendBackend.uploadOperationalEvidence', 'frontendBackend.confirmRelease']) {
  requireText(releaseStation, protectedCall, 'ReleaseStation authenticated mutation path');
}
for (const protectedCall of ['frontendBackend.uploadOperationalEvidence', 'frontendBackend.receiveRestock']) {
  requireText(receivingStation, protectedCall, 'ReceivingStation authenticated mutation path');
}
for (const forbidden of ['Synthetic prototype', 'Locally confirmed', 'synthetic fixture']) {
  forbidText(operationalRoute, forbidden, 'OperationalModuleRoute normal runtime');
  forbidText(releaseStation, forbidden, 'ReleaseStation normal runtime');
  forbidText(receivingStation, forbidden, 'ReceivingStation normal runtime');
}
if ((lendingHub.match(/if \(inspection\) \{/gu) ?? []).length < 3) {
  fail('InternalLendingHub inspection-only local demonstrations are no longer explicit');
}

const eventsRoute = read('src/frontend/app/SupplyRoutes.tsx');
requireText(eventsRoute, 'if (!eventAllowed) {', 'ManagedEventsRoute capability gate');
requireText(eventsRoute, 'setLoadState("denied")', 'ManagedEventsRoute denied state');
requireText(
  eventsRoute,
  'setLoadState(error instanceof FrontendApiError',
  'ManagedEventsRoute unavailable state',
);

console.log(
  'Frontend fixture boundary verified: normal routes are backend-backed; fixtures remain explicit-preview-only or unreachable legacy source.',
);
