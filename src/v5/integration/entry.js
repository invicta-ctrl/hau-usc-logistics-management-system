import { createV5Backend } from './backend.js';
import { createV5Runtime } from './runtime.js';
import { clearBackendViewModels } from './view-models.js';
import * as app from '../src/app.js';

// No connected surface may silently fall back to the frozen illustrative rows.
// Clear backend-backed collections before the V5 application module renders.
clearBackendViewModels();
app.integrationBoot();

async function startIntegratedApplication() {
  // Environment bindings are selected only by the serving Worker (or the
  // verified loopback proxy in development). Browser state cannot retarget V5.
  const backend = createV5Backend();
  const runtime = createV5Runtime({ backend, app });

  globalThis.__HAU_V5_INTEGRATION__ = runtime;
  await runtime.start();
}

startIntegratedApplication().catch((error) => {
  console.error('V5 application startup failed.', error);
});
