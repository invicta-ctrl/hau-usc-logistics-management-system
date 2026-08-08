# Impeccable v3 decisions

## D1 — Build from verified v2

Decision: copy the complete v2 modular source into a new v3 source directory.

Reason: the recovered branch contained no Claude-authored v3 files, while v2
was complete, independently generated, and already covered all required
surfaces. This preserves v2 and makes the reset reviewable.

## D2 — Additive v3 stylesheet

Decision: load `styles/v3.css` last instead of rewriting the seven inherited
style layers.

Reason: the inherited layers preserve behavior and state coverage. A single
direction layer makes the visual delta auditable and removable.

Cost: some selectors intentionally override v2. The export order is therefore
part of the v3 contract and is tested through the generated file.

## D3 — No remote typography or imagery

Decision: use offline system font stacks and CSS-only microinteraction marks.

Reason: the preview must open without a server and make zero network requests.

## D4 — Signature controls, native semantics

Decision: visually rebuild menu/back/theme controls without changing their
native button/anchor semantics or the app event model.

Reason: distinct interaction character must not cost keyboard behavior,
accessible names, focus restoration, or route truth.

## D5 — Asymmetry where priority is real

Decision: give the primary portal and primary operational exception more space.

Reason: equal rectangles imply equal urgency. The data already identifies a
lead route/exception, so asymmetry reflects product truth rather than decoration.

## D6 — Generated export remains derived

Decision: modular files under `prototypes/impeccable-whole-site-redesign-v3/`
are authoritative. The single-file HTML is regenerated with `tools/export.mjs`.

Reason: this preserves a maintainable source-to-artifact pipeline and avoids
hand-editing generated output.

## D7 — Front-end boundary

Decision: no production application, backend, migration, configuration,
provider, deployment, or release file is changed.

Reason: the owner packet authorizes a design preview branch only.
