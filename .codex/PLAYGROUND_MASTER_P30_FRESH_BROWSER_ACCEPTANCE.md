# P30 Fresh-Browser Full Acceptance

DATE: 2026-08-29
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: PASS_LIVE_PLAYGROUND
ROUTE: SOLO

## Accepted deployed identity

| Identity | Verified value |
| --- | --- |
| Source branch | `reconcile/playground-master` |
| Deployed source | `ab356898651317b1441ece72dcc95a9139b9fa21` |
| Deployed tree | `23caaf499f961dbe450f99946d78324d49172c22` |
| Staging entry artifact SHA-256 | `3bfa8b83a9bc06d1066cffa9f5467aa34f44e812ec83b3ecf5bba7349d934e0b` |
| Environment | isolated Playground / `STAGING` |
| Schema/latest migration | `32` / `0032_staff_account_activity_history.sql` |

The first deployed P29 source exposed one P30 defect: changing the public hash from Borrow to Tracking reused `PublicFlows` state and left Lending Center mounted. The smallest repair keyed the public flow renderer by route and added a same-session Borrow -> Tracking -> Borrow regression test. The repaired source passed the full 1,243-test suite, the 1,683-module staging build, release lint with zero errors and two unchanged warnings, and the focused regression at 390 and 1440 before a new guarded Playground-only deployment.

## Fresh-browser matrix

Both independent contexts began with no cookies. Each passed landing -> Staff sign in -> Enter Playground -> authenticated System Owner with 39 server capabilities -> Playground Index -> every required workspace -> sign out.

| Surface | Backend/API evidence | Authorization | 390 | 1440 |
| --- | --- | --- | --- | --- |
| Landing and entry | version/public feed/session all 200 | fresh public -> System Owner | PASS | PASS |
| Playground Index | Worker version metadata 200 | Playground environment gate | PASS | PASS |
| Overview | `/api/bootstrap/overview` 200 | System Owner | PASS | PASS |
| Inventory | `/api/bootstrap/inventory` 200 | System Owner | PASS | PASS |
| Request Hub | `/api/bootstrap/request` 200 | System Owner | PASS | PASS |
| Lending Hub | `/api/bootstrap/lending` 200 | System Owner | PASS | PASS |
| Release | `/api/bootstrap/release` 200 | System Owner | PASS | PASS |
| Restocking | `/api/bootstrap/restocking` 200 | System Owner | PASS | PASS |
| Procurement | `/api/bootstrap/procurement` 200 | System Owner | PASS | PASS |
| Events | `/api/getEventManagement` 200 | System Owner | PASS | PASS |
| Administration | protected staff-directory API 200 | System Owner | PASS | PASS |
| Profile | `/api/me/profile` 200 | System Owner | PASS | PASS |
| Public request entry | expected `/api/auth/session` 401 -> Staff sign in | fail-closed public boundary | PASS | PASS |
| Public lending | borrower-safe catalog 200 | public | PASS | PASS |
| Public tracking | Track lending form after same-session route transition | public | PASS | PASS |

For every authenticated route at both widths: main and H1 visible, backend API passed, loading terminated, no unavailable blocker, no normal-route fixture leak, no horizontal overflow, zero console errors, and zero failed requests. Public lending/tracking also recorded zero unexpected console errors, zero failed requests, and zero overflow. The one console error produced by the expected public-request 401 was classified with that authorization probe and excluded from the independent lending/tracking error window. Sign-out returned to the public landing page and cleared the session cookie.

## Private evidence

The exact JSON report and per-route screenshots are retained outside Git. They contain no committed hostname, provider identity, D1/R2 identifier, session material, or data rows. Failed harness attempts were also preserved privately; they identified selector/timing defects and are not counted as candidate acceptance.

## Post-acceptance state

- D1 fixed identity: PASS.
- Baseline: `PGBL-20260828-COVERAGE-V2` v2.
- Reset generation: `6`.
- Working state: `DIRTY`, active test session true.
- Sessions/transient total: `5` / `5`.
- Foreign-key violations: `0`.
- Reversible and sealed recovery points: available.
- Production mutation: NONE.
- Google mutation: NONE.

The DIRTY state is truthful P30 session residue and is deliberately preserved for P31 reset acceptance. It must not be normalized before the first mutation/reset proof.

## P31 handoff

Run two independent live mutation/reset cycles against this deployed source. Each cycle must prove meaningful D1 and R2/profile/theme/workflow changes, use the guarded Reset Entire Playground path, restore baseline/domain/inventory/R2/profile/theme/events/administration, invalidate the old session, create a new System Owner session, and leave critical routes green. Never target Production or delete unknown R2 objects.
