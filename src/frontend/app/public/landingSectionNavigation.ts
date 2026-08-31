/**
 * Returns to the public landing route, then moves viewport and focus to the
 * requested section after React has committed the route change.
 */
export function openLandingSection(sectionId: string, onHome: () => void) {
  onHome();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const section = document.getElementById(sectionId);
        const heading = document.getElementById(`${sectionId}-heading`);
        const focusTarget = heading ?? section;
        if (!section || !focusTarget) return;
        focusTarget.setAttribute('tabindex', '-1');
        section.scrollIntoView({ block: 'start', behavior: 'auto' });
        focusTarget.focus({ preventScroll: true });
        window.history.replaceState(null, '', `#${sectionId}`);
      });
    });
  });
}
