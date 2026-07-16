# Usability improvement backlog

## Review goal

Make the site and each module easier to understand, navigate, and operate while
preserving the approved visual baseline, domain rules, server authorization,
data integrity, privacy, and generated-artifact workflow.

The first implemented improvement is the separate guided-demo artifact. The
items below are proposals for later bounded specifications; they are not
silently active production behavior.

## Priority 1 - clarity and next action

1. **Module purpose and next-step strip.** Add one concise sentence and the
   primary safe action at the top of each module, plus a link to the relevant
   queue or form. This reduces “where do I start?” without hiding controls.
2. **Status explanation on demand.** Make status chips reveal plain-language
   meaning, prerequisites, and permitted next actions through an accessible
   popover or adjacent detail text. Do not encode meaning by color alone.
3. **Action-disabled reasons beside the action.** Show the exact safe reason
   where a consequential button is disabled, rather than requiring trial and
   error. The server remains the authority.
4. **Unified success and recovery pattern.** Every mutation should state what
   changed, the record ID, the next useful location, and how to recover when an
   authoritative refresh fails.

## Priority 2 - reduce cognitive load

5. **Progressive disclosure for long forms.** Group identity/context, requested
   items, committee-specific detail, and review into short labeled sections
   with persistent summaries. Preserve keyboard order and validation context.
6. **Filter summaries and saved views.** Show active filter chips, result count,
   one Clear all action, and role-safe saved views for frequent queues.
7. **Consistent record detail drawer.** Use one pattern for identifier, status,
   owner/scope, quantities, timeline, evidence metadata, and allowed actions
   across request, restock, lending, release, and procurement records.
8. **Human-friendly labels with stable IDs secondary.** Lead with descriptive
   names and place immutable IDs in copyable secondary text for traceability.

## Priority 3 - interaction and accessibility

9. **In-app help and replayable tour.** Adapt the guided-demo step content into
   permission-aware contextual help after the core interface stabilizes. Never
   expose hidden modules or data through help content.
10. **Mobile action ergonomics.** Keep the primary safe action reachable near
    the bottom of long mobile forms and drawers while avoiding overlap with
    system/browser controls.
11. **Table-to-card responsive detail.** Preserve column meaning, headers, and
    row actions on narrow screens instead of relying on horizontal scrolling.
12. **Keyboard and screen-reader shortcuts.** Add a discoverable shortcut/help
    surface for navigation, search focus, closing overlays, and returning to
    the active record. Avoid single-key shortcuts inside text fields.

## Priority 4 - confidence and learning

13. **Representative empty states.** Explain why a queue is empty, which filters
    apply, and the authorized action that can create or locate a record.
14. **Preview-versus-live environment banner.** Keep environment, data source,
    freshness, and write behavior understandable without exposing resource
    identifiers.
15. **Inline quantity vocabulary.** Use the same labels for requested,
    approved, reserved, received, released, returned, on-hand, and
    available-to-promise quantities across modules.
16. **Role-aware home views.** After staging evidence exists, default each role
    to the smallest useful queue/dashboard without fetching or exposing
    unauthorized modules.

## Evaluation method

For each proposed improvement, create an accepted bounded specification and
measure:

- task completion and error recovery on 390 px and 1366 px;
- keyboard-only completion and visible focus;
- accessible name, status, announcement, and overlay behavior;
- number of steps and context switches for the representative workflow;
- server authorization and sanitized DTO behavior;
- no regression in idempotency, concurrency, immutable history, ledger truth,
  or generated parity.

Prefer five representative task walkthroughs over broad aesthetic redesign:
submit one request, approve and hand off one lending ticket, receive one restock
line, release one approved item, and locate one inventory ledger history.
