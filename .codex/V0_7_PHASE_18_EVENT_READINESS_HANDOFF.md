# v0.7.0 Phase 18 Event Readiness Resolution Handoff

Status: **OWNER DATA BLOCKER RESOLVED — LOCAL CANDIDATE VERIFIED — STAGING ACCEPTANCE PENDING — PRODUCTION NO-GO**

Date: 2026-07-28

## Owner resolution and approved source

The owner designated
`HAU_USC_Logistics_v0.7.0_Complete_Continuation_From_Phase16_OAuth_2026-07-26.md`
as the approved event record and reproduced the complete authoritative values
in the current owner decision. The September 1–2 schedule supersedes the
August 10 and August 12 schedule from the July 4 meeting notes. The two
schedules are not merged. The August dates are retained only as superseded
historical planning context.

The named source file was not present in the accessible repository or current
attachment directory during this run, so no local file hash is claimed. The
current explicit owner decision is authoritative and contains the complete
approved hierarchy used by the deterministic seed.

## Approved active hierarchy

- Main Event: `Youth Development Days 2026`
- September 1, 2026:
  - `Pottery Making / Textile Weaving / Basket Weaving Workshop`; Workshop;
    time `TBA`; Plaza San Jose.
- September 2, 2026:
  - `DAPUGAN: Lutong Pamana Competition`; Competition; 8:00 AM–12:00 PM;
    STL Kitchen Laboratory.
  - `SIGASIG: Laro ng Lahi`; Traditional Games; 9:00 AM–12:00 PM; Covered
    Court; Sipa, Kadang-kadang, Sack Race, Sabayang Paglakad, and Chinese
    Garter.
  - `HARANA: Pagsulat at Pag-awit ng Kundiman`; Competition; 1:00–2:30 PM;
    IH Gymnasium.
  - `KABILIN: Sarsuwela Competition`; Competition; 2:30–4:30 PM;
    IH Gymnasium.
  - `SILAK: The Search for the Luminary`; Cultural Program / Competition;
    4:30–8:30 PM; IH Gymnasium.
  - `Awarding Ceremony`; Ceremony; 8:30–9:00 PM; IH Gymnasium.

Server-owned IDs and generated event/activity codes are used. `ACTIVE` is the
existing main-event status and `UPCOMING` is the existing pre-event day and
activity status. No new status enum was invented.

## Truthful unknown-value contract

Responsible and supporting committees, preparation and release deadlines,
request windows, readiness, preparation progress, and additional notes are not
invented. Schema 27 stores nullable operational values where supported,
projects `OWNER_REVIEW_REQUIRED`, renders `Not added yet`, and renders null
readiness/progress as `Not assessed`. It never substitutes zero percent.

## Implemented protected workflow

- D1 migration `0027_event_management.sql` adds Main Event revisions, Event
  Days, governed Activities, included activity items, event hierarchy links,
  nullable operational fields, and append-only Activity History.
- `event.manage` is granted only to System Owner, Administrator, and Director.
- Protected website forms create and correct Main Events, Event Days, and
  Activities; complete missing committees/deadlines/windows/readiness; link
  requests, food requirements, materials, procurement, inventory
  requirements, and releases; and display actor/timestamp history.
- Server validation supplies IDs/codes, enforces optimistic revision and
  idempotency, validates hierarchy/status/time/committee constraints, writes
  Activity History plus the general audit log, and denies unauthorized roles.
- Request creation derives and persists event-series, event-day, and activity
  links from the selected active hierarchy.
- Overview, Request Center, Release Desk, and requester projections use active
  authoritative event rows and exclude archived event days.
- `scripts/seed-approved-ydd-2026.mjs` is an authenticated, deterministic,
  duplicate-detecting staging seed. It archives matching August 10/12 days as
  superseded history, refuses unresolved duplicates/unexpected September
  activities, clears unapproved operational values, and reconciles to exactly
  one series, two active days, and seven active activities.

## Local verification

- ESLint: pass.
- Vitest: 71 files / 464 tests pass.
- Fresh isolated D1: all migrations 0001–0027 pass; schema 27.
- Focused local Worker API: Admin/Director create/read/update path passes;
  unauthorized Food role receives `CAPABILITY_REQUIRED`; TBA and null owner
  review values persist; Activity History is present.
- Focused protected browser acceptance: mobile 390×844 and desktop 1440×900
  both pass with truthful `TBA`, `Not added yet`, and `Not assessed` output.
- Distribution build and standalone verification pass. Apps Script generated
  parity is pending because the local generator could not obtain a write
  handle for `apps-script/AppBody.html`; generated files were not hand-edited.

The Windows Playwright wrapper did not terminate its local Worker after the
focused cases completed, so the outer command timed out; both requested test
cases themselves reported `ok` before teardown.

## Remaining staging gate

Before Phase 18 can be accepted:

1. create a private pre-0027 staging D1 export;
2. apply migration 0027 to staging;
3. deploy the exact candidate to staging only;
4. run the deterministic approved seed and reconcile one series / two days /
   seven activities with no active August schedule or duplicate rows;
5. run protected Admin and Director desktop/mobile acceptance, unauthorized
   denial, history/audit/link verification, and cleanup;
6. verify cache-busted health/readiness/version and exact-head CI.

Current external limitation: this sandbox cannot connect to GitHub or external
staging services. No staging or production value was changed in this local
checkpoint. Phase 18 is not yet accepted, and Phase 19 has not started.
