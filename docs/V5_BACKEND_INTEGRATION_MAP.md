# V5 backend integration map

Status: implementation map for the v0.8.1 Isolated Staging Playground candidate
Visual authority: frozen `impeccable-whole-site-redesign-v5` source at accepted correction `908653dc956c9ccffa68ac0b350fc23b69f053ea`
Functional authority: current Production v0.8.0 backend contract at `3059098ff2a2935fec59df52748ccae420aadba7`
Schema: 30
Latest migration: `0030_production_access_and_operations.sql`
New migration: none

## Binding and authority rules

- The browser calls same-origin Worker/API contracts only. It cannot select a D1 database, R2 bucket, provider resource, deployment environment, or recovery target.
- The playground Worker is accepted only after same-origin `/api/version` and `/api/health` prove `STAGING`, the server-owned playground flag, D1 readiness, and both R2 dependencies. Browser input cannot turn the Index or playground controls on.
- D1 business state, server authorization, revisions, idempotency, audit, history, ledger rules, and R2 evidence/media services remain authoritative. V5 does not reproduce those rules in the browser.
- Backend-backed frozen arrays are emptied before the application boots. Supported routes render API-derived records or explicit loading, empty, denied, and error states.
- Provider/email sends, Google writes, Production mutations, and Production deployment are not exercised by this task. Their existing controls may be wired, but live mutation proof remains outside this authorization.
- Direct public account creation, public evidence-file upload, and local-only avatar upload are not current Production contracts and are not presented as successful operations.

## Exact route classification

`src/v5/src/registry.js` exports the same classification as executable source. The unit gate proves that `index` plus all 33 registered surfaces appear exactly once and that no implicit owner deferral exists.

| Route | Classification | Authoritative integration |
| --- | --- | --- |
| `index` | `PLAYGROUND_ONLY` | Searchable grouped route index, real-login path, safe candidate/parity status, reset, and baseline-refresh requests; server-verified playground only |
| `public.landing` | `BACKEND_READ_ONLY` | Published advertisement projection and authorized media URL; portal navigation remains client-side |
| `public.signin` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Session login/logout plus starter activation and reset completion through the existing auth lifecycle |
| `public.register` | `PROTOTYPE_ONLY_UNSUPPORTED` | Direct public account creation conflicts with the accepted verified-application and starter-activation lifecycle |
| `public.verify` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Account-application email start/confirm and opaque verification receipt |
| `public.application` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Submit/resubmit with the complete current application contract and private receipt/status tokens |
| `public.application-status` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Private status-token lookup and governed withdrawal |
| `public.request-intake` | `FULLY_BACKEND_WIRED` | D1-derived options, new/additional request proof, acknowledgements, submit, and receipt |
| `public.request-tracking` | `FULLY_BACKEND_WIRED` | Request ID plus opaque tracking-code lookup and current lifecycle projection |
| `public.lending-intake` | `FULLY_BACKEND_WIRED` | D1-derived catalogue, borrower contract, acknowledgements, submit, and receipt; no public file upload |
| `public.lending-tracking` | `FULLY_BACKEND_WIRED` | Submission ID plus opaque tracking-code lookup and current custody projection |
| `public.policy` | `BACKEND_READ_ONLY` | Accepted privacy and acceptable-use copy |
| `admin.overview` | `BACKEND_READ_ONLY` | Scoped overview bootstrap and current request/lending/release/inventory/event summaries |
| `director.overview` | `BACKEND_READ_ONLY` | Server-scoped director overview projection |
| `food.overview` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Scoped overview plus current food component update contract when an authorized component is selected |
| `inventory.overview` | `BACKEND_READ_ONLY` | Server-scoped inventory overview projection |
| `materials.overview` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Scoped overview plus current materials component update contract when an authorized component is selected |
| `request.queue` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Read, explicit per-line review, ask-for-information, reject, and reservation commands |
| `lending.queue` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Read and complete lending-ticket creation contract |
| `lending.detail` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Approval, handoff, return, asset registration, and asset-maintenance contracts |
| `release.desk` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Cumulative release, authorized evidence reference, and release-correction contracts |
| `inventory.catalog` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Catalog read plus create and bulk classification contracts |
| `inventory.item` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Item/ledger read plus update, storage context, archive/restore, classification, and cycle-count contracts |
| `restocking.queue` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Restock detail, transition, receiving, and inventory-ledger effects through existing commands |
| `procurement.board` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Canvass create/update/archive/preferred, deliverable transition, and receiving contracts |
| `events.series` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Series/day/activity save, operational link, and event-item transfer contracts |
| `audit.activity` | `BACKEND_READ_ONLY` | Capability-filtered audit/activity projection |
| `admin.access` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Account-application review/override and access ID/policy/account/session/status/unlock contracts |
| `admin.directory` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Access directory plus identity-roster status, preview, directory, self, apply, and rollback contracts |
| `admin.reference` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Reference workspace, preview, submit, and review contracts |
| `admin.links` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Versioned reference-link list/get/history/create/update/transition contracts |
| `admin.brand` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Brand upload/publish/rollback and advertisement save/upload/preview/publish/lifecycle contracts |
| `account.profile` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Profile read, contact, username, password, and identity-correction contracts; no local avatar upload |
| `owner.health` | `V5_NATIVE_FUNCTIONAL_PARITY_ADDITION` | Health/readiness/version, migration diagnostics, evidence status/process/restore/archive, and safe playground status |

## Capability implementation groups

The route map is backed by two small V5-native controllers composed only from existing V5 panels, fields, buttons, tables, notices, and spacing:

- `src/v5/integration/operations-parity.js` owns request-to-ledger, lending/custody, release/correction, inventory/catalog, procurement/receiving, events, and current food/material component commands.
- `src/v5/integration/admin-parity.js` owns activation/reset, account applications, access, roster, references, links, brand, advertisements, profile, diagnostics, migrations, and evidence operations.
- `src/v5/integration/runtime.js` owns session and capability gates, route reads, scoped revisions, real-data projection, public tracking, playground verification, and controller event delegation.
- `src/v5/integration/backend.js` owns the same-origin auth/API/legacy-command adapters and stores authenticated CSRF state after login or starter activation.

Current adapter stubs for composite assignment/escalation/reopen/amend/cancel and venue-equipment mutation are not current D1 operational-service methods in the exact Production backend. They are therefore not claimed as current Production capabilities and no browser command is invented for them. Current food/material component updates are exposed only when the server returns real request and component identifiers.

## Unsupported controls and explicit test exclusions

- `public.register` remains visibly non-destructive and directs users to the verified application flow.
- Public lending evidence upload is omitted because the public API does not accept direct evidence bytes or an R2 target.
- Profile-photo upload is omitted because Production has no governed avatar-object mutation contract.
- Provider/email send, identity-roster Google apply/rollback, and evidence restore/archive controls are contract-wired but are not live-mutated by this task because the owner did not authorize those external writes.
- No capability is classified `OWNER_DEFERRED`. The three omitted controls above are evidence-backed unsupported prototype controls, not current Production capabilities hidden from V5.

## Mock and production-denial proof

- `src/v5/integration/entry.js` clears every backend-backed frozen record collection before V5 boot.
- Real bootstrap/module/detail responses repopulate those same view models; generic unloaded copy replaces static record identities in detail and tracking states.
- Dynamic queue buttons open capability-gated governed actions and no V5 source emits `data-act="noop"`.
- `V5_ROUTE_CLASSIFICATIONS` is exhaustive and deterministic.
- Production builds omit the playground bar, Index route, test-persona shortcuts, reset controls, and playground markers. A build-time artifact assertion rejects their presence.
- The staging Index is enabled only after same-origin server-owned `STAGING` identity and isolated D1/R2 health succeed. A browser-supplied flag cannot alter bindings or activate it.

Required result for the frozen candidate:

```text
MOCK_DATA_REMAINING_ON_BACKEND_SUPPORTED_ROUTES: 0
INTEGRATED_SRC_VISUAL_PARITY_WITH_FROZEN_V5: PASS
AUTO_PLAYGROUND_TO_PRODUCTION: DISABLED
PRODUCTION_MUTATION: NONE
```

## Verification ownership

- Unit: view-model clearing/projection, route-classification exhaustiveness, same-origin backend, controller command shapes, capability denials, playground server guard, and Production artifact denial.
- Browser: all 33 registered V5 routes plus playground Index/search, real-login path, responsive widths `320/390/768/1024/1440`, light/dark, and Production absence of playground UI.
- Cross-module: request review/reserve/release/ledger; lending approval/handoff/return/asset; canvass/restock/deliverable/receive; event link/transfer; application review/activation/access; governance publish/public projection. Provider, Google, and Production writes remain gated.
- Deployment: exact frozen commit/tree/artifact to the isolated playground only, followed by safe playground identity/readiness and unchanged Production fingerprints.
