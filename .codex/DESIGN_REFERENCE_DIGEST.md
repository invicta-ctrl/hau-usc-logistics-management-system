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

- Administrator (`ADMIN.html`, SHA-256 `88e13f1e34cb9175d943f362444655f0f10d4bc6179f9e4af2be825ef2e6c5a3`): use an exception-first control overview that
  prioritizes access decisions, configuration/reference warnings, cross-workflow
  operational visibility, and the next governed action. Present four explicit
  control areas—Access Management, Reference Data, Link Registry, and Audit &
  System—inside the shared shell. They are entry points into existing
  server-authorized domains, not a client-side permission switch. Keep roster
  identity read-only, keep permission and cross-office routing changes subject
  to distinct review, show audit/system information without secrets, and
  preserve cross-role visibility as observation rather than execution authority.
- Director (`DIRECTOR.html`, SHA-256 `e2bb882de9bd53598b8a4b5d3886183a37e5731175b4615e8772521a8990b072`): use a decision-first leadership overview for event-series readiness, cross-committee progress, blockers, and release readiness. Keep request, procurement, release, lending, and inventory records connected through the existing shared workspaces and identities. Present only leadership-scale signals and governed next actions; retain detailed operational work in each committee workspace. Keep Management & Access bounded to approved event structure and leadership decisions, while access, configuration, and environment changes remain inside the existing server-authorized administration boundary.
- Food (`Food.html`, SHA-256 `0f15dd3c493b471572d3ad417edca6356b691c6d8247e624314871ffbc6f2390`): use a deadline-first Food workspace covering the full food requirement queue, event readiness, supplier and quote context, budget/procurement stages, cumulative receiving, and controlled distribution. Keep historical supplier prices visibly non-authoritative, show stale references explicitly, and preserve food-specific checks for quantity/pax, dietary/allergen/halal context, lead time, handling/expiry, and receipt or invoice evidence. Release access remains capability-bound and server-validated; role ownership and the orange accent never grant authority.
- Inventory & Pantry: pending extraction from `INVENTORY.html`.
- Materials: pending extraction from `MATERIALS.html`.
