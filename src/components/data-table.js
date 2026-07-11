export function dataTable({ caption, columns, rows, rowRenderer }) {
  return `<div class="table-wrap desktop-table"><table><caption>${caption}</caption><thead><tr>${columns.map((column) => `<th scope="col">${column}</th>`).join('')}</tr></thead><tbody>${rows.map(rowRenderer).join('')}</tbody></table></div>`;
}
