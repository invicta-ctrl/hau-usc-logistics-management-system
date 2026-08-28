import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'LIGHT' | 'DARK' | 'SYSTEM';

function storedPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem('hau-usc-theme')?.toUpperCase();
    if (stored === 'LIGHT' || stored === 'DARK' || stored === 'SYSTEM') return stored;
  } catch {}
  return 'SYSTEM';
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(storedPreference);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const dark = preference === 'DARK' || (preference === 'SYSTEM' && systemDark);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('hau-usc-theme', preference.toLowerCase());
    } catch {}
  }, [dark, preference]);

  const toggle = useCallback(() => setPreference(dark ? 'LIGHT' : 'DARK'), [dark]);

  return [dark, setPreference, toggle, preference] as const;
}
