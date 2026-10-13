'use client';

import type { CSSProperties, ReactNode } from 'react';

import BorderGlow from '@/components/react-bits/border-glow';
import SpotlightCard from '@/components/react-bits/spotlight-card';
import { usePalette } from '@/hooks/use-palette';
import { cn } from '@/lib/utils';

interface SurfaceProps {
  children: ReactNode;
  /** Classes for the content box (layout, spacing). The surface fills its parent. */
  className?: string;
}

const BORDER = { dark: 'rgba(255, 255, 255, 0.12)', light: '#dedede' } as const;

/** Card face lit by a soft accent spotlight that follows the pointer. */
export function SpotlightSurface({ children, className }: SurfaceProps) {
  const palette = usePalette();
  return (
    <SpotlightCard
      theme={palette.mode}
      spotlightColor={palette.accent}
      intensity={palette.mode === 'dark' ? 0.12 : 0.18}
      spotlightSize={220}
      borderGlow={0.5}
      flare={false}
      className={cn('h-full', className)}
      style={
        {
          '--spotlight-card-surface': palette.surface,
          '--spotlight-card-border': BORDER[palette.mode],
          '--spotlight-card-shadow': 'none',
          borderRadius: 8,
          padding: 20,
        } as CSSProperties
      }
    >
      {children}
    </SpotlightCard>
  );
}

/** Card face with a glowing accent border. Reserved for what is live now. */
export function LiveSurface({ children, className }: SurfaceProps) {
  const palette = usePalette();
  return (
    <BorderGlow
      backgroundColor={palette.surface}
      borderRadius={8}
      glowColor={palette.accentHsl}
      colors={[palette.accent, palette.ink, palette.accent]}
      glowIntensity={0.7}
      glowRadius={28}
      fillOpacity={0.25}
      animated
      className="h-full"
    >
      <div className={cn('relative h-full p-5', className)}>{children}</div>
    </BorderGlow>
  );
}
