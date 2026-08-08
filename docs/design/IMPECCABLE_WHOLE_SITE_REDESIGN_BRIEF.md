# Impeccable Whole-Site Redesign Brief

Scope: the entire HAU-USC Logistics Management System, public and internal.
Status: **proposed v0.8.0 design baseline.** Not a v0.7.2 amendment — the active
specification defers "the v0.8.0 design-system and role-workspace redesign"
(`.codex/specs/v0.7.2-production-access-operations.md` §3.3).

Mode (Impeccable): **Operate.** Every internal surface exists so an operator
completes a task. Public portals are also Operate, tuned calmer — they are
intake and tracking, not marketing.

---

## 1. Recommended direction — Institutional Operations Editorial

**Confirmed by the owner, 2026-08-07.**

A calm, high-trust HAU-USC operations system that reads as a university office
of record: editorial institutional hierarchy over a disciplined logistics
command centre, with warm paper, oxblood authority, restrained gold selection,
and precise monoline icons.

### The one-sentence thesis

*Custody is the product; the interface is the ledger's manners.*

### Governing principles

1. **One dominant surface per page.** Every screen names a single most important
   thing. Everything else is demoted to a rule, a row, or a quiet group.
2. **Queues and tables before cards.** Cards are for genuinely heterogeneous
   summaries only. Homogeneous records get rows.
3. **Detail opens beside the queue, not instead of it.** Split-pane on desktop,
   drawer on tablet, full-screen push on mobile — never losing queue position.
4. **Colour never carries meaning alone.** Every status is a labelled chip; the
   chip's colour is reinforcement, and its text is the truth.
5. **One brand ink for icons.** Preserved verbatim from the reference.
6. **Truthful unknowns.** "Not recorded" / "Not assessed" — never a fabricated
   zero.
7. **Public is narrower.** Public surfaces show strictly less, in larger type,
   with one action.

### What changes from the reference

| Reference | Redesign |
|---|---|
| 6 metric cards of equal weight | Attention strip: 4 actionable counts as one bounded band, inert counts demoted to a context line |
| 12 equal-weight boxes | 1 dominant work surface + supporting rails |
| `div` grids with unreachable rows | Semantic tables, focusable rows, split-pane detail |
| 4 tinted pulse surfaces | One neutral queue row + labelled status chip |
| CSS `conic-gradient` donut | Labelled composition bar in real markup, or omitted |
| "Roadmap to v1.0" panel | Removed from operational surfaces |
| Mobile drops readiness/quantity | Mobile keeps operational columns, drops decoration |
| 3 shimmer sweep animations | One 140 ms state acknowledgement |
| `font-weight: 900` everywhere | 900 reserved for numerals |

### What is preserved verbatim

Identity ramp; icon token structure and the single-ink rule; 24×24 / 1.8-stroke
monoline geometry; dark-theme re-tokenisation; spacing, radius and motion
scales; system-stack + Georgia pairing; the gold focus ring; the reduced-motion
block; sidebar collapse, mobile drawer, Escape-to-close, and ⌘K.

---

## 2. Alternatives considered (not implemented)

**B — Ledger-First Density.** Push all the way to a records aesthetic: near-zero
chrome, hairline rules instead of containers, uniform 32px rows, monospaced
numerics, no panels at all. *Strength:* highest operational density; the ledger
model becomes literally visible. *Rejected because:* it discards the "governed
warmth" the reference earns, and the Angelite-facing public portals would feel
punitive.

**C — Portal-Warm.** Lead with the calm of the public portals and carry it
inward: generous spacing, larger type, fewer columns, progressive disclosure
everywhere. *Strength:* lowest training cost; kindest to occasional users.
*Rejected because:* Director, Administrator and Release Desk work is
accountability-dense; hiding columns behind disclosure would slow the people who
use the system most and weaken the visible-authority principle.

---

## 3. System board

**Anchor hue** oxblood `#610b0f` · **selection** bright gold `#f2d15c` ·
**ground** canvas `#f4efe6` / paper `#fffdf8`.

- **Type.** Georgia display for page titles only. Body in the system humanist
  stack. Scale 10/11/13/16/18/28/34 + clamped display. Weights: 400 body, 600
  labels, 700 emphasis, 900 numerals only.
- **Space.** 4px base, unchanged. Section rhythm 24/32/40.
- **Radius.** 10px controls, 14px containers. **20px retired** — it read as
  consumer-soft on full-width panels.
- **Elevation.** Two levels only: flat-on-paper with a hairline, and one raised
  level for genuinely floating layers (drawer, dialog, toast, menu). The
  reference's large ambient shadows on every panel are removed.
- **Motion.** 140 ms for state, 240 ms for position. Ease-out only. One
  acknowledgement animation total.
- **Icons.** The reference sprite, unchanged geometry, one ink.
- **Status.** One chip component. Text always present. Five tones mapped from
  the 21 canonical statuses — never more.

## 4. Surface architecture

How one design language adapts across the product:

| Surface class | Shape | Density | Primary action |
|---|---|---|---|
| Public intake | Single column ≤ 640px, stepper, review, receipt | Low | One, sticky on mobile |
| Public tracking | Timeline + next-action line | Low | Usually none |
| Sign-in / account | Single column ≤ 420px, centred | Low | One |
| Role overview | Attention band + one dominant queue + quiet rails | Medium | One |
| Operational queue | Semantic table + split-pane detail | High | One per selected record |
| Detail / drawer | Header, facts, evidence, ledger, actions footer | High | One primary + quiet secondaries |
| Admin / reference | Table + inline edit + confirmation | Medium-high | One |
| Health / status | Labelled aggregate rows, truthful unavailable | Medium | None |

Responsive rule: **the same information priority at every width.** Mobile
reorders and stacks; it does not delete operational columns. Split-pane becomes
a drawer at < 1024px and a full-screen push at < 768px.

## 5. Anti-slop guardrails accepted

No purple/blue SaaS palette · no glassmorphism · no glowing borders · no
gradient text · no card walls · no decorative charts · no pill-badge spread ·
no marketing language inside staff workspaces · no invented statistics presented
as real (all preview figures are marked illustrative) · no raw enums · no
provider jargon · no emoji icons · no lorem ipsum · no unbounded single-file
production code.
