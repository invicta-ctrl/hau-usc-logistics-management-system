import { useEffect, useRef } from "react";

export function PreviewIndexLauncher({
  onOpen,
  returnFocusRequestedRef,
}: {
  onOpen: (fromLauncher: boolean) => void;
  returnFocusRequestedRef: { current: boolean };
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!returnFocusRequestedRef.current) return;

    let focusFrame = 0;
    const routeFrame = requestAnimationFrame(() => {
      focusFrame = requestAnimationFrame(() => {
        const launcher = ref.current;
        if (!launcher) return;
        launcher.focus({ preventScroll: true });
        returnFocusRequestedRef.current = false;
      });
    });

    return () => {
      cancelAnimationFrame(routeFrame);
      cancelAnimationFrame(focusFrame);
    };
  }, [returnFocusRequestedRef]);

  return (
    <button
      ref={ref}
      type="button"
      className="preview-index-launcher"
      data-preview-index-launcher
      onClick={() => onOpen(true)}
    >
      Playground Index
    </button>
  );
}
