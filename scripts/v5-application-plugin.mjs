const APP_SUFFIX = '/src/v5/src/app.js';

export function v5ApplicationBridge() {
  return {
    name: 'hau-v5-application-bridge',
    transform(code, id) {
      const normalized = String(id).replaceAll('\\', '/').split('?')[0];
      if (!normalized.endsWith(APP_SUFFIX)) return null;
      return {
        code: `${code}\nexport { render as integrationRender, go as integrationGo, toast as integrationToast, state as integrationState, openOverlay as integrationOpenOverlay, closeOverlay as integrationCloseOverlay };\n`,
        map: null,
      };
    },
  };
}
