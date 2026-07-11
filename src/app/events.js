export function announce(message) {
  const node = document.getElementById('announcer');
  if (!node) return;
  node.textContent = '';
  requestAnimationFrame(() => {
    node.textContent = message;
  });
}

export function debounce(fn, delay = 180) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
