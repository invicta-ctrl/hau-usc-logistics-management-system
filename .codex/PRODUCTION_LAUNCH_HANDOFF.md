# Phase 3 Task 2A Staging Correction Handoff

Status: staging correction deployed; this is not production approval or Phase 3 completion.

## Deployed target

- Staging URL: `https://hau-usc-logistics-staging.earllawrence-adriano-ce.workers.dev`
- Candidate: `d6085d867ba775f5f3e5c9b51f54754487167eb5`
- Cloudflare Worker version: `24f38c25-b34d-4c42-b545-e32258e16b73`
- Health result: STAGING, application version 0.6.0, D1 connected, schema 7, latest migration `0007_entity_committee_scope.sql`.

## What changed

- Staging and production-mode browser builds default to the REST/Worker runtime and fail closed if a mock runtime is requested.
- The login gateway hides the workspace until a server session is established, removes preview/reset controls, and routes each server-assigned experience to its fixed `/app/...` workspace.
- The server-mode shell removes the generic overview hero from the authenticated first viewport and leads with an Administrator, Director, Food, Inventory & Pantry, or Materials role workspace.
- The public requester path remains distinct at `/request` with no internal navigation.

## Verified evidence

- `npm run check`: passed, including governance, lint, 53 Vitest files / 373 tests, generated-artifact checks, and Cloudflare dry run.
- Full Playwright from the preceding code correction: 90 passed, 204 intentional skips, 0 failures.
- Fresh staging browser evidence at 390px, about 820px, and 1366px covers login; Administrator, Director, Food, Inventory & Pantry, and Materials sign-in; and the requester path. All reviewed authenticated and requester views had no horizontal overflow.
- Server-assigned routes were verified as `/app/admin`, `/app/director`, `/app/food`, `/app/inventory`, and `/app/materials`. An authenticated Food session sent to `/app/admin` returned to `/app/food`.

## Boundaries and remaining work

- The private authorization package validates only through Gate D. It does not approve synthetic workflow writes, evidence uploads, rollback rehearsal, or cleanup/retention.
- A public lending portal is not implemented. Unauthenticated `/lending` shows the isolated login and exposes no internal lending data; it is a safe denial, not a substitute for a borrower workflow. An accepted external capability, privacy, and API contract is required before building that portal.
- No production promotion, `main` update, PR merge, D1 data migration, operational data write, evidence upload, or rollback rehearsal occurred in Task 2A.
