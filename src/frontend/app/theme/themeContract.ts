export const THEME_FAMILIES = [
  'HAU_INSTITUTIONAL',
  'ANGELITE_IVORY',
  'MIDNIGHT_LEDGER',
  'EMERALD_OPERATIONS',
  'COBALT_SIGNAL',
  'GRAPHITE_COPPER',
] as const;

export const THEME_MODES = ['LIGHT', 'DARK', 'SYSTEM'] as const;

export type ThemeFamily = (typeof THEME_FAMILIES)[number];
export type ThemeMode = (typeof THEME_MODES)[number];

export type AppearancePreference = {
  family: ThemeFamily;
  mode: ThemeMode;
};

export const DEFAULT_APPEARANCE: AppearancePreference = {
  family: 'HAU_INSTITUTIONAL',
  mode: 'SYSTEM',
};

export const THEME_FAMILY_LABELS: Record<ThemeFamily, string> = {
  HAU_INSTITUTIONAL: 'HAU Institutional',
  ANGELITE_IVORY: 'Angelite Ivory',
  MIDNIGHT_LEDGER: 'Midnight Ledger',
  EMERALD_OPERATIONS: 'Emerald Operations',
  COBALT_SIGNAL: 'Cobalt Signal',
  GRAPHITE_COPPER: 'Graphite & Copper',
};

export function isThemeFamily(value: unknown): value is ThemeFamily {
  return typeof value === 'string' && THEME_FAMILIES.includes(value as ThemeFamily);
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && THEME_MODES.includes(value as ThemeMode);
}
