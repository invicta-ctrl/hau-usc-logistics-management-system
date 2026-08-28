# P04 Preview Index / Workspace Navigation Audit

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
BRANCH: reconcile/playground-master
MODE: LIVE_DEFECT_REPRODUCTION_PLUS_LOCAL_CANDIDATE_REPAIR

## Defect reproduced

The deployed Playground Preview Index listed 15 accepted routes, but every authenticated entry's Open Preview action was a no-op. The URL remained #/__preview/index, no workspace mounted, browser history gained no workspace state, and direct inspection URLs did not exist.

Three source causes were confirmed:

1. inspection was restricted to DEV on exact 127.0.0.1:4173, even after /api/version had established the canonical deployed Playground gate;
2. inspection selection lived only in React state and never acquired a route/hash identity;
3. normal application navigation was memory-only, so public and real-access routes lacked canonical direct-load and browser-history state.

## Repair

- Added exact application route hashes: root for Landing and #/route/<route> for every other real application route.
- Added exact protected inspection hashes: #/__preview/inspect/<route>.
- Synchronized application and Preview Index state from hashchange, including initial direct loads and reloads.
- Permitted fixture inspection only when /api/version establishes Playground and the browser is either the exact DEV supervisor or exact HTTPS playground.hausc.org.
- Preserved the off-origin fail-closed gate and unchanged real authorization path.
- Removed the intermediate empty-hash transition when opening a route from the Index, so one browser Back returns directly to the Index.
- Replaced deployed-facing local inspection wording with truthful Preview inspection wording.

## Exhaustive route matrix

The Playwright regression clicks all 15 Index entries:

    landing
    tracking
    borrow
    staff-signin
    external-request
    overview
    inventory
    request-center
    lending
    release
    restocking
    procurement
    events
    administration
    profile

For each entry it verifies the canonical URL, visible main landmark and heading, browser Back to the Preview Index, browser Forward to the workspace, direct route load, reload persistence, and the protected inspection identity where applicable. Protected inspection entries also verify their explicit Back to Preview Index action. No mutation request is permitted during the matrix.

## Verification

- Focused unit suite: 4 files / 32 tests passed.
- P04 exhaustive Playwright at 1440: 15/15 entries passed.
- P04 exhaustive Playwright at 390: 15/15 entries passed.
- Existing public-open, protected real-access, and exact-4173 inspection tests: 3/3 passed.
- Off-origin inspection gate at 1440: passed.
- Cloudflare staging build: passed; 1,675 modules.
- Candidate staging index: 792,941 bytes; SHA-256 C5A52F7BF1519E8058E99A8C99DC68CAFB8E93A330D39CA8D7725F34CC9003A4.
- Hero reconstruction: byte-identical; 36,018,711 bytes; SHA-256 657b38b82d452a234ab76c64a3c4312133279ec3d59b9923c84c5e24501e71d1.
- Controlled local server on port 4173 was stopped after verification; the port was confirmed free.

The first exhaustive run reached every route but failed its final assertion because it classified legitimate read-only catalog/bootstrap GETs as forbidden. The guard was corrected to the P04 safety requirement—zero mutation requests—and both final viewport runs passed. P06 retains responsibility for the full fixture/read boundary audit.

## P04 gate

    DEAD_WORKSPACE_LINKS = 0
    PREVIEW_INDEX_NAVIGATION = PASS_LOCAL_CANDIDATE
    DIRECT_ROUTE_NAVIGATION = PASS_LOCAL_CANDIDATE
    BACK_FORWARD = PASS_LOCAL_CANDIDATE
    POST_RUNTIME_RESET_NAVIGATION = PASS_LOCAL_CANDIDATE
    MUTATION_REQUESTS = 0
    OFF_ORIGIN_INSPECTION = DENIED
    LIVE_DEPLOYMENT = NOT_PERFORMED

The current live deployment still contains the reproduced no-op behavior. Exact-candidate live verification remains pending the later accepted deployment/rollback gate.
