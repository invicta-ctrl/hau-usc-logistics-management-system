export function resultSummary(count, noun) {
  return `<span role="status" aria-live="polite">${count} ${noun}${count === 1 ? '' : 's'}</span>`;
}
