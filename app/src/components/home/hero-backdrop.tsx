'use client';

import DotGrid from '@/components/react-bits/dot-grid';
import { usePalette } from '@/hooks/use-palette';

/** Dot grid behind the hero. Dots near the pointer light up in the accent green. */
export function HeroBackdrop() {
  const palette = usePalette();
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <DotGrid
        dotSize={3}
        gap={22}
        baseColor={palette.faint}
        activeColor={palette.accent}
        proximity={130}
        glow={0.4}
        fade={0.6}
        clickShock={false}
      />
    </div>
  );
}
