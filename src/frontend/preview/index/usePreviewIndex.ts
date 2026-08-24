import { useCallback, useEffect, useRef, useState } from 'react';
import type { Route } from '../../app/appTypes';
import {
  isProtectedPreviewRoute,
  localPreviewInspectionAllowed,
  PREVIEW_INSPECTION_OFF,
  type PreviewIndexBrowseState,
  type PreviewInspectionState,
} from './inspection';
import { frontendBackend } from '../../integration/backend';
import { isPreviewIndexHash, PREVIEW_INDEX_HASH } from './routeHash';
import { projectPreviewIndexGate } from './trustedGate';

export function usePreviewIndex() {
  const [allowed, setAllowed] = useState(false);
  const [indexOpen, setIndexOpen] = useState(() => isPreviewIndexHash(window.location.hash));
  const [inspection, setInspection] = useState<PreviewInspectionState>(PREVIEW_INSPECTION_OFF);
  const [browseState, setBrowseState] = useState<PreviewIndexBrowseState>({
    query: '',
    filter: 'ALL',
    scrollTop: 0,
  });
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
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
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
    setInspection(PREVIEW_INSPECTION_OFF);
    if (window.location.hash) {
      window.location.hash = '';
    }
  }, []);

  const cancelLauncherRestore = useCallback(() => {
    returnFocusRequestedRef.current = false;
  }, []);

  const openInspection = useCallback(
    (route: Route) => {
      if (
        !isProtectedPreviewRoute(route) ||
        !localPreviewInspectionAllowed({
          indexAllowed: allowed,
          indexOpen,
          explicitIndexAction: true,
        })
      ) {
        return false;
      }
      setInspection({ mode: 'LOCAL_INDEX_INSPECTION', route });
      return true;
    },
    [allowed, indexOpen],
  );

  const returnToIndex = useCallback(() => {
    setInspection(PREVIEW_INSPECTION_OFF);
    if (window.location.hash !== PREVIEW_INDEX_HASH) {
      window.location.hash = PREVIEW_INDEX_HASH;
    } else {
      setIndexOpen(true);
    }
    requestAnimationFrame(() => window.scrollTo({ top: browseState.scrollTop }));
  }, [browseState.scrollTop]);

  return {
    allowed,
    indexOpen,
    returnFocusRequestedRef,
    openIndex,
    closeIndex,
    cancelLauncherRestore,
    inspection,
    browseState,
    setBrowseState,
    openInspection,
    returnToIndex,
  };
}
