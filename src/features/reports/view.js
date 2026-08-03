import { statusChip, escapeHtml } from '../../components/status-chip.js';
import { permissionsFor } from '../../domain/permissions.js';
import { openConfirmation } from '../../components/modal.js';
import { presentationLabel } from '../../domain/presentation-labels.js';

const reportTypes = [
  'OSA inventory form preparation',
  'Inventory movement report',
  'Event fulfillment and consumption summary',
  'Request status summary',
  'Restock history',
  'Overdue loans',
  'Canvass comparison and supplier price history',
  'Evidence index',
  'Audit log',
  'Term-end handoff pack manifest',
];

function download(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function renderReports(ctx) {
  const warnings = ctx.selectors.warnings(ctx.state);
  const permissions = permissionsFor(ctx.state.role);
  return `<div class="view-grid"><section class="panel hero"><p class="eyebrow">Reports & Admin Preview</p><h2>Derived exports, evidence index, audit log, and diagnostics.</h2><p>Google Sheets is a future reporting/export destination—not the quantity source of truth.</p></section><section class="panel"><div class="panel-head"><div><h2>Browser-generated reports</h2><p>JSON and CSV generation uses authoritative preview state only.</p></div><span class="pill">${reportTypes.length} report structures</span></div><div class="grid-2">${reportTypes.map((title) => `<article class="card"><h3>${title}</h3><p class="muted">Preview export structure; no external service required.</p><div class="button-row section-gap"><button class="secondary" data-export-json="${escapeHtml(title)}">Export JSON</button><button class="ghost" data-export-csv="${escapeHtml(title)}">Export CSV</button></div></article>`).join('')}</div></section><section class="panel"><div class="panel-head"><div><h2>Preview diagnostics</h2><p>Visible to Administrator role only in the demonstration UI.</p></div>${statusChip(ctx.state.previewMode ? 'FOR_REVIEW' : 'COMPLETED', ctx.state.previewMode ? 'Preview mode' : 'Production')}</div>${
    permissions.diagnostics
      ? `<div class="grid-4"><article class="card metric"><span>Schema</span><strong>v${ctx.state.schemaVersion}</strong><small>${ctx.state.appVersion}</small></article><article class="card metric"><span>Backend</span><strong>${ctx.state.backendMode}</strong><small>No external writes</small></article><article class="card metric"><span>Records</span><strong>${Object.values(
          ctx.state,
        )
          .filter(Array.isArray)
          .reduce(
            (sum, rows) => sum + rows.length,
            0,
          )}</strong><small>Across preview entities</small></article><article class="card metric"><span>Warnings</span><strong>${warnings.length}</strong><small>Data quality checks</small></article></div><div class="alert section-gap"><div><strong>Last correlation ID</strong><p>${ctx.state.lastCorrelationId}</p></div></div><div class="button-row section-gap"><button class="secondary" data-export-state>Export demo state</button><button class="danger" data-reset-state>Reset demo state</button></div>`
      : '<div class="alert"><div><strong>Administrator preview role required</strong><p>Role switching only demonstrates visibility; production authorization must be server-enforced.</p></div></div>'
  }</section><section class="panel"><div class="panel-head"><div><h2>Data-quality warnings</h2><p>Raw exceptions are retained for audit views.</p></div><span class="pill">${warnings.length}</span></div><div class="list">${warnings.map((warning) => `<div class="list-item"><span><strong>${presentationLabel(warning.code)}</strong><small>${warning.entityId}${warning.value !== undefined ? ` · raw ${warning.value}` : ''}</small></span>${statusChip('FOR_REVIEW')}</div>`).join('') || '<div class="empty-state"><h3>No detected data-quality exceptions</h3><p>Duplicate IDs, negative stock, orphan reservations, and stale quotes are monitored.</p></div>'}</div></section></div>`;
}

export function mountReports(ctx, root) {
  root.querySelectorAll('[data-export-json]').forEach((button) =>
    button.addEventListener('click', () =>
      download(
        `${button.dataset.exportJson.replaceAll(' ', '-').toLowerCase()}.json`,
        JSON.stringify(
          {
            report: button.dataset.exportJson,
            generatedAt: new Date().toISOString(),
            previewMode: true,
            data: ctx.state,
          },
          null,
          2,
        ),
        'application/json',
      ),
    ),
  );
  root
    .querySelectorAll('[data-export-csv]')
    .forEach((button) =>
      button.addEventListener('click', () =>
        download(
          `${button.dataset.exportCsv.replaceAll(' ', '-').toLowerCase()}.csv`,
          `report,generated_at,preview_mode\n"${button.dataset.exportCsv}",${new Date().toISOString()},true\n`,
          'text/csv',
        ),
      ),
    );
  root
    .querySelector('[data-export-state]')
    ?.addEventListener('click', () =>
      download('hau-usc-logistics-preview-state.json', ctx.store.export(), 'application/json'),
    );
  root.querySelector('[data-reset-state]')?.addEventListener('click', () =>
    openConfirmation({
      title: 'Reset preview state',
      summary: 'All local preview changes will be replaced by the fixed demonstration dataset.',
      effects: [
        'No Google data affected',
        'Current local preview JSON can be exported first',
        'Schema remains at current version',
      ],
      confirmLabel: 'Reset demo safely',
      onConfirm: async () => {
        ctx.store.reset();
        ctx.toast('Fixed demo state restored.');
      },
    }),
  );
}
