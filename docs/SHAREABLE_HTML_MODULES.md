# Shareable HTML modules

## Accepted outcome

The repository produces both the existing all-in-one offline prototype and one
offline HTML entry point for each authoritative primary module. Every module
file opens directly on its named workspace while retaining the complete shared
shell, navigation, styles, runtime, and cross-module workflows.

## Canonical outputs

The backward-compatible all-in-one artifact remains:

- `HAU-USC_Logistics-Prototype-Shareable.html`

The presenter-focused guided artifact is:

- `hau-usc-logistics-guided-demo.html`

The generated `shareable-html-modules/` directory contains:

1. `hau-usc-logistics-01-overview-shareable.html`
2. `hau-usc-logistics-02-request-center-shareable.html`
3. `hau-usc-logistics-03-office-lending-hub-shareable.html`
4. `hau-usc-logistics-04-release-desk-shareable.html`
5. `hau-usc-logistics-05-restocking-shareable.html`
6. `hau-usc-logistics-06-procurement-deliverables-shareable.html`
7. `hau-usc-logistics-07-inventory-management-shareable.html`

The numeric prefix fixes display order. Lowercase kebab-case avoids spaces,
case ambiguity, and operating-system-specific path behavior.

## Generation contract

- `scripts/shareable-module-registry.mjs` is the single ordered registry used
  by visual assembly, generation, verification, and tests.
- `npm run build` assembles the authoritative visual, creates the all-in-one
  artifact and guided demo, then recreates all seven module artifacts from that
  exact bundled HTML. Generated HTML must not be hand-edited.
- Each module artifact has a validated default-view marker, matching static
  navigation/view state, module-specific document title, and module heading.
- Every artifact is a single file with no external script or stylesheet and no
  module script, so it can be shared and opened directly with `file://`.
- `npm run verify:dist` rejects missing, stale, extra, misnamed, externally
  dependent, or incorrectly activated module artifacts.

## Scope boundary

Reference Administration remains a permission-gated internal workspace rather
than a primary shareable entry point. The public request-only portal remains a
runtime mode rather than a duplicate module. Neither changes the seven-module
primary navigation contract.

This repository packaging change does not deploy, publish, upload, or alter
Google Apps Script, Sheets, Drive, staging, or production resources.
