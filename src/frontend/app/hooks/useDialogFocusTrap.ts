import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  "[tabindex]:not([tabindex='-1'])",
].join(',');

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getAttribute('aria-hidden') !== 'true' && element.tabIndex >= 0,
  );
}

/**
 * Keeps focus in a temporary modal surface and returns it to the invoking
 * control on close. Escape and visibility are intentionally left to each
 * surface, so their routing semantics remain local.
 */
export function useDialogFocusTrap({
  open,
  dialogRef,
  inertSelector,
}: {
  open: boolean;
  dialogRef: RefObject<HTMLElement | null>;
  /** Background regions made unavailable to pointer, keyboard and AT while open. */
  inertSelector?: string;
}) {
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const active = document.activeElement;
    restoreFocusRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
    const inertSnapshots = inertSelector
      ? Array.from(document.querySelectorAll<HTMLElement>(inertSelector))
          .filter((element) => element !== dialog && !element.contains(dialog))
          .map((element) => ({
            element,
            inert: element.inert,
            ariaHidden: element.getAttribute('aria-hidden'),
          }))
      : [];

    for (const snapshot of inertSnapshots) {
      snapshot.element.inert = true;
      snapshot.element.setAttribute('aria-hidden', 'true');
    }

    const focusInitial = () => {
      const preferred = dialog.querySelector<HTMLElement>('[data-dialog-initial-focus]');
      const target = preferred ?? focusableElements(dialog)[0] ?? dialog;
      target.focus();
    };

    const frame = requestAnimationFrame(focusInitial);
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = focusableElements(dialog);
      if (!items.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const current = document.activeElement as HTMLElement | null;
      const first = items[0];
      const last = items.at(-1)!;
      if (event.shiftKey && (current === first || !current || !dialog.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !current || !dialog.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', trapTab);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', trapTab);
      for (const snapshot of inertSnapshots) {
        snapshot.element.inert = snapshot.inert;
        if (snapshot.ariaHidden === null) snapshot.element.removeAttribute('aria-hidden');
        else snapshot.element.setAttribute('aria-hidden', snapshot.ariaHidden);
      }
      const restore = restoreFocusRef.current;
      restoreFocusRef.current = null;
      if (restore?.isConnected) restore.focus();
    };
  }, [dialogRef, inertSelector, open]);
}
