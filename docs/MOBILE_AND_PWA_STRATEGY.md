# Mobile and PWA Strategy

## Current truth

The application is **responsive**, but it is not currently an installable Progressive Web App. There is no web app manifest, service worker, offline application shell, push notification subscription, background sync, or production offline mutation queue. The Apps Script deployment should be described as a mobile-friendly web app, not a native app or PWA.

In **DEMO** mode, fictional preview state may remain in browser local storage. That behavior must not be confused with operational offline support. In **CURRENT Apps Script** mode, going offline pauses revision polling and server calls fail safely; operational data is not intentionally cached for offline use and mutations cannot be completed offline.

## Responsive behavior

The authoritative visual CSS defines four practical ranges:

| Width            | Current behavior                                                                        | Operator concern                                     |
| ---------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Above 1180 px    | Full sidebar, multi-column metrics, tables and forms                                    | Primary desktop workflow                             |
| 851–1180 px      | Reduced grids and single-column hero/content                                            | Tablet/compact desktop                               |
| 641–850 px       | Sidebar becomes a horizontal scrollable seven-item navigation; content padding tightens | Navigation discovery and horizontal scrolling        |
| 381–640 px       | Single-column forms/toolbars; desktop tables switch to mobile cards; stacked actions    | Touch targets, long entity labels, keyboard viewport |
| 380 px and below | Narrow nav items, full-width action buttons, compact branding                           | Small-device overflow and modal usability            |

Reduced-motion preferences shorten animations/transitions. Drawers and modals expose dialog semantics and keyboard focus handling. Responsive acceptance still needs physical-device or browser-emulation checks for Android Chrome and iOS Safari, landscape, 200% zoom, software keyboard, long Filipino/English content, safe-area insets, slow network, and file capture/upload.

## Mobile workflow priorities

| Workflow                | Mobile expectation                                                                                        | Must remain server-authoritative                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Request submission      | Search/select item, compose lines, date/event context, review and submit without horizontal form overflow | Identity boundary, exact item, current routing, validation   |
| Receiving               | Scan queue, enter line receipt, capture/select evidence, see remaining quantity                           | Cumulative totals, supplier/link validation, ledger movement |
| Release/lending handoff | Identify ticket, verify recipient, enter condition/quantity, attach evidence                              | Permission, reservation, eligibility, ledger movement        |
| Inventory lookup        | Search, card view, balance/VERIFY distinction, open history                                               | Balance calculation and catalog permission                   |
| Administrative setup    | Not optimized as an on-the-go workflow                                                                    | Apps Script editor/configuration and owner approval          |

High-risk destructive or irreversible actions must never be reduced to a single ambiguous icon. Confirmation text should name the entity, quantity, unit, consequence, and whether an immutable movement will be posted.

## Connectivity and retry behavior

- A mutation button is disabled while its request is active.
- A retryable transport/lock failure retains the same idempotency key.
- A successful command whose refresh fails shows a recorded-but-not-refreshed warning; the operator uses read-only Refresh and does not resubmit.
- Offline/online events update sync status. Reconnect triggers an immediate revision check, not an automatic replay of arbitrary form submissions.
- Dirty forms, uploads, and modal workflows defer automatic state replacement behind an updates-available banner.
- Request-only mode does not poll internal revisions.

No operational command should be queued in local storage. The command may depend on stock, status, authorization, or evidence state that becomes stale while offline.

## PWA decision gate

A future hosted application may become installable only after these decisions and tests:

1. institutional approval for device/browser storage of shell and any data;
2. a manifest with reviewed name, icons, theme, start URL, scope, and display mode;
3. a service worker that caches versioned static assets only by default and never caches authenticated API/evidence responses unless explicitly designed;
4. logout/offboarding cache purge and safe multi-account behavior on shared devices;
5. update activation that cannot run incompatible UI/API/schema versions together;
6. offline UX that clearly distinguishes unsaved draft from recorded command;
7. no background mutation replay without fresh authorization and business-state revalidation;
8. accessibility, install/update, storage-quota, private-browsing, and recovery tests.

The preferred first phase is an installable shell with network-required operational actions. An encrypted local draft feature could follow for non-sensitive request composition, but borrower/student/contact data and internal bootstrap state should remain excluded unless a separate threat/privacy review approves them.

## Notifications

Push notifications, email, and SMS are **PLANNED/FUTURE** only. A notification service must use minimum data, opt-in/role rules, expiring deep links, rate limiting, delivery/audit records, and no sensitive content on lock screens. Notifications are hints; opening the app must reauthorize and reload current state.

## Acceptance checklist

- All seven screens open at 320, 375, 640, 850, 1180, and desktop widths with no clipped critical control.
- Mobile cards expose the same status, identifier, quantities, and permitted actions as desktop tables.
- Navigation remains keyboard/touch reachable and indicates the active screen.
- Forms survive validation errors, rotation/resizing, and the software keyboard without losing input.
- Dialog focus is trapped, Escape/close behavior is predictable, and focus returns to the invoker.
- Evidence capture rejects unsupported/oversize files and shows upload progress/failure without double submit.
- Offline state prevents mutation and reconnect does not silently submit.
- Screen reader, zoom, contrast, reduced motion, and touch-target checks meet [Accessibility](ACCESSIBILITY.md).
- No operational response is present in Cache Storage or a service-worker cache because none should exist in the current release.
