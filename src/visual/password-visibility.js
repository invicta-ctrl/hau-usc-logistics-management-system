const EYE_ICON = `
  <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <circle cx="12" cy="12" r="2.75" fill="none" stroke="currentColor" stroke-width="1.8"/>
  </svg>`;

const EYE_OFF_ICON = `
  <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
    <path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-2.5 3.1M6.2 6.3A15.7 15.7 0 0 0 2.5 12s3.5 6 9.5 6a9.8 9.8 0 0 0 3-.5M9.9 9.8a3 3 0 0 0 4.3 4.3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buttonContent(revealed) {
  return `${revealed ? EYE_OFF_ICON : EYE_ICON}<span>${revealed ? 'Hide' : 'Show'}</span>`;
}

export function passwordVisibilityToggleMarkup(inputId) {
  const id = escapeHtml(inputId);
  return `<button class="auth-password-toggle" type="button" data-password-visibility-toggle="${id}" aria-controls="${id}" aria-label="Show password" aria-pressed="false">${buttonContent(false)}</button>`;
}

export function passwordFieldMarkup({
  id,
  name,
  autocomplete,
  label = 'Password',
  describedBy = '',
  minlength = '',
  maxlength = '128',
  required = true,
}) {
  const describedByAttribute = describedBy ? ` aria-describedby="${escapeHtml(describedBy)}"` : '';
  const minlengthAttribute = minlength ? ` minlength="${escapeHtml(minlength)}"` : '';
  const requiredAttribute = required ? ' required' : '';
  const escapedId = escapeHtml(id);
  return `
    <label for="${escapedId}">${escapeHtml(label)}</label>
    <div class="auth-password-control">
      <input id="${escapedId}" name="${escapeHtml(name)}" type="password" autocomplete="${escapeHtml(autocomplete)}"${requiredAttribute}${minlengthAttribute} maxlength="${escapeHtml(maxlength)}"${describedByAttribute}>
      ${passwordVisibilityToggleMarkup(id)}
    </div>`;
}

function findInput(root, id) {
  return Array.from(root?.querySelectorAll?.('input') ?? []).find((input) => input.id === id) ?? null;
}

export function togglePasswordVisibility(button, root) {
  const inputId = button?.dataset?.passwordVisibilityToggle ?? button?.getAttribute?.('aria-controls') ?? '';
  const input = findInput(root, inputId);
  if (!input || !['password', 'text'].includes(input.type)) return false;

  const start = input.selectionStart;
  const end = input.selectionEnd;
  const reveal = input.type === 'password';
  input.type = reveal ? 'text' : 'password';
  button.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
  button.setAttribute('aria-pressed', String(reveal));
  button.innerHTML = buttonContent(reveal);
  input.focus?.({ preventScroll: true });
  if (Number.isInteger(start) && Number.isInteger(end)) input.setSelectionRange?.(start, end);
  return true;
}

export function attachPasswordVisibilityControls(root) {
  root?.querySelectorAll?.('[data-password-visibility-toggle]').forEach((button) => {
    if (button.dataset.passwordVisibilityBound === 'true') return;
    button.dataset.passwordVisibilityBound = 'true';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      togglePasswordVisibility(button, root);
    });
  });
}
