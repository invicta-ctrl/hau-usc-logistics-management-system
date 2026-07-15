const runtime = globalThis.__HAU_RUNTIME_CONFIG__ ?? {};

export function booleanFlag(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
}

const configuredBackendMode = runtime.backendMode ?? import.meta.env?.VITE_BACKEND_MODE ?? 'mock';

export const config = Object.freeze({
  appVersion: '0.5.0',
  schemaVersion: 3,
  previewMode: true,
  backendMode: configuredBackendMode,
  appEnvironment: runtime.appEnvironment ?? import.meta.env?.VITE_APP_ENV ?? 'development',
  bootstrapContractVersion: Number(
    runtime.bootstrapContractVersion ?? import.meta.env?.VITE_BOOTSTRAP_CONTRACT_VERSION ?? 1,
  ),
  compositeRequestsEnabled: booleanFlag(
    runtime.compositeRequestsEnabled ?? import.meta.env?.VITE_COMPOSITE_REQUESTS_ENABLED,
    configuredBackendMode === 'mock',
  ),
  foodRequestsEnabled: booleanFlag(
    runtime.foodRequestsEnabled ?? import.meta.env?.VITE_FOOD_REQUESTS_ENABLED,
    configuredBackendMode === 'mock',
  ),
  httpApiBaseUrl: runtime.httpApiBaseUrl ?? import.meta.env?.VITE_HTTP_API_BASE_URL ?? '',
  timezone: 'Asia/Manila',
  locale: 'en-PH',
  currency: 'PHP',
  storageKey: 'hau-usc-logistics-preview',
  maxUploadBytes: 10 * 1024 * 1024,
  uploadTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  pageSize: 10,
});
