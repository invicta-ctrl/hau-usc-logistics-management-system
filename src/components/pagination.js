export function paginate(rows, page = 1, pageSize = 10) {
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  return {
    rows: rows.slice((current - 1) * pageSize, current * pageSize),
    page: current,
    pages,
    total: rows.length,
  };
}

export function pagination({ page, pages, total, target }) {
  return `<nav class="pagination" aria-label="${target} pagination"><button class="secondary" type="button" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>Previous</button><span>Page ${page} of ${pages} · ${total} results</span><button class="secondary" type="button" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>Next</button></nav>`;
}
