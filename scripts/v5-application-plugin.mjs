const APP_SUFFIX = '/src/v5/src/app.js';
const BOOT_MARKER = '/* ---------------- Boot ---------------- */';

export function v5ApplicationBridge() {
  return {
    name: 'hau-v5-application-bridge',
    transform(code, id) {
      const normalized = String(id).replaceAll('\\', '/').split('?')[0];
      if (!normalized.endsWith(APP_SUFFIX)) return null;
      const bootIndex = code.lastIndexOf(BOOT_MARKER);
      if (bootIndex < 0) throw new Error('The frozen V5 application boot marker is missing.');
      const application = code.slice(0, bootIndex);
      const boot = code.slice(bootIndex + BOOT_MARKER.length).trim();
      return {
        code: `${application}\nexport function integrationBoot() {\n${boot}\n}\nexport { render as integrationRender, go as integrationGo, toast as integrationToast, state as integrationState, setPlaygroundContext as integrationSetPlaygroundContext, setAuthorizedRoutes as integrationSetAuthorizedRoutes, openOverlay as integrationOpenOverlay, closeOverlay as integrationCloseOverlay };\n`,
        map: null,
      };
    },
  };
}
