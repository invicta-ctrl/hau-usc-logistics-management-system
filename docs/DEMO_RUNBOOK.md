# Guided demo runbook

## Live Isolated Playground

The deployed Playground is available at `https://playground.hausc.org/` behind the configured Cloudflare Access boundary. No application credentials are required for the staging demo:

1. Open the Playground with a fresh browser session.
2. Select `Staff sign in`.
3. Select `Enter Playground` to issue a temporary staging-only System Owner session.
4. Demonstrate Overview, Inventory, Internal Request Hub, Internal Lending Hub, Release, Restocking, Procurement, Events, Administration, and Profile.
5. Use public lending and tracking only from the public surface; a public logistics request truthfully requires staff sign-in.
6. Sign out or perform the private operator cleanup after the demo. Never retain or share the session cookie or CSRF token.

For reset, use only `scripts/playground/reset-workspace.mjs` with the current private resource manifest and a new private report path. Reconcile the current reset generation first, do not repeat an ambiguous or already-completed reset, verify the old session is rejected, and finish with zero sessions/transient rows plus sealed D1/R2 parity. Production, Google, email/provider sends, and baseline refresh remain outside this demo workflow.

## Outcome

`hau-usc-logistics-guided-demo.html` is the primary offline presentation
artifact. It contains the complete fictional preview application plus an
accessible seven-step guide. It requires no server, external stylesheet,
external script, Google account, Sheet, Drive folder, or network connection.

The historical Phase 2 review images are under `docs/archive/v0.6/previews-v0.6-phase-2/`.
They cover login/onboarding, all five internal experiences, Request Center,
Lending Hub, Release Desk, and representative 390 px mobile adaptations. The
preview manifest records the fixed clock, viewport, regeneration command, and
safety boundary.

The existing all-in-one shareable and the seven direct module shareables remain
available. The guided demo does not replace or modify staging or production.

## Build and launch

1. Run `npm run check` from the repository root.
2. Open `hau-usc-logistics-guided-demo.html` directly in Chrome or Edge.
3. Confirm the `Preview mode · local data` label and select `Reset Demo Data`
   if a previous rehearsal changed the fictional records.
4. Select `Guided demo` in the lower-right corner.
5. Use `Open this module`, `Next module`, and `Previous` to control the tour.
   Press Escape at any time to close the guide.

## Recommended 12-minute story

| Time | Module                     | Presenter outcome                                                                                         |
| ---: | -------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1:00 | Overview                   | Establish one operational picture for upcoming work, queue pressure, and recent completion.               |
| 2:30 | Request Center             | Build a representative event request and explain predictive catalog selection and composite sections.     |
| 1:30 | Office Lending Hub         | Explain consumable versus loanable handling, claim, due date, and return.                                 |
| 1:15 | Release Desk               | Show the controlled physical handoff and traceable release history.                                       |
| 1:30 | Restocking                 | Review prerequisites, preferred quote context, and cumulative line-level receiving.                       |
| 2:00 | Procurement & Deliverables | Connect canvassing, receiving, evidence context, and event-item provenance.                               |
| 1:30 | Inventory Management       | Finish with stock truth, availability-to-promise, filters, ledger history, and controlled administration. |
| 0:45 | Close                      | Reiterate fictional data, server-enforced production controls, and the staging acceptance boundary.       |

## Presenter guardrails

- Say “near-live bounded refresh,” not WebSocket or real-time.
- Say “fictional preview data,” not production or live institutional records.
- Do not claim staging acceptance, production promotion, migration, or release.
- Do not present a catalog entry as proof that a venue or asset is available.
- Do not imply a school ID is authentication or authorization.
- Explain that stock is ledger-derived and release/receiving actions are
  controlled server workflows in Apps Script mode.
- If a workflow is interrupted, reset demo data and resume from the relevant
  direct module file in `shareable-html-modules/`.

## Rehearsal checklist

- [ ] `npm run check` passes at the presentation SHA.
- [ ] The guided demo opens from `file://` with no visible JavaScript error.
- [ ] Every Next/Previous step opens the named module.
- [ ] Escape closes the guide and focus returns to its launcher.
- [ ] Desktop at 1366 px and mobile at 390 px remain usable.
- [ ] Reset Demo Data restores the prepared fictional state.
- [ ] No real person, credential, identifier, contact, supplier tax value,
      evidence link, or Google resource is present.
- [ ] The presenter knows the exact staging/production claims that remain
      prohibited.
