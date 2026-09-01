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
  const initialRoute = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    document.title = `${label} · HAU-USC Logistics`;

    if (initialRoute.current && !focusOnMount) {
      initialRoute.current = false;
      return;
    }
    initialRoute.current = false;

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
