const runtime = globalThis.__HAU_RUNTIME_CONFIG__ ?? {};
const buildMode = String(import.meta.env?.MODE ?? 'development').trim().toLowerCase();
const isCloudflareBuild = buildMode === 'staging' || buildMode === 'production';

export function booleanFlag(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
}

const requestedBackendMode = runtime.backendMode ?? import.meta.env?.VITE_BACKEND_MODE;
const configuredBackendMode = requestedBackendMode ?? (isCloudflareBuild ? 'rest' : 'mock');
const backendMode =
  isCloudflareBuild && configuredBackendMode === 'mock' ? 'unconfigured' : configuredBackendMode;

export const config = Object.freeze({
  appVersion: '0.8.0',
  schemaVersion: 3,
  previewMode: backendMode === 'mock',
  backendMode,
  appEnvironment: runtime.appEnvironment ?? import.meta.env?.VITE_APP_ENV ?? (isCloudflareBuild ? buildMode : 'development'),
  bootstrapContractVersion: Number(
    runtime.bootstrapContractVersion ?? import.meta.env?.VITE_BOOTSTRAP_CONTRACT_VERSION ?? (isCloudflareBuild ? 2 : 1),
  ),
  compositeRequestsEnabled: booleanFlag(
    runtime.compositeRequestsEnabled ?? import.meta.env?.VITE_COMPOSITE_REQUESTS_ENABLED,
    configuredBackendMode === 'mock',
  ),
  foodRequestsEnabled: booleanFlag(
    runtime.foodRequestsEnabled ?? import.meta.env?.VITE_FOOD_REQUESTS_ENABLED,
    configuredBackendMode === 'mock',
  ),
  materialsRequestsEnabled: booleanFlag(
    runtime.materialsRequestsEnabled ?? import.meta.env?.VITE_MATERIALS_REQUESTS_ENABLED,
    configuredBackendMode === 'mock',
  ),
  venueEquipmentRequestsEnabled: booleanFlag(
    runtime.venueEquipmentRequestsEnabled ?? import.meta.env?.VITE_VENUE_EQUIPMENT_REQUESTS_ENABLED,
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
