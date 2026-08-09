# V4.1 Production Visual Acceptance

Visual authority: `DESIGN.md` and the accepted V4.1 Institutional Command /
Operational Choreography direction. Production structure and behavior remain
authoritative where the old preview differed.

## Acceptance result

| Area | Result | Evidence |
|---|---|---|
| Landing hierarchy and real CTAs | Pass | Focused V4.1 browser suite and screenshots |
| Light and dark modes | Pass | 375 and 1440 dark; full light matrix |
| 320, 375, 414, 768, 1024, 1440 px | Pass | Dedicated visual-acceptance test |
| 200% zoom | Pass | `v41-landing-200-percent-zoom.png` |
| Reduced motion | Pass | Static map assertion |
| Keyboard and focus | Pass | menu/Escape, modal containment, focus restoration suites |
| Static 3D fallback | Pass | mobile, save-data/reduced-motion source and browser checks |
| Theme/menu/back controls | Pass | focused control behavior assertions |
| Horizontal overflow | Pass | responsive navigation and visual matrix |
| Hallmark review | 58/58 pass | final manual gate sweep; Map / Diagram remains owner-pinned |
| Impeccable detector | Pass after repair | one final detector run; side-tab, advisory token, and image-placeholder findings corrected |

## Visual evidence

Stored under `output/design/acceptance/`:

- `v41-landing-320-light.png`
- `v41-landing-375-light.png`
- `v41-landing-375-dark.png`
- `v41-landing-414-light.png`
- `v41-landing-768-light.png`
- `v41-landing-1024-light.png`
- `v41-landing-1440-light.png`
- `v41-landing-1440-dark.png`
- `v41-landing-200-percent-zoom.png`

The evidence was regenerated after the final typography, focus, and fold-ratio
adjustments. The inspected light/dark and mobile/zoom captures show intentional
figure-ground contrast, readable wrapping, single-line primary affordances,
and a static mobile logistics sequence.

## Hallmark pre-emit critique

- Philosophy 5: a campus logistics entrance, not a generic marketing page.
- Hierarchy 5: identity, headline, Request, Lending, Staff, tracking.
- Execution 4: final contrast, fold, responsive, and detector repairs applied.
- Specificity 5: real HAU-USC workflows and institutional identity.
- Restraint 5: no fake metric, demo chrome, freight imagery, or infinite motion.
- Variety 4: owner-pinned Map / Diagram system applied to production structure.

No axis is below three. Contrast checks cover the landing ink/paper, muted text,
button, dark-mode, and focus pairs. The smallest measured required pair is the
light focus ring at 3.21:1; ordinary landing text is 7.85:1 or higher.

## Exceptions and non-goals

- No authenticated surface receives a 3D centerpiece.
- No preview surface selector, actor selector, viewport selector, or design
  label ships.
- No live private data appears in evidence.
- No production or staging deployment was used to obtain these captures.
