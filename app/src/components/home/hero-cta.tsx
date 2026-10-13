'use client';

import Link from 'next/link';

import StarBorder from '@/components/react-bits/star-border';
import { usePalette } from '@/hooks/use-palette';

/** Main call to action. A star circles its outline in the accent green. */
export function HeroCta() {
  const palette = usePalette();
  return (
    <StarBorder
      as={Link}
      href="/contests"
      theme={palette.mode}
      color={palette.accent}
      radius={6}
      thickness={1}
      backgroundColor={palette.surface}
      textColor={palette.ink}
      className="h-10 px-5 py-0 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      Browse contests
    </StarBorder>
  );
}
