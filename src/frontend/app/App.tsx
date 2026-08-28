import { AppRouteRenderer } from './AppRouteRenderer';
import { useAppController } from './useAppController';
import { PreviewIndexLauncher } from '../preview/index/PreviewIndexLauncher';
import { PreviewIndexPage } from '../preview/index/PreviewIndexPage';
import { usePreviewIndex } from '../preview/index/usePreviewIndex';
import { PreviewInspectionRoute } from '../preview/index/PreviewInspectionRoute';

/* Inlined rather than imported from a shared constant: Rollup only folds this
 * away reliably when Vite's define substitution puts the literal at the use
 * site. Imported across a module boundary it stayed a runtime read and the
 * preview modules survived tree-shaking — verify-preview-absent.mjs caught it. */
const PREVIEW_TOOLING_ENABLED = import.meta.env.MODE !== 'production';

export default function App() {
  const controller = useAppController();
  const preview = usePreviewIndex();

  if (PREVIEW_TOOLING_ENABLED && preview.inspection.mode === 'LOCAL_INDEX_INSPECTION') {
    return (
      <PreviewInspectionRoute
        route={preview.inspection.route}
        dark={controller.dark}
        onToggleTheme={controller.toggleTheme}
        onBackToIndex={preview.returnToIndex}
        onExitToHome={() => {
          preview.closeIndex();
          controller.goHome();
        }}
        onOpenRoute={preview.openInspection}
      />
    );
  }

  if (PREVIEW_TOOLING_ENABLED && preview.allowed && preview.indexOpen) {
    return (
      <PreviewIndexPage
        navigate={controller.navigate}
        onClose={preview.closeIndex}
        onCancelLauncherRestore={preview.cancelLauncherRestore}
        returnFocusRequestedRef={preview.returnFocusRequestedRef}
        browseState={preview.browseState}
        onBrowseStateChange={preview.setBrowseState}
        onOpenPreview={(entry) => preview.openInspection(entry.route)}
      />
    );
  }

  return (
    <>
      <AppRouteRenderer controller={controller} />
      {PREVIEW_TOOLING_ENABLED && preview.allowed ? (
        <PreviewIndexLauncher
          onOpen={preview.openIndex}
          returnFocusRequestedRef={preview.returnFocusRequestedRef}
        />
      ) : null}
    </>
  );
}
