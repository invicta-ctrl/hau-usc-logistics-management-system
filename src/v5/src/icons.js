/* Icon language, preserved from the v0.7.2 reference:
   24x24 viewBox, fill=none, stroke=currentColor, stroke-width 1.8,
   round caps and joins. One brand ink — status meaning lives in labels.
   The duplicate box/cube symbol pair in the reference is collapsed to one. */

const PATHS = {
  home: '<path d="m4 10 8-6 8 6v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1Z" stroke-linejoin="round"/>',
  inbox:
    '<path d="M5 5h14l2 10v4H3v-4Z" stroke-linejoin="round"/><path d="M3 14h5l2 3h4l2-3h5" stroke-linejoin="round"/>',
  repeat:
    '<path d="M17 4h3v3M7 20H4v-3M20 7a7 7 0 0 0-12-2L4 8m0 9a7 7 0 0 0 12 2l4-3" stroke-linecap="round" stroke-linejoin="round"/>',
  lending:
    '<path d="M5 4h11a2 2 0 0 1 2 2v10H7a2 2 0 0 0-2 2V4Z" stroke-linejoin="round"/><path d="M7 20h12V8h-1M9 8h5M9 12h5" stroke-linecap="round" stroke-linejoin="round"/><path d="m3 16 2 2 2-2" stroke-linecap="round" stroke-linejoin="round"/>',
  check: '<path d="m5 12 4 4L19 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  'arrow-down':
    '<path d="M12 4v15m-6-6 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>',
  'arrow-left': '<path d="M19 12H5m6-6-6 6 6 6" stroke-linecap="round" stroke-linejoin="round"/>',
  'arrow-right': '<path d="M5 12h14m-6-6 6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/>',
  box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z" stroke-linejoin="round"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9" stroke-linejoin="round"/>',
  calendar:
    '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16" stroke-linecap="round"/>',
  clipboard:
    '<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 5.5V4h6v1.5M8 10h8M8 14h6" stroke-linecap="round"/>',
  alert:
    '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v5M12 16h.01" stroke-width="2" stroke-linecap="round"/>',
  search: '<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5" stroke-linecap="round"/>',
  bell: '<path d="M6 17h12l-1.5-2v-4a4.5 4.5 0 0 0-9 0v4Z" stroke-linejoin="round"/><path d="M10 20h4" stroke-linecap="round"/>',
  moon: '<path d="M19.5 15.5A7.5 7.5 0 0 1 8.5 4.5 7.5 7.5 0 1 0 19.5 15.5Z" stroke-linejoin="round"/>',
  sun: '<circle cx="12" cy="12" r="4.5" stroke-linejoin="round"/><path d="M12 1v3M12 20v3M4.2 4.2l2 2M17.8 17.8l2 2M1 12h3M20 12h3M4.2 19.8l2-2M17.8 6.2l2-2" stroke-linecap="round"/>',
  chevron: '<path d="m7 10 5 5 5-5" stroke-linecap="round" stroke-linejoin="round"/>',
  'chevron-right': '<path d="m9 5 7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>',
  menu: '<path d="M5 7h14M5 12h9M5 17h14" stroke-linecap="round"/>',
  users:
    '<circle cx="9" cy="9" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 7a2.5 2.5 0 0 1 0 5M16 14.5a4.5 4.5 0 0 1 4.5 4.5" stroke-linecap="round"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1L14.7 3h-4l-.3 2.1a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.3 2.1h4l.3-2.1a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" stroke-width="1.4" stroke-linejoin="round"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round"/>',
  briefcase:
    '<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M9 7V5h6v2M4 12h16M10 12v2h4v-2" stroke-linecap="round" stroke-linejoin="round"/>',
  close: '<path d="m6 6 12 12M18 6 6 18" stroke-linecap="round"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01" stroke-width="2" stroke-linecap="round"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke-linecap="round"/>',
  file: '<path d="M6 3h7l5 5v13H6Z" stroke-linejoin="round"/><path d="M13 3v5h5" stroke-linejoin="round"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 1 0-5.7-5.7L11 7.4" stroke-linecap="round"/><path d="M14 10a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 1 0 5.7 5.7L13 16.6" stroke-linecap="round"/>',
  shield: '<path d="M12 3 5 6v6c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6Z" stroke-linejoin="round"/>',
  truck: '<path d="M3 7h11v9H3Z" stroke-linejoin="round"/><path d="M14 10h4l3 3v3h-7Z" stroke-linejoin="round"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
  megaphone:
    '<path d="M4 10v4l12 5V5L4 10Z" stroke-linejoin="round"/><path d="M16 9a3 3 0 0 1 0 6M7 15v3h3" stroke-linecap="round"/>',
  activity: '<path d="M3 12h4l3 7 4-14 3 7h4" stroke-linecap="round" stroke-linejoin="round"/>',
  plus: '<path d="M12 5v14M5 12h14" stroke-linecap="round"/>',
  filter: '<path d="M4 6h16l-6 7v5l-4 2v-7Z" stroke-linejoin="round"/>',
  eye: '<path d="M2.5 12s3.2-5.5 9.5-5.5S21.5 12 21.5 12 18.3 17.5 12 17.5 2.5 12 2.5 12Z" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.75"/>',
  'eye-off':
    '<path d="m3 3 18 18M10.6 6.7A9.8 9.8 0 0 1 12 6.5c6.3 0 9.5 5.5 9.5 5.5a17 17 0 0 1-3.2 3.8M6.2 6.2A17 17 0 0 0 2.5 12s3.2 5.5 9.5 5.5a9.7 9.7 0 0 0 3.1-.5M9.8 9.8a3.1 3.1 0 0 0 4.4 4.4" stroke-linecap="round" stroke-linejoin="round"/>',
};

export const ICON_NAMES = Object.keys(PATHS);

export function spriteMarkup() {
  return `<svg class="visually-hidden" aria-hidden="true" focusable="false"><defs>${Object.entries(
    PATHS,
  )
    .map(
      ([name, body]) =>
        `<symbol id="i-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${body}</symbol>`,
    )
    .join('')}</defs></svg>`;
}

/** Decorative by default — icons never carry meaning on their own. */
export function icon(name, className = '') {
  const cls = className ? `icon ${className}` : 'icon';
  return `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
}
