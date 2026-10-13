'use client';

import { useTheme } from 'next-themes';

import { useMounted } from '@/hooks/use-mounted';
import { PALETTES, type Palette } from '@/lib/palette';

export interface ThemePalette extends Palette {
  mode: 'dark' | 'light';
}

/**
 * Palette for the resolved theme. The server and the first client render use
 * dark, the default theme, so hydration output matches.
 */
export function usePalette(): ThemePalette {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const mode = mounted && resolvedTheme === 'light' ? 'light' : 'dark';
  return { ...PALETTES[mode], mode };
}
