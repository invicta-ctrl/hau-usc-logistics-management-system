import { useCallback, useEffect, useRef, useState } from 'react';
import type { Route } from '../../app/appTypes';
import {
  isProtectedPreviewRoute,
  previewInspectionAllowed,
  PREVIEW_INSPECTION_OFF,
  type PreviewIndexBrowseState,
  type PreviewInspectionState,
} from './inspection';
import { loadFrontendVersion } from '../../integration/frontendVersion';
import {
  isPreviewIndexHash,
  PREVIEW_INDEX_HASH,
  previewInspectionHash,
  previewInspectionRouteFromHash,
} from './routeHash';
import { projectPreviewIndexGate } from './trustedGate';

export function usePreviewIndex() {
  const [gateState, setGateState] = useState<'CHECKING' | 'ALLOWED' | 'DENIED'>('CHECKING');
  const allowed = gateState === 'ALLOWED';
  const [indexOpen, setIndexOpen] = useState(() => isPreviewIndexHash(window.location.hash));
  const [inspection, setInspection] = useState<PreviewInspectionState>(PREVIEW_INSPECTION_OFF);
  const [browseState, setBrowseState] = useState<PreviewIndexBrowseState>({
    query: '',
    filter: 'ALL',
    scrollTop: 0,
  });
  const returnFocusRequestedRef = useRef(false);

  useEffect(() => {
    let active = true;
    loadFrontendVersion()
      .then((version) => {
        if (active) {
          setGateState(projectPreviewIndexGate(version).indexAllowed ? 'ALLOWED' : 'DENIED');
        }
      })
      .catch(() => {
        if (active) setGateState('DENIED');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const syncPreviewRoute = () => {
      const route = previewInspectionRouteFromHash(window.location.hash);
      if (
        route &&
        previewInspectionAllowed({
          indexAllowed: allowed,
          indexOpen: false,
          explicitIndexAction: false,
          directInspectionRoute: true,
        })
      ) {
        setInspection({ mode: 'INDEX_INSPECTION', route });
        setIndexOpen(false);
        return;
      }
      setInspection(PREVIEW_INSPECTION_OFF);
      setIndexOpen(isPreviewIndexHash(window.location.hash));
    };
    syncPreviewRoute();
    window.addEventListener('hashchange', syncPreviewRoute);
    return () => window.removeEventListener('hashchange', syncPreviewRoute);
  }, [allowed]);

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
        !previewInspectionAllowed({
          indexAllowed: allowed,
          indexOpen,
          explicitIndexAction: true,
          directInspectionRoute: inspection.mode === 'INDEX_INSPECTION',
        })
      ) {
        return false;
      }
      const targetHash = previewInspectionHash(route);
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      } else {
        setInspection({ mode: 'INDEX_INSPECTION', route });
        setIndexOpen(false);
      }
      return true;
    },
    [allowed, indexOpen, inspection.mode],
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
    gatePendingForRequestedRoute:
      gateState === 'CHECKING' &&
      (isPreviewIndexHash(window.location.hash) ||
        previewInspectionRouteFromHash(window.location.hash) !== null),
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
