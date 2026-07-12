const runtime = globalThis.__HAU_RUNTIME_CONFIG__ ?? {};

export const config = Object.freeze({
  appVersion: '0.4.0',
  schemaVersion: 3,
  previewMode: true,
  backendMode: runtime.backendMode ?? import.meta.env?.VITE_BACKEND_MODE ?? 'mock',
  appEnvironment: runtime.appEnvironment ?? import.meta.env?.VITE_APP_ENV ?? 'development',
  httpApiBaseUrl: runtime.httpApiBaseUrl ?? import.meta.env?.VITE_HTTP_API_BASE_URL ?? '',
  timezone: 'Asia/Manila',
  locale: 'en-PH',
  currency: 'PHP',
  storageKey: 'hau-usc-logistics-preview',
  maxUploadBytes: 10 * 1024 * 1024,
  uploadTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  pageSize: 10,
});
