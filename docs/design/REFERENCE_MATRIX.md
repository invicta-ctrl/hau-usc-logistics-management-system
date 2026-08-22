<!-- Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 -->

# HAU-USC reference matrix

## Purpose and method

This matrix follows the eight independent studies under [`docs/design/references`](references/). It selects the strongest source for each design axis instead of blending every source into every surface. “Adopt” means adapt a principle to HAU-USC's existing vanilla V5 architecture, brand, permissions, and real backend state. It never means copy a proprietary composition, asset, or implementation.

Research was performed on 2026-08-10 in a managed browser at a fixed 1280 × 720 viewport. Responsive claims are therefore proposals or source-observed device-comparison patterns, not reproduced multi-viewport evidence.

## Decision matrix

| Category                 | Strongest reference | Principle to adopt                                               | Principle to avoid                                             | Implementation risk                                                     |
| ------------------------ | ------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Information architecture | Mobbin              | Task → workflow → state → evidence progression                   | Screenshot-gallery navigation                                  | Medium: route and record search must preserve server authorization      |
| Dashboard composition    | Codrops             | Unequal editorial emphasis based on operational importance       | Uniform card wallpaper                                         | Medium: variable layout can become arbitrary without fixed roles        |
| Navigation               | Recent.design       | Persistent orientation plus URL-backed selected state            | Desktop-only permanent rail                                    | Medium: mobile transformation and focus order need explicit design      |
| Global search            | SaaSFrame           | Group results by route, record, person, and safe action          | One flat relevance list                                        | High: private fields and actions require server-filtered results        |
| Typography               | Mobbin              | Strong scale contrast with a restrained utility layer            | Marketing-scale headings inside work surfaces                  | Low: current local type family already supports the hierarchy           |
| Color                    | Magic UI            | Neutral/warm base with one concentrated accent moment            | Rainbow/glow accents throughout                                | Low: current oxblood/gold tokens already define identity and focus      |
| Surface system           | 21st.dev            | Focused preview/inspection surface with explicit controls        | Every section framed as a rounded card                         | Medium: state inspector must remain playground-only                     |
| Data cards               | Recent.design       | Variable emphasis where content importance differs               | Masonry for comparable operational metrics                     | Low: restrict variable spans to overviews                               |
| Tables                   | Mobbin              | Preserve sequence, comparison, and inspectable detail            | Turn rows into disconnected cards                              | Medium: small-screen transformation must preserve field relationships   |
| Filters                  | Awwwards            | Multi-dimensional taxonomy with searchable long lists            | Aesthetic filters or hidden filter state                       | Medium: filter vocabulary must match backend contracts                  |
| Forms                    | Mobbin              | Progressive disclosure and clear task sequence                   | Cinematic or floating-label novelty                            | Low: incumbent semantics and validation remain authoritative            |
| Motion                   | Codrops             | Bounded shared-element continuity using transform/opacity        | Scroll hijacking, infinite loops, split-text spectacle         | Medium: focus placement and reduced motion must be deterministic        |
| Microinteraction         | Magic UI            | Compact command/focus/selection feedback                         | Animated borders, confetti, shimmer, or glow as routine chrome | Low if kept tokenized and local                                         |
| 3D                       | Spline              | Optional variable-driven overview visualization with 2D fallback | Critical content in canvas or required free orbit              | Very high: runtime, assets, input, GPU, accessibility, and fallback     |
| Spatial depth            | Spline              | Layer operational context behind DOM controls                    | Camera/object occlusion of text and actions                    | High: scene composition must remain stable across state and viewport    |
| Accessibility            | Mobbin              | Search plus complete browse path and legible hierarchy           | Shortcut-only navigation                                       | Medium: every custom overlay and visualization needs semantic parity    |
| Responsiveness           | SaaSFrame           | Treat desktop/mobile as intentionally paired compositions        | Shrink the desktop grid                                        | High: fixed-viewport research must be followed by actual matrix testing |
| Performance              | Magic UI            | Small optional effect wrappers over a fast static base           | Global always-running effects                                  | Medium: paint and bundle budgets must be measured per primitive         |
| Implementation approach  | 21st.dev            | Inspect components and states before module rollout              | Framework migration to obtain visual snippets                  | High: the current integration depends on its vanilla render/adapters    |
| HAU-USC suitability      | Mobbin              | Operational evidence and lifecycle clarity                       | Neutralizing institutional character                           | Low when combined with incumbent oxblood/gold and current contracts     |

## Axis ownership

The synthesis assigns one primary job to each source:

- **Mobbin:** lifecycle clarity, dense application hierarchy, and evidence progression.
- **SaaSFrame:** global query interpretation and responsive comparison discipline.
- **21st.dev:** playground-only component/state inspection.
- **Spline:** the constraints and potential of one optional spatial overview proof.
- **Awwwards:** authored composition confidence and rigorous filter taxonomy.
- **Codrops:** unequal editorial rhythm and restrained continuity motion.
- **Magic UI:** command palette and polished, bounded microinteraction.
- **Recent.design:** persistent orientation, URL-backed filters, and attribution.

No source owns HAU-USC's identity. Identity remains USC oxblood, gold, warm paper, institutional typography, logistics vocabulary, and real governed state.

## Cross-reference conflicts resolved

| Conflict                                      | Resolution                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Quiet SaaS shell vs expressive showcase       | The workbench stays calm; expression peaks only in the Overview and public editorial arrival.                              |
| Equal card grid vs editorial asymmetry        | Use predictable rows/tables in operations; use named unequal regions in overviews.                                         |
| Rich effects vs status semantics              | Status, focus, and confirmation keep exclusive color/motion meanings; decorative effects are exceptional and non-semantic. |
| 3D wow factor vs operational access           | 2D DOM is authoritative; 3D is lazy, optional, overview-only, and replaceable.                                             |
| Component marketplace vs implementation architecture | Rebuild approved principles within the accepted architecture; do not migrate frameworks from research alone.                                  |
| Persistent desktop navigation vs mobile space | Transform rail → drawer/tab bar while preserving route and selected state.                                                 |

## Copyright and dependency decision

No third-party visual asset or source code is proposed for the first slice. Magic UI and default Codrops downloadable demos advertise MIT licensing, but exact dependencies and artifact licenses would still require a separate review before reuse. No authoritative repository-wide license was confirmed for 21st.dev, so it remains reference-only. Spline export/runtime use would be a separately approved dependency and plan decision.
