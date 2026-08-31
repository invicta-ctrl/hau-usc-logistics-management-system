import { useEffect, useRef } from 'react';

/**
 * Gives client-side route changes the same context reset as a document load.
 * The second animation frame runs after transient navigation cleanup restores
 * its opener, so the new main landmark is the final focus destination.
 */
export function useRouteFocus({
  routeKey,
  label,
  enabled = true,
  focusOnMount = false,
}: {
  routeKey: string;
  label: string;
  enabled?: boolean;
  focusOnMount?: boolean;
}) {
  const initialRouteKey = useRef(routeKey);

  useEffect(() => {
    if (!enabled) return;
    document.title = `${label} · HAU-USC Logistics`;

    // Compare the route identity instead of consuming a boolean. React
    // StrictMode replays mount effects in development; a one-shot boolean makes
    // that replay look like a client-side route change and steals restored focus.
    if (!focusOnMount && routeKey === initialRouteKey.current) return;

    let focusFrame = 0;
    const routeFrame = requestAnimationFrame(() => {
      focusFrame = requestAnimationFrame(() => {
        const main = document.getElementById('main-content');
        if (!main) return;
        main.classList.add('route-focus-target');
        main.setAttribute('tabindex', '-1');
        main.setAttribute('aria-label', label);
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        main.focus({ preventScroll: true });
      });
    });

    return () => {
      cancelAnimationFrame(routeFrame);
      cancelAnimationFrame(focusFrame);
    };
  }, [enabled, focusOnMount, label, routeKey]);
}
