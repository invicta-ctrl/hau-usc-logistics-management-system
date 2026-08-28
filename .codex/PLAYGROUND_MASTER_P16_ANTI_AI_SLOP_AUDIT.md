# P16 Anti-AI-Slop Candidate Audit

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: PASS_BOUNDED_AUDIT; CORRECTIONS_ASSIGNED_P17_P23
ROUTE: SOLO

## Confirmed corrections

| Evidence | Finding | Assigned phase |
| --- | --- | --- |
| `src/frontend/app/landing/HeroSection.tsx` | The exact slogan `Every request. Every handoff. On record.` and a 5.25rem media hero conflict with the accepted direct-product-title rule. Replace the slogan rather than inventing a new one; preserve the real request and lending actions. | P19 copy; P23 measured media/performance |
| `src/frontend/preview/index/PreviewIndexPage.tsx` | Every route currently carries five metadata blocks and up to three actions in one long grouped list. This is useful audit data but too heavy for the required fast QA launcher. Promote search and one-click navigation; move secondary contract detail behind selected detail. | P21 Index redesign |
| `src/frontend/styles/index.css` and `src/frontend/app/overview/OverviewPreviewRoute.tsx` | Preview-only ledger/path/activity/topology/reconciliation lists use blurred glass material. Dense records and history must become solid content planes; translucency belongs to navigation, overlays, and selected transient controls. | P17 glass architecture |
| Preview-only legacy branches in Administration, Lending, Request, Release, Supply, Inventory, and Overview source | Development phrases such as `Design fixture`, `Synthetic prototype`, and `no backend` are repeated. They are currently guarded by the explicit preview boundary, not normal runtime truth, but the QA experience still needs one concise environment indicator instead of per-module disclaimer repetition. | P19 copy; P21 Index |
| `src/frontend/styles/index.css` command-page background | A decorative radial wash remains behind operational command content. Remove it unless P17 proves a functional hierarchy purpose and acceptable contrast/performance. | P17 glass architecture |

## Deliberate patterns retained

- Real records, queues, tables, attention states, selected detail, history, and evidence remain the dominant authenticated module structure.
- Status chips remain when they encode a real workflow state; rounded shape alone is not treated as a defect. Decorative or duplicate pills still require later audit.
- Profile’s five sections are task and authority boundaries, not a replacement for a record table, so they remain valid content grouping.
- Mobile record cards remain conditionally valid where they preserve every critical table field and action without horizontal clipping; P20/P28 must verify equivalence.
- One primary action plus subordinate actions is already present on the public landing and most operational detail views and must be preserved.
- Empty, loading, error, and unavailable states are operational states, not fake analytics. Their wording and motion remain assigned to P19/P20/P27.

## Explicitly rejected for the refinement pass

- New slogan heroes, marketing filler, fake statistics, card-wall dashboards, rainbow icon schemes, decorative glow, nested glass cards, or animation added for polish alone.
- Replacing dense queues/tables with tiles where comparison and scanning would degrade.
- Removing consequence, authority, status, or evidence context merely to create whitespace.

## Next exact action

Begin P17 Restrained glass architecture. Map every current blurred/translucent surface to an accepted functional layer, convert dense operational content to solid semantic surfaces, preserve opaque/reduced-transparency fallbacks, and verify that no essential meaning depends on transparency.
