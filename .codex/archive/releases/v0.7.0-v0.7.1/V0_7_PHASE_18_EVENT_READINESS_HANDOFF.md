# v0.7.0 Phase 18 Event Readiness Resolution Handoff

Status: **ACCEPTED ON STAGING — PRODUCTION NO-GO**

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
- Exact implementation commit `d54e733f3936513bb2305e53fa95d984060c28a4`
  passes the complete `npm run check` in an isolated exact-commit worktree:
  governance, lint, 71 files / 464 Vitest tests, build, deterministic Apps
  Script generated parity, distribution verification, Cloudflare types, and
  deployment dry-run. Generated files were not hand-edited.

The Windows Playwright wrapper did not terminate its local Worker after the
focused cases completed, so the outer command timed out; both requested test
cases themselves reported `ok` before teardown.

## Staging execution checkpoint

- A private pre-0027 staging export was created and independently restored into
  SQLite with `integrity_check=ok`, zero foreign-key violations, and 69 tables.
  Its SHA-256 is
  `9bcc61adec05c482a3542d65a8b4188f3b07b68c8ff2e243e42a60ff37f1248d`.
- Migration `0027_event_management.sql` is applied on staging; the operational
  schema version is 27 and the migration is no longer pending.
- Exact candidate `41e2ead90fd5120c69843fad9aeda473e3f8f2cc` was deployed to
  staging and passed cache-busted environment/candidate convergence.
- The authenticated deterministic seed and its idempotent replay both passed.
  Staging reconciles to one Youth Development Days 2026 series, two active
  September days, seven approved activities, no active August 10/12 day, and
  no duplicate series or activity.
- Live mobile review found that the overview omitted the TBA workshop and
  rendered absent readiness as `0%`; an empty roadmap also rendered `NaN%`.
  These were not accepted as truthful output. Repair commit
  `a342c7a2d8b03b21ad400705575adada0a69591a` now derives TBA activity dates
  from Event Days, renders absent committees as `Not added yet`, renders
  unassessed readiness as `Not assessed`, and supplies a truthful empty
  roadmap state. Its focused local Worker/browser regression passes, as do
  ESLint, 71 files / 464 Vitest tests, and the generated production build.
- Production was not readied, migrated, seeded, deployed, or otherwise
  modified.

## Final acceptance

- Startup compatibility repair
  `80c0db43cc06145ada09434fd55f3fd31c0873f7` supplies the new Event Days
  collection to fresh mock state and safely migrates older persisted preview
  state. The complete repository gate passes, and the full responsive matrix
  passes 127 tests with 311 intentional skips and zero failures.
- Exact runtime `80c0db43cc06145ada09434fd55f3fd31c0873f7` is deployed to
  staging. Three cache-busted probes returned that exact SHA and `STAGING`.
- Seed replay at the exact runtime reconciles two active days, seven active
  activities, and 40 append-only history records without duplicates.
- Live 390×844 and 1440×900 acceptance each show all seven activities. The
  September 1 workshop shows `TBA · Sep 1, 2026`, `Not added yet`, two
  `Not assessed` values, and no fabricated `0%`; Event Management and Activity
  History are available in both layouts.
- D1 reconciliation proves one active series, two active days, seven active
  activities, zero active August 10/12 days, seven owner-review-required
  activities with nullable unknown fields, 30 audited event records, three
  authorized `event.manage` role grants, and zero unauthorized role grants.
- Focused Worker acceptance proves Administrator/Director mutation,
  unauthorized denial, request/event-day/activity linking, idempotency,
  Activity History, and audit behavior on the deployed exact code.
- Draft PR #9 is open and mergeable at exact head `80c0db4`; all 6 / 6 checks
  pass, including the six-minute browser-smoke job.
- No synthetic event series or activity was added to staging acceptance data;
  only the approved deterministic hierarchy and append-only replay history
  remain. Production was not modified.

Phase 18 is accepted. The authoritative pointer advances to Phase 19.
