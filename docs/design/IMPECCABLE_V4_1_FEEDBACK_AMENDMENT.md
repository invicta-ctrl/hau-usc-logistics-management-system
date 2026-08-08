# Impeccable v4.1 user-feedback amendment

Status: accepted for implementation on the isolated design branch.

Authority: the owner’s 12 browser comments, follow-up instructions, and
substantial-front-end-redesign addendum on 2026-08-08 supersede the prior v4
visual closure only for the scope below.
The previous v4 review and verification remain historical evidence; they are
not evidence for this amendment until the revised artifact is reverified.

## Objective

Refine the v4 preview into a materially different, dynamic,
production-grounded experience without changing production code, domain
behavior, routes, authorization, or data. Keep the oxblood/gold identity while
moving beyond the v2/v3 shell, card-wall, and generic admin-template
fingerprints. A two-second before/after comparison must show an obvious
structural and experiential change.

## Accepted scope

- remove the non-semantic maroon/gold corner and rail lines called out by the
  owner;
- give the public floating bar and theme control a restrained, animated glass
  treatment with a complete reduced-motion path;
- replace the lending glyph in public and authenticated navigation;
- rebuild the public landing as a USC introduction using stable official HAU
  facts, the official USC Facebook link, and a locally bundled copy of the
  production login background; remove the step tutorial;
- adapt the Request Center preview to the current production information
  architecture: authenticated department identity, Create/Track modes,
  New/Additional requests, Event/Sub-event selection, line composition, and
  explicit For Review/no-reservation language;
- add a local-only profile-image chooser and preview; never upload, persist, or
  transmit the selected image;
- remove the redundant committee-scope footer control;
- replace role cycling with a labelled role-view dialog. The dialog changes
  preview perspective only and never changes account authorization;
- regenerate the offline export, reverify the complete route/state artifact,
  refresh the design-system/current-task records, and prepare a Claude handoff.

## Owner substantial-redesign override

The following additions are mandatory and are not optional polish:

- write the requested external design DNA record at
  `docs/design/IMPECCABLE_V3_EXTERNAL_DESIGN_DNA.md`, separating what each
  reference teaches, what is adapted, what is not copied, and where it applies;
- record Hallmark study, audit, and redesign equivalents. At least one
  macrostructure decision must be attributable to that work;
- apply Impeccable critique, bolder, animate, layout, typeset, colorize,
  delight, adapt, harden, audit, and polish equivalents, with a final
  command/target/finding/implemented-change evidence table;
- replace the generic theme switch with an accessible celestial day/night
  control: both sun and moon remain visible, a circular active plate moves
  between them, press feedback is 100–140 ms, travel is 200–260 ms, theme
  crossfade is 220–320 ms, and reduced motion keeps an unambiguous state;
- replace the generic hamburger with a kinetic three-line control that uses
  transform/opacity feedback and changes to a close state only when the mobile
  drawer is open;
- replace the oversized circular back treatment with a compact, optically
  aligned control whose glyph travels 2–4 px on hover and compresses on press;
- retain or improve context-preserving skeletons, finite linear progress,
  status text, and progressive reveal without inventing backend percentages;
- demonstrate at least six major front-end changes, at least three of them
  compositional, without removing any registered route, state, or workflow;
- create identical v3/v4.1 before-and-after captures for eight required cases:
  overview light/dark at 1440, Request Center light at 1440, inventory light at
  1440, release/lending dark at 1440, public portal light at 1440, and overview
  light/dark at 390;
- pass the visual-delta question even when logos and labels are mentally
  discounted: the composition and design system must remain recognizably
  different.

## Product, privacy, and safety invariants

- The preview remains fully local and makes no application/API/provider calls.
- Request Center production access remains governed and authenticated. The
  preview may demonstrate its structure only with visibly illustrative data.
- Submission never implies acceptance, reservation, ledger movement, release,
  or persistence.
- No real operational record, officer roster, social metric, announcement, or
  live inventory item may be reproduced or invented as current truth.
- Official external links use `noopener noreferrer`; the offline export must
  remain self-contained except for deliberate user-activated links.
- Keyboard access, focus management, 44px targets, 320px reflow, 200% zoom,
  dark theme, and `prefers-reduced-motion` remain required.

## Acceptance criteria

1. All 12 browser comments have an observable, source-backed resolution.
2. The landing contains no step tutorial and introduces USC with official,
   stable wording rather than volatile names or counts.
3. The Request Center preview matches the current production setup while
   stating its authenticated and non-persistent boundary.
4. Theme, role, request composer, and profile photo controls work locally with
   immediate accessible feedback.
5. The v4 registry remains 33 routes / 53 variants; icon-only divergence from
   v3 is explicitly permitted and parity tooling still protects IDs/order.
6. The single-file export embeds the campus background and produces no
   automatic external request.
7. Focused Chromium, contrast, theme, motion, responsive, source/export,
   Hallmark, Impeccable, and independent review gates are rerun for v4.1.
8. The celestial toggle, kinetic menu, refined back control, and loading system
   meet their stated motion, state, focus, touch-target, and reduced-motion
   contracts.
9. At least six major front-end changes and at least three compositional changes
   are evidenced against v3; the eight-case visual-delta set is captured and
   independently judged substantial.
10. The final handoff reports the exact substantial-redesign fields requested
    by the owner and names every Hallmark/Impeccable equivalent actually used.

## Out of scope and stop boundary

No application-runtime edit, backend/provider/authentication change, migration,
deployment, PR, merge, release, or production mutation. Stop after a verified
commit and push of the design branch plus the Claude continuation packet.

## Implementation acceptance — 2026-08-08

- Implementation commit:
  `a413824af98624c089560135f6168672aa86b656`.
- Review: `output/design/IMPECCABLE_REDESIGN_V4_1_REVIEW.md`, disposition
  `ship`, no material fix.
- Evidence: 33/53 parity; Hallmark 58/58; theme 13/13; motion 13/13; six-width
  verify zero; contrast zero; curated captures 21/21; exact visual delta 8/8.
- Substantial redesign: PASS, 12 major front-end changes and 5 compositional
  changes; two-second and logo/label-discounted judgment PASS.
- Design record: `DESIGN.md`, `.impeccable/design.json`, and the dual critique
  snapshot are refreshed from the built v4.1 system.
- Front-end-only containment: confirmed. No application runtime, Worker, D1,
  R2, migration, provider, authentication, staging, deployment, release, or
  production change was made.
- Closure commit: the documentation-only commit containing this acceptance and
  the Claude handoff; verify its exact SHA from Git before continuation.
