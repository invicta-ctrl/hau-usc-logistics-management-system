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

## Rendering

The renderer registry is the imported `modules` map in `bootstrap.js`. `renderActive()` replaces only `#view-root` and mounts the current feature. Store notifications carry dirty views; hidden modules are not rebuilt after unrelated operations.

List features use precomputed inventory search text, result limits, and pagination. Inventory indexes are cached against `state.revisions.inventory` and expose `Map<itemId, onHand>`, `Map<itemId, activeReserved>`, `Map<eventItemId, balance>`, request-line groupings, event deliverable groupings, and normalized search strings.

## Persistence and recovery

`store.js` isolates browser persistence. Schema migrations convert legacy `openingOnHand` quantities into `OPENING_BALANCE` ledger entries and add operational collections without resetting valid state. Corrupt/unsupported state restores safe demo data and exposes a visible warning/export path.

## Build

Vite uses `src/` as its root. `vite-plugin-singlefile` inlines generated CSS and JavaScript into `dist/index.html`. Optional runtime images should be inlined or adapted to Apps Script templates before deployment.
