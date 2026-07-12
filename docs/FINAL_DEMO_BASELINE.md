# Final Demo Prototype Baseline

## Approved visual direction

The final demo will use the appearance and interaction language of:

`HAU-USC_Logistics-Prototype-Shareable.html`

This is the single-file build of the archived Final prototype. Its HAU-USC maroon/oxblood, gold, cream, paper, and white palette; Georgia display hierarchy; responsive sidebar; panels; status chips; cards; tables; forms; request-only mode; Release Desk; lending; restocking; procurement; canvass; and inventory screens are the approved demo direction.

The earlier `Index_Frontend_Visual_Preview_Revision_02_2026-07-11(1).html` is retained as historical reference only. It is not the active demo baseline.

## Files and ownership

- `legacy/HAU-USC_Logistics-Prototype.original.html` — preserved visual source of truth.
- `src/visual/` — extracted shell, view modules, and compatibility runtime.
- `src/styles/visual/` — extracted ordered CSS modules.
- `dist/index.html` — deployment build artifact.
- `HAU-USC_Logistics-Prototype-Shareable.html` — reviewer/share copy; generated from `dist/index.html`.

Do not edit `dist/index.html` or the share copy directly. Change source, then run `npm run build`.

## Demo launch procedure

1. Run `npm install` once.
2. Run `npm run check` before a rehearsal.
3. Open `HAU-USC_Logistics-Prototype-Shareable.html` in a browser, or run `npm run dev` for a local server.
4. Confirm the visible `Front-end preview` / `Preview mode` label.
5. If old browser state changes the records, select `Reset Demo Data` inside the application.
6. For the requester presentation, open the share copy with `?request=1` in a served environment.

GitHub's source viewer is not a browser runtime. Reviewers should download the HTML or use a deployed preview URL.

## Guided demo order

1. Overview: show upcoming events, readiness buckets, operational pulse, completed history, and roadmap.
2. Request Center: show autocomplete, stock/partial/procurement routing, line summary, and submission for DOL review.
3. Release Desk: show a controlled physical handoff and the release history.
4. Office Lending Hub: show review, approval, handoff, overdue derivation, and return.
5. Restocking: show a catalog request, receiving, evidence metadata, and cumulative history.
6. Procurement & Deliverables: show deliverables, canvass references, receiving, event-item IDs, and transfer provenance.
7. Inventory Management: show on-hand, reserved, available-to-promise, ledger history, and catalog actions.

## Demo safety boundary

All records are fictional preview data. No Google Sheets, Drive, email, Chat, Apps Script, REST, or production backend writes occur. The current compatibility runtime is intentionally isolated while its controllers are migrated one module at a time to the hardened service contract.

## Acceptance before the final presentation

- [ ] Share copy and `dist/index.html` have the same SHA-256 hash.
- [ ] `npm run check` passes.
- [ ] Desktop rehearsal at 1366 px is complete.
- [ ] Mobile rehearsal at 390 px is complete.
- [ ] Request-only mode does not expose internal navigation or records.
- [ ] Reset Demo Data restores the prepared starting state.
- [ ] No real student, borrower, supplier, contact, credential, or evidence data is present.
- [ ] Any remaining compatibility-runtime limitation is disclosed in the presentation notes.
