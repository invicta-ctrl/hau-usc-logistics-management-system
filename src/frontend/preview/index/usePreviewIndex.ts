import { useCallback, useEffect, useRef, useState } from "react";
import { frontendBackend } from "../../integration/backend";
import { isPreviewIndexHash, PREVIEW_INDEX_HASH } from "./routeHash";
import { projectPreviewIndexGate } from "./trustedGate";

export function usePreviewIndex() {
  const [allowed, setAllowed] = useState(false);
  const [indexOpen, setIndexOpen] = useState(() => isPreviewIndexHash(window.location.hash));
  const returnFocusRequestedRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    frontendBackend
      .version(controller.signal)
      .then((version) => {
        if (active) setAllowed(projectPreviewIndexGate(version).indexAllowed);
      })
      .catch(() => {
        if (active) setAllowed(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const onHashChange = () => setIndexOpen(isPreviewIndexHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const openIndex = useCallback((fromLauncher: boolean) => {
    returnFocusRequestedRef.current = fromLauncher;
    if (window.location.hash !== PREVIEW_INDEX_HASH) {
      window.location.hash = PREVIEW_INDEX_HASH;
    } else {
      setIndexOpen(true);
    }
  }, []);

  const closeIndex = useCallback(() => {
    if (window.location.hash) {
      window.location.hash = "";
    }
  }, []);

  const cancelLauncherRestore = useCallback(() => {
    returnFocusRequestedRef.current = false;
  }, []);

  return {
    allowed,
    indexOpen,
    returnFocusRequestedRef,
    openIndex,
    closeIndex,
    cancelLauncherRestore,
  };
}
