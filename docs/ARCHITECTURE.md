# Architecture

## Principles

1. Ledger transactions are quantity truth.
2. Views call the service contract and never mutate authoritative collections.
3. The mock service performs clone-validate-commit transactions; failures discard the draft.
4. Idempotency records make retries safe.
5. Parent request status derives from child lines.
6. Only the active feature renderer runs after a targeted change; shared counters update separately.
7. Request-only mode receives a sanitized selector result, not the internal state object.

## Runtime flow

```text
router -> active feature renderer -> service contract -> selected adapter
                                     |                  |
                                     |                  +-- mock (active)
                                     |                  +-- Apps Script stub
                                     |                  +-- REST stub
                                     v
                              transactional store
                                     |
                              revision selectors
                                     |
                         active feature + dirty shared UI
```

`src/app/bootstrap.js` owns composition, not domain rules. `src/services/mock-service.js` owns preview transactions. Pure validation and derivation live under `src/domain/` so Vitest can exercise them without a browser.

## Visual compatibility layer

The archived Final prototype is the visual authority. `scripts/extract-visual-baseline.mjs` splits its body into shell and per-view HTML modules and splits its stylesheet into ordered visual modules without changing selector order or declarations. `scripts/authoritative-visual-plugin.mjs` assembles those fragments during Vite's HTML transform. Vitest reconstructs the source and proves markup, CSS cascade, and interaction hooks remain equivalent.

The active preview controller is presently `src/visual/runtime.js`, extracted from the same baseline so its buttons and forms remain operational. The newer domain, store, selector, feature, and service modules remain in place and tested, but their controller is temporarily inactive. Migration should proceed one view at a time: retain the extracted template and CSS, move handlers to feature controllers, and route commands through `MockService`. Do not replace the visual layer again.

## Rendering

The renderer registry is the imported `modules` map in `bootstrap.js`. `renderActive()` replaces only `#view-root` and mounts the current feature. Store notifications carry dirty views; hidden modules are not rebuilt after unrelated operations.

List features use precomputed inventory search text, result limits, and pagination. Inventory indexes are cached against `state.revisions.inventory` and expose `Map<itemId, onHand>`, `Map<itemId, activeReserved>`, `Map<eventItemId, balance>`, request-line groupings, event deliverable groupings, and normalized search strings.

## Persistence and recovery

`store.js` isolates browser persistence. Schema migrations convert legacy `openingOnHand` quantities into `OPENING_BALANCE` ledger entries and add operational collections without resetting valid state. Corrupt/unsupported state restores safe demo data and exposes a visible warning/export path.

## Build

Vite uses `src/` as its root. The visual plugin assembles ordered HTML fragments, and `vite-plugin-singlefile` inlines generated CSS and JavaScript into `dist/index.html`. A final build hook converts the import-free inline bundle to a classic script for standalone `file://` use. `npm run verify:dist` rejects external assets, missing operational roots, or a remaining module script.
