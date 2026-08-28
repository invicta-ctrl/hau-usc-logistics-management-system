import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_APPEARANCE,
  isThemeFamily,
  isThemeMode,
  type AppearancePreference,
} from '../theme/themeContract';

function storedAppearance(): AppearancePreference {
  try {
    const family = localStorage.getItem('hau-usc-theme-family')?.toUpperCase();
    const mode = localStorage.getItem('hau-usc-theme')?.toUpperCase();
    return {
      family: isThemeFamily(family) ? family : DEFAULT_APPEARANCE.family,
      mode: isThemeMode(mode) ? mode : DEFAULT_APPEARANCE.mode,
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function useTheme() {
  const [appearance, setAppearance] = useState<AppearancePreference>(storedAppearance);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const dark = appearance.mode === 'DARK' || (appearance.mode === 'SYSTEM' && systemDark);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.dataset.themeFamily = appearance.family;
    try {
      localStorage.setItem('hau-usc-theme-family', appearance.family);
      localStorage.setItem('hau-usc-theme', appearance.mode.toLowerCase());
    } catch {}
  }, [appearance, dark]);

  const toggle = useCallback(
    () => setAppearance((current) => ({ ...current, mode: dark ? 'LIGHT' : 'DARK' })),
    [dark],
  );

  return [dark, setAppearance, toggle, appearance] as const;
}
