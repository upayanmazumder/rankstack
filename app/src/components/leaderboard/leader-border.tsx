'use client';

import ElectricBorder from '@/components/react-bits/electric-border';
import { usePalette } from '@/hooks/use-palette';

/**
 * Live current around the leader's row. Render it inside a cell of a
 * `relative` row: it covers the whole row and ignores the pointer.
 */
export function LeaderBorder() {
  const palette = usePalette();
  // The effect bleeds 64px past its box. Clip it to a band around the row
  // so the scrolling table wrapper does not grow a scrollbar.
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -inset-y-3 overflow-hidden"
    >
      <ElectricBorder
        color={palette.accent}
        theme={palette.mode}
        borderRadius={4}
        thickness={1}
        strands={2}
        chaos={0.35}
        intensity={0.6}
        arcs={0}
        interactive={false}
        style={{ position: 'absolute', inset: '12px 1px' }}
      />
    </span>
  );
}
