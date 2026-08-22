#!/usr/bin/env node
// Derives the HAU-USC surface ladders from stated CIE L* targets.
//
// The ladders are not hand-picked hexes. Each step names the L* it is supposed
// to hit and the warm hue it carries, and this file solves for the sRGB value.
// That is why the ladder is even in perceived lightness rather than even in
// hex arithmetic, and why light and dark can be checked against the same
// targets. `comfort-audit.mjs` measures the rendered result against the same
// L* scale, so a step declared here is a step you can verify on screen.
//
// This file is COLOUR MATHS ONLY. The ladder values themselves live in
// theme-source.mjs, which imports from here. They used to be declared in both
// places and had already drifted — light text-muted was L* 46 in one and 43 in
// the other — which is the same class of defect the theme pass exists to end.
//
// Print the resolved ladders with: node scripts/design/theme-source.mjs

// --- OKLab <-> sRGB ---------------------------------------------------------

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function oklchToRgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const R = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const B = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [R, G, B].map((v) => Math.round(Math.min(1, Math.max(0, toSrgb(v))) * 255));
}

export function relLuminance([r, g, b]) {
  return 0.2126 * toLinear(r / 255) + 0.7152 * toLinear(g / 255) + 0.0722 * toLinear(b / 255);
}

export function lstarOf(rgb) {
  const y = relLuminance(rgb);
  return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y;
}

export const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

export function hexToRgb(h) {
  const s = h.replace('#', '');
  const f = s.length === 3 ? s.replace(/./gu, (c) => c + c) : s;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
}

/* Solve for the OKLab L that lands on a target CIE L*, at a given chroma and
   hue. Bisection rather than a closed form because clipping into sRGB gamut
   makes the relationship non-analytic near the extremes. */
export function atLstar(targetL, C, hDeg) {
  let lo = 0;
  let hi = 1;
  let rgb = [0, 0, 0];
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    rgb = oklchToRgb(mid, C, hDeg);
    if (lstarOf(rgb) < targetL) lo = mid;
    else hi = mid;
  }
  return rgb;
}

export function contrast(a, b) {
  const [l1, l2] = [relLuminance(a), relLuminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
