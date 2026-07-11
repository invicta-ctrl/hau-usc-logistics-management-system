# Accessibility Checklist

Implemented in the preview:

- Semantic landmarks and heading hierarchy.
- Skip-to-content link.
- Visible keyboard focus.
- Desktop navigation and mobile bottom navigation with `aria-current="page"`.
- Accessible More drawer and application dialogs.
- Focus trap, inert background, Escape handling, and focus restoration.
- Labeled fields, combobox/listbox keyboard operation, `aria-invalid`, associated field errors, first-error focus.
- Live status/result announcements and operation errors inside the relevant modal/panel.
- Named table captions and mobile card alternatives.
- Text status labels in addition to color.
- Reduced-motion and forced-colors handling.
- Mobile body text around 14-16 px and primary targets at least 44 CSS px.
- Browser confirmation dialogs replaced by transaction-summary modals.

Manual validation still required:

- NVDA, JAWS, VoiceOver, and TalkBack workflows.
- 200% zoom on production-supported browsers.
- Windows High Contrast and macOS Increase Contrast.
- Long institutional names, Filipino/English mixed content, slow network, and real validation errors.
- Color contrast measurement after final approved logos/branding assets.

This document does not claim WCAG conformance or certification.
