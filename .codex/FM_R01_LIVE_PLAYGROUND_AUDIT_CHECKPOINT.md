# FM-R01 Checkpoint — Live Playground Audit

STATUS: PASS
AUDIT_DATE: 2026-08-28 Asia/Manila
MODE: READ-ONLY EXCEPT TEMPORARY PLAYGROUND SESSION CREATION
TARGET: `https://playground.hausc.org/`
DEPLOYED_SOURCE: `50c5cab77b7fe251cf1a11c284fe791e6c2af127`
DEPLOYED_TREE: `5a985e623e8a234bf1d4cfac52ab5afb86fd8257`
PRODUCTION_MUTATION: ZERO

## Entry and shell

- Cloudflare Access boundary: PASS.
- Signed-out landing route: PASS; it rendered the institutional landing surface and no blank root was present.
- `Staff sign in` exposed the expected isolated `Enter Playground` action without credentials.
- Temporary Playground System Owner session: PASS.
- Authenticated shell and navigation: PASS until a crashing route was selected.

## Route matrix

| Route | Live result | Classification |
| --- | --- | --- |
| Overview | `Route reserved · not yet built` | Confirmed placeholder |
| Inventory | Loaded 394 visible records after authenticated bootstrap | Real backend, functional |
| Internal Request Hub | `Request queue unavailable` | HTTP 200 real data rejected by frontend adapter |
| Internal Lending Hub | `Lending queue unavailable` | HTTP 200 real data rejected by frontend adapter |
| Release | `Design fixture · not production data` | Synthetic fixture |
| Restocking | `Design fixture · not production data` | Synthetic fixture |
| Procurement | `Design fixture · not production data` | Synthetic fixture |
| Events | Authenticated shell collapsed to only the skip link | Uncaught frontend exception |
| Administration | Authenticated shell collapsed to only the skip link | Uncaught frontend exception |
| Profile | Loaded server-projected synthetic Playground profile and capabilities | Real backend, functional |

## Exact root causes

### Request bootstrap

- Browser network evidence: `GET /api/bootstrap/request?page=1&pageSize=25&filter=ACTIVE` returned HTTP 200.
- Contract: `bootstrap-module`, module `request`, version 2, authenticated (`requestOnly: false`).
- Real response included one request, two request lines, one event series, two event days, seven events, and 25 inventory references.
- Frontend adapter rejects canonical response values because:
  - `scopeRevision.token` is a finite number while `projectScopeRevision` requires a non-empty string.
  - one event has canonical nullable `startAt` and `endAt`, while the adapter requires non-empty strings.
- No request mutation occurred.

### Lending bootstrap

- Browser network evidence: `GET /api/bootstrap/lending?page=1&pageSize=25` returned HTTP 200.
- Contract: `bootstrap-module`, module `lending`, version 2, authenticated (`requestOnly: false`).
- Real response included four lending tickets and 25 inventory references.
- Required ticket, asset, history, inventory, pagination, and revision timestamp fields matched the adapter except `scopeRevision.token`, which is numeric while the adapter requires a string.
- No lending mutation occurred.

### Events and Administration

- Both routes throw `TypeError: Cannot read properties of undefined (reading 'capabilities')`.
- `AppRouteRenderer` reads `session.user.capabilities` for these routes.
- The projected `Session` type contains route capabilities and named permission booleans but no `user` member.
- This uncaught render exception collapses the authenticated application shell and reproduces the reported blank page.

### Placeholder and fixture routes

- Overview falls through to `AuthPlaceholderRoute` by design.
- Release renders `ReleaseDeskRoute`, which identifies itself as a synthetic design fixture.
- Restocking and Procurement render fixture-driven `SupplyRoutes` states.
- These are source-level runtime choices, not missing backend data.

## Repair direction

1. Add regression coverage for numeric scope revision tokens, nullable Request event times, and Events/Admin permission projection.
2. Make the frontend adapter accept the canonical server response without weakening malformed-response checks.
3. Project raw server permission capabilities into the typed session or expose explicit permission booleans; never dereference an absent `session.user`.
4. Replace Overview and fixture route runtime paths with real API-backed routes derived from accepted FI-17 structure and existing server contracts.
5. Re-run the route matrix before reset or deployment.

