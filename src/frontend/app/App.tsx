import { AppRouteRenderer } from "./AppRouteRenderer";
import { useAppController } from "./useAppController";
import { PreviewIndexLauncher } from "../preview/index/PreviewIndexLauncher";
import { PreviewIndexPage } from "../preview/index/PreviewIndexPage";
import { usePreviewIndex } from "../preview/index/usePreviewIndex";

export default function App() {
  const controller = useAppController();
  const preview = usePreviewIndex();

  if (preview.allowed && preview.indexOpen) {
    return (
      <PreviewIndexPage
        navigate={controller.navigate}
        onClose={preview.closeIndex}
        onCancelLauncherRestore={preview.cancelLauncherRestore}
        returnFocusRequestedRef={preview.returnFocusRequestedRef}
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
