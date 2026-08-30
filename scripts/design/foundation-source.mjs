// HAU-USC frontend design-foundation authority.
//
// Color remains owned by theme-source.mjs. This file owns the non-color
// contract shared by application routes: type, spacing, sizing, shape, motion,
// stacking, safe areas, and the accepted responsive inspection widths.

export const CASCADE_LAYERS = [
  'reset',
  'tokens',
  'base',
  'layout',
  'components',
  'states',
  'utilities',
  'overrides',
];

export const STRUCTURAL_WIDTHS = [320, 390, 768, 1024, 1440];

export const TYPOGRAPHY_ROLES = {
  display: {
    family: 'var(--font-display)',
    size: 'clamp(2.5rem, 8vw, 4.75rem)',
    lineHeight: '0.98',
    weight: '700',
    tracking: '-0.045em',
  },
  editorial: {
    family: 'var(--font-wordmark)',
    size: 'clamp(2rem, 6vw, 3.75rem)',
    lineHeight: '1.04',
    weight: '700',
    tracking: '-0.028em',
  },
  'page-title': {
    family: 'var(--font-display)',
    size: 'clamp(1.75rem, 4vw, 2.5rem)',
    lineHeight: '1.08',
    weight: '700',
    tracking: '-0.035em',
  },
  'section-title': {
    family: 'var(--font-display)',
    size: 'clamp(1.25rem, 2.4vw, 1.625rem)',
    lineHeight: '1.15',
    weight: '700',
    tracking: '-0.022em',
  },
  'record-title': {
    family: 'var(--font-body)',
    size: '1rem',
    lineHeight: '1.35',
    weight: '650',
    tracking: '-0.01em',
  },
  body: {
    family: 'var(--font-body)',
    size: '1rem',
    lineHeight: '1.55',
    weight: '400',
    tracking: '0',
  },
  'compact-body': {
    family: 'var(--font-body)',
    size: '0.875rem',
    lineHeight: '1.5',
    weight: '400',
    tracking: '0',
  },
  label: {
    family: 'var(--font-body)',
    size: '0.8125rem',
    lineHeight: '1.35',
    weight: '650',
    tracking: '0.005em',
  },
  caption: {
    family: 'var(--font-body)',
    size: '0.75rem',
    lineHeight: '1.45',
    weight: '500',
    tracking: '0.01em',
  },
  numeric: {
    family: 'var(--font-body)',
    size: '0.875rem',
    lineHeight: '1.4',
    weight: '600',
    tracking: '0',
  },
  'mono-reference': {
    family: 'var(--font-record)',
    size: '0.75rem',
    lineHeight: '1.5',
    weight: '500',
    tracking: '0.025em',
  },
};

export const FOUNDATION_TOKENS = {
  'font-size': '1rem',

  // Four-point primitive scale retained for compatibility and composition.
  'space-2xs': '0.25rem',
  'space-xs': '0.5rem',
  'space-sm': '0.75rem',
  'space-md': '1rem',
  'space-lg': '1.5rem',
  'space-xl': '2.5rem',
  'space-2xl': '4rem',

  // Mobile-first spacing and density roles.
  'space-page-inline': 'clamp(1rem, 3vw, 2.5rem)',
  'space-page-block': 'clamp(1rem, 2.5vw, 2rem)',
  'space-section-gap': 'clamp(1.5rem, 4vw, 3rem)',
  'space-stack-gap': '1rem',
  'space-cluster-gap': '0.75rem',
  'space-control-gap': '0.5rem',
  'density-row-compact': '2.75rem',
  'density-row-standard': '3.25rem',
  'density-row-comfortable': '3.75rem',

  // Content measures. Wide workbenches are deliberate; prose and forms are not.
  'content-reading': '70ch',
  'content-form': '42rem',
  'content-workbench': '90rem',
  'content-wide': '120rem',

  // Mobile viewport and safe-area roles.
  'viewport-block': '100vh',
  'safe-area-top': 'env(safe-area-inset-top, 0px)',
  'safe-area-right': 'env(safe-area-inset-right, 0px)',
  'safe-area-bottom': 'env(safe-area-inset-bottom, 0px)',
  'safe-area-left': 'env(safe-area-inset-left, 0px)',

  // Shape roles preserve the accepted 6 / 8 / 10 / 14 px family.
  'radius-compact': '0.375rem',
  'radius-control': '0.5rem',
  'radius-surface': '0.625rem',
  'radius-overlay': '0.875rem',
  'radius-pill': '999px',

  // Controls use a 44 px minimum hit target without disabling pinch zoom.
  'control-height-compact': '2.75rem',
  'control-height-standard': '3rem',
  'control-height-large': '3.25rem',
  'control-hit-area-min': '2.75rem',

  // Semantic material aliases follow whichever of the twelve appearances wins.
  'surface-page': 'var(--theme-page, var(--background))',
  'surface-content': 'var(--theme-surface, var(--card))',
  'surface-inset': 'var(--theme-surface-muted, var(--muted))',
  'surface-raised': 'var(--theme-surface-raised, var(--card))',
  'surface-overlay': 'var(--popover)',
  'border-subtle-role': 'var(--theme-border, var(--border))',
  'border-control-role': 'var(--theme-border-strong, var(--border-warm))',
  'elevation-content': 'none',
  'elevation-raised': 'var(--glass-shadow-soft)',
  'elevation-overlay': 'var(--glass-shadow-raised)',

  // One named stacking contract; routes do not invent new four-digit values.
  'z-content': '1',
  'z-raised': '10',
  'z-menu': '100',
  'z-sticky': '200',
  'z-overlay': '300',
  'z-modal': '400',
  'z-toast': '500',

  // Motion roles describe intent, not individual components.
  'motion-duration-feedback': '120ms',
  'motion-duration-state': '200ms',
  'motion-duration-surface': '280ms',
  'motion-duration-context': '400ms',
  'motion-ease-enter': 'cubic-bezier(0.16, 1, 0.3, 1)',
  'motion-ease-exit': 'cubic-bezier(0.7, 0, 0.84, 0)',
  'motion-ease-standard': 'cubic-bezier(0.65, 0, 0.35, 1)',
};
