let activeLayer = null;
let lastTrigger = null;

function focusable(root) {
  return [
    ...root.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ];
}
function setBackgroundInert(value) {
  const shell = document.querySelector('.app-shell');
  if (shell) shell.inert = value;
}

export function closeLayer() {
  if (!activeLayer) return;
  activeLayer.remove();
  activeLayer = null;
  setBackgroundInert(false);
  lastTrigger?.focus?.();
  lastTrigger = null;
}

function mountLayer({ title, body, kind, onMount, dismissible = true }) {
  closeLayer();
  lastTrigger = document.activeElement;
  const root = document.getElementById('layer-root');
  const backdrop = document.createElement('div');
  backdrop.className = kind === 'drawer' ? 'drawer-backdrop' : 'modal-backdrop';
  backdrop.innerHTML = `<section class="${kind}" role="dialog" aria-modal="true" aria-labelledby="layer-title"><div class="layer-head"><div><p class="eyebrow">Preview workflow</p><h2 id="layer-title">${title}</h2></div>${dismissible ? '<button class="icon-button" type="button" data-layer-close aria-label="Close dialog">×</button>' : ''}</div><div data-layer-body>${body}</div></section>`;
  root.append(backdrop);
  activeLayer = backdrop;
  setBackgroundInert(true);
  const dialog = backdrop.querySelector('[role="dialog"]');
  const trap = (event) => {
    if (event.key === 'Escape' && dismissible) {
      event.preventDefault();
      closeLayer();
      return;
    }
    if (event.key !== 'Tab') return;
    const nodes = focusable(dialog);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  backdrop.addEventListener('keydown', trap);
  backdrop.addEventListener('click', (event) => {
    if (event.target.closest('[data-layer-close]')) closeLayer();
  });
  onMount?.(backdrop.querySelector('[data-layer-body]'), closeLayer);
  requestAnimationFrame(() => (focusable(dialog)[0] ?? dialog).focus());
  return backdrop;
}

export function openModal(options) {
  return mountLayer({ ...options, kind: 'modal' });
}
export function openDrawer(options) {
  return mountLayer({ ...options, kind: 'drawer' });
}

export function openConfirmation({
  title,
  summary,
  effects = [],
  confirmLabel = 'Confirm preview action',
  onConfirm,
}) {
  return openModal({
    title,
    body: `<div class="stack"><div class="alert"><div><strong>Review the exact effects</strong><p>${summary}</p></div></div><ul>${effects.map((effect) => `<li>${effect}</li>`).join('')}</ul><div class="button-row"><button class="secondary" type="button" data-layer-close>Cancel</button><button class="primary" type="button" data-confirm-action>${confirmLabel}</button></div><div data-operation-error></div></div>`,
    onMount(root, close) {
      root.querySelector('[data-confirm-action]').addEventListener('click', async (event) => {
        const button = event.currentTarget;
        button.disabled = true;
        button.textContent = 'Posting safely…';
        try {
          await onConfirm();
          close();
        } catch (error) {
          root.querySelector('[data-operation-error]').innerHTML =
            `<div class="alert error section-gap"><div><strong>${error.code ?? 'Operation failed'}</strong><p>${error.message} Incident ${error.correlationId ?? 'pending'}.</p></div></div>`;
          button.disabled = false;
          button.textContent = confirmLabel;
        }
      });
    },
  });
}
