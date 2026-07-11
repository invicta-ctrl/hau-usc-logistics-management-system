export function bindAutocomplete({ input, listbox, items, onSelect }) {
  let active = -1;
  const render = () => {
    const query = input.value.trim().toLowerCase();
    const matches = query ? items.filter((item) => item.searchText.includes(query)).slice(0, 8) : [];
    active = Math.min(active, matches.length - 1);
    listbox.innerHTML = matches
      .map(
        (item, index) =>
          `<div role="option" id="ac-${item.id}" data-value="${item.id}" aria-selected="${index === active}"><strong>${item.name}</strong><small>${item.id} · ${item.category} · ${item.unit}</small></div>`,
      )
      .join('');
    listbox.classList.toggle('hidden', !matches.length);
    input.setAttribute('aria-expanded', String(Boolean(matches.length)));
    input.setAttribute('aria-activedescendant', active >= 0 ? `ac-${matches[active].id}` : '');
    return matches;
  };
  input.addEventListener('input', () => {
    active = -1;
    render();
  });
  input.addEventListener('keydown', (event) => {
    const matches = render();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      active = Math.min(matches.length - 1, active + 1);
      render();
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      active = Math.max(0, active - 1);
      render();
    }
    if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      onSelect(matches[active]);
      listbox.classList.add('hidden');
    }
    if (event.key === 'Escape') {
      listbox.classList.add('hidden');
      input.setAttribute('aria-expanded', 'false');
    }
  });
  listbox.addEventListener('mousedown', (event) => {
    const option = event.target.closest('[role="option"]');
    const item = items.find((row) => row.id === option?.dataset.value);
    if (item) {
      event.preventDefault();
      onSelect(item);
      listbox.classList.add('hidden');
    }
  });
}
