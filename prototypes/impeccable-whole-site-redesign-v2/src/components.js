/* Reusable preview primitives. Each returns an HTML string.
   Accessibility contracts live here so every surface inherits them. */

import { icon } from './icons.js';
import { statusLabel, tone } from './data/vocabulary.js';

export const esc = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

let uid = 0;
export const nextId = (prefix = 'x') => `${prefix}-${++uid}`;

/* ---------- Theme toggle ----------
   Sun in light, moon in dark. Both glyphs stay in the DOM; motion.css rotates
   and crossfades between them so pressing transforms the icon rather than
   swapping it. The accessible name describes the ACTION; aria-pressed reports
   whether dark is active, so the announced state stays truthful. */

export function themeToggle(dark) {
  return `<button class="icon-button theme-toggle" type="button" data-act="toggle-theme"
    aria-pressed="${!!dark}"
    aria-label="${dark ? 'Switch to light mode' : 'Switch to dark mode'}">
    <span class="theme-toggle__icons">
      ${icon('sun', 'theme-toggle__sun')}
      ${icon('moon', 'theme-toggle__moon')}
    </span>
  </button>`;
}

/* ---------- Status chip: colour never travels alone ---------- */

export function chip(status) {
  const t = tone(status);
  const glyph = t === 'alert' ? icon('alert') : '';
  return `<span class="chip" data-tone="${t}">${glyph}${esc(statusLabel(status))}</span>`;
}

/* ---------- Page header ---------- */

export function pageHead({ crumbs = [], title, lede = '', actions = '' }) {
  const trail = crumbs.length
    ? `<nav class="breadcrumbs" aria-label="Breadcrumb">${crumbs
        .map((c, i) =>
          i === crumbs.length - 1
            ? `<b aria-current="page">${esc(c)}</b>`
            : `<span>${esc(c)}</span><span aria-hidden="true">/</span>`,
        )
        .join('')}</nav>`
    : '';
  return `<header class="page-head">
    <div class="page-head__title">${trail}<h1>${esc(title)}</h1>${
      lede ? `<p>${esc(lede)}</p>` : ''
    }</div>
    ${actions ? `<div class="page-head__actions">${actions}</div>` : ''}
  </header>`;
}

/* ---------- Attention band ---------- */

export function attentionBand(items) {
  return `<section class="attention" aria-label="Attention summary">
    ${items
      .map(
        (m) => `<button class="attention__item" type="button" data-urgent="${!!m.urgent}"
        data-act="${esc(m.act ?? 'noop')}">
        <span class="attention__label">${icon(m.icon, 'icon--sm icon--muted')}${esc(m.label)}</span>
        <span class="attention__value num">${esc(m.value)}</span>
        <span class="attention__note">${esc(m.note)}</span>
      </button>`,
      )
      .join('')}
  </section>`;
}

export function contextLine(pairs) {
  return `<p class="context-line">${pairs
    .map((p) => `<span>${esc(p.label)} <b>${esc(p.value)}</b></span>`)
    .join('')}<span class="illustrative">${icon(
    'info',
    'icon--sm icon--muted',
  )}All figures are illustrative preview data.</span></p>`;
}

/* ---------- Queue table ----------
   Semantic <table>. Rows are focusable buttons in the first cell so keyboard
   users reach the detail without a synthetic row role. Column priority
   classes decide what a narrow container drops — never status or quantity. */

export function queueTable({ caption, columns, rows, selectedRef = null }) {
  return `<div class="table-wrap"><table class="q">
    <caption>${esc(caption)}</caption>
    <thead><tr>${columns
      .map(
        (c) =>
          `<th scope="col"${c.priority ? ` class="col-p${c.priority}"` : ''}${
            c.numeric ? ' style="text-align:right"' : ''
          }>${esc(c.label)}</th>`,
      )
      .join('')}</tr></thead>
    <tbody>${rows
      .map(
        (r) => `<tr${r.ref === selectedRef ? ' aria-selected="true"' : ''}>${r.cells
          .map(
            (cell, i) =>
              `<${i === 0 ? 'th scope="row"' : 'td'}${
                columns[i]?.priority ? ` class="col-p${columns[i].priority}"` : ''
              }${columns[i]?.numeric ? ' class="q__num"' : ''}>${cell}</${i === 0 ? 'th' : 'td'}>`,
          )
          .join('')}</tr>`,
      )
      .join('')}</tbody>
  </table></div>`;
}

export function rowLink(ref, title, sub, act = 'open') {
  return `<button class="q__link" type="button" data-act="${esc(act)}" data-ref="${esc(ref)}">
    <b>${esc(title)}</b><span>${esc(sub)}</span>
  </button>`;
}

/* ---------- Quantity ---------- */

export function qty(value, unit) {
  if (value === null || value === undefined) return `<span class="muted">Not recorded</span>`;
  return `<span class="qty"><b>${esc(value)}</b><span>${esc(unit)}</span></span>`;
}

export function meter(done, total, toneName = 'progress') {
  if (!total) return `<span class="muted">Not assessed</span>`;
  const pct = Math.round((done / total) * 100);
  // scaleX rather than width so progress animates without layout thrash.
  return `<span class="qty"><b>${done}</b><span>of ${total}</span></span>
    <span class="meter" data-tone="${toneName}" role="img"
      aria-label="${pct}% complete"><span style="transform:scaleX(${pct / 100})"></span></span>`;
}

/* ---------- Facts ---------- */

export function facts(pairs) {
  return `<dl class="facts">${pairs
    .map(
      (p) =>
        `<div><dt>${esc(p.label)}</dt><dd>${p.html ?? esc(p.value ?? 'Not recorded')}</dd></div>`,
    )
    .join('')}</dl>`;
}

/* ---------- Timeline ---------- */

export function timeline(steps) {
  return `<ol class="timeline">${steps
    .map(
      (s) => `<li data-done="${!!s.done}" data-current="${!!s.current}">
      <span class="timeline__dot">${s.done ? icon('check') : ''}</span>
      <span class="timeline__body"><b>${esc(s.title)}</b><span>${esc(s.meta)}</span></span>
    </li>`,
    )
    .join('')}</ol>`;
}

/* ---------- Stepper ---------- */

export function stepper(steps, currentIndex) {
  return `<ol class="stepper">${steps
    .map(
      (s, i) =>
        `<li${i === currentIndex ? ' aria-current="step"' : ''} data-done="${
          i < currentIndex
        }"><span>${esc(s)}</span></li>`,
    )
    .join('')}</ol>`;
}

/* ---------- States ---------- */

export function emptyState({ title, body, action = '' }) {
  return `<div class="state"><span class="state__mark">${icon(
    'inbox',
  )}</span><h2>${esc(title)}</h2><p>${esc(body)}</p>${action}</div>`;
}

export function loadingState(rows = 5) {
  return `<div class="table-wrap" aria-busy="true" aria-live="polite">
    <p class="visually-hidden">Loading records.</p>
    ${Array.from({ length: rows })
      .map(
        (_, i) =>
          `<div style="display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr) 92px;gap:16px;padding:13px 10px;border-bottom:1px solid var(--line)">
        <span class="skeleton" style="height:13px;width:${68 + ((i * 7) % 26)}%"></span>
        <span class="skeleton" style="height:13px;width:52%"></span>
        <span class="skeleton" style="height:20px;border-radius:999px"></span>
      </div>`,
      )
      .join('')}
  </div>`;
}

export function notice({ tone: t = 'info', title, body, action = '' }) {
  const glyph = t === 'alert' ? 'alert' : t === 'done' ? 'check' : 'info';
  return `<div class="notice" data-tone="${t}" role="${
    t === 'alert' ? 'alert' : 'status'
  }">${icon(glyph)}<div><b>${esc(title)}</b><p>${esc(body)}</p>${action}</div></div>`;
}

export function deniedState() {
  return `<div class="state"><span class="state__mark">${icon('lock')}</span>
    <h2>You do not have access to this area</h2>
    <p>This workspace is limited to the System Owner. Your current role is Administrator.
       Nothing was changed. Ask the System Owner if you need this view.</p>
    <a class="btn" href="#/admin.overview">Return to your overview</a></div>`;
}

/* ---------- Evidence ---------- */

export function evidenceList(items) {
  return `<ul class="evidence">${items
    .map(
      (e) => `<li><span class="evidence__mark">${icon('file')}</span>
      <span><b>${esc(e.name)}</b><span>${esc(e.meta)}</span></span>
      <span class="chip" data-tone="${e.tone}">${esc(e.state)}</span></li>`,
    )
    .join('')}</ul>`;
}

/* ---------- Form field ---------- */

export function field({
  label: labelText,
  name,
  type = 'text',
  value = '',
  hint = '',
  error = '',
  required = false,
  options = null,
  textarea = false,
}) {
  const id = nextId('f');
  const hintId = hint ? `${id}-hint` : '';
  const errId = error ? `${id}-err` : '';
  const describedBy = [hintId, errId].filter(Boolean).join(' ');
  const describe = describedBy ? ` aria-describedby="${describedBy}"` : '';
  const invalid = error ? ' aria-invalid="true"' : '';
  const req = required ? ' required' : '';

  let control;
  if (options) {
    control = `<select id="${id}" name="${esc(name)}"${describe}${invalid}${req}>${options
      .map((o) => `<option${o === value ? ' selected' : ''}>${esc(o)}</option>`)
      .join('')}</select>`;
  } else if (textarea) {
    control = `<textarea id="${id}" name="${esc(name)}"${describe}${invalid}${req}>${esc(
      value,
    )}</textarea>`;
  } else {
    control = `<input id="${id}" name="${esc(name)}" type="${esc(type)}" value="${esc(
      value,
    )}"${describe}${invalid}${req} />`;
  }

  return `<div class="field" data-invalid="${!!error}">
    <label for="${id}">${esc(labelText)}${
      required ? ' <span class="muted">(required)</span>' : ''
    }</label>
    ${control}
    ${hint ? `<span class="field__hint" id="${hintId}">${esc(hint)}</span>` : ''}
    ${
      error
        ? `<span class="field__error" id="${errId}">${icon(
            'alert',
            'icon--sm',
          )}${esc(error)}</span>`
        : ''
    }
  </div>`;
}

/* ---------- Composition bar (replaces the reference's decorative donut) ---------- */

export function composition(parts) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return `<div>
    <div class="composition" role="img" aria-label="${esc(
      parts.map((p) => `${p.label} ${Math.round((p.value / total) * 100)} percent`).join(', '),
    )}">
      ${parts
        .map(
          (p) =>
            `<span style="width:${(p.value / total) * 100}%;background:${p.color}"></span>`,
        )
        .join('')}
    </div>
    <ul class="composition-key" style="margin-top:12px">
      ${parts
        .map(
          (p) =>
            `<li><i style="background:${p.color}"></i><span>${esc(p.label)}</span><b>${
              p.value
            } (${Math.round((p.value / total) * 100)}%)</b></li>`,
        )
        .join('')}
    </ul>
  </div>`;
}

/* ---------- Receipt ---------- */

export function receipt({ ref, title, lines, footer }) {
  return `<div class="receipt">
    <div class="receipt__head">
      <span class="label">${esc(title)}</span>
      <span class="receipt__ref">${esc(ref)}</span>
      <span class="muted" style="font-size:var(--t-xs)">Keep this reference to track your request.</span>
    </div>
    <div class="receipt__body">${facts(lines)}${footer ?? ''}</div>
  </div>`;
}
