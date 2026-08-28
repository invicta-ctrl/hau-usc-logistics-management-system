# P28 Final Accessibility and Responsive Matrix

DATE: 2026-08-29
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: PASS_LOCAL_EXACT_CANDIDATE
ROUTE: SOLO
SOURCE: `a2fda65dc5af2c7fdce89da29d486bc4b5c21102` plus the P28 test-contract correction in this checkpoint

## Required matrix

| Requirement | Evidence | Result |
| --- | --- | --- |
| Widths 320, 390, 768, 1024, 1440 | Five Playwright frontend projects | PASS |
| HAU default Light | Five-width theme matrix | PASS |
| HAU default Dark | Five-width theme matrix | PASS |
| Representative alternate Light | Angelite Ivory matrix | PASS |
| Representative alternate Dark | Midnight Ledger matrix | PASS |
| All themes | Six families × Light/Dark/System at 390 and 1440 | PASS |
| Keyboard | Tab/focus and public workflow tests | PASS |
| Focus | Mobile dialog return, desktop theme control, route focus tests | PASS |
| 200% zoom/reflow | 720 CSS-pixel desktop equivalent and cutover reflow assertions | PASS |
| Reduced motion | Theme matrix and public hero/index checks | PASS |
| Screen-reader smoke | Sixteen-route landmark, heading, label, name, table-header, and ID audit | PASS |
| Horizontal overflow | All five accepted widths and sampled appearances | PASS |

No primary-workflow-breaking horizontal overflow was detected.

## Screen-reader smoke scope

The route-wide semantics audit inspected the visible main content for:

- one visible H1 beginning the content hierarchy;
- no heading-level skips;
- associated names for every visible input, select, and textarea;
- accessible names for every visible button and link;
- `scope` on every visible table header;
- unique IDs within the main landmark.

It covered Landing, Tracking, Public Lending, Staff Sign In, Playground Index, External Request, Overview, Inventory, Request Center, Lending, Release, Restocking, Procurement, Events, Administration, and Profile at 390 and 1440. Critical public forms and workflow controls were additionally exercised through public lending, public tracking, account application, staff sign-in, starter activation, theme/focus, Current states, and governed media fallback.

## Bounded corrections

P28 found three stale regression locators after the P27 semantic cleanup:

1. Home and Staff sign-in were incorrectly asserted as buttons instead of links in LEND-02.
2. Track lending was incorrectly asserted as a link instead of the local tab button.
3. The withdrawn state used a partial text locator that matched both `Application withdrawn.` and the exact `WITHDRAWN` record value.
4. The Current media-error assertion still searched the detail article even though P27 intentionally presents the message once in the media figure.

Only test contracts were corrected. Product behavior did not change. The updated assertions verify the correct semantic roles, exact status value, and single media-error presentation.

## Exact results

- `playground-accessibility-semantics.spec.js --workers=1`: `3 passed`, `7 intentional skips`.
- `playground-theme-accessibility.spec.js --workers=1`: `9 passed`, `6 intentional skips`.
- LEND-02 five-width regression: `5 passed`.
- Corrected tracking/application/media-error focused matrix: `15 passed`.
- Serialized full `frontend-cutover.spec.js`: `60 passed` across all five widths.
- P25 deterministic contrast audit retained: `12` palettes, `216` contrast pairs, `0` failures.
- P27 repository suite retained because product source did not change in P28: `169` files and `1,243` tests passed.

## Diagnostic exclusions and environment preservation

An exploratory all-config run started 415 cases with eight browser workers against one local Vite process. It was cancelled after contention-generated timeouts; it is not acceptance evidence. The required suites were rerun serialized and passed.

Port 4200 was found to be owned by an unrelated LiteLLM service. Playwright's `reuseExistingServer` attached to that service and exposed its Swagger page; the run was cancelled, the owner was preserved, and nothing was stopped or changed. Port 4217 was verified free and used for the final serialized cutover pass. All Playground test servers started by this phase were stopped. Port 4173 remained untouched.

No deployment, D1, R2, Production, main, Google, provider-send, or Figma mutation occurred.

## P29 handoff

The exact local candidate meets the P28 accessibility/responsive gate. P29 must freeze branch/SHA/tree, lockfile and artifact hashes, Worker/D1/R2 identity, schema/migration, baseline/generation, theme/language versions, and rollback target before deploying only to Playground.
