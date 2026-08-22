# V4.1 → Production Integration Map

How the accepted V4.1 visual language applies to each real production surface.

Companion to `PRODUCTION_FRONTEND_PARITY_BASELINE.md` and
`.codex/specs/active/v0.7.3-frontend-design-integration.md`.

**The design system is a language, not a template.** Production screens are not
forced into one composition. Where a production structure and a preview pattern
disagree, production structure wins and the visual treatment adapts.

---

## Global treatments

| Concern | Applied to every surface |
|---|---|
| Identity | Oxblood anchor, scarce muted gold for active/selected/attention only |
| Light mode | Clean paper ground with a real figure/ground gap; not beige-on-beige |
| Dark mode | Separately authored charcoal + oxblood; content sits above its ground |
| Type | Bold editorial display for page and section headings; highly readable operational body |
| Icons | One monoline family, one brand ink; colour reserved for status, selection, attention, primary action |
| Depth | Page ground → working surface → elevated overlay. Not glass everywhere |
| Motion | Press 100–140 ms · micro 160–220 ms · component 180–260 ms · route 220–320 ms · drawer 240–360 ms · hero 300–520 ms. Transform/opacity. No bounce. Everything settles |
| Copy | §6 of the specification |
| Environment | No badge in production; "Test site" in plain language on staging |

---

## Public / pre-authentication

| Production route | Current structure | V4.1 pattern | Copy | Motion | Mobile | Functionality preserved |
|---|---|---|---|---|---|---|
| Portal entry | Portal directory list | **Major upgrade.** Institutional hero, one bold headline, primary *Request supplies*, secondary *Borrow equipment*, quiet *Staff sign in*, visible tracking entry; 3D hero behind copy | Replace directory phrasing with direct actions | Staged hero entry, lazy 3D after critical content | 3D simplified/bounded; CTAs stack, remain above fold | Every existing destination stays reachable |
| Staff Sign In | Centred auth form | Compact elevated auth card, premium field treatment | "Sign in" · errors reveal nothing about account existence | Field focus, submit press | Full-width fields, sticky action | Session boundary and failure semantics unchanged |
| Create Staff Account | Form | Same auth-card language | Plain-language requirements | Inline validation reveal | Stacked | Account stays inactive until reviewed |
| Account application | Multi-step form | Stepper + review + explicit receipt | "Apply for access" | Step transitions | Stacked; sticky continue | Fail-closed identity matching unchanged |
| Application status | Status view | Timeline + current state + next action | "What happens next" | Timeline reveal once | Stacked | No reviewer detail exposed |
| Public Request Center | Intake form | Sectioned form, review step, explicit receipt | Keep "Request"; drop implementation wording | Section reveal, submit acknowledgement | Sticky primary action | **No stock reservation at submission; no public stock counts** |
| Request tracking | Reference lookup | Timeline + status chip + next action | "Track a request" | Timeline reveal | Stacked | Reference-only lookup |
| Public Lending Center | Intake form | Same intake language | Keep "Lending"/"Borrow" | Section reveal | Sticky action | Identity-evidence requirement intact |
| Lending tracking | Status view | Lifecycle timeline | Plain stage names | Stage emphasis | Stacked | Borrower identity never published |
| Privacy / acceptable use | Policy dialog | Readable policy surface, explicit acknowledgement | Short plain sentences | Dialog enter/exit with focus handling | Full-screen sheet | Acknowledgement still recorded |

## Authenticated shell

| Element | V4.1 pattern | Notes |
|---|---|---|
| Route rail | Persistent desktop rail, bold active state, gliding indicator | Collapsible; off-canvas below 1024 |
| Topbar | Compact command bar; search as a primary anchor | Keyboard shortcut hint retained |
| Menu control | Kinetic menu; close morph only when a drawer actually covers content | Never a false "close" affordance |
| Back control | Compact glossy plate, directional arrow travel | Replaces the oversized outlined circle |
| Theme control | Celestial capsule; **filled** crescent moon and filled sun; travelling plate | Persisted; truthful accessible label; reduced motion drops travel |
| Account menu | Disclosure from trigger; focus returns to trigger | |
| Workspace / scope | Clear context control using real role and team names | Scope filtering stays server-bound |
| Mobile navigation | Off-canvas drawer + bottom navigation for the most-used destinations | Safe-area aware |

## Operational modules

| Module | V4.1 pattern | Functionality preserved |
|---|---|---|
| Overview | Asymmetric operational brief answering: what needs attention, what is ready, what is blocked, what next, what changed. Not equal cards | Counts reflect authorized scope only |
| Request Center | Queue → selected request → line decisions / history / next action | **One explicit decision per line**; nothing routed by default; compare-and-swap review |
| Office Lending Hub | Lifecycle queue with the current stage visually obvious | For Review → Ready to Claim → On Loan → Returned, plus Overdue |
| Release Desk | Ready · recipient · quantity · remaining · evidence · completion | **Partial and cumulative release**; recipient-confirmed handoff |
| Restocking / Receiving | Queue + receipt recording with remaining quantity | Partial receipt; stock moves only on recorded receipt |
| Procurement / Canvassing | Queue + quote comparison + preferred decision | Exclusive preferred decision; supplier records stay private |
| Inventory | Search/filter → dense table → item detail → movement history | Ledger-derived balances; **no direct balance editing affordance** |
| Item / history | Facts + append-only ledger | Corrections are reversals, never edits |
| Events / sub-events | Series → sub-event context with readiness | Truthful unknowns, never fabricated zeros |
| Activity / history | Chronological, actor-attributed | Immutable audit references |

## Administration

| Surface | V4.1 pattern | Copy | Preserved |
|---|---|---|---|
| Accounts & Access | Governed table + detail drawer + before/after change summary | "Access", "Permissions", "Account status", "Needs review" | Effective-access preview; archive-without-delete; audit |
| Staff Directory | Read-only table | State it is read-only in plain words | Protected-source projection |
| Reference Administration | Table + inline edit + confirmation | Plain catalog names | Governed mutation with audit |
| Link Registry | Table + publication state | External sync described plainly, reported separately | Publication semantics |
| Announcements / Brand & Media | Versioned asset table + preview | "Published", "Previous versions" | Owner-only mutation; retained history |
| My Profile | Two-panel: access facts + security | "Role changes go through Accounts and Access" | Self-service boundary |
| System status | Labelled aggregate rows; plain summary first, technical detail progressively disclosed | Ordinary users see Online / Temporarily unavailable / Try again | Owner-gated; unavailable ≠ zero |

---

## Exceptions

1. **`reports`** gets no surface. It has a feature directory but no bootstrap
   module and no view template. Inventing one would contradict source.
2. **System Owner surface** is the one place technical vocabulary may remain,
   and even there plain language leads with detail progressively disclosed.
3. **3D is public-landing only.** No authenticated operational surface gets a
   3D centrepiece; it would compete with dense operational content.
4. **Glass is selective** — floating command surfaces, overlays, drawers,
   filters, quick actions. Dense tables stay flatter for legibility.
