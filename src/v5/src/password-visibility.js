import { icon } from './icons.js';

function buttonContent(revealed) {
  return `${icon(revealed ? 'eye-off' : 'eye', 'icon--sm')}<span>${revealed ? 'Hide' : 'Show'}</span>`;
}

export function passwordVisibilityToggleMarkup(inputId) {
  const id = String(inputId);
  return `<button class="field__password-toggle" type="button" data-act="toggle-password-visibility"
    data-password-visibility-toggle="${id}" aria-controls="${id}" aria-label="Show password" aria-pressed="false">${buttonContent(false)}</button>`;
}

export function passwordVisibilityToggleDefinition(inputId) {
  const id = String(inputId);
  return {
    attrs: {
      type: 'button',
      'data-act': 'toggle-password-visibility',
      'data-password-visibility-toggle': id,
      'aria-controls': id,
      'aria-label': 'Show password',
      'aria-pressed': 'false',
    },
    content: buttonContent(false),
  };
}

function controlledInput(button, root) {
  const id = button?.dataset?.passwordVisibilityToggle || button?.getAttribute?.('aria-controls');
  if (!id) return null;
  return Array.from(root?.querySelectorAll?.('input') ?? []).find((input) => input.id === id) ?? null;
}

export function togglePasswordVisibility(button, root = document) {
  const input = controlledInput(button, root);
  if (!input || (input.type !== 'password' && input.type !== 'text')) return false;

  const selectionStart = input.selectionStart;
  const selectionEnd = input.selectionEnd;
  const revealed = input.type === 'password';
  input.type = revealed ? 'text' : 'password';
  button.setAttribute('aria-pressed', String(revealed));
  button.setAttribute('aria-label', revealed ? 'Hide password' : 'Show password');
  button.innerHTML = buttonContent(revealed);
  input.focus({ preventScroll: true });
  if (Number.isInteger(selectionStart) && Number.isInteger(selectionEnd)) {
    input.setSelectionRange(selectionStart, selectionEnd);
  }
  return true;
}
