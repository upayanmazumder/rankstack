'use client';

import { useTheme } from 'next-themes';

import SquishSwitch from '@/components/react-bits/squish-switch';
import { useMounted } from '@/hooks/use-mounted';
import { usePalette } from '@/hooks/use-palette';

/** Dark mode switch. On means dark, the default theme. */
export function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const palette = usePalette();
  const dark = !mounted || resolvedTheme !== 'light';

  return (
    <SquishSwitch
      checked={dark}
      onChange={on => setTheme(on ? 'dark' : 'light')}
      ariaLabel="Dark mode"
      width={40}
      height={22}
      trackColor={palette.faint}
      trackOnColor={palette.accent}
      thumbColor={palette.ink}
      thumbOnColor={palette.surface}
      className="rounded-full [&_button:focus-visible]:rounded-full [&_button:focus-visible]:ring-2 [&_button:focus-visible]:ring-ring [&_button:focus-visible]:ring-offset-2 [&_button:focus-visible]:ring-offset-background"
    />
  );
}
