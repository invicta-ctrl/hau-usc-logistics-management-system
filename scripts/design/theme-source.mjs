#!/usr/bin/env node
// THE SINGLE SOURCE OF THE HAU-USC THEME.
//
// Every surface, text role, border and glass value in the design prototypes and
// in the Figma variable collections is derived from this file. Nothing else
// declares a colour. `build-theme.mjs` emits the CSS; `figma-theme-payload.mjs`
// emits the Figma payload; both read this. That is what stops the code and the
// design file from drifting apart, which is the failure this pass exists to end.
//
// Values are declared as INTENT — a target CIE L*, a chroma and a hue — not as
// hex. Hex is the output. The consequence is that "one step up the ladder" means
// the same perceived distance in light and in dark, and that
// `comfort-audit.mjs`, which measures rendered L*, is checking the same number
// this file asked for.
//
// The two exceptions are stated where they occur: the canonical gold #D4AF37 is
// an owner decision and is written literally, and the status hues are carried
// over intact because they are already proven against WCAG.

import { atLstar, hexToRgb, hex, lstarOf, contrast, relLuminance } from './ladder.mjs';

export { atLstar, hexToRgb, hex, lstarOf, contrast, relLuminance };

/* ---------------------------------------------------------------- identity */

// OWNER DECISION 2026-08-19, DESIGN.md D08.0. Not derived, not negotiable.
export const CANONICAL_GOLD = '#d4af37';

// Dark mode lifts the canonical gold toward paper because #D4AF37 sits too close
// to the dark surfaces to carry a decisive accent there. Same hue, more light.
export const DARK_GOLD = '#e1c671';

export const OXBLOOD = {
  light: { 900: '#40070a', 800: '#610b0f', 700: '#78141a', 600: '#8d1f28', 500: '#a62835' },
  dark: { 900: '#4a1015', 800: '#8e3038', 700: '#a5424b', 600: '#b8535d', 500: '#c4626c' },
};

export const GOLD = {
  light: { 700: '#7d5518', 500: '#c8992f', 400: CANONICAL_GOLD, 200: '#e6d088', 100: '#f7efd5' },
  dark: { 700: '#c9a45f', 500: '#e3c37f', 400: DARK_GOLD, 200: '#eddca7', 100: '#faf1de' },
};

/* ------------------------------------------------------------ the ladders */
//
// WHY EACH STEP EXISTS — this is the part an implementer needs, because a hex
// tells you nothing about where it may be used.
//
//   ground   the environmental canvas. Never carries reading content. It is the
//            furthest surface from the reader and is deliberately the dimmest
//            thing in light mode and the darkest in dark mode.
//   inset    a recess INSIDE the work plane: filter bars, sub-headers, table
//            headers, disabled regions. One step toward the ground.
//   work     the primary reading and operational plane. Tables, forms, records.
//            This is where an operator spends the shift, so it is tuned first
//            and everything else is positioned relative to it.
//   raised   temporary elevation: cards that genuinely float, popovers,
//            suggestion lists. One step away from the ground.
//   overlay  dialogs, the command palette, context panels. The furthest from
//            the ground, used for the smallest area, which is why it is allowed
//            to be the brightest value in light mode.
//
// LIGHT hue 80 is the warm-paper axis. Chroma DECREASES up the ladder, so the
// cream lives in the environment and the reading plane stays near-neutral —
// body copy and status colour read true on it.
//
// DARK hue 20 is the oxblood axis. Chroma INCREASES up the ladder, so rising
// out of the ground reads as moving toward the institution rather than toward
// grey. Nothing in the ladder approaches #000: the darkest surface is L* 8.6,
// which keeps large dark fields legible instead of crushed.

const LIGHT_H = 80;
const DARK_H = 20;

export const SURFACES = {
  light: {
    ground: { L: 87.4, C: 0.028, h: LIGHT_H },
    inset: { L: 91.6, C: 0.022, h: LIGHT_H },
    work: { L: 95.4, C: 0.014, h: LIGHT_H },
    raised: { L: 97.3, C: 0.01, h: LIGHT_H },
    overlay: { L: 98.5, C: 0.006, h: LIGHT_H },
  },
  dark: {
    ground: { L: 8.6, C: 0.018, h: DARK_H },
    inset: { L: 11.8, C: 0.02, h: DARK_H },
    work: { L: 15.2, C: 0.022, h: DARK_H },
    raised: { L: 19.0, C: 0.024, h: DARK_H },
    overlay: { L: 22.4, C: 0.026, h: DARK_H },
  },
};

/* Text. Light ink is oxblood-charcoal rather than #000 — at L* 16 on an L* 95.4
   plane it still measures 13:1, so nothing is bought by going blacker except
   glare. Dark ink is a warm off-white rather than #FFF, for the same reason in
   the other direction: 12.7:1 is far past the requirement and the missing 5
   points of L* are the difference between reading and squinting. */
export const TEXT = {
  light: {
    'text-primary': { L: 16.0, C: 0.026, h: 18 },
    'text-secondary': { L: 33.0, C: 0.024, h: 18 },
    /* L* 43 rather than 46: muted copy has to clear 4.5:1 on the INSET plane,
       not just on the work plane, and inset is the hardest of the three. */
    'text-muted': { L: 43.0, C: 0.018, h: 18 },
  },
  dark: {
    'text-primary': { L: 93.0, C: 0.012, h: 66 },
    'text-secondary': { L: 82.0, C: 0.014, h: 40 },
    'text-muted': { L: 67.0, C: 0.013, h: 30 },
  },
};

/* Borders. `subtle` and `default` are decoration and may be quiet. `strong` and
   `control` are not: WCAG 2.2 1.4.11 needs 3:1 for anything that identifies a
   control or its state, measured against EVERY surface the control can sit on,
   which for us is the ground as well as the work plane. `control` is therefore
   solved against the hardest of those three, not the easiest. */
export const BORDERS = {
  light: {
    'border-subtle': { L: 88.0, C: 0.016, h: LIGHT_H },
    'border-default': { L: 81.0, C: 0.02, h: LIGHT_H },
    'border-strong': { L: 68.0, C: 0.026, h: LIGHT_H },
    'border-control': { L: 49.5, C: 0.022, h: 70 },
    'selected-line': { L: 40.0, C: 0.07, h: 75 },
  },
  dark: {
    'border-subtle': { L: 19.5, C: 0.018, h: DARK_H },
    'border-default': { L: 26.0, C: 0.022, h: DARK_H },
    'border-strong': { L: 38.0, C: 0.026, h: DARK_H },
    'border-control': { L: 53.0, C: 0.02, h: 25 },
    'selected-line': { L: 72.0, C: 0.07, h: 80 },
  },
};

/* The focus indicator is a two-part token on purpose: a gold ring for identity
   plus a contrast companion that carries the 3:1, so the ring never has to
   choose between looking like HAU-USC and being visible on a pale surface. */
export const FOCUS = {
  light: { 'focus-ring': CANONICAL_GOLD, 'focus-ring-contrast': '#40070a' },
  dark: { 'focus-ring': DARK_GOLD, 'focus-ring-contrast': '#faf1de' },
};

/* Status. Hues are carried over unchanged — they already pass and they are
   already learned by the operators. What changes is that the DARK backgrounds
   stop being alpha over whatever happens to be behind and become solid values
   composited once against the dark work plane. A status pill that changes
   contrast depending on which panel it lands in is not a status system. */
export const STATUS = {
  light: {
    neutral: { fg: '#5d4a4f', bg: '#ece3d3', line: '#cdbfa7' },
    info: { fg: '#23557f', bg: '#e4eefa', line: '#b0cbe6' },
    progress: { fg: '#7d5518', bg: '#fbeed2', line: '#dcbe8a' },
    done: { fg: '#1f6b41', bg: '#e2f3e9', line: '#a8d3ba' },
    alert: { fg: '#9c2630', bg: '#fbe6e8', line: '#e3aeb3' },
  },
  dark: {
    neutral: { fg: '#cbb9bc', bgOver: ['#ffffff', 0.07], line: '#6a5458' },
    info: { fg: '#a8cbf0', bgOver: ['#3a689e', 0.26], line: '#5d7c9e' },
    progress: { fg: '#eecb92', bgOver: ['#96671e', 0.28], line: '#96703c' },
    done: { fg: '#9ad9b2', bgOver: ['#2d7048', 0.28], line: '#4d7d61' },
    alert: { fg: '#f6acb2', bgOver: ['#a6343c', 0.3], line: '#96555c' },
  },
};

/* The oxblood chrome rail. It is the one deliberately high-contrast edge in the
   product — an institutional spine, not a panel — so it is exempt from the
   surface ladder and is measured on its own terms. */
export const RAIL = {
  light: { from: '#6b0e13', to: '#3d070a', ink: '#f7ecd9', 'ink-dim': '#d9bfae' },
  dark: { from: '#2f1417', to: '#1d0f11', ink: '#f4e6d2', 'ink-dim': '#c4a9ad' },
};

/* ------------------------------------------------- background environment */
//
// The ground is an authored environment, not a flat colour and not decoration.
// Three broad radial fields, each doing one job:
//
//   anchor    oxblood weight, so the composition has a heavy corner
//   decision  a gold warmth where the eye should settle
//   halo      a light lift that keeps the opposite corner from going dead
//
// Alphas are LOW on purpose. The previous pass ran anchor at 0.30 and halo at
// 0.55, which reads as gradient blobs the moment you notice it — the test in
// §30 is that depth and warmth register before the gradient does. These values
// were pulled down until the fields survive a 22px blur (which is what glass
// samples) while staying under the threshold where they become a subject.

export const FIELDS = {
  light: {
    anchor: ['#610b0f', 0.1],
    decision: [CANONICAL_GOLD, 0.1],
    halo: ['#fffdf8', 0.4],
    rule: ['#610b0f', 0.038],
  },
  dark: {
    anchor: ['#8e3038', 0.16],
    decision: [DARK_GOLD, 0.055],
    halo: ['#78141a', 0.26],
    rule: ['#f7ecd9', 0.035],
  },
};

/* -------------------------------------------------- Institutional Glass */
//
// A glass pane is one optical effect, not six independent properties, so fill,
// blur, edge and shadow are declared together per step.
//
// FILL went UP and BLUR came DOWN across every step. Both changes serve the
// same rule: content must not compete with the backdrop. A pane at 0.22 alpha
// leans on a 16px blur to stay readable, which is an expensive way to buy what
// opacity gives for free — and heavy blur is what makes glass read as frosted
// plastic rather than as glass. G2 at 0.52/14px is more legible AND cheaper
// than G2 at 0.34/22px.
//
// G4 is the only step allowed a gold edge, because it is the only step that
// means "decide here".

export const GLASS = {
  light: {
    g1: { fill: ['#fff9ec', 0.34], blur: 10, sat: 108 },
    g2: { fill: ['#fffbf2', 0.52], blur: 14, sat: 112 },
    g3: { fill: ['#fffdf8', 0.66], blur: 18, sat: 116 },
    g4: { fill: ['#f2e4b6', 0.34], blur: 22, sat: 120 },
    edgeQuiet: ['#ffffff', 0.5],
    edgeStrong: [CANONICAL_GOLD, 0.6],
    /* 0.16, not the 0.22 this started at: at 1440 the scrimmed page still has
       to read as a dimmed page rather than a maroon one. */
    scrim: ['#40070a', 0.16],
    highlight: ['#ffffff', 0.2],
    shadow: {
      g1: ['#3a1216', 0.08],
      g2: ['#3a1216', 0.1],
      g3: ['#3a1216', 0.14],
      g4: ['#3a1216', 0.18],
      drop: ['#3a1216', 0.12],
    },
  },
  dark: {
    g1: { fill: ['#4a2229', 0.34], blur: 10, sat: 108 },
    g2: { fill: ['#4f2028', 0.5], blur: 14, sat: 112 },
    g3: { fill: ['#552029', 0.64], blur: 18, sat: 116 },
    g4: { fill: [DARK_GOLD, 0.24], blur: 22, sat: 120 },
    edgeQuiet: ['#fff0c7', 0.22],
    edgeStrong: [DARK_GOLD, 0.66],
    /* Light-handed on purpose: over an L* 8.6 ground a heavy scrim has nowhere
       to go but black. Focus in dark mode comes from the overlay pane being
       14 L* brighter than the ground. */
    scrim: ['#0d0708', 0.34],
    highlight: ['#fffaeb', 0.11],
    shadow: {
      g1: ['#000000', 0.26],
      g2: ['#000000', 0.3],
      g3: ['#000000', 0.36],
      g4: ['#000000', 0.42],
      drop: ['#000000', 0.38],
    },
  },
};

/* ---------------------------------------------------------------- helpers */

export function solve(spec) {
  return hex(atLstar(spec.L, spec.C, spec.h));
}

export function rgba([hexValue, alpha]) {
  const [r, g, b] = hexToRgb(hexValue);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function composite([fgHex, alpha], bgHex) {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  return hex(fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha))));
}

/** Every resolved colour token for one mode, keyed by the CSS custom-property
 *  name without the leading dashes. This is the shape both emitters consume. */
export function resolveMode(mode) {
  const t = {};
  for (const [name, spec] of Object.entries(SURFACES[mode])) t[name] = solve(spec);
  for (const [name, spec] of Object.entries(TEXT[mode])) t[name] = solve(spec);
  for (const [name, spec] of Object.entries(BORDERS[mode])) t[name] = solve(spec);
  for (const [name, value] of Object.entries(FOCUS[mode])) t[name] = value;

  for (const [step, value] of Object.entries(OXBLOOD[mode])) t[`ox-${step}`] = value;
  for (const [step, value] of Object.entries(GOLD[mode])) t[`gold-${step}`] = value;

  t['gold-primary'] = GOLD[mode][400];
  t['gold-light'] = GOLD[mode][200];
  t['gold-tint'] = GOLD[mode][100];
  t['accent-text'] = GOLD[mode][700];
  t['authority'] = OXBLOOD[mode][800];
  t['action-primary'] = GOLD[mode][400];

  /* on-accent is dark in BOTH modes, because the gold it sits on is light in
     both modes. Flipping it with the theme is the classic dark-mode bug. */
  t['on-accent'] = '#40070a';
  t['text-inverse'] = mode === 'light' ? solve(SURFACES.light.overlay) : solve(SURFACES.dark.ground);

  for (const [tone, spec] of Object.entries(STATUS[mode])) {
    t[`${tone}-fg`] = spec.fg;
    t[`${tone}-bg`] = spec.bg ?? composite(spec.bgOver, solve(SURFACES[mode].work));
    t[`${tone}-line`] = spec.line;
  }

  for (const [name, value] of Object.entries(RAIL[mode])) t[`rail-${name}`] = value;

  return t;
}

/* ------------------------------------------------------------------- report */
//
// `node scripts/design/theme-source.mjs` prints the resolved ladders and the
// contrast each text role earns on each surface. It exists so the numbers can
// be checked without opening a browser or reading generated CSS, and because
// the ladder used to be declared in two files that had quietly disagreed.

const invokedDirectly = (process.argv[1] || '').replace(/\\/gu, '/').endsWith('/theme-source.mjs');
if (invokedDirectly) {
  for (const mode of ['light', 'dark']) {
    const t = resolveMode(mode);
    process.stdout.write(`\n${mode.toUpperCase()} SURFACES\n`);
    for (const [name, spec] of Object.entries(SURFACES[mode])) {
      const rgb = hexToRgb(solve(spec));
      process.stdout.write(
        `  --${name.padEnd(8)} ${solve(spec)}  L*=${lstarOf(rgb).toFixed(1).padStart(5)}\n`,
      );
    }
    process.stdout.write(`${mode.toUpperCase()} TEXT — contrast on ground / inset / work / raised\n`);
    for (const name of Object.keys(TEXT[mode])) {
      const rgb = hexToRgb(t[name]);
      const on = ['ground', 'inset', 'work', 'raised']
        .map((s) => contrast(rgb, hexToRgb(t[s])).toFixed(2).padStart(6))
        .join(' ');
      process.stdout.write(`  --${name.padEnd(15)} ${t[name]} ${on}\n`);
    }
    process.stdout.write(`${mode.toUpperCase()} 1.4.11 — control boundaries, 3:1 required\n`);
    for (const name of ['border-control', 'selected-line', 'focus-ring-contrast']) {
      const rgb = hexToRgb(t[name]);
      const on = ['ground', 'inset', 'work', 'raised']
        .map((s) => contrast(rgb, hexToRgb(t[s])).toFixed(2).padStart(6))
        .join(' ');
      process.stdout.write(`  --${name.padEnd(15)} ${t[name]} ${on}\n`);
    }
  }
  process.stdout.write('\n');
}
