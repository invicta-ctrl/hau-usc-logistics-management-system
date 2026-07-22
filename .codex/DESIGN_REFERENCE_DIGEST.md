# v0.6 Design Reference Digest

## Source and hierarchy

- Shared-direction source: `HAU-USC_Logistics_S0003_Design_Direction_Preview.html`.
- SHA-256: `89d7741b25146806c2ffed8c0bcf85dd58cdba1d84144c6dd65c54ada0318429`.
- S0003 governs the cross-role shell and component convergence. The matching
  S0002 role reference governs later role-specific UX, unless it conflicts with
  this shared system.
- The S0003 review-role tabs and its standalone mock JavaScript are review-only;
  neither belongs in the production application or domain logic.

## Shared shell and tokens

- Use one recognizable internal shell: deep oxblood / burgundy navigation,
  cream/paper workspace, restrained gold framing, and rounded, lightly shadowed
  operational surfaces.
- Core tokens: oxblood `#350507`, burgundy `#5e0b10`, maroon `#8d151b`, gold
  `#f0c83b`, strong gold `#b77917`, cream `#f7f0e1`, paper `#fffdf8`, ink
  `#351719`, muted `#735f5c`, line `#e4d6bd`.
- Use editorial serif headings (Georgia-compatible fallback) and practical
  system sans-serif for navigation, forms, tables, and supporting text.
- Shared geometry: persistent desktop sidebar, compact page header, modest
  command/summary region, compact metric cards, responsive content panels, and
  an accessible focus treatment.

## Interaction grammar

- Navigation groups use clear labels, icon + label + optional count, one
  high-contrast active state, and role-scoped destinations.
- Use the same card, panel, action, priority-row, progress, and status-chip
  grammar across roles. Status always uses explicit text plus color.
- Lead with exceptions, decisions, deadlines, readiness, and the next safe
  action. Keep operational context available without turning the overview into
  an undifferentiated dashboard.
- Reduce hero dominance: command copy supports the task; it must not displace
  queues, tables, forms, and actionable operational data.

## Role accents

| Role | Accent | Soft / ink |
| --- | --- | --- |
| Administrator / Director | gold `#b77917` | `#fff2c5` / `#6f4507` |
| Food | orange `#c65f1c` | `#fff0df` / `#79370d` |
| Inventory & Pantry | amber `#d59a18` | `#fff2b9` / `#805107` |
| Materials | blue `#356a88` | `#e8f2f7` / `#244e66` |

Accents identify a workspace; they never replace labels or server-derived
authorization.

## Responsive rules

- At tablet widths, reduce the sidebar and stack command/content regions.
- At approximately 820px and below, replace the desktop sidebar with a sticky
  compact mobile header and five-item bottom navigation; retain required actions.
- Stack panels, use two-column metrics/signals where practical, and avoid
  clipped controls or overlapping text. Do not simply expose the full desktop
  sidebar on narrow screens.
- Keep primary actions touchable and forms/tables operable; progressively
  disclose secondary content instead of silently hiding required work.

## Prohibited patterns

- No review-role selector or mockup JavaScript in production.
- No five separate applications or divergent navigation systems.
- No accent-only status/authorization communication.
- No oversized decorative hero that buries operational work.
- No mobile cascade of the desktop sidebar, clipped controls, or hidden
  required actions.

## Role-specific decisions (append only when its bounded slice begins)

- Administrator: pending extraction from `ADMIN.html`.
- Director: pending extraction from `DIRECTOR.html`.
- Food: pending extraction from `Food.html`.
- Inventory & Pantry: pending extraction from `INVENTORY.html`.
- Materials: pending extraction from `MATERIALS.html`.
