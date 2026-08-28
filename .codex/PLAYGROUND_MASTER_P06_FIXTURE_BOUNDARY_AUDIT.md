# P06 Full Normal-Runtime Fixture Audit

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: COMPLETE_PENDING_FINAL_CHECKPOINT

## Scope and method

The audit searched the deployed frontend source for `Design fixture`, `Synthetic prototype`, `no backend`, `preview*`, `fixture`, `mock`, simulated/local success wording, and hard-coded operational records. The broad textual inventory produced 300 matches across 92 files. Those matches were then classified by the actual application route graph and by whether each shared component's `inspection` prop defaults to the normal backend path.

Text presence alone was not treated as a violation. Preview/test source, explicit truthful “no fixture substituted” copy, and backend seed tooling were classified separately from the normal deployed application graph.

## Route-graph result

| Surface                        | Normal deployed route                                                       | Deterministic data disposition                                                                                  | Truthful failure disposition                                                  |
| ------------------------------ | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Overview                       | `OverviewRoute` -> `OperationalModuleRoute module="overview"`               | Accepted FI command-table data exists only in `OverviewPreviewRoute`, imported only by `PreviewInspectionRoute` | backend empty/denied/unavailable/error projection                             |
| Inventory                      | shared `InventoryRoute`, `inspection` omitted and default false             | `INV_FIXTURE` only when `inspection` is true                                                                    | backend loading/empty/denied/error/stale states                               |
| Requests                       | shared `InternalRequestHub`, `inspection` omitted and default false         | `PREVIEW_QUEUE` and local demonstration only in the inspection branch                                           | backend queue/review; denied/error/conflict remain explicit                   |
| Lending                        | shared `InternalLendingHub`, `inspection` omitted and default false         | `PREVIEW_QUEUE` and local demonstrations only in inspection branches                                            | backend review/handoff/evidence/return; denied/error/conflict remain explicit |
| Release                        | `OperationalModuleRoute module="release"`                                   | `ReleaseDeskRoute` imported only by `PreviewInspectionRoute`                                                    | backend read-only empty/denied/unavailable/error projection                   |
| Restocking                     | `OperationalModuleRoute module="restocking"`                                | accepted visual supply presentation is not routed normally                                                      | backend read-only empty/denied/unavailable/error projection                   |
| Procurement                    | `OperationalModuleRoute module="procurement"`                               | accepted visual supply presentation is not routed normally                                                      | backend read-only empty/denied/unavailable/error projection                   |
| Events                         | shared `SupplyRoutes mode="events"`, `inspection` omitted and default false | `previewEventManagement` only when `inspection` is true                                                         | capability denial and backend unavailable states are explicit                 |
| Administration                 | shared `AdministrationRoute`, `inspection` omitted and default false        | preview accounts/directory/system rows only when `inspection` is true                                           | backend read-only selection/denied/unavailable/error states                   |
| External request/Profile/shell | normal authenticated/public components, `inspection` omitted                | injected preview portal/profile/operator only in Preview inspection                                             | normal auth, validation, denial, and backend results remain authoritative     |

## Explicit Preview-only modules

- `OverviewPreviewRoute` occurs only in its defining file and `PreviewInspectionRoute`.
- `ReleaseDeskRoute` occurs only in its defining file and `PreviewInspectionRoute`.
- Preview inspection can render only when `usePreviewIndex` accepts the trusted Playground version and `previewInspectionAllowed` accepts exact local `127.0.0.1:4173` development or exact HTTPS `playground.hausc.org` deployment context.
- The Preview renderer labels its boundary as sanitized fixture data with no backend authorization.

## Unreachable legacy source

The following older source components have no importer and no route-graph reference:

- `LegacyAdministrationFixture` in `AdministrationRoute.tsx`;
- `LendingHubRoute` in `LendingHubRoute.tsx`;
- `RequestCenterRouteWithStates` in `RequestCenterRouteWithStates.tsx`.

They are classified `UNREACHABLE_LEGACY_SOURCE`, not normal runtime. P06 preserves them because deletion is outside this audit checkpoint; the deterministic gate fails if any acquires another source reference. Later preservation-gated residue work may remove them only after its own exact authority and dependency checks.

## Deterministic build boundary

Added `scripts/verify-frontend-fixture-boundary.mjs`. It fails when:

1. a fixture-only or legacy component enters `AppRouteRenderer`;
2. normal routing passes `inspection`, Preview data, or simulated-success language;
3. required real backend route mappings disappear;
4. Preview-only module reference sets expand;
5. an unreachable legacy fixture gains a reference;
6. shared component fixtures stop defaulting to `inspection = false` and explicit fixture ternaries;
7. protected Request/Lending backend calls or Events capability/error paths lose their explicit boundary markers; or
8. the trusted Preview inspection gateway loses its version/origin/mode checks.

The gate runs before `build`, `build:cloudflare`, and `build:cloudflare:production`. The focused frontend test asserts that all three build scripts retain it.

## Verification

- `npm run verify:frontend:fixture-boundary`: PASS.
- Targeted ESLint for the verifier and changed test: PASS.
- Focused guard test: 1 file / 4 tests passed.
- `npm run test:frontend`: 2 files / 32 tests passed.
- `npm run build`: PASS; the fixture gate ran before the preview build.
- `npm run build:cloudflare`: PASS; the fixture gate ran before the staging build.
- Preview/shareable artifacts remain byte-identical with SHA-256 `A59F9DD5AAFD4D1D7CC1BB3A7722244DBCD81F5A671DA8F536030CE701873679`.
- Staging index remains SHA-256 `719767F6076D5276CB7E147EBCA10FD4458A31DB4DB0627D58B4A6CC6AB97489`.
- No deployment, reset, migration, provider, D1/R2, business-data, Production/main, Google, or Figma mutation occurred.

```text
NORMAL_RUNTIME_FIXTURE_PATHS = 0
NORMAL_RUNTIME_FAKE_SUCCESS_PATHS = 0
EXPLICIT_PREVIEW_ONLY = PASS
TRUTHFUL_EMPTY_DENIED_UNAVAILABLE_ERROR = PASS
UNREACHABLE_LEGACY_SOURCE = 3_AND_GATED
DETERMINISTIC_BUILD_BOUNDARY = PASS
```
