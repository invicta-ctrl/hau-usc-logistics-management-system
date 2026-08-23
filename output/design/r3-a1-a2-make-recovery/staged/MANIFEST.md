# R3-A1-A2 Make — staged Checkpoint A source

These are the **exact bytes** dispatched into the Figma Make editor for
Checkpoint A. Each dispatch asserted `after === next` against the served file, so
the provider document and the file here are byte-identical at write time.

They are kept so the work survives a lost browser session — the same lesson the
stalled `PublicFlows.tsx` save produced.

| sha256 (first 16) | bytes | provider path |
|---|---:|---|
| `b0e03e9d13384756` | 1,056 | `src/app/appRoutes.ts` |
| `648bea9016cada30` | 2,569 | `src/app/appTypes.ts` |
| `fe371e5e21bcb0d2` | 11,675 | `src/app/auth/AccountRecoveryPanel.tsx` |
| `581204ebe4d2e1f6` | 4,283 | `src/app/auth/VerificationCodeField.tsx` |
| `279e30d8103491d3` | 5,241 | `src/app/entryIntent.ts` |
| `7e31f72c277479a1` | 21,299 | `src/app/request/ExternalRequestCenter.tsx` |

Truncation markers: **0**.

## Why Checkpoint A is additive

`appTypes.ts` keeps `"request"` in `PublicSubRoute` at this checkpoint. Every
existing caller therefore still type-checks, and nothing yet imports the three
new components — so the project compiles with Checkpoint A applied on its own.
Checkpoint B removes `"request"` in the same save as the callers that stop using
it.

## Provider file creation

The Make "Create new file" field **flattens `/` to `_`** — typing
`src/app/entryIntent.ts` produced a root-level `src_app_entryIntent.ts`. That
attempt was reverted with the per-file restore control.

The working path is the **file-tree context menu**: right-click a folder →
`Create file` / `Create folder`, which creates inside that folder. `request/`
was created that way.

Two renames did not take on the first attempt (the inline field was not focused
when the keystrokes were sent) and left a `new-file.tsx`; both were corrected
before saving — one by reverting, one by an explicit context-menu Rename. Any
`new-file.tsx` in a diff is a rename that silently failed and must be fixed
before Save.


---

## Checkpoint B — staged, not yet applied

Checkpoint B is the switch: it removes `"request"` from `PublicSubRoute` in the
same save as the callers that stop using it, so the project compiles before and
after.

| provider path | change |
|---|---|
| `src/app/appTypes.ts` | drops `"request"` from `PublicSubRoute` (supersedes the Checkpoint A copy) |
| `src/app/useAppController.ts` | first-class entry intent; `goHome` preserves the session; `openLogisticsHub`; persona-driven simulation |
| `src/app/AppRouteRenderer.tsx` | routes `external-request`; passes `onHome` into the public chrome |
| `src/app/auth/StaffSignInPage.tsx` | new lede; Activate account; Forgot password; truthful denial actions; persona picker |
| `src/app/landing/LandingPage.tsx` · `HeroSection.tsx` · `LogisticsHubSection.tsx` | CTAs carry `EXTERNAL_REQUEST_CENTER` intent and state the staff gate on the control |
| `src/app/public/Footer.tsx` · `PublicNavbar.tsx` · `PublicMobileDrawer.tsx` | same CTA change; one semantic Home |
| `src/styles/index.css` | `.atrium__action--stacked` / `.atrium__action-note` for the hero access notes |

### What the previous prototype hid

The old `handleSignIn` granted `capabilities: [...AUTH_ROUTES]` — every
capability — to whoever signed in. Every routing decision was therefore trivially
"authorized", which made the entire question the owner is asking invisible in the
prototype. Each persona now carries a realistic capability set drawn from
`src/domain/permissions.js`, so the prototype can actually demonstrate a non-DOL
requester routing differently from DOL staff, and an ineligible account being
refused.
