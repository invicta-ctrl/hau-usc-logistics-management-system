export function mobileCardList(rows, renderer) {
  return `<div class="mobile-card-list">${rows.map(renderer).join('')}</div>`;
}
