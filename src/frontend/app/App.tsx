import { lazy, Suspense } from 'react';
import { useAppController } from './useAppController';
import { PreviewIndexLauncher } from '../preview/index/PreviewIndexLauncher';
import { PreviewIndexPage } from '../preview/index/PreviewIndexPage';
import { usePreviewIndex } from '../preview/index/usePreviewIndex';

const AppRouteRenderer = lazy(() =>
  import('./AppRouteRenderer').then((module) => ({ default: module.AppRouteRenderer })),
);
const PreviewInspectionRoute = lazy(() =>
  import('../preview/index/PreviewInspectionRoute').then((module) => ({
    default: module.PreviewInspectionRoute,
  })),
);

function RouteLoading({ dark, previewGate = false }: { dark: boolean; previewGate?: boolean }) {
  if (previewGate) {
    return (
      <main
        className="min-h-screen"
        style={{ background: dark ? '#40070a' : '#f2eae5' }}
        role="status"
        aria-label="Validating Playground access"
        aria-busy="true"
        data-preview-gate-loading="true"
      />
    );
  }

  return (
    <main
      className="min-h-screen grid place-items-center px-6"
      style={{ background: dark ? '#40070a' : '#f2eae5', color: dark ? '#fff8ef' : '#40070a' }}
      aria-live="polite"
      aria-busy="true"
      data-route-loading="true"
    >
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.2em] font-semibold">HAU–USC Logistics</p>
        <h1 className="mt-3 text-xl font-semibold">
          Loading logistics workspace
        </h1>
      </div>
    </main>
  );
}

export default function App() {
  const controller = useAppController();
  const preview = usePreviewIndex();

  if (preview.gatePendingForRequestedRoute) {
    return <RouteLoading dark={controller.dark} previewGate />;
  }

  if (preview.inspection.mode === 'INDEX_INSPECTION') {
    return (
      <Suspense fallback={<RouteLoading dark={controller.dark} />}>
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
      </Suspense>
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
      <Suspense fallback={<RouteLoading dark={controller.dark} />}>
        <AppRouteRenderer controller={controller} />
      </Suspense>
      {preview.allowed ? (
        <PreviewIndexLauncher
          onOpen={preview.openIndex}
          returnFocusRequestedRef={preview.returnFocusRequestedRef}
        />
      ) : null}
    </>
  );
}
