# FI-00 to FI-03 Live Figma Authority Audit Register

TASK: FI-LIVE-FIGMA-AUTHORITY-01
AUTHORITY: Live Make `rP9W9MQlZkyQrUx38TVsFS` for current visual implementation; live Design `hXJElH4p72KfgAaoUyfNOC` for documentation/reference; repository contracts for behavior.
SCOPE: FI-00 through FI-03 only. No Figma, provider, Playground, or Production write occurred.

## Evidence freeze

- Official Figma MCP identity: root direct read-only `whoami` PASS as `Invicta-ctrl`.
- Design metadata: root direct read-only PASS at page 90 / node `55:14`; FI-01 foundation context/screenshot PASS at `223:2`; FI-03 documentation contexts/screenshots PASS at `123:1012`, `123:1542`, `123:1671`, and `123:1816`.
- Make: root authenticated Chrome inspection PASS on exact file version 39 at desktop and compact widths; ordinary web fetch was not used.
- This writer saw one isolated Design-app reauthentication failure and made the one permitted `codex mcp login figma` recovery invocation. Root's subsequent official MCP identity and targeted reads passed; no further OAuth attempt was made.

## Bounded surface register

| Slice | Real surface                | Current live evidence                                                                                                                                                                                         | Repository disposition                                                                                                                                                                                                                        |
| ----- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FI-00 | Authority chain             | Make is accessible through authenticated Chrome; Design is accessible through official MCP; old exports are fallback only.                                                                                    | `VERIFIED_NO_OP`: classification corrected in the current audit chain; historical evidence preserved.                                                                                                                                         |
| FI-01 | Shared foundation           | Design M0-M4/G0-G4 retains semantic hierarchy on existing variables, light/dark roles, Bricolage/IBM Plex/Newsreader role map, oxblood authority, gold decisive focus, and separate operational status roles. | `VERIFIED_NO_OP`: existing tokens and G1-G4 system conform. Only route-local CSS extensions use those variables.                                                                                                                              |
| FI-02 | Public landing              | Make v39: USC/DOL masthead; Home, Logistics hub, theme, Staff sign in; warm blurred institutional hero; `HAU-USC · Institutional Logistics Ledger`; requested headline/actions/utility links.                 | Repaired hero, navigation, action hierarchy, governed institutional media, and stopped announcements from replacing logistics intent. Announcement loading/populated/empty/error/media-failure stays a separate truthful service-backed area. |
| FI-03 | Staff sign-in               | Make v39: campus backdrop, dark oxblood centered card, Department of Logistics eyebrow, Identifier placeholder, password visibility, help, gold sign-in action, return link; compact reflow.                  | Repaired presentation only; field binding remains `u` and existing auth/session controls are unchanged.                                                                                                                                       |
| FI-03 | Verify, application, status | Make v39 contains only a placeholder for these routes; it is not a visual implementation authority for them. Design documentation frames are explicitly proposed/reference only.                              | Existing contract-backed routes and safe states retained; Design reference used only where compatible. No placeholder, mock behavior, or new auth flow introduced.                                                                            |

## Acceptance result

FI00_RESULT: VERIFIED_NO_OP
FI01_RESULT: VERIFIED_NO_OP
FI02_FUNCTIONAL_STATUS: PASS
FI02_VISUAL_STATUS: HISTORICAL_PASS_SUPERSEDED;DIRECT_LOCAL_REPAIR_COMPLETE;OWNER_ROOT_ACCEPTANCE_PENDING
FI03_FUNCTIONAL_STATUS: PASS
FI03_VISUAL_STATUS: PASS (Make-supported sign-in; documentation-constrained verification/application/status retained without invention)

## FI-02 visual-acceptance supersession and repair receipt — 2026-08-22

- **Reason reopened:** Earl rejected the prior FI-02 `VISUAL_PASS`: the localhost landing beneath the preserved staging/test banner was still structurally stale against live Make v39. This preserves the historical result while superseding it for FI-02 only.
- **Live Make evidence read:** `LandingPage`, `HeroSection`, `CurrentSection`, `LogisticsHubSection`, `landingData`, `PublicNavbar`, and `Footer` from Make file `rP9W9MQlZkyQrUx38TVsFS`; no Figma write or asset download occurred.
- **Repair:** public shell and landing now use the Make order and hierarchy—maroon institutional masthead, exact ledger hero lede/actions, Current split composition, oxblood Logistics hub with four real-route tiles and six ledger steps, and institutional footer. `Logistics hub` uses a reduced-motion-safe in-page scroll instead of changing the hash router.
- **Functional preservation:** Current continues to project loading/populated/empty/error/media-failure only from the existing public advertisement runtime. Dynamic official media keeps its returned alt text; no Make prototype event data or unverified cover asset was copied. Real request/lending/tracking/sign-in routes and the public policy link remain present.
- **Repair verification:** landing unit 8/8 PASS; scoped ESLint/Prettier/diff check PASS; focused lifecycle E2E 6/6 PASS; full V5 1440 project 32 PASS/7 configured skips; visual matrix 5/5 at 320/390/768/1024/1440 with light/dark capture; final build PASS; deterministic dist parity PASS (`578,452` bytes, sha256 prefix `256f187cbc659b43`).

## FI-02 owner-comparison repair closeout — 2026-08-22

- **Second rejection preserved:** independent owner comparison showed the historical repair receipt was still visually incomplete: the masthead DOM was not visibly rendered in the 1440×1000 viewport, the landing still referenced `/brand/login-background`, and dark-theme foregrounds could collapse into their warm surfaces. The earlier `VISUAL_PASS` remains historical evidence only and is explicitly superseded above.
- **Bounded correction:** `hero-poster.js` contains the exact `heroPoster.ts` WebP data URI read from authenticated Make source `rP9W9MQlZkyQrUx38TVsFS`; it replaces the landing image only. The landing masthead now has an enforced Make-style maroon 76px band (60px compact) below retained staging chrome. Theme-specific foregrounds keep the masthead, Current, Logistics hub, and footer legible without altering public routes or advertisement-state projection.
- **Direct visual evidence:** inspected localhost at 1440×1000 and 390×844 in light and dark. Measured masthead: desktop y=71/h=76; mobile y=68/h=60; `display:flex`, `visibility:visible`, `opacity:1`, sticky z-index 110. Current heading is dark ink on warm paper in dark mode; no horizontal overflow at the verified breakpoints.
- **Repair verification:** landing unit 8/8 PASS; focused lifecycle E2E 1/1 PASS; responsive light/dark E2E 9/9 PASS; visual matrix 5/5 PASS at 320/390/768/1024/1440; direct keyboard drawer/focus, preserved hub hash/focus, reduced-motion, and effective 200%-zoom (720px) checks PASS; Prettier/ESLint PASS; `npm run build`, `npm run verify:dist` (`610,260` bytes, sha256 prefix `bd4dbfc670f8d409`), governance, continuation, and handoff checks PASS.

## Verification receipt

- Cross-width public lifecycle, sign-in, and theme matrix: 20 PASS at 320, 375, 390, 414, 768, 1024, 1280, 1440, and 1920 CSS pixels; 16 state-specific skips are expected by the configured browser projects.
- V5 visual acceptance: 5 PASS at 320, 390, 768, 1024, and 1440 CSS pixels.
- Full unit regression: `npm test` PASS. Canonical artifacts were rebuilt with `npm run build`, and `npm run verify:dist` PASS.
- Focused touched-file ESLint, Prettier, `git diff --check`, `npm run check:agents`, `npm run handoff:verify`, and `npm run check:continuation` PASS.
- Root visual inspection confirmed the Make-aligned landing and sign-in at desktop and 390px compact, with no horizontal overflow, a 78×44 theme target, and a 44×44 compact-navigation target.
