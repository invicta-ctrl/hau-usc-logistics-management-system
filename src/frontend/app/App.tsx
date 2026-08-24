import { AppRouteRenderer } from './AppRouteRenderer';
import { useAppController } from './useAppController';
import { PreviewIndexLauncher } from '../preview/index/PreviewIndexLauncher';
import { PreviewIndexPage } from '../preview/index/PreviewIndexPage';
import { usePreviewIndex } from '../preview/index/usePreviewIndex';
import { PreviewInspectionRoute } from '../preview/index/PreviewInspectionRoute';

export default function App() {
  const controller = useAppController();
  const preview = usePreviewIndex();

  if (preview.inspection.mode === 'LOCAL_INDEX_INSPECTION') {
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

  if (preview.allowed && preview.indexOpen) {
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
      {preview.allowed ? (
        <PreviewIndexLauncher
          onOpen={preview.openIndex}
          returnFocusRequestedRef={preview.returnFocusRequestedRef}
        />
      ) : null}
    </>
  );
}
