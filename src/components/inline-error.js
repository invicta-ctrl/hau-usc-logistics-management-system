export function fieldError(name, message) {
  return message ? `<span id="${name}-error" class="field-error">${message}</span>` : '';
}

export function applyFieldErrors(form, errors = {}) {
  for (const [name, message] of Object.entries(errors)) {
    const field = form.elements.namedItem(name);
    if (!field) continue;
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', `${name}-error`);
    let node = form.querySelector(`#${CSS.escape(name)}-error`);
    if (!node) {
      node = document.createElement('span');
      node.id = `${name}-error`;
      node.className = 'field-error';
      field.insertAdjacentElement('afterend', node);
    }
    node.textContent = message;
  }
  const first = form.querySelector('[aria-invalid="true"]');
  first?.focus();
}
