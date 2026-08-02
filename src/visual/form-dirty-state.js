function normalizedScalar(value) {
  return String(value ?? '').replace(/\r\n?/gu, '\n');
}

export function normalizedFormSnapshot(form) {
  const entries = [];
  for (const field of Array.from(form?.elements ?? [])) {
    if (!field?.name || field.disabled) continue;
    const type = String(field.type ?? '').toLowerCase();
    if (['button', 'submit', 'reset', 'image'].includes(type)) continue;
    if (type === 'checkbox' || type === 'radio') {
      entries.push([
        field.name,
        type,
        field.checked ? 'checked' : 'unchecked',
        normalizedScalar(field.value),
      ]);
      continue;
    }
    if (type === 'file') {
      const files = Array.from(field.files ?? []).map((file) => [file.name, file.size, file.lastModified]);
      entries.push([field.name, type, files]);
      continue;
    }
    if (field.multiple && field.options) {
      const values = Array.from(field.options)
        .filter((option) => option.selected)
        .map((option) => normalizedScalar(option.value));
      entries.push([field.name, type, values]);
      continue;
    }
    entries.push([field.name, type, normalizedScalar(field.value)]);
  }
  return JSON.stringify(entries);
}

export function createFormDirtyTracker(snapshot = normalizedFormSnapshot) {
  const baselines = new WeakMap();
  const dirtyForms = new Set();

  const register = (form) => {
    if (form && !baselines.has(form)) baselines.set(form, snapshot(form));
    return form;
  };
  const update = (form) => {
    if (!form) return false;
    register(form);
    if (snapshot(form) === baselines.get(form)) dirtyForms.delete(form);
    else dirtyForms.add(form);
    return dirtyForms.has(form);
  };
  const markClean = (form) => {
    if (!form) return;
    baselines.set(form, snapshot(form));
    dirtyForms.delete(form);
  };
  const cleanDisconnected = () => {
    for (const form of dirtyForms) if (form.isConnected === false) dirtyForms.delete(form);
  };
  const isDirty = (root = null) => {
    cleanDisconnected();
    for (const form of dirtyForms) {
      if (!root || root === form || root.contains?.(form)) return true;
    }
    return false;
  };
  const discard = (root = null) => {
    for (const form of [...dirtyForms]) {
      if (!root || root === form || root.contains?.(form)) {
        dirtyForms.delete(form);
        baselines.delete(form);
      }
    }
  };
  const markAllClean = () => {
    for (const form of [...dirtyForms]) markClean(form);
  };

  return { register, update, markClean, isDirty, discard, markAllClean };
}
