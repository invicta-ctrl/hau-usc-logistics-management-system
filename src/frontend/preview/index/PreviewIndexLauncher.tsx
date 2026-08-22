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
    if (returnFocusRequestedRef.current) {
      returnFocusRequestedRef.current = false;
      ref.current?.focus();
    }
  }, [returnFocusRequestedRef]);

  return (
    <button
      ref={ref}
      type="button"
      className="preview-index-launcher"
      data-preview-index-launcher
      onClick={() => onOpen(true)}
    >
      Preview Index
    </button>
  );
}
