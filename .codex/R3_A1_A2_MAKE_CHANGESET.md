# R3-A1-A2 — Figma Make changeset

FILE: `rP9W9MQlZkyQrUx38TVsFS` — HAU-USC Logistics · Prototyping
BASELINE: Version 40 (saved by R3-A1)
AMENDMENT: `.codex/specs/accepted/2026-08-23-r3-a1-a2-owner-routing-identity-three-context.md`
DATE: 2026-08-23

This file is written **before** the provider save completes, deliberately, so the
work is reproducible even if browser state is lost. R3-A1 hit a save stall and
recorded the same lesson.

---

## Tooling constraints — re-confirmed for R3-A1-A2

| Constraint | Status |
|---|---|
| `mcp__figma__use_figma` writing Make files | **Not supported.** Design/FigJam/Slides only. No MCP write path. |
| Figma Make AI prompt path | **Unavailable.** "You're out of AI credits for your Full seat in Earl Lawrence Adriano's team. Credits reset Sep 12." |
| In-app browser (`Claude_Browser`) | **Signed out** — the Make file renders as "Sign up to use Figma Make". Cannot edit. |
| Chrome (`claude-in-chrome`) | **Authenticated.** Editor loads with Publish/Share and the code view. This is the only write path. |

### Write mechanism

The Make code view is **CodeMirror 6**, not Monaco. Typing source through
synthetic keystrokes is unsafe — CM6 auto-closes brackets and quotes, which
corrupts pasted-in code. Instead each file is written through the editor's own
`EditorView.dispatch`:

```js
const view = document.querySelector('.cm-content').cmView.view;
view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: nextText } });
```

That is the same code path typing goes through, so Figma Make registers a normal
edit — confirmed: the editor showed `1 edited file · PublicFlows.tsx +53 −173`
with Save / Discard immediately after dispatch.

Every transformation asserts its anchor **before** dispatching. If any anchor is
missing the script returns `DISPATCHED: false` and the document is untouched, so
a partial edit is impossible.

### The repository Make mirror was rejected as a source

`output/design/figma-make-source/` cannot be used to author these edits: 47 of
its files contain a literal `…N tokens truncated…` marker, including
`src/app/PublicFlows.tsx`. See `docs/design/FIGMA_MAKE_SOURCE_REGISTER.md`
and `.codex/R3_A1_A2_MAKE_MIRROR_TRUNCATION.txt` (`FE-R3-015`).

Live source was read from the editor instead. Live `PublicFlows.tsx` at baseline:
**790 lines / 50,790 characters, no truncation marker.**

---

## Applied — `src/app/PublicFlows.tsx`

790 → **670 lines**, 50,790 → **43,427 characters**. All 20 transformations
asserted and applied in one atomic dispatch.

| # | Change | Verified |
|---|---|---|
| 1 | `type Route` drops `"request"` → `"tracking" \| "borrow"` | x1 |
| 2 | `type View` → `"Lending Center" \| "Track lending" \| "Lending policy"` | x1 |
| 3 | initial view → `route === "tracking" ? "Track lending" : "Lending Center"` | x1 |
| 4 | `data-module` → constant `"lending"` | x1 |
| 5 | `← Public front door` → `Home`, arrow moved into `aria-hidden` markup | x1 |
| 6 | Assurance banner gate → `{view === "Lending Center" && (` | x1 |
| 7 | Banner title → "Public lending — no account and no sign-in needed" | x1 |
| 8 | Banner body rescoped to browsing/borrowing, adds DOL staff | x1 |
| 9 | Audience chips → Angelite Student · USC Staff / Officer · DOL Staff | x1 |
| 10 | Nav rationale comment replaced with the R3-A1-A2 §12 rationale | x1 |
| 11 | `<nav aria-label="Public portals">` → `"Public lending navigation"`, **Home button prepended** | x1 |
| 12 | Tab list → `["Lending Center", "Track lending", "Lending policy"]` — **Request Center removed** | x1 |
| 13 | Staff sign-in arrow moved into `aria-hidden` markup | x1 |
| 14 | **Whole public Request Center view deleted** — `−8,006 characters` | ✓ |
| 15 | Track view gate → `"Track lending"` | x1 |
| 16 | Track heading → "Track lending" | x1 |
| 17 | Policy gate → `"Lending policy"` | x1 |
| 18 | Policy heading → "How lending records are handled" | x1 |
| 19 | Policy body rescoped to lending, plus a new "Logistics requests are different" section pointing at Staff sign in | x1 |
| 20 | `nav .leave::after{content:" →"}` removed; `nav .home` / `nav .navArrow` added | x1 |

Plus: the stale `R3 CONTRACT-RECONCILED REPLACEMENT` header docblock was replaced
with the R3-A1-A2 scope-correction header, which also states the prototype
boundary ("simulates outcomes and stores nothing").

Post-edit assertions: `Public front door` **0 occurrences**;
`Request Center` 2 occurrences, both verified intentional — the §12 rationale
comment and the new "External Request Center" policy sentence.

---

## Provider save — IN FLIGHT, not yet confirmed

Save was clicked. The button has shown a spinner for ~90 seconds; the header
still reads **Version 40** and the pending panel still shows
`PublicFlows.tsx +53 −173`.

Console errors were checked and are **telemetry only** —
`figma.com/api/web_logger/metrics/*` and `events.statsigapi.net`, all
`Failed to fetch` / `status 0`. **No save-API error.** This matches the R3-A1
save incident, which resolved on its own after Figma reconnected.

Handling, per the R3-A1 precedent:

- The tab is **left open**. Not reloaded, not navigated away from.
- **Discard was never clicked.**
- The changeset above is recorded here first, so it is reproducible from the
  repository alone.

**`FIGMA_MAKE_CODE_CURRENT` is NOT claimed** until the provider reports a version
above 40 with zero pending edits after a full reload.

---

## Remaining — not yet applied

These carry the rest of R3-A1-A2 §46 step 13 into the prototype.

| File | Change |
|---|---|
| `src/app/appTypes.ts` | Drop `"request"` from `PublicSubRoute`; add `RequesterRoute = "external-request"`; add `EntryIntent`; extend `Session` with `requesterEligible` / `internalOperator`; extend `AuthPreviewOutcome` with the §27 personas (non-DOL requester, DOL, ineligible, expired, invalid credentials, activation-required, reset) |
| `src/app/entryIntent.ts` | **NEW** — `resolveStaffHome`, `resolvePostAuthDestination`, `DENIAL_COPY`; same matrix as the repository |
| `src/app/useAppController.ts` | First-class entry intent; **`goHome` must stop resetting `authState` / `intendedRoute`** so Home preserves the session; persona-driven simulation; `openLogisticsHub` |
| `src/app/AppRouteRenderer.tsx` | Route `external-request` to the new surface |
| `src/app/request/ExternalRequestCenter.tsx` | **NEW** — authenticated requester surface with the DOL "REQUESTER VIEW" cue and `Open Logistics Hub` |
| `src/app/auth/StaffSignInPage.tsx` | New lede copy; `No password yet? Activate account`; `Forgot password?`; persona selector |
| `src/app/auth/AccountRecoveryPanel.tsx`, `VerificationCodeField.tsx` | **NEW** — 8-digit flow with all §19 states, labelled as simulation |
| `src/app/landing/HeroSection.tsx`, `LandingPage.tsx`, `LogisticsHubSection.tsx` | CTAs carry `EXTERNAL_REQUEST_CENTER` intent and state the staff gate on the control |
| `src/app/public/Footer.tsx`, `PublicNavbar.tsx`, `PublicMobileDrawer.tsx` | Same CTA change; one semantic Home |
| `src/app/appRoutes.ts` | `"request-center"` label → `Internal Request Hub` |

§27 note: because Make is a prototype it **may** simulate identity outcomes, but
the simulation must represent the corrected product model and must be labelled
truthfully. No simulated result may be presented as real provider behaviour.
