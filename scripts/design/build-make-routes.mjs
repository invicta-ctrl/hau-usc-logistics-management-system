#!/usr/bin/env node
// Produces the canonical-theme versions of the four Figma Make route files.
//
//   input   output/design/make-preservation/*        captured from Make at v36
//           RequestCenterRoute.unsaved.tsx           the owner-adopted pending buffer
//   output  output/design/make-adoption/*            ready to write back into Make
//
// WHY A SCRIPT AND NOT A REGEX SWEEP
// The owner's instruction was explicit: close the superseded literals BY SEMANTIC
// ROLE, not by naive global replace. Every substitution below is therefore named,
// asserted, and counted. If an anchor string stops matching — because the file
// moved on — the build fails loudly instead of silently skipping a replacement or,
// worse, matching something it should not have.
//
// The census that drove this found 44 superseded occurrences, not the 33 first
// recorded. The extra 11 were in `rgba()` form: `rgba(232,185,60,…)` is #E8B93C
// and `rgba(111,90,96,…)` is #6F5A60. Exactly the way the same values hid inside
// theme.css. A hex-only sweep would have declared victory with a quarter of the
// work left.
//
// Usage: node scripts/design/build-make-routes.mjs [--check]

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import esbuild from 'esbuild';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const SRC = path.join(REPO, 'output/design/make-preservation');
const OUT = path.join(REPO, 'output/design/make-adoption');
const CHECK = process.argv.includes('--check');

/* Every superseded value, in both the forms it actually appears in. */
const SUPERSEDED = [
  ['#e8b93c', 'gold-vivid'], ['#f2d15c', 'gold-mid'], ['#f6e29a', 'gold-pale'],
  ['#faeecb', 'gold-cream'], ['#fffdf8', 'paper-warm'], ['#fcf2cf', 'paper-mid'],
  ['#f2eae5', 'paper-bg'], ['#241416', 'ink-deep'], ['#6f5a60', 'ink-mid'],
  ['#d1b478', 'border-warm'],
  ['232,185,60', 'gold-vivid rgba'], ['242,209,92', 'gold-mid rgba'],
  ['246,226,154', 'gold-pale rgba'], ['250,238,203', 'gold-cream rgba'],
  ['255,253,248', 'paper-warm rgba'], ['36,20,22', 'ink-deep rgba'],
  ['111,90,96', 'ink-mid rgba'], ['252,242,207', 'paper-mid rgba'],
  ['242,234,229', 'paper-bg rgba'], ['209,180,120', 'border-warm rgba'],
];

let failed = 0;
const log = [];

/** Apply one named replacement and assert it actually fired the expected number
 *  of times. `count: 0` means "must not be present", used for guard rails. */
function sub(state, label, find, replace, expected) {
  const parts = state.text.split(find);
  const found = parts.length - 1;
  if (found !== expected) {
    log.push(`  FAIL  ${state.file} · ${label}: expected ${expected} match(es), found ${found}`);
    failed++;
    return;
  }
  state.text = parts.join(replace);
  state.applied += found;
}

/* A translucent brand colour is expressed as a mix of the canonical token rather
   than a fresh rgba literal, so it follows the token in both modes instead of
   pinning one mode's value. */
const mix = (token, pct) => `color-mix(in oklch, var(${token}) ${pct}%, transparent)`;

// ---------------------------------------------------------------- RequestCenter

function requestCenter(text) {
  const s = { file: 'RequestCenterRoute.tsx', text, applied: 0 };

  /* 1 — the palette helper. It returned literal hexes and branched on `dark`.
     Reading the tokens instead means light and dark come from theme.css, which
     is the whole point of the adoption. `dark` is kept in the signature because
     call sites pass it and it still drives non-colour behaviour. */
  sub(
    s,
    'ap() palette -> canonical tokens',
    `function ap(dark: boolean) {
  return {
    bg:     dark ? "#1c1917" : "#fffdf8",
    m1:     dark ? "#242120" : "#ffffff",
    m2:     dark ? "#2d2927" : "#f7f0e2",
    border: dark ? "rgba(250,249,247,0.10)" : "#e6dcc9",
    text:   dark ? "#faf9f7" : "#241416",
    muted:  dark ? "rgba(250,249,247,0.46)" : "#6f5a60",
    skel:   dark ? "#2d2927" : "#e6dcc9",
  } as const;
}`,
    `function ap(_dark: boolean) {
  // Colour comes from theme.css. Each entry names a semantic role in the
  // canonical ladder, so light and dark resolve from one source instead of two
  // hardcoded branches that could drift apart.
  return {
    bg:     "var(--paper-warm)",   // work — the reading plane this route sits on
    m1:     "var(--paper-mid)",    // raised — rows, cards, inspector
    m2:     "var(--paper-light)",  // inset — headers, filter strips, wells
    border: "var(--border-paper)", // border/subtle
    text:   "var(--ink-deep)",     // text/primary
    muted:  "var(--ink-mid)",      // text/secondary
    skel:   "var(--paper-light)",  // skeleton blocks read as an inset
    sel:    "color-mix(in oklch, var(--gold-vivid) 14%, var(--paper-warm))",
    zebra:  "color-mix(in oklch, var(--ink-deep) 3%, var(--paper-warm))",
  } as const;
}`,
    1,
  );

  /* 2 — MK-04. Production derives the option set per line; a fixed list cannot
     be right. The fixture was missing the exact three fields the rule branches
     on, so they are added and the rule is mirrored. */
  sub(
    s,
    'ReqLine gains itemId',
    'type ReqLine = { name: string; qty: number; avail: "available" | "short"; shortBy?: number };',
    `type ReqLine = {
  name: string;
  qty: number;
  avail: "available" | "short";
  shortBy?: number;
  /* Production gates ISSUE_FROM_STOCK and RESTOCK on the line resolving to a
     catalog item. Without it the route set cannot be derived at all. */
  itemId?: string;
};`,
    1,
  );

  sub(
    s,
    'ReqItem gains type and catalogType',
    `  detailLines: ReqLine[];
  context: string;
  nextAction: string;
};`,
    `  detailLines: ReqLine[];
  context: string;
  nextAction: string;
  /* The other two fields permittedRoutes() branches on. */
  type?: "CATALOG_RESTOCK" | "STANDARD";
  catalogType?: "OFFICE_INVENTORY" | "PANTRY" | null;
};

/* Mirrors production's REVIEW_ROUTE_LABELS in src/visual/runtime.js. */
const ROUTE_LABELS = {
  ISSUE_FROM_STOCK:    "Issue from stock",
  PROCUREMENT:         "Procurement / canvass",
  RESTOCK:             "Catalog restock",
  REJECT:              "Reject",
  MISSING_INFORMATION: "Missing information",
} as const;

type RouteKey = keyof typeof ROUTE_LABELS;

/* Mirrors production's permittedRoutes(request, line). Production's own note
   applies here too: presentational filtering only — the server revalidates every
   decision and is the single source of truth for what is legal. Only REJECT and
   MISSING_INFORMATION are unconditional. */
function permittedRoutes(request: ReqItem, line: ReqLine): RouteKey[] {
  const routes: RouteKey[] = [];
  if (line.itemId) routes.push("ISSUE_FROM_STOCK");
  if (request.type !== "CATALOG_RESTOCK") routes.push("PROCUREMENT");
  if (
    line.itemId &&
    (request.type === "CATALOG_RESTOCK" ||
      ["OFFICE_INVENTORY", "PANTRY"].includes(request.catalogType ?? ""))
  ) {
    routes.push("RESTOCK");
  }
  routes.push("REJECT", "MISSING_INFORMATION");
  return routes;
}`,
    1,
  );

  /* The reviewable fixture gets the discriminating fields. It is an equipment
     request against office inventory, so its catalog-resolved lines legitimately
     offer RESTOCK and the unresolved one does not — which is the behaviour the
     select is supposed to demonstrate. */
  sub(
    s,
    'fixture REQ-2026-0142 gains route-discriminating fields',
    `    detailLines: [
      { name: "Folding chair — monobloc", qty: 120, avail: "available" },
      { name: "Wireless microphone",      qty: 4,   avail: "short", shortBy: 1 },
      { name: "Trestle table 6ft",        qty: 12,  avail: "available" },
    ],`,
    `    type: "STANDARD", catalogType: "OFFICE_INVENTORY",
    detailLines: [
      { name: "Folding chair — monobloc", qty: 120, avail: "available", itemId: "ITM-DEMO-156" },
      { name: "Wireless microphone",      qty: 4,   avail: "short", shortBy: 1 },
      { name: "Trestle table 6ft",        qty: 12,  avail: "available", itemId: "ITM-DEMO-161" },
    ],`,
    1,
  );

  sub(
    s,
    'per-line select derives its options',
    `                    <option value="" disabled>
                      Select a route
                    </option>
                    <option>Issue from stock</option>
                    <option>Procurement / canvass</option>
                    <option>Reject</option>
                    <option>Missing information</option>`,
    `                    <option value="" disabled>
                      Select a route
                    </option>
                    {permittedRoutes(item, line).map((route) => (
                      <option key={route} value={route}>
                        {ROUTE_LABELS[route]}
                      </option>
                    ))}`,
    1,
  );

  /* 3 — MK-03. Tailwind arbitrary values take a var() reference, so the focus
     ring follows the canonical gold instead of pinning the superseded one. */
  /* Ten, not nine: one of them trails `focus-visible:outline-inset`, so it reads
     as a separate rule but carries the same arbitrary value. */
  sub(s, 'focus outline gold', 'focus-visible:outline-[#e8b93c]', 'focus-visible:outline-[var(--gold-vivid)]', 10);
  sub(s, 'focus ring gold', 'focus:ring-[#e8b93c]', 'focus:ring-[var(--gold-vivid)]', 1);

  sub(s, 'status chip in-review wash', '"rgba(232,185,60,0.15)"', `"${mix('--gold-vivid', 15)}"`, 1);
  sub(s, 'urgency badge wash', '"rgba(232,185,60,0.08)"', `"${mix('--gold-vivid', 8)}"`, 1);
  sub(s, 'decision panel wash', '"rgba(232,185,60,0.07)"', `"${mix('--gold-vivid', 7)}"`, 1);
  sub(s, 'decision panel edge', '"1px solid rgba(232,185,60,0.28)"', `"1px solid ${mix('--gold-vivid', 28)}"`, 1);
  sub(s, 'decision panel copy on dark', '"rgba(250,238,203,0.7)"', `"${mix('--gold-cream', 70)}"`, 1);

  sub(s, 'closed chip wash', '"rgba(111,90,96,0.10)",   color: "#6f5a60", border: "rgba(111,90,96,0.22)"',
    `"${mix('--ink-mid', 10)}",   color: "var(--ink-mid)", border: "${mix('--ink-mid', 22)}"`, 1);
  sub(s, 'fixture badge wash', 'background: "rgba(111,90,96,0.10)", color: "#6f5a60", border: "1px solid rgba(111,90,96,0.20)"',
    `background: "${mix('--ink-mid', 10)}", color: "var(--ink-mid)", border: "1px solid ${mix('--ink-mid', 20)}"`, 1);

  sub(s, 'primary action fill', '(dark ? "#e8b93c" : "#40070a")', '(dark ? "var(--gold-vivid)" : "var(--oxblood-deep)")', 1);
  sub(s, 'primary action ink', '(dark ? "#40070a" : "#faeecb")', '(dark ? "var(--oxblood-deep)" : "var(--gold-cream)")', 1);
  sub(s, 'ghost action ink', 'color: "#e8b93c", background: "none"', 'color: "var(--gold-vivid)", background: "none"', 1);

  sub(s, 'selected row (cards)', 'background: isSelected ? (dark ? "#2d2520" : "#fcf2cf") : c.m1,', 'background: isSelected ? c.sel : c.m1,', 1);
  sub(s, 'selected row (table)', 'background: isSelected ? (dark ? "#2d2520" : "#fcf2cf") : (i % 2 === 0 ? c.m1 : (dark ? "#222120" : "#faf7f2")),',
    'background: isSelected ? c.sel : (i % 2 === 0 ? c.m1 : c.zebra),', 1);

  return s;
}

// ------------------------------------------------------- the three CSS routes

/* These three keep a scoped local palette on `.pub` / `.lend` / `.rel`. Pointing
   the local names at the canonical tokens means the `.dark` override block is no
   longer needed for colour: theme.css already sets the dark value of each token
   on any `.dark` element, and these roots carry that class themselves. */

function publicFlows(text) {
  const s = { file: 'PublicFlows.tsx', text, applied: 0 };
  sub(s, 'light surfaces, ink and action',
    '--surface:#fffdf8;--inset:#f7f0e2;--muted:#6f5a60;--text:#241416;',
    '--surface:var(--paper-warm);--inset:var(--paper-light);--muted:var(--ink-mid);--text:var(--ink-deep);', 1);
  sub(s, 'action gold', '--action:#e8b93c;', '--action:var(--gold-vivid);', 1);
  sub(s, 'ink on oxblood (light)', '--onOx:#fffdf8;--glassHi:rgba(255,255,255,.34)', '--onOx:var(--gold-cream);--glassHi:rgba(255,255,255,.34)', 1);
  sub(s, 'ink on oxblood (dark)', '--onOx:#fffdf8;--glassHi:rgba(255,250,235,.22)', '--onOx:var(--gold-cream);--glassHi:rgba(255,250,235,.22)', 1);
  sub(s, 'decision field', '--fD:rgba(232,185,60,.26)', `--fD:${mix('--gold-vivid', 26)}`, 1);
  sub(s, 'halo field', '--fH:rgba(255,253,248,.55)', `--fH:${mix('--paper-warm', 55)}`, 1);
  return s;
}

function lendingHub(text) {
  const s = { file: 'LendingHubRoute.tsx', text, applied: 0 };
  sub(s, 'light palette -> tokens',
    '.lend{--bg:#fffdf8;--m1:#fff;--m2:#f7f0e2;--m3:#f0e3c7;--text:#241416;--muted:#6f5a60;--line:#e6dcc9;--ox:#6f1624;--gold:#a77417;',
    '.lend{--bg:var(--paper-warm);--m1:var(--paper-mid);--m2:var(--paper-light);' +
      '--m3:color-mix(in oklch, var(--gold-vivid) 18%, var(--paper-light));' +
      '--text:var(--ink-deep);--muted:var(--ink-mid);--line:var(--border-paper);' +
      '--ox:var(--oxblood-mid);--gold:var(--ink-light);', 1);
  sub(s, 'dark colour overrides removed (theme.css owns them now)',
    '.lend.dark{--bg:#1c1917;--m1:#242120;--m2:#2d2927;--m3:#3a302b;--text:#faf9f7;--muted:#b9aaa7;--line:#49413d;--ox:#8e2134;--gold:#d0a64a}', '', 1);
  return s;
}

function releaseDesk(text) {
  const s = { file: 'ReleaseDeskRoute.tsx', text, applied: 0 };
  sub(s, 'light palette -> tokens',
    '.rel{--bg:#fffdf8;--m1:#fff;--m2:#f7f0e2;--text:#241416;--muted:#6f5a60;--line:#e6dcc9;--ox:#6f1624;--gold:#a77417;',
    '.rel{--bg:var(--paper-warm);--m1:var(--paper-mid);--m2:var(--paper-light);' +
      '--text:var(--ink-deep);--muted:var(--ink-mid);--line:var(--border-paper);' +
      '--ox:var(--oxblood-mid);--gold:var(--ink-light);', 1);
  sub(s, 'dark colour overrides removed (theme.css owns them now)',
    '.rel.dark{--bg:#1c1917;--m1:#242120;--m2:#2d2927;--text:#faf9f7;--muted:#b9aaa7;--line:#49413d;--ox:#8e2134;--gold:#d0a64a}', '', 1);
  return s;
}

// ---------------------------------------------------------------------- build

const JOBS = [
  ['RequestCenterRoute.unsaved.tsx', 'RequestCenterRoute.tsx', requestCenter],
  ['PublicFlows.tsx', 'PublicFlows.tsx', publicFlows],
  ['LendingHubRoute.tsx', 'LendingHubRoute.tsx', lendingHub],
  ['ReleaseDeskRoute.tsx', 'ReleaseDeskRoute.tsx', releaseDesk],
];

await mkdir(OUT, { recursive: true });
const summary = [];

for (const [inName, outName, fn] of JOBS) {
  const before = await readFile(path.join(SRC, inName), 'utf8');
  const s = fn(before);

  /* The guard: after transformation, not one superseded value may remain. This
     is the check that would have caught the earlier "33 literals" undercount. */
  const remaining = [];
  for (const [needle, why] of SUPERSEDED) {
    const n = (s.text.toLowerCase().match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'gu')) || []).length;
    if (n) remaining.push(`${needle} (${why}) x${n}`);
  }
  if (remaining.length) {
    log.push(`  FAIL  ${outName}: superseded values survive — ${remaining.join(', ')}`);
    failed++;
  }

  /* Parse the result. These files go straight into a provider editor where a
     syntax error is a broken build in someone else's project, so "it looked
     right" is not good enough. The originals parse too, which makes this a real
     control rather than a rubber stamp. */
  try {
    esbuild.transformSync(s.text, { loader: 'tsx', jsx: 'automatic' });
  } catch (e) {
    const err = e.errors && e.errors[0];
    log.push(`  FAIL  ${outName}: does not parse — ${err ? `${err.text} @ line ${err.location.line}` : e.message}`);
    failed++;
  }

  const sha = createHash('sha256').update(s.text).digest('hex');
  summary.push({ file: outName, bytes: Buffer.byteLength(s.text), applied: s.applied, sha256: sha });
  if (!CHECK) await writeFile(path.join(OUT, outName), s.text);
}

if (log.length) process.stdout.write(log.join('\n') + '\n\n');
for (const r of summary) {
  process.stdout.write(
    `  ${r.file.padEnd(24)} ${String(r.bytes).padStart(6)} bytes · ${String(r.applied).padStart(2)} substitutions · ${r.sha256.slice(0, 16)}\n`,
  );
}
process.stdout.write(
  failed ? `\n${failed} failure(s)\n` : `\nall four files transformed · zero superseded values remain\n`,
);
process.exit(failed ? 1 : 0);
